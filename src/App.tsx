import { useState, useEffect, useRef, type ReactNode } from "react";
import { albumService, listService, reviewService, userService } from "./lib/services/firestore-service";
import { Album, Review, Track, TrackSearchResult, User, UserList } from "./types";
import { auth, firebaseConfigured } from "./lib/firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import LoginScreen from "./components/auth/LoginScreen";
import RegisterScreen from "./components/auth/RegisterScreen";
import ProfileAvatar from "./components/ProfileAvatar";
import { encodeProfileImage } from "./lib/profile-image";

type Screen = "home" | "album" | "artist" | "search" | "lists" | "profile" | "edit-profile" | "settings" | "login" | "register";

function mergeAlbums(current: Album[], incoming: Album[]): Album[] {
  const byId = new Map(current.map((album) => [album.id, album]));
  for (const album of incoming) {
    if (album.id) byId.set(album.id, album);
  }
  return [...byId.values()];
}

const art = [
  "https://images.unsplash.com/photo-1597773150796-e5c14ebecbf5?auto=format&fit=crop&w=700&q=85",
  "https://images.unsplash.com/photo-1557264322-b44d383a2906?auto=format&fit=crop&w=700&q=85",
  "https://images.unsplash.com/photo-1567095751004-aa51a2690368?auto=format&fit=crop&w=700&q=85",
  "https://images.unsplash.com/photo-1566410824233-a8011929225c?auto=format&fit=crop&w=700&q=85",
  "https://images.unsplash.com/photo-1584968124544-d10ce10dd21f?auto=format&fit=crop&w=700&q=85",
  "https://images.unsplash.com/photo-1563305096-9af2877f57f9?auto=format&fit=crop&w=700&q=85",
  "https://images.unsplash.com/photo-1582721691120-d1db3852893e?auto=format&fit=crop&w=700&q=85",
];

const portrait =
  "https://images.unsplash.com/photo-1776849443030-186b43bff95c?auto=format&fit=crop&w=300&q=85";

function Icon({
  name,
  size = 22,
  fill = "none",
}: {
  name: string;
  size?: number;
  fill?: string;
}) {
  const paths: Record<string, ReactNode> = {
    search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></>,
    home: <><path d="m3 11 9-8 9 8" /><path d="M5 10v10h14V10M9 20v-6h6v6" /></>,
    list: <><path d="M8 6h13M8 12h13M8 18h13" /><circle cx="3" cy="6" r=".7" fill="currentColor" /><circle cx="3" cy="12" r=".7" fill="currentColor" /><circle cx="3" cy="18" r=".7" fill="currentColor" /></>,
    user: <><circle cx="12" cy="8" r="4" /><path d="M4 21c.5-4.2 3.2-6.5 8-6.5s7.5 2.3 8 6.5" /></>,
    plus: <path d="M12 5v14M5 12h14" />,
    chevron: <path d="m9 18 6-6-6-6" />,
    heart: <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21l7.8-7.5 1.1-1.1a5.5 5.5 0 0 0-.1-7.8Z" />,
    bookmark: <path d="M6 3h12v18l-6-4-6 4V3Z" />,
    star: <path d="m12 2.7 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-2.9-5.6 2.9 1.1-6.2L3 9.3l6.2-.9L12 2.7Z" />,
    back: <><path d="m15 18-6-6 6-6" /><path d="M9 12h10" /></>,
    more: <><circle cx="5" cy="12" r="1" fill="currentColor" /><circle cx="12" cy="12" r="1" fill="currentColor" /><circle cx="19" cy="12" r="1" fill="currentColor" /></>,
    close: <><path d="M6 6l12 12M18 6 6 18" /></>,
    spotify: <><circle cx="12" cy="12" r="9" /><path d="M7.5 9.5c3.5-1 7.1-.5 9.6.8M8.2 12.7c3-.7 6-.3 8.2.8M9 15.7c2.3-.5 4.5-.2 6.3.7" /></>,
    filter: <><path d="M4 6h16M7 12h10M10 18h4" /></>,
    calendar: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M8 3v4M16 3v4M3 10h18" /></>,
    drag: <><path d="M8 7h8M8 12h8M8 17h8" /></>,
    share: <><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><path d="m8.6 10.5 6.8-4M8.6 13.5l6.8 4" /></>,
    download: <><path d="M12 3v12m0 0 4-4m-4 4-4-4" /><path d="M5 20h14" /></>,
    edit: <><path d="m4 20 4.5-1 10-10a2.1 2.1 0 0 0-3-3l-10 10L4 20Z" /><path d="m14 7 3 3" /></>,
    lock: <><rect x="5" y="10" width="14" height="11" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3" /></>,
    camera: <><path d="M4 8h3l1.5-2h7L17 8h3v11H4V8Z" /><circle cx="12" cy="13" r="3.5" /></>,
    gear: <><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2.8 2.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6v.2h-4V21a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1L4.2 17l.1-.1a1.7 1.7 0 0 0 .3-1.9A1.7 1.7 0 0 0 3 14H2.8v-4H3a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9L4.2 7 7 4.2l.1.1A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-1.6v-.2h4V3a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1L19.8 7l-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.2v4H21a1.7 1.7 0 0 0-1.6 1Z" /></>,
  };
  return (
    <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      {paths[name]}
    </svg>
  );
}

function UniversalHeader({ action, onLogo, onBack, className = "" }: { action: ReactNode; onLogo?: () => void; onBack?: () => void; className?: string }) {
  return <header className={`universal-header ${className}`}>
    <div className="universal-header-row">
      {onBack ? <button type="button" className="wordmark universal-wordmark back-button" onClick={onBack} aria-label="Back"><Icon name="chevron" size={17} /> <span>Back</span></button> : <button type="button" className="wordmark universal-wordmark" onClick={onLogo} aria-label="Eco home">ec<span>o</span></button>}
      <div className="universal-action">{action}</div>
    </div>
  </header>;
}

function Stars({ value = 4.5, large = false }: { value?: number; large?: boolean }) {
  return (
    <div className={`stars ${large ? "stars-large" : ""}`} aria-label={`${value} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <span key={star} className={star <= Math.round(value) ? "star-on" : ""}>★</span>
      ))}
      {!large && <b>{value.toFixed(1)}</b>}
    </div>
  );
}

function Header({ onSearch }: { onSearch: () => void }) {
  return (
    <UniversalHeader onLogo={() => window.scrollTo({ top: 0, behavior: "smooth" })} action={<button className="header-icon-button" onClick={onSearch} aria-label="Search"><Icon name="search" /></button>} />
  );
}

function SectionTitle({ children, action }: { children: ReactNode; action?: string }) {
  return (
    <div className="section-title">
      <h2>{children}</h2>
      {action && <button>{action} <Icon name="chevron" size={15} /></button>}
    </div>
  );
}

function HomeScreen({
  albums,
  reviews,
  user,
  openAlbum,
  openSearch,
}: {
  albums: Album[];
  reviews: Review[];
  user: User | null;
  openAlbum: (id?: string) => void;
  openSearch: () => void;
}) {
  return (
    <>
      <Header onSearch={openSearch} />
      <main>
        <section className="hero-intro">
          <p>YOUR MUSIC COMMUNITY</p>
          <h1>Welcome, {user?.displayName ?? "listener"}.</h1>
          <span>Find your next favorite record.</span>
        </section>

        <section>
          <SectionTitle>Albums</SectionTitle>
          <div className="album-rail">
            {albums.map((album) => (
              <button className="album-tile" key={album.id} onClick={() => openAlbum(album.id)}>
                <div className="cover-wrap">
                  <img src={album.coverUrl} alt={`${album.title} by ${album.artist}`} />
                </div>
                <strong>{album.title}</strong>
                <span>{album.artist}</span>
              </button>
            ))}
            {albums.length === 0 && <p className="screen-heading">The local catalog is empty. Run the MusicBrainz importer to add albums.</p>}
          </div>
        </section>

        <section className="feed-section">
          <SectionTitle>Recent community reviews</SectionTitle>
          {reviews.map((review) => {
            const album = albums.find((item) => item.id === review.albumId);
            if (!album) return null;
            return <article className="review-card" key={review.id}>
              <div className="review-head">
                <div className="review-user">
                  <div className="avatar avatar-lilac">{review.userId.slice(0, 1).toUpperCase()}</div>
                  <div><strong>{review.userId}</strong><span>reviewed an album</span></div>
                </div>
              </div>
              <button className="review-album" onClick={() => openAlbum(album.id)}>
                <img src={album.coverUrl} alt={`${album.title} cover`} />
                <div><span>ALBUM</span><h3>{album.title}</h3><p>{album.artist} · {album.year}</p><Stars value={review.rating} /></div>
              </button>
              {review.textContent && <p className="review-copy">{review.textContent}</p>}
              <div className="review-footer"><span>{review.likesCount ?? 0} likes</span><span>{review.isRewatch ? "Re-listen" : "First listen"}</span></div>
            </article>;
          })}
          {reviews.length === 0 && <p className="screen-heading">Community reviews will appear here.</p>}
        </section>
      </main>
    </>
  );
}

function AlbumScreen({
  album,
  tracks,
  reviews,
  goBack,
  openLog,
}: {
  album: Album | null;
  tracks: Track[];
  reviews: Review[];
  goBack: () => void;
  openLog: () => void;
}) {
  const [reviewOrder, setReviewOrder] = useState<"popular" | "recent">("popular");
  const sortedReviews = reviewOrder === "popular"
    ? [...reviews].sort((left, right) => (right.likesCount ?? right.likes ?? 0) - (left.likesCount ?? left.likes ?? 0))
    : reviews;
  const ratingBins = [5, 4, 3, 2, 1].map((rating) => ({
    rating,
    count: reviews.filter((review) => Math.round(review.rating) === rating).length,
  }));
  const averageRating = reviews.length
    ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
    : 0;
  const trackReviewStats = new Map<string, { count: number; totalRating: number }>();
  for (const review of reviews) {
    if (!review.trackId) continue;
    const stats = trackReviewStats.get(review.trackId) ?? { count: 0, totalRating: 0 };
    stats.count += 1;
    stats.totalRating += review.rating;
    trackReviewStats.set(review.trackId, stats);
  }
  const maximumBin = Math.max(1, ...ratingBins.map((bin) => bin.count));
  const popularTrackId = reviews.reduce<string | undefined>((popular, review) => {
    if (!review.favoriteTrackId) return popular;
    const popularCount = reviews.filter((entry) => entry.favoriteTrackId === popular).length;
    const currentCount = reviews.filter((entry) => entry.favoriteTrackId === review.favoriteTrackId).length;
    return currentCount > popularCount ? review.favoriteTrackId : popular;
  }, undefined);
  if (!album) {
    return <main className="album-page"><UniversalHeader onLogo={goBack} action={<span />} /><p className="screen-heading">Album not found in the local music catalog.</p></main>;
  }
  return (
    <main className="album-page">
      <UniversalHeader onBack={goBack} action={<button className="header-icon-button" aria-label="Share album"><Icon name="share" /></button>} />
      <div className="album-hero">
        <div className="hero-blur" style={{ backgroundImage: `url(${album.coverUrl})` }} />
        <img className="hero-cover" src={album.coverUrl} alt={`${album.title} by ${album.artist}`} />
      </div>
      <div className="album-content">
        <div className="album-heading">
          <p>{album.artist.toUpperCase()}</p>
          <h1>{album.title}</h1>
          <span>
            {album.year}
            {album.trackCount > 0 ? ` · ${album.trackCount} tracks` : ""}
            {album.duration ? ` · ${album.duration}` : ""}
            {album.trackCount === 0 && !album.duration ? " · Track details unavailable" : ""}
          </span>
          <div className="pills">{album.genres.map((genre) => <span key={genre}>{genre}</span>)}</div>
          {album.metadataSource && <small className="metadata-attribution">
            Metadata: <a href="https://musicbrainz.org/" target="_blank" rel="noreferrer">{album.metadataSource}</a>
            {album.metadataSource === "MusicBrainz" && <> · Artwork: <a href="https://coverartarchive.org/" target="_blank" rel="noreferrer">Cover Art Archive</a></>}
          </small>}
        </div>

        <div className="score-card">
          <div className="score-main">
            {reviews.length > 0
              ? <><strong>{averageRating.toFixed(1)}</strong><span>out of 5</span><Stars value={averageRating} /><small>{reviews.length.toLocaleString()} ratings loaded</small></>
              : <><strong>—</strong><span>Not rated yet</span><small>Be the first to review</small></>}
          </div>
          <div className="histogram" aria-label="Rating distribution">
            {ratingBins.map(({ rating, count }) => (
              <div key={rating}><span>{rating}</span><i><b style={{ width: `${(count / maximumBin) * 100}%` }} /></i><small>{count}</small></div>
            ))}
          </div>
        </div>

        <div className="action-bar">
          <button className="primary-button" onClick={openLog}><Icon name="plus" size={19} /> Log / Review</button>
          <button className="square-action" aria-label="Add to favorites"><Icon name="heart" /></button>
          <button className="square-action" aria-label="Want to listen"><Icon name="bookmark" /></button>
        </div>

        <section className="tracklist">
          <SectionTitle>Tracklist</SectionTitle>
          <div className="track-card">
            {tracks.map((track) => {
              const trackStats = track.id ? trackReviewStats.get(track.id) : undefined;
              return <div className="track" key={track.id ?? track.trackNumber}>
                <span>{String(track.trackNumber).padStart(2, "0")}</span>
                <strong>{track.title}{trackStats && <small className="track-review-count">★ {(trackStats.totalRating / trackStats.count).toFixed(1)} · {trackStats.count} review(s)</small>}</strong>
                <span aria-label={popularTrackId && track.id === popularTrackId ? "Most popular favorite track" : "Track"}><Icon name="star" size={17} fill={popularTrackId && track.id === popularTrackId ? "currentColor" : "none"} /></span>
                <time>{track.duration}</time>
              </div>;
            })}
            {tracks.length === 0 && <p className="screen-heading">Track information is not available yet.</p>}
          </div>
        </section>

        <section className="community">
          <SectionTitle>Community reviews</SectionTitle>
          <div className="filter-pills">
            <button className={reviewOrder === "popular" ? "active" : ""} onClick={() => setReviewOrder("popular")}>Popular</button>
            <button className={reviewOrder === "recent" ? "active" : ""} onClick={() => setReviewOrder("recent")}>Recent</button>
          </div>
          {sortedReviews.map((review) => <article className="community-card" key={review.id}>
            <div className="review-user"><div className="avatar avatar-lilac">{review.userId.slice(0, 1).toUpperCase()}</div><div><strong>{review.userId}</strong><Stars value={review.rating} /></div></div>
            {(review.textContent ?? review.content) && <p>{review.textContent ?? review.content}</p>}
            <div className="review-footer"><span>{review.likesCount ?? review.likes ?? 0} likes</span><span>{review.isRewatch ? "Re-listen" : "Listen"}</span></div>
          </article>)}
          {reviews.length === 0 && <p className="screen-heading">No reviews yet. Be the first to log this album.</p>}
        </section>
      </div>
    </main>
  );
}

function ProfileScreen({
  user,
  albums,
  reviews,
  lists,
  openShare,
  editProfile,
  openSettings,
}: {
  user: User | null;
  albums: Album[];
  reviews: Review[];
  lists: UserList[];
  openShare: (review?: Review) => void;
  editProfile: () => void;
  openSettings: () => void;
}) {
  const [tab, setTab] = useState<"reviews" | "lists" | "stats">("reviews");
  const avatarUrl = user?.photoURL || user?.avatarUrl || portrait;
  const favoriteAlbums = (user?.favoriteAlbums ?? [])
    .map((albumId) => albums.find((album) => album.id === albumId))
    .filter((album): album is Album => Boolean(album));
  return (
    <>
      <UniversalHeader action={<button className="header-icon-button" aria-label="Settings" onClick={openSettings}><Icon name="gear" /></button>} />
      <main className="profile-page">
        <section className="profile-header">
          <div className="profile-person">
            <ProfileAvatar className="profile-avatar" src={avatarUrl} alt={user?.displayName ?? "Profile photo"} />
            <div><h1>{user?.displayName ?? "Eco listener"}</h1><p>@{user?.username ?? ""}</p></div>
          </div>
          <p>{user?.bio ?? ""}</p>
          <div className="profile-actions">
            {user?.lastfmUsername && <span className="spotify-badge">Last.fm: {user.lastfmUsername}</span>}
            <button className="edit-profile" onClick={editProfile}><Icon name="edit" size={16} /> Edit profile</button>
          </div>
          <div className="stats">
            <div><strong>{new Set(reviews.map((review) => review.albumId)).size}</strong><span>Albums</span></div>
            <div><strong>{reviews.length}</strong><span>Reviews</span></div>
            <div><strong>{lists.length}</strong><span>Lists</span></div>
          </div>
        </section>
        <section className="favorite-editor">
          <div className="edit-section-title"><div><span>YOUR IDENTITY</span><h2>Top 4 albums</h2></div></div>
          <div className="edit-favorite-grid">
            {favoriteAlbums.map((album) => <div key={album.id}><img src={album.coverUrl} alt={album.title} /><strong>{album.title}</strong></div>)}
            {favoriteAlbums.length === 0 && <p>Choose your four all-time favorite albums in Edit Profile.</p>}
          </div>
        </section>
        <div className="profile-tabs">
          {(["reviews", "lists", "stats"] as const).map((item) => <button className={tab === item ? "active" : ""} onClick={() => setTab(item)} key={item}>{item[0].toUpperCase() + item.slice(1)}</button>)}
        </div>
        {tab === "reviews" && <section className="profile-reviews">
          {reviews.map((review) => {
            const album = albums.find((item) => item.id === review.albumId);
            if (!album) return null;
            return <article className="profile-review" key={review.id}>
              <img src={album.coverUrl} alt={album.title} />
              <div><span>{album.artist}</span><strong>{album.title}</strong><Stars value={review.rating} /><p>{review.textContent ?? review.content}</p><div><span><Icon name="heart" size={16} /> {review.likesCount ?? review.likes ?? 0}</span><button onClick={() => openShare(review)}><Icon name="share" size={16} /> Share</button></div></div>
            </article>;
          })}
          {reviews.length === 0 && <p className="screen-heading">You have not reviewed an album yet.</p>}
        </section>}
        {tab === "lists" && <section className="profile-lists">
          {lists.map((list) => (
            <article key={list.id}><div className="mini-stack">{(list.albumIds ?? []).slice(0, 2).map((id) => albums.find((album) => album.id === id)).filter((album): album is Album => Boolean(album)).map((album) => <img key={album.id} src={album.coverUrl} alt="" />)}</div><strong>{list.title}</strong><span>{list.albumIds?.length ?? list.albums?.length ?? 0} albums</span></article>
          ))}
          {lists.length === 0 && <p className="screen-heading">You have not created a list yet.</p>}
        </section>}
        {tab === "stats" && <section className="stats-dashboard">
          <div className="metric-row"><div><strong>{new Set(reviews.map((review) => review.albumId)).size}</strong><span>Albums logged</span></div><div><strong>{reviews.length}</strong><span>Diary entries</span></div><div><strong>{reviews.length ? (reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length).toFixed(1) : "—"}</strong><span>Avg rating</span></div></div>
          <div className="analytics-card"><h3>Top genres from your reviews</h3>{Array.from(new Set(reviews.flatMap((review) => albums.find((album) => album.id === review.albumId)?.genres ?? []))).slice(0, 5).map((genre) => <p key={genre}>{genre}</p>)}{reviews.length === 0 && <p>Rate albums to start your listening statistics.</p>}</div>
        </section>}
      </main>
    </>
  );
}

type SearchFilters = { decade: string; year: string; genres: string[]; minRating: number };

function SearchScreen({ albums, openAlbum, openArtist }: { albums: Album[]; openAlbum: (id?: string) => void; openArtist: (artist: string, fromScreen?: string) => void }) {
  const [category, setCategory] = useState("All");
  const [filterOpen, setFilterOpen] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [searchAlbums, setSearchAlbums] = useState<Album[]>([]);
  const [searchTracks, setSearchTracks] = useState<TrackSearchResult[]>([]);
  const [searchOffset, setSearchOffset] = useState(0);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState("");
  const latestSearch = useRef(0);
  const [filters, setFilters] = useState<SearchFilters>({ decade: "", year: "", genres: [], minRating: 0 });
  const normalizedSearch = searchText.trim();
  const hasFullSearch = normalizedSearch.length >= 2;

  useEffect(() => {
    const requestId = ++latestSearch.current;
    const hasActiveFilters = filters.decade || filters.year || filters.genres.length > 0 || filters.minRating > 0;
    const shouldSearch = (hasFullSearch || hasActiveFilters) && ["All", "Albums", "Artists", "Tracks"].includes(category);
    if (!shouldSearch) {
      setSearchAlbums([]);
      setSearchTracks([]);
      setSearching(false);
      setSearchError("");
      return;
    }

    const timer = window.setTimeout(() => {
      setSearching(true);
      setSearchError("");
      const request = category === "Tracks"
        ? albumService.searchTracks(normalizedSearch).then((results) => {
          if (requestId === latestSearch.current) setSearchTracks(results);
        })
        : albumService.searchAlbums(normalizedSearch, {
          decade: filters.decade || undefined,
          year: filters.year || undefined,
          genre: filters.genres[0] || undefined,
        }, searchOffset).then((results) => {
          if (requestId === latestSearch.current) {
            if (searchOffset === 0) setSearchAlbums(results);
            else setSearchAlbums((prev) => mergeAlbums(prev, results));
          }
        });
      request
        .catch((error: unknown) => {
          console.error("Could not search the local music catalog.", error);
          if (requestId === latestSearch.current) setSearchError("Music search failed. Check that the catalog API is running.");
        })
        .finally(() => {
          if (requestId === latestSearch.current) setSearching(false);
        });
    }, 300);

    return () => window.clearTimeout(timer);
  }, [category, hasFullSearch, normalizedSearch, filters, searchOffset]);

  const hasActiveFilters = filters.decade || filters.year || filters.genres.length > 0 || filters.minRating > 0;
  const baseAlbums = (hasFullSearch || hasActiveFilters) ? searchAlbums : albums;

  useEffect(() => {
    setSearchOffset(0);
  }, [normalizedSearch, filters, category]);

  const filteredAlbums = baseAlbums.filter((album) => {
    const matchesText = !normalizedSearch || `${album.title} ${album.artist} ${album.genres.join(" ")}`.toLowerCase().includes(normalizedSearch.toLowerCase());
    const matchesDecade = !filters.decade || Math.floor(album.year / 10) * 10 === Number(filters.decade);
    const matchesYear = !filters.year || album.year === Number(filters.year);
    const matchesGenre = filters.genres.length === 0 || filters.genres.some((genre) => album.genres.includes(genre));
    const matchesRating = filters.minRating === 0 || (album.totalRatings > 0 && album.averageRating >= filters.minRating);
    return matchesText && matchesDecade && matchesYear && matchesGenre && matchesRating;
  });
  return (
    <>
      <UniversalHeader action={<button className="header-icon-button" onClick={() => setFilterOpen(true)} aria-label="Search filters"><Icon name="filter" /></button>} />
      <main className="search-page">
        <div className="search-header">
          <div className="global-search"><Icon name="search" size={20} /><input autoFocus value={searchText} onChange={(event) => setSearchText(event.target.value)} placeholder="Search albums, artists, tracks..." /><button aria-label="Search filters" onClick={() => setFilterOpen(true)}><Icon name="filter" size={19} /></button></div>
          <div className="category-tabs">{["All", "Albums", "Artists", "Tracks", "Users", "Lists"].map((item) => <button className={category === item ? "active" : ""} onClick={() => setCategory(item)} key={item}>{item}</button>)}</div>
        </div>
        <section className="discovery-filters">
          <button className="filter-lead" onClick={() => setFilterOpen(true)}><Icon name="filter" size={16} /> Filters</button>
          {filters.genres.map((genre) => <button key={genre} onClick={() => setFilters({ ...filters, genres: filters.genres.filter((item) => item !== genre) })}>{genre} ×</button>)}
          {filters.decade && <button onClick={() => setFilters({ ...filters, decade: "" })}>{filters.decade}s ×</button>}
          {filters.year && <button onClick={() => setFilters({ ...filters, year: "" })}>{filters.year} ×</button>}
          {filters.minRating > 0 && <button onClick={() => setFilters({ ...filters, minRating: 0 })}>{filters.minRating.toFixed(1)}+ ★ ×</button>}
        </section>
        {searchError && <p role="alert" className="error-text">{searchError}</p>}
        {category === "All" && !hasFullSearch && <section className="release-calendar">
          <SectionTitle>Recent catalogue</SectionTitle>
          <div className="release-timeline">
            {[...albums].sort((left, right) => right.year - left.year).slice(0, 4).map((album) => (
              <button key={album.id} onClick={() => openAlbum(album.id)}><div><img src={album.coverUrl} alt="" /><span>{album.year}</span></div><strong>{album.title}</strong><small>{album.artist}</small></button>
            ))}
          </div>
        </section>}
        {(category === "All" || category === "Albums") && <section className="result-section">
          <SectionTitle>Albums</SectionTitle>
          <div className="search-albums">{filteredAlbums.map((album) => <button key={album.id} onClick={() => openAlbum(album.id)}><img src={album.coverUrl} alt="" /><strong>{album.title}</strong><span>{album.artist}</span></button>)}</div>
          {searching && <p className="screen-heading">Searching albums…</p>}
          {!searching && hasFullSearch && filteredAlbums.length === 0 && <p className="screen-heading">No matching albums found.</p>}
          {!searching && (hasFullSearch || hasActiveFilters) && searchAlbums.length > 0 && searchAlbums.length % 30 === 0 && <button className="publish-button" onClick={() => setSearchOffset((prev) => prev + 30)}>Load More</button>}
        </section>}
        {(category === "All" || category === "Artists") && <section className="result-section">
          <SectionTitle>Artists</SectionTitle>
          <div className="artist-results">{Array.from(new Map(filteredAlbums.map((album) => [album.artist, album])).values()).map((album) => <button key={album.artist} onClick={() => openArtist(album.artist, category)}><img src={album.coverUrl} alt="" /><div><strong>{album.artist}</strong><span>Artist</span></div><Icon name="chevron" size={17} /></button>)}</div>
        </section>}
        {(category === "All" || category === "Tracks") && <section className="result-section tracks-results">
          <SectionTitle>Tracks</SectionTitle>
          {category === "Tracks" && hasFullSearch
            ? <div className="track-search-results">
              {searchTracks.map((track) => <button key={track.id} onClick={() => openAlbum(track.albumId)}>
                <span className="track-search-play"><Icon name="plus" size={17} /></span>
                <span><strong>{track.title}</strong><small>{track.artist} · {track.albumTitle} · {track.year || "Year unknown"}</small></span>
              </button>)}
              {searching && <p className="screen-heading">Searching tracks…</p>}
              {!searching && searchTracks.length === 0 && !searchError && <p className="screen-heading">No matching tracks found.</p>}
            </div>
            : <p className="screen-heading">{category === "All" ? "Choose Tracks to search song titles." : "Type at least two characters to search tracks."}</p>}
        </section>}
        {(category === "All" || category === "Users") && <section className="result-section user-results">
          <SectionTitle>Users</SectionTitle>
          <p className="screen-heading">Member search is not available yet.</p>
        </section>}
        {(category === "All" || category === "Lists") && <section className="result-section search-list-results">
          <SectionTitle>Lists</SectionTitle>
          <p className="screen-heading">Explore public lists from the Lists tab.</p>
        </section>}
      </main>
      {filterOpen && <FilterSheet close={() => setFilterOpen(false)} filters={filters} onApply={setFilters} />}
    </>
  );
}

function FilterSheet({ close, filters, onApply }: { close: () => void; filters: SearchFilters; onApply: (filters: SearchFilters) => void }) {
  const [draft, setDraft] = useState(filters);
  const toggleGenre = (genre: string) => setDraft((current) => ({
    ...current,
    genres: current.genres.includes(genre) ? current.genres.filter((item) => item !== genre) : [...current.genres, genre],
  }));
  return <div className="modal-backdrop" onMouseDown={close}><section className="filter-sheet" onMouseDown={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
    <UniversalHeader className="modal-safe-header" action={<button type="button" className="header-icon-button" onClick={close} aria-label="Close filters"><Icon name="close" size={19} /></button>} />
    <div className="filter-title"><div><span>DISCOVERY</span><h2>Filters & categories</h2></div></div>
    <label className="field-label" htmlFor="filter-decade">Era / decade</label><select id="filter-decade" value={draft.decade} onChange={(event) => setDraft({ ...draft, decade: event.target.value })}><option value="">Any decade</option>{[2020, 2010, 2000, 1990, 1980, 1970, 1960].map((decade) => <option value={String(decade)} key={decade}>{decade}s</option>)}</select>
    <label className="field-label" htmlFor="filter-year">Specific year</label><input id="filter-year" className="text-field" type="number" min="1800" max="2100" placeholder="Year" value={draft.year} onChange={(event) => setDraft({ ...draft, year: event.target.value })} />
    <label className="field-label">Genres</label><div className="check-grid">{["Indie", "Hip-Hop", "Electronic", "R&B", "Jazz", "Rock"].map((genre) => <label key={genre}><input type="checkbox" checked={draft.genres.includes(genre)} onChange={() => toggleGenre(genre)} /> <span>{genre}</span></label>)}</div>
    <div className="range-label"><label htmlFor="min-rating">Minimum average rating</label><strong>{draft.minRating === 0 ? "Any" : `${draft.minRating.toFixed(1)}+`}</strong></div><input id="min-rating" className="range" type="range" min="0" max="5" step=".5" value={draft.minRating} onChange={(event) => setDraft({ ...draft, minRating: Number(event.target.value) })} />
    <button className="publish-button" onClick={() => { onApply(draft); close(); }}>Show results</button>
  </section></div>;
}

function ListsScreen({ lists, albums, createList, openShare }: { lists: UserList[]; albums: Album[]; createList: () => void; openShare: () => void }) {
  return <><UniversalHeader action={<button className="header-icon-button" onClick={createList} aria-label="Create list"><Icon name="plus" /></button>} /><main className="list-viewer">
    {lists.map((list) => {
      const ids = list.albumIds ?? list.albums?.slice().sort((a, b) => a.position - b.position).map((item) => item.albumId) ?? [];
      const items = ids.map((id) => albums.find((album) => album.id === id)).filter((album): album is Album => Boolean(album));
      const duration = items.reduce((total, album) => total + (Number.parseInt(album.duration, 10) || 0), 0);
      const rating = items.length ? items.reduce((total, album) => total + album.averageRating, 0) / items.length : 0;
      return <section className="community-card" key={list.id}>
        <div className="cover-collage">{items.slice(0, 3).map((album) => <img key={album.id} src={album.coverUrl} alt="" />)}</div>
        <span>CURATED LIST</span><h2>{list.title}</h2><p>{list.description}</p>
        <div className="aggregate-stats"><span><b>{items.length}</b> Albums</span><span><b>{duration} min</b> Total</span><span><b>{rating.toFixed(1)}</b> Avg rating</span></div>
        <div className="numbered-grid">{items.map((album, index) => <article key={album.id}><div><img src={album.coverUrl} alt={album.title} /><span>{String(index + 1).padStart(2, "0")}</span></div><strong>{album.title}</strong><small>{album.artist}</small></article>)}</div>
        <button className="icon-button" onClick={openShare} aria-label={`Share ${list.title}`}><Icon name="share" size={19} /></button>
      </section>;
    })}
    {lists.length === 0 && <div className="screen-heading"><span>DISCOVER & CURATE</span><h1>Your lists</h1><p>Public community lists and your own collections will appear here.</p></div>}
    <div className="list-footer-actions"><button className="new-list" onClick={createList}><Icon name="plus" size={17} /> New list</button></div>
  </main></>;
}

function BottomNav({ active, setScreen, openLog }: { active: Screen; setScreen: (s: Screen) => void; openLog: () => void }) {
  return (
    <nav className="bottom-nav" aria-label="Main navigation">
      <button className={active === "home" ? "active" : ""} onClick={() => setScreen("home")}><Icon name="home" /><span>Home</span></button>
      <button className={active === "search" ? "active" : ""} onClick={() => setScreen("search")}><Icon name="search" /><span>Search</span></button>
      <button className="log-button" onClick={openLog} aria-label="Log an album"><Icon name="plus" size={28} /></button>
      <button className={active === "lists" ? "active" : ""} onClick={() => setScreen("lists")}><Icon name="list" /><span>Lists</span></button>
      <button className={active === "profile" ? "active" : ""} onClick={() => setScreen("profile")}><Icon name="user" /><span>Profile</span></button>
    </nav>
  );
}

function LogSheet({
  close,
  albumId,
  album,
  tracks,
  userId,
  onPublished,
}: {
  close: () => void;
  albumId: string | null;
  album: Album | null;
  tracks: Track[];
  userId?: string;
  onPublished: () => Promise<void>;
}) {
  const [rating, setRating] = useState(4.5);
  const [relis, setRelis] = useState(false);
  const [listenedAt, setListenedAt] = useState(new Date().toISOString().slice(0, 10));
  const [trackId, setTrackId] = useState("");
  const [review, setReview] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const publishReview = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!albumId || !userId) {
      setError("Choose an album and sign in before publishing.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await reviewService.createReview({
        userId,
        albumId,
        rating,
        trackId: trackId || undefined,
        textContent: review.trim(),
        listenedAt: new Date(`${listenedAt}T12:00:00`),
        favoriteTrackId: trackId || undefined,
        isRewatch: relis,
      });
      await onPublished();
      close();
    } catch (publishError) {
      console.error("Could not publish review.", publishError);
      setError("Review could not be saved. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop" onMouseDown={close}>
      <form className="log-sheet" onSubmit={publishReview} onMouseDown={(e) => e.stopPropagation()} aria-modal="true" role="dialog" aria-labelledby="log-title">
        <UniversalHeader className="modal-safe-header" action={<button type="button" className="header-icon-button" onClick={close} aria-label="Close log and review"><Icon name="close" size={20} /></button>} />
        <div className="sheet-title">
          <div><img src={album?.coverUrl ?? art[0]} alt="" /><div><span>LOG ALBUM</span><h2 id="log-title">{album?.title ?? "Select an album"}</h2><p>{album?.artist ?? ""}</p></div></div>
        </div>
        <div className="rating-block">
          <label>Your rating <strong>{rating.toFixed(1)}</strong></label>
          <div className="rating-selector">
            {[1, 2, 3, 4, 5].map((star) => (
              <button type="button" className={star - 0.5 === rating ? "half-active" : ""} key={star} onClick={(e) => {
                const box = e.currentTarget.getBoundingClientRect();
                setRating(e.clientX - box.left < box.width / 2 ? star - 0.5 : star);
              }} aria-label={`Rate up to ${star} stars`}>
                <span className={star <= Math.floor(rating) ? "full" : star - 0.5 === rating ? "half" : ""}>★</span>
              </button>
            ))}
          </div>
        </div>
        <label className="field-label">Date listened</label>
        <input className="text-field" type="date" value={listenedAt} onChange={(event) => setListenedAt(event.target.value)} required />
        <label className="field-label">Track reviewed (optional)</label>
        <select value={trackId} onChange={(event) => setTrackId(event.target.value)}>
          <option value="">Album review only</option>
          {tracks.map((track) => <option key={track.id} value={track.id}>{track.title}</option>)}
        </select>
        <label className="field-label" htmlFor="review">Your review</label>
        <textarea id="review" placeholder="What did you think?" rows={3} maxLength={2000} value={review} onChange={(event) => setReview(event.target.value)} />
        <div className="toggle-row">
          <div><strong>Re-listen</strong><span>I’ve listened to this album before</span></div>
          <button type="button" className={`toggle ${relis ? "on" : ""}`} onClick={() => setRelis(!relis)} aria-label="Toggle re-listen"><i /></button>
        </div>
        {error && <p role="alert" className="error-text">{error}</p>}
        <button className="publish-button" disabled={loading}>{loading ? "Publishing..." : "Publish & Share"}</button>
      </form>
    </div>
  );
}

function ListCreator({
  close,
  albums,
  userId,
  onCreated,
}: {
  close: () => void;
  albums: Album[];
  userId?: string;
  onCreated: () => Promise<void>;
}) {
  const [isPublic, setIsPublic] = useState(true);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [albumSearch, setAlbumSearch] = useState("");
  const [albumIds, setAlbumIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const saveList = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!userId) {
      setError("Sign in to create a list.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await listService.createList({
        ownerId: userId,
        title: title.trim(),
        description: description.trim(),
        albumIds,
        likesCount: 0,
        isPublic,
      });
      await onCreated();
      close();
    } catch (saveError) {
      console.error("Could not create list.", saveError);
      setError("List could not be saved. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  const toggleAlbum = (albumId: string) => {
    setAlbumIds((current) =>
      current.includes(albumId)
        ? current.filter((id) => id !== albumId)
        : [...current, albumId],
    );
  };
  const matchingAlbums = albums.filter((album) =>
    `${album.title} ${album.artist}`.toLowerCase().includes(albumSearch.trim().toLowerCase()),
  );

  return <div className="modal-backdrop" onMouseDown={close}><form className="list-creator" onSubmit={saveList} onMouseDown={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
    <UniversalHeader className="modal-safe-header" action={<button type="button" className="header-icon-button" onClick={close} aria-label="Close list creator"><Icon name="close" size={19} /></button>} />
    <div className="filter-title"><div><span>NEW COLLECTION</span><h2>Create a list</h2></div></div>
    <label className="field-label" htmlFor="list-title">List title</label><input id="list-title" className="text-field" value={title} onChange={(event) => setTitle(event.target.value)} required maxLength={80} />
    <label className="field-label" htmlFor="list-description">Description</label><textarea id="list-description" rows={2} placeholder="What connects these records?" value={description} onChange={(event) => setDescription(event.target.value)} maxLength={500} />
    <label className="field-label" htmlFor="list-album-search">Albums</label><div className="add-search"><Icon name="search" size={18} /><input id="list-album-search" placeholder="Search & add album" value={albumSearch} onChange={(event) => setAlbumSearch(event.target.value)} /></div>
    <div className="added-albums">
      {matchingAlbums.map((album, i) => <div key={album.id ?? album.title}><input type="checkbox" checked={album.id ? albumIds.includes(album.id) : false} disabled={!album.id} onChange={() => album.id && toggleAlbum(album.id)} aria-label={`Add ${album.title}`} /><span>{i + 1}</span><img src={album.coverUrl} alt="" /><p><strong>{album.title}</strong><small>{album.artist}</small></p></div>)}
    </div>
    <div className="toggle-row privacy-row"><div><strong>{isPublic ? "Public list" : "Private list"}</strong><span>{isPublic ? "Anyone can find and share this list" : "Only you can view this list"}</span></div><button type="button" className={`toggle ${isPublic ? "on" : ""}`} onClick={() => setIsPublic(!isPublic)}><i /></button></div>
    {error && <p role="alert" className="error-text">{error}</p>}
    <button className="publish-button" disabled={loading}>{loading ? "Saving..." : "Save List"}</button>
  </form></div>;
}

function ShareCard({
  close,
  album,
  review,
  user,
}: {
  close: () => void;
  album: Album | null;
  review: Review | null;
  user: User | null;
}) {
  const [error, setError] = useState("");
  const [working, setWorking] = useState(false);
  const coverUrl = album?.coverUrl ?? art[0];
  const title = album?.title ?? "Your latest listen";
  const artist = album?.artist ?? "Eco";
  const rating = review?.rating ?? album?.averageRating ?? 0;
  const reviewText = review?.textContent ?? review?.content ?? "";

  const createImage = async () => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.src = coverUrl;
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () => reject(new Error("Album artwork could not be loaded."));
    });

    const canvas = document.createElement("canvas");
    canvas.width = 1080;
    canvas.height = 1920;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Image generation is not supported by this browser.");

    const scale = Math.max(canvas.width / image.width, canvas.height / image.height);
    const imageWidth = image.width * scale;
    const imageHeight = image.height * scale;
    context.drawImage(image, (canvas.width - imageWidth) / 2, (canvas.height - imageHeight) / 2, imageWidth, imageHeight);
    const overlay = context.createLinearGradient(0, 0, 0, canvas.height);
    overlay.addColorStop(0, "#06101dcc");
    overlay.addColorStop(0.4, "#06101d55");
    overlay.addColorStop(1, "#06101df2");
    context.fillStyle = overlay;
    context.fillRect(0, 0, canvas.width, canvas.height);

    const coverSize = 660;
    const coverX = (canvas.width - coverSize) / 2;
    context.shadowColor = "#00000099";
    context.shadowBlur = 45;
    context.drawImage(image, coverX, 410, coverSize, coverSize);
    context.shadowBlur = 0;
    context.fillStyle = "#ffffff";
    context.font = "800 74px Inter, sans-serif";
    context.textAlign = "center";
    context.fillText(title.slice(0, 24), 540, 1210, 900);
    context.font = "600 38px Inter, sans-serif";
    context.fillStyle = "#cbd5e1";
    context.fillText(artist.toUpperCase().slice(0, 36), 540, 1270, 900);
    context.fillStyle = "#00d2ff";
    context.font = "700 42px Inter, sans-serif";
    context.fillText(`${"★".repeat(Math.round(rating))}  ${rating.toFixed(1)} / 5`, 540, 1390, 900);

    if (reviewText) {
      context.fillStyle = "#f1f5f9";
      context.font = "italic 34px Inter, sans-serif";
      const words = reviewText.split(/\s+/);
      let line = "";
      let y = 1500;
      for (const word of words) {
        const nextLine = line ? `${line} ${word}` : word;
        if (context.measureText(nextLine).width > 820) {
          context.fillText(line, 540, y, 820);
          line = word;
          y += 48;
          if (y > 1690) break;
        } else {
          line = nextLine;
        }
      }
      if (line && y <= 1690) context.fillText(line, 540, y, 820);
    }
    context.fillStyle = "#ffffff";
    context.font = "800 44px Inter, sans-serif";
    context.fillText("eco", 540, 1820);
    context.fillStyle = "#00d2ff";
    context.fillText(`@${user?.username ?? "listener"}`, 540, 1870);
    return new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error("Could not export the social card.")), "image/png");
    });
  };

  const downloadCard = async () => {
    setWorking(true);
    setError("");
    try {
      const blob = await createImage();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "eco-listen.png";
      link.click();
      URL.revokeObjectURL(url);
    } catch (generationError) {
      console.error("Could not generate the social card.", generationError);
      setError(generationError instanceof Error ? generationError.message : "Could not generate the social card.");
    } finally {
      setWorking(false);
    }
  };

  const shareCard = async () => {
    setWorking(true);
    setError("");
    try {
      const file = new File([await createImage()], "eco-listen.png", { type: "image/png" });
      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: `${title} — Eco`, text: `I rated ${title} ${rating}/5 on Eco.` });
      } else {
        const url = URL.createObjectURL(file);
        const link = document.createElement("a");
        link.href = url;
        link.download = file.name;
        link.click();
        URL.revokeObjectURL(url);
      }
    } catch (shareError) {
      if (shareError instanceof Error && shareError.name === "AbortError") return;
      console.error("Could not share the social card.", shareError);
      setError(shareError instanceof Error ? shareError.message : "Could not share the social card.");
    } finally {
      setWorking(false);
    }
  };

  return <div className="modal-backdrop share-backdrop" onMouseDown={close}><section className="share-generator" onMouseDown={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
    <UniversalHeader className="modal-safe-header" action={<button type="button" className="header-icon-button" onClick={close} aria-label="Close social share card"><Icon name="close" size={19} /></button>} />
    <div className="share-top"><div><span>SOCIAL CARD</span><h2>Share your listen</h2></div></div>
    <div className="story-card">
      <div className="story-bg" style={{ backgroundImage: `url(${coverUrl})` }} />
      <div className="story-brand">ec<span>o</span></div>
      <div className="story-content"><img src={coverUrl} alt={`${title} by ${artist}`} /><div className="story-rating"><span>{"★".repeat(Math.round(rating))}</span><b>{rating.toFixed(1)} / 5.0</b></div><h3>{title}</h3><p className="story-artist">{artist.toUpperCase()}</p>{reviewText && <blockquote>{reviewText}</blockquote>}<div className="story-user"><ProfileAvatar className="share-avatar" src={user?.photoURL || user?.avatarUrl || portrait} alt="" /><span><b>@{user?.username ?? "listener"}</b><small>Logged on Eco</small></span></div></div>
    </div>
    {error && <p role="alert" className="error-text">{error}</p>}
    <div className="share-actions"><button className="publish-button" disabled={working} onClick={shareCard}><Icon name="share" size={18} /> Share card</button><button className="square-action" disabled={working} onClick={downloadCard} aria-label="Download image"><Icon name="download" /></button></div>
  </section></div>;
}

function EditProfileScreen({
  close,
  user,
  albums,
  onSave,
}: {
  close: () => void;
  user: User | null;
  albums: Album[];
  onSave: (data: Partial<User>) => Promise<void>;
}) {
  const [displayName, setDisplayName] = useState(user?.displayName ?? "");
  const [username, setUsername] = useState(user?.username ?? "");
  const [bio, setBio] = useState(user?.bio ?? "");
  const [photoURL, setPhotoURL] = useState(user?.photoURL ?? user?.avatarUrl ?? "");
  const [lastfmUsername, setLastfmUsername] = useState(user?.lastfmUsername ?? "");
  const [favoriteAlbums, setFavoriteAlbums] = useState(user?.favoriteAlbums ?? []);
  const [saving, setSaving] = useState(false);
  const [imageLoading, setImageLoading] = useState(false);
  const [error, setError] = useState("");

  const handlePhotoChange = async (file?: File) => {
    if (!file) return;
    setImageLoading(true);
    setError("");
    try {
      setPhotoURL(await encodeProfileImage(file));
    } catch (imageError) {
      setError(imageError instanceof Error ? imageError.message : "Could not process this image.");
    } finally {
      setImageLoading(false);
    }
  };

  const saveProfile = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (imageLoading) return;
    setSaving(true);
    setError("");
    try {
      await onSave({
        displayName: displayName.trim(),
        username: username.trim(),
        bio: bio.trim(),
        photoURL: photoURL.trim(),
        lastfmUsername: lastfmUsername.trim(),
        favoriteAlbums: favoriteAlbums.slice(0, 4),
      });
    } catch (saveError) {
      console.error("Could not save profile.", saveError);
      setError("Profile could not be saved. Check your connection and try again.");
    } finally {
      setSaving(false);
    }
  };

  const changeFavorites = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const selected = Array.from(event.currentTarget.selectedOptions, (option) => option.value);
    if (selected.length <= 4) setFavoriteAlbums(selected);
  };

  return <main className="account-screen edit-profile-screen">
    <form onSubmit={saveProfile}>
      <UniversalHeader onLogo={close} action={<button className="save-button" disabled={saving}>{saving ? "Saving..." : "Save"}</button>} />
      <div className="screen-heading"><span>YOUR ACCOUNT</span><h1>Edit Profile</h1></div>
      <section className="photo-editor">
        <div><ProfileAvatar className="profile-photo-preview" src={photoURL || portrait} alt="Profile photo preview" /></div>
        <label className="field-label" htmlFor="profile-photo">Upload photo or provide an image URL</label>
        <input id="profile-photo" type="file" accept="image/*" onChange={(event) => void handlePhotoChange(event.currentTarget.files?.[0])} />
        <input className="text-field" type="url" aria-label="Or enter photo URL" placeholder="https://..." value={photoURL.startsWith("data:") ? "" : photoURL} onChange={(event) => setPhotoURL(event.target.value)} />
        {imageLoading && <span>Processing image...</span>}
      </section>
      <section className="favorite-editor">
        <div className="edit-section-title"><div><span>SHOWCASE</span><h2>Top 4 Favorite Albums</h2></div><p>Select up to four</p></div>
        <select className="text-field" multiple value={favoriteAlbums} onChange={changeFavorites} aria-label="Choose up to four favorite albums">
          {albums.map((album) => <option key={album.id} value={album.id}>{album.title} — {album.artist}</option>)}
        </select>
      </section>
      <section className="edit-form">
        <label htmlFor="display-name">Display Name</label><input id="display-name" className="text-field" value={displayName} onChange={(event) => setDisplayName(event.target.value)} required maxLength={80} />
        <label htmlFor="username">Username</label><div className="handle-field"><span>@</span><input id="username" className="text-field" value={username} onChange={(event) => setUsername(event.target.value)} required maxLength={30} pattern="[A-Za-z0-9._]+" /></div>
        <div className="label-row"><label htmlFor="profile-bio">Bio</label><span>{bio.length}/160</span></div><textarea id="profile-bio" rows={4} value={bio} onChange={(event) => setBio(event.target.value)} maxLength={160} />
        <label htmlFor="lastfm-username">Last.fm Username</label><input id="lastfm-username" className="text-field" value={lastfmUsername} onChange={(event) => setLastfmUsername(event.target.value)} maxLength={40} />
        {error && <p role="alert" className="error-text">{error}</p>}
      </section>
    </form>
  </main>;
}

function SettingsScreen({ close, onLogout }: { close: () => void; onLogout: () => void }) {
  return <main className="account-screen settings-screen">
    <UniversalHeader onLogo={close} action={<button className="header-text-action" onClick={close}>Done</button>} />
    <div className="screen-heading"><span>YOUR ECO</span><h1>Settings</h1></div>
    <section className="settings-group"><h2>Account & Sync</h2><div className="settings-card">
      <div className="setting-row"><span><strong>Spotify Live Sync</strong><small>Not connected — backend integration required</small></span></div>
      <div className="setting-row"><span><strong>Last.fm Auto-Scrobble</strong><small>Username can be saved in Edit Profile; sync requires backend integration</small></span></div>
      <div className="setting-row"><span><strong>Account email</strong><small>{auth?.currentUser?.email ?? "Unavailable"}</small></span></div>
    </div></section>
    <section className="settings-group"><h2>Preferences</h2><div className="settings-card">
      <button className="setting-link"><span><strong>Default Rating Scale</strong><small>0.5 – 5.0 Stars</small></span><Icon name="chevron" size={19} /></button>
      <button className="setting-link"><span><strong>Notification Settings</strong><small>Push, email, and activity alerts</small></span><Icon name="chevron" size={19} /></button>
    </div></section>
    <section className="settings-group account-actions"><h2>Account Actions</h2><div className="settings-card"><button onClick={onLogout}>Log Out</button></div></section>
    <p className="settings-version"> Version 1.0.0</p>
  </main>;
}

function ArtistScreen({
  artist,
  albums,
  goBack,
  loadMore,
  hasMore,
  openAlbum,
}: {
  artist: string | null;
  albums: Album[];
  goBack: () => void;
  loadMore: () => void;
  hasMore: boolean;
  openAlbum: (id?: string, fromScreen?: string) => void;
}) {
  return (
    <main className="album-page">
      <UniversalHeader onLogo={goBack} action={<button className="header-icon-button" aria-label="Share"><Icon name="share" /></button>} />
      <section className="profile-header">
        <div className="profile-person">
          <div className="avatar avatar-lilac">{artist?.slice(0, 1).toUpperCase()}</div>
          <div><h1>{artist}</h1><p>Artist</p></div>
        </div>
        <button className="edit-profile" onClick={goBack}><Icon name="chevron" size={16} /> Back</button>
      </section>
      <section className="section-title"><h2>Albums by {artist}</h2></section>
      <div className="album-rail">
        {albums.map((album) => (
          <button className="album-tile" key={album.id} onClick={() => openAlbum(album.id, "artist")}>
            <div className="cover-wrap">
              <img src={album.coverUrl} alt={`${album.title} by ${album.artist}`} />
            </div>
            <strong>{album.title}</strong>
            <span>{album.year}</span>
          </button>
        ))}
        {albums.length === 0 && <p className="screen-heading">No albums found for this artist.</p>}
      </div>
      {hasMore && <div style={{ padding: 24, textAlign: "center" }}><button className="primary-button" onClick={loadMore}>Load More</button></div>}
    </main>
  );
}

export default function App() {
  const [screen, setScreen] = useState<Screen>("login");
  const [logOpen, setLogOpen] = useState(false);
  const [listOpen, setListOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [shareReview, setShareReview] = useState<Review | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  // Data state
  const [albums, setAlbums] = useState<Album[]>([]);
  const [selectedAlbumId, setSelectedAlbumId] = useState<string | null>(null);
  const [selectedArtist, setSelectedArtist] = useState<string | null>(null);
  const [artistAlbums, setArtistAlbums] = useState<Album[]>([]);
  const [artistOffset, setArtistOffset] = useState(0);
  const [navHistory, setNavHistory] = useState<string[]>([]);
  const [albumTracks, setAlbumTracks] = useState<Track[]>([]);
  const [albumReviews, setAlbumReviews] = useState<Review[]>([]);
  const [recentReviews, setRecentReviews] = useState<Review[]>([]);
  const [userReviews, setUserReviews] = useState<Review[]>([]);
  const [userLists, setUserLists] = useState<UserList[]>([]);
  const [publicLists, setPublicLists] = useState<UserList[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const selectedAlbum = albums.find((album) => album.id === selectedAlbumId) ?? null;

  const refreshRecentReviews = async () => {
    try {
      setRecentReviews(await reviewService.getRecentReviews());
    } catch (error) {
      console.error("Could not load community reviews.", error);
      setLoadError("Community reviews could not be loaded.");
    }
  };

  const refreshPublicLists = async () => {
    try {
      const lists = await listService.getLists();
      setPublicLists(lists);
      const albumIds = lists.flatMap((list) => list.albumIds ?? list.albums?.map((item) => item.albumId) ?? []);
      if (albumIds.length) {
        const referencedAlbums = await albumService.getAlbumsByIds(albumIds);
        setAlbums((current) => mergeAlbums(current, referencedAlbums));
      }
    } catch (error) {
      console.error("Could not load public lists.", error);
      setLoadError("Public lists could not be loaded.");
    }
  };

  const refreshAlbumReviews = async (albumId: string) => {
    try {
      setAlbumReviews(await reviewService.getReviewsByAlbum(albumId));
    } catch (error) {
      console.error("Could not load album reviews.", error);
      setLoadError("Album reviews could not be loaded.");
    }
  };

  useEffect(() => {
    if (!auth) {
      setAuthLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (firebaseUser) {
          const profile = await userService.getUserProfile(firebaseUser.uid);
          setCurrentUser(profile);
          setScreen("home");
        } else {
          setCurrentUser(null);
          setScreen("login");
        }
      } catch (error) {
        console.error("Could not load the signed-in user's profile.", error);
        setLoadError("Your profile could not be loaded. Check your Firebase connection and try again.");
      } finally {
        setAuthLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!firebaseConfigured) return;
    albumService.getAlbums()
      .then(setAlbums)
      .catch((error: unknown) => {
        console.error("Could not load the local music catalog.", error);
        setLoadError("The local music catalog could not be loaded. Generate its files with the catalog importer.");
      });
    void refreshRecentReviews();
    void refreshPublicLists();
  }, []);

  useEffect(() => {
    const userId = auth?.currentUser?.uid;
    if (screen !== "profile" || !userId) return;
    Promise.all([reviewService.getUserReviews(userId), listService.getUserLists(userId)])
      .then(([reviews, lists]) => {
        setUserReviews(reviews);
        setUserLists(lists);
        const listAlbumIds = lists.flatMap((list) => list.albumIds ?? list.albums?.map((item) => item.albumId) ?? []);
        const albumIds = [...reviews.map((review) => review.albumId), ...listAlbumIds];
        return albumService.getAlbumsByIds(albumIds);
      })
      .then((referencedAlbums) => {
        setAlbums((current) => mergeAlbums(current, referencedAlbums));
      })
      .catch((error: unknown) => {
        console.error("Could not load profile activity.", error);
        setLoadError("Your profile activity could not be loaded.");
      });
  }, [screen, currentUser?.id]);

  const openAlbum = async (id?: string, fromScreen?: string) => {
    const albumId = id ?? albums[0]?.id;
    if (albumId) {
      if (fromScreen && fromScreen !== "album") {
        setNavHistory((prev) => (prev.includes(fromScreen) ? prev : [...prev, fromScreen]));
      }
      setSelectedAlbumId(albumId);
      setAlbumReviews([]);
      setAlbumTracks([]);
      void refreshAlbumReviews(albumId);
      setScreen("album");
      try {
        const album = await albumService.getAlbumById(albumId);
        if (!album) {
          setLoadError("That album is no longer available in the local catalog.");
          return;
        }
        setAlbums((current) => mergeAlbums(current, [album]));
        setAlbumTracks(album.tracks ?? []);
      } catch (error) {
        console.error("Could not load album from the local catalog.", error);
        setLoadError("Album details could not be loaded from the local music database.");
      }
      return;
    }
    setScreen("album");
  };

  const openArtist = async (artist: string, fromScreen?: string) => {
    if (fromScreen && fromScreen !== "artist") {
      setNavHistory((prev) => (prev.includes(fromScreen) ? prev : [...prev, fromScreen]));
    }
    setSelectedArtist(artist);
    setArtistAlbums([]);
    setArtistOffset(0);
    setScreen("artist");
    try {
      const results = await albumService.getAlbumsByArtist(artist, 50, 0);
      setArtistAlbums(results);
      setAlbums((current) => mergeAlbums(current, results));
    } catch (error) {
      console.error("Could not load artist albums.", error);
      setLoadError("Artist albums could not be loaded.");
    }
  };

  const goBack = () => {
    const last = navHistory[navHistory.length - 1];
    setNavHistory((prev) => prev.slice(0, -1));
    if (last === "search") setScreen("search");
    else if (last === "home") setScreen("home");
    else if (last === "lists") setScreen("lists");
    else if (last === "artist") setScreen("artist");
    else setScreen("home");
  };

  const loadMoreArtistAlbums = async () => {
    if (!selectedArtist) return;
    try {
      const results = await albumService.getAlbumsByArtist(selectedArtist, 50, artistOffset);
      setArtistOffset((prev) => prev + 50);
      setArtistAlbums((current) => mergeAlbums(current, results));
      setAlbums((all) => mergeAlbums(all, results));
    } catch (error) {
      console.error("Could not load more artist albums.", error);
    }
  };

  const openLog = () => {
    if (!selectedAlbumId && albums[0]?.id) openAlbum(albums[0].id);
    setLogOpen(true);
  };

  const openShare = (review?: Review) => {
    setShareReview(review ?? userReviews[0] ?? recentReviews[0] ?? null);
    setShareOpen(true);
  };

  const handleLogout = async () => {
    if (!auth) return;
    await signOut(auth);
    setScreen("login");
  };

  const saveProfile = async (data: Partial<User>) => {
    const userId = auth?.currentUser?.uid;
    if (!userId) throw new Error("You must be signed in to edit your profile.");
    await userService.updateUserProfile(userId, data);
    setCurrentUser((profile) => profile ? { ...profile, ...data } : profile);
    setScreen("profile");
  };

  if (!firebaseConfigured) {
    return (
      <main className="account-screen">
        <div className="screen-heading">
          <span>SETUP REQUIRED</span>
          <h1>Connect Eco to Firebase</h1>
          <p>Create a <code>.env.local</code> file in the project root with these values from Firebase Console → Project settings → Your apps:</p>
          <pre>{`VITE_FIREBASE_API_KEY=\nVITE_FIREBASE_AUTH_DOMAIN=\nVITE_FIREBASE_PROJECT_ID=\nVITE_FIREBASE_STORAGE_BUCKET=\nVITE_FIREBASE_MESSAGING_SENDER_ID=\nVITE_FIREBASE_APP_ID=`}</pre>
          <p>Enable Email/Password and Google under Authentication → Sign-in method, then create a Cloud Firestore database.</p>
        </div>
      </main>
    );
  }

  const showNav = !["album", "edit-profile", "settings", "login", "register"].includes(screen);

  if (authLoading) {
    return (
      <div className="app-shell" style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh" }}>
        <div className="universal-wordmark">ec<span>o</span></div>
      </div>
    );
  }

  return (
    <div className="app-shell">
      {screen === "home" && <HomeScreen albums={albums} reviews={recentReviews} user={currentUser} openAlbum={openAlbum} openSearch={() => setScreen("search")} />}
      {screen === "album" && <AlbumScreen album={selectedAlbum} tracks={albumTracks} reviews={albumReviews} goBack={goBack} openLog={openLog} />}
      {screen === "artist" && <ArtistScreen artist={selectedArtist} albums={artistAlbums} goBack={goBack} loadMore={loadMoreArtistAlbums} hasMore={artistAlbums.length === 50} openAlbum={openAlbum} />}
      {screen === "profile" && <ProfileScreen user={currentUser} albums={albums} reviews={userReviews} lists={userLists} openShare={openShare} editProfile={() => setScreen("edit-profile")} openSettings={() => setScreen("settings")} />}
      {screen === "edit-profile" && <EditProfileScreen close={() => setScreen("profile")} user={currentUser} albums={albums} onSave={saveProfile} />}
      {screen === "settings" && <SettingsScreen close={() => setScreen("profile")} onLogout={handleLogout} />}
      {screen === "search" && <SearchScreen albums={albums} openAlbum={openAlbum} openArtist={openArtist} />}
      {screen === "lists" && <ListsScreen lists={publicLists} albums={albums} createList={() => setListOpen(true)} openShare={() => openShare()} />}
      {screen === "login" && <LoginScreen setScreen={setScreen} />}
      {screen === "register" && <RegisterScreen setScreen={setScreen} />}
      {showNav && <BottomNav active={screen} setScreen={setScreen} openLog={openLog} />}
      {logOpen && <LogSheet close={() => setLogOpen(false)} albumId={selectedAlbumId} album={selectedAlbum} tracks={albumTracks} userId={auth?.currentUser?.uid} onPublished={async () => { await refreshRecentReviews(); if (selectedAlbumId) await refreshAlbumReviews(selectedAlbumId); }} />}
      {listOpen && <ListCreator close={() => setListOpen(false)} albums={albums} userId={auth?.currentUser?.uid} onCreated={refreshPublicLists} />}
      {shareOpen && <ShareCard close={() => setShareOpen(false)} album={albums.find((item) => item.id === shareReview?.albumId) ?? selectedAlbum ?? albums[0] ?? null} review={shareReview} user={currentUser} />}
      {loadError && <p role="alert" className="error-text">{loadError}</p>}
    </div>
  );
}
