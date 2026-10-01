import { useState, type ReactNode } from "react";

type Screen = "home" | "album" | "search" | "lists" | "profile" | "edit-profile" | "settings";

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

function UniversalHeader({ action, onLogo, className = "" }: { action: ReactNode; onLogo?: () => void; className?: string }) {
  return <header className={`universal-header ${className}`}>
    <div className="universal-header-row">
      <button className="wordmark universal-wordmark" onClick={onLogo} aria-label="Eco home">ec<span>o</span></button>
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

function HomeScreen({ openAlbum, openSearch }: { openAlbum: () => void; openSearch: () => void }) {
  const releases = [
    ["Blue Hour", "Mila Rae"],
    ["Soft Static", "Novo Amor"],
    ["Afterimage", "Lunar Isles"],
    ["Frequencies", "Baird"],
  ];
  return (
    <>
      <Header onSearch={openSearch} />
      <main>
        <section className="hero-intro">
          <p>FRIDAY, MAY 24</p>
          <h1>Good evening, Alex.</h1>
          <span>Find your next favorite record.</span>
        </section>

        <section>
          <SectionTitle action="See all">Weekly releases</SectionTitle>
          <div className="album-rail">
            {releases.map(([title, artist], i) => (
              <button className="album-tile" key={title} onClick={openAlbum}>
                <div className="cover-wrap">
                  <img src={art[i]} alt={`${title} by ${artist}`} />
                  {i === 0 && <span className="new-pill">NEW</span>}
                </div>
                <strong>{title}</strong>
                <span>{artist}</span>
              </button>
            ))}
          </div>
        </section>

        <section className="feed-section">
          <SectionTitle action="Following">Feed activity</SectionTitle>
          <article className="review-card">
            <div className="review-head">
              <div className="review-user">
                <div className="avatar avatar-lilac">M</div>
                <div><strong>maya.wav</strong><span>reviewed an album</span></div>
              </div>
              <button className="more-button" aria-label="More options"><Icon name="more" /></button>
            </div>
            <button className="review-album" onClick={openAlbum}>
              <img src={art[0]} alt="Blue Hour album cover" />
              <div>
                <span>ALBUM</span>
                <h3>Blue Hour</h3>
                <p>Mila Rae · 2024</p>
                <Stars value={4.5} />
              </div>
            </button>
            <p className="review-copy">“Feels like driving through the city at 2am with nowhere to be. That final track is unreal.”</p>
            <div className="review-footer">
              <button><Icon name="heart" size={19} /> 24</button>
              <span>2h ago</span>
            </div>
          </article>

          <article className="review-card compact-review">
            <div className="review-head">
              <div className="review-user">
                <div className="avatar avatar-blue">J</div>
                <div><strong>julian.fm</strong><span>logged Soft Static</span></div>
              </div>
              <span>5h ago</span>
            </div>
            <div className="compact-row">
              <img src={art[1]} alt="Soft Static album cover" />
              <div><h3>Soft Static</h3><p>Novo Amor</p><Stars value={4} /></div>
            </div>
          </article>
        </section>
      </main>
    </>
  );
}

function AlbumScreen({ goBack, openLog }: { goBack: () => void; openLog: () => void }) {
  const tracks = [
    ["Tidal Memory", "3:42"],
    ["Blue Hour", "4:18"],
    ["Half Awake", "3:51"],
    ["City in Reverse", "4:06"],
    ["Anywhere But Here", "5:12"],
  ];
  return (
    <main className="album-page">
      <UniversalHeader onLogo={goBack} action={<button className="header-icon-button" aria-label="Share album"><Icon name="share" /></button>} />
      <div className="album-hero">
        <div className="hero-blur" style={{ backgroundImage: `url(${art[0]})` }} />
        <img className="hero-cover" src={art[0]} alt="Blue Hour by Mila Rae" />
      </div>
      <div className="album-content">
        <div className="album-heading">
          <p>MILA RAE</p>
          <h1>Blue Hour</h1>
          <span>2024 · 11 tracks · 42 min</span>
          <div className="pills"><span>Dream Pop</span><span>Electronic</span></div>
        </div>

        <div className="score-card">
          <div className="score-main"><strong>4.3</strong><span>out of 5</span><Stars value={4.5} /><small>2,847 ratings</small></div>
          <div className="histogram" aria-label="Rating distribution">
            {[["5", 88], ["4", 68], ["3", 34], ["2", 16], ["1", 7]].map(([label, width]) => (
              <div key={label}><span>{label}</span><i><b style={{ width: `${width}%` }} /></i></div>
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
            {tracks.map(([title, duration], i) => (
              <div className="track" key={title}>
                <span>{String(i + 1).padStart(2, "0")}</span>
                <strong>{title}</strong>
                <button aria-label={`Favorite ${title}`}><Icon name="star" size={17} fill={i === 1 ? "currentColor" : "none"} /></button>
                <time>{duration}</time>
              </div>
            ))}
          </div>
        </section>

        <section className="community">
          <SectionTitle action="View all">Community reviews</SectionTitle>
          <div className="filter-pills"><button className="active">Popular</button><button>Recent</button><button>Friends</button></div>
          <article className="community-card">
            <div className="review-user"><div className="avatar avatar-lilac">M</div><div><strong>maya.wav</strong><Stars value={4.5} /></div></div>
            <p>Feels like driving through the city at 2am with nowhere to be. That final track is unreal.</p>
            <div className="review-footer"><button><Icon name="heart" size={18} /> 24 likes</button><span>2d</span></div>
          </article>
        </section>
      </div>
    </main>
  );
}

function ProfileScreen({ openShare, editProfile, openSettings }: { openShare: () => void; editProfile: () => void; openSettings: () => void }) {
  const [tab, setTab] = useState<"reviews" | "lists" | "stats">("reviews");
  return (
    <>
      <UniversalHeader action={<button className="header-icon-button" aria-label="Settings" onClick={openSettings}><Icon name="gear" /></button>} />
      <main className="profile-page">
        <section className="profile-header">
          <div className="profile-person">
            <img src={portrait} alt="Alex Morgan" />
            <div><h1>Alex Morgan</h1><p>@alexlistens</p></div>
          </div>
          <p>Always listening. Dream pop, late-night jazz, and records that feel like places.</p>
          <div className="profile-actions">
            <button className="spotify-badge"><Icon name="spotify" size={18} /> Connected to Spotify</button>
            <button className="edit-profile" onClick={editProfile}><Icon name="edit" size={16} /> Edit profile</button>
          </div>
          <div className="stats">
            <div><strong>326</strong><span>Albums</span></div>
            <div><strong>184</strong><span>Reviews</span></div>
            <div><strong>12</strong><span>Lists</span></div>
          </div>
        </section>
        <div className="profile-tabs">
          {(["reviews", "lists", "stats"] as const).map((item) => <button className={tab === item ? "active" : ""} onClick={() => setTab(item)} key={item}>{item[0].toUpperCase() + item.slice(1)}</button>)}
        </div>
        {tab === "reviews" && <section className="profile-reviews">
          {[
            ["Blue Hour", "Mila Rae", 4.5, "An album that glows brighter after midnight.", 24, art[0]],
            ["Soft Static", "Novo Amor", 4, "Quietly devastating, beautifully detailed.", 18, art[1]],
            ["Afterimage", "Lunar Isles", 3.5, "A dreamy, patient listen with a huge finish.", 9, art[2]],
          ].map(([title, artist, rating, copy, likes, image]) => (
            <article className="profile-review" key={String(title)}>
              <img src={String(image)} alt="" />
              <div><span>{artist}</span><strong>{title}</strong><Stars value={Number(rating)} /><p>“{copy}”</p><div><button><Icon name="heart" size={16} /> {likes}</button><button onClick={openShare}><Icon name="share" size={16} /> Share</button></div></div>
            </article>
          ))}
        </section>}
        {tab === "lists" && <section className="profile-lists">
          {["Night drives", "Perfect first albums", "Soft Sundays", "Blue period"].map((title, i) => (
            <article key={title}><div className="mini-stack"><img src={art[i]} alt="" /><img src={art[i + 1]} alt="" /></div><strong>{title}</strong><span>{12 - i * 2} albums</span></article>
          ))}
        </section>}
        {tab === "stats" && <section className="stats-dashboard">
          <div className="metric-row"><div><strong>326</strong><span>Albums logged</span></div><div><strong>428h</strong><span>Listened</span></div><div><strong>4.1</strong><span>Avg rating</span></div></div>
          <div className="analytics-card genres-card"><div className="donut"><span>Top<br /><b>Genres</b></span></div><div><h3>Top genres</h3><p><i className="dot-cyan" /> Dream Pop <b>34%</b></p><p><i className="dot-blue" /> Electronic <b>28%</b></p><p><i className="dot-purple" /> Indie <b>21%</b></p></div></div>
          <div className="analytics-card"><h3>Albums logged per month</h3><div className="bar-chart">{[38, 64, 42, 78, 58, 92].map((height, i) => <div key={i}><i style={{ height: `${height}%` }} /><span>{["Jan", "Feb", "Mar", "Apr", "May", "Jun"][i]}</span></div>)}</div></div>
        </section>}
      </main>
    </>
  );
}

function SearchScreen({ openAlbum }: { openAlbum: () => void }) {
  const [category, setCategory] = useState("All");
  const [filterOpen, setFilterOpen] = useState(false);
  return (
    <>
      <UniversalHeader action={<button className="header-icon-button" onClick={() => setFilterOpen(true)} aria-label="Search filters"><Icon name="filter" /></button>} />
      <main className="search-page">
        <div className="search-header">
          <div className="global-search"><Icon name="search" size={20} /><input autoFocus placeholder="Search albums, artists, users, lists..." /><button aria-label="Search filters" onClick={() => setFilterOpen(true)}><Icon name="filter" size={19} /></button></div>
          <div className="category-tabs">{["All", "Albums", "Artists", "Tracks", "Users", "Lists"].map((item) => <button className={category === item ? "active" : ""} onClick={() => setCategory(item)} key={item}>{item}</button>)}</div>
        </div>
        <section className="discovery-filters">
          <button className="filter-lead" onClick={() => setFilterOpen(true)}><Icon name="filter" size={16} /> Filters</button>
          {["Indie", "Hip-Hop", "Electronic", "2020s", "90s", "Album", "EP", "4.0+ ★"].map((chip) => <button key={chip} onClick={() => setFilterOpen(true)}>{chip}</button>)}
        </section>
        {category === "All" && <section className="release-calendar">
          <SectionTitle action="Full calendar">Fresh releases</SectionTitle>
          <div className="release-timeline">
            {[["OUT TODAY", "Blue Hour", "Mila Rae", art[0]], ["FRI 31", "Chromatic", "Lunar Isles", art[3]], ["JUN 07", "Frequencies", "Baird", art[4]], ["JUN 14", "Still Life", "Hana", art[5]]].map(([date, title, artist, image]) => (
              <button key={String(title)} onClick={openAlbum}><div><img src={String(image)} alt="" /><span>{date}</span></div><strong>{title}</strong><small>{artist}</small></button>
            ))}
          </div>
        </section>}
        {(category === "All" || category === "Albums") && <section className="result-section">
          <SectionTitle action="See all">Albums</SectionTitle>
          <div className="search-albums">{[["Blue Hour", "Mila Rae"], ["Soft Static", "Novo Amor"], ["Afterimage", "Lunar Isles"]].map(([title, artist], i) => <button key={title} onClick={openAlbum}><img src={art[i]} alt="" /><strong>{title}</strong><span>{artist}</span></button>)}</div>
        </section>}
        {(category === "All" || category === "Artists") && <section className="result-section">
          <SectionTitle action="See all">Artists</SectionTitle>
          <div className="artist-results">{[["Mila Rae", art[6]], ["Lunar Isles", art[3]], ["Baird", art[4]]].map(([name, image]) => <button key={name}><img src={image} alt="" /><div><strong>{name}</strong><span>Artist · 48.2k followers</span></div><Icon name="chevron" size={17} /></button>)}</div>
        </section>}
        {(category === "All" || category === "Tracks") && <section className="result-section tracks-results">
          <SectionTitle action="See all">Tracks</SectionTitle>
          {[["Blue Hour", "Mila Rae", art[0]], ["Half Awake", "Mila Rae", art[0]], ["Soft Focus", "Novo Amor", art[1]]].map(([title, artist, image], i) => <button key={title}><span>{i + 1}</span><img src={image} alt="" /><div><strong>{title}</strong><small>{artist}</small></div><Icon name="more" size={18} /></button>)}
        </section>}
        {(category === "All" || category === "Users") && <section className="result-section user-results">
          <SectionTitle action="See all">Users</SectionTitle>
          <div><button><div className="avatar avatar-lilac">M</div><span><strong>maya.wav</strong><small>@mayalistens · 328 reviews</small></span><b style={{width:"55px",paddingLeft:0,paddingRight:0}}>Follow</b></button><button><div className="avatar avatar-blue">J</div><span><strong>julian.fm</strong><small>@julianfm · 194 reviews</small></span><b style={{width:"55px",paddingLeft:0,paddingRight:0}}>Follow</b></button></div>
        </section>}
        {(category === "All" || category === "Lists") && <section className="result-section search-list-results">
          <SectionTitle action="See all">Lists</SectionTitle>
          <div>{["Records for the blue hour", "Quiet records, loud feelings"].map((title, i) => <button key={title}><span><img src={art[i]} alt="" /><img src={art[i + 2]} alt="" /></span><div><strong>{title}</strong><small>by @{i ? "maya.wav" : "alexlistens"} · {12 - i * 3} albums</small></div><Icon name="chevron" size={17} /></button>)}</div>
        </section>}
      </main>
      {filterOpen && <FilterSheet close={() => setFilterOpen(false)} />}
    </>
  );
}

function FilterSheet({ close }: { close: () => void }) {
  const [rating, setRating] = useState(4);
  return <div className="modal-backdrop" onMouseDown={close}><section className="filter-sheet" onMouseDown={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
    <UniversalHeader className="modal-safe-header" action={<button className="header-icon-button" onClick={close} aria-label="Close filters"><Icon name="close" size={19} /></button>} />
    <div className="filter-title"><div><span>DISCOVERY</span><h2>Filters & categories</h2></div></div>
    <label className="field-label">Era / decade</label><select defaultValue="2020s"><option>2020s</option><option>2010s</option><option>2000s</option><option>1990s</option><option>1980s</option></select>
    <label className="field-label">Genres</label><div className="check-grid">{["Indie", "Hip-Hop", "Electronic", "R&B", "Jazz", "Rock"].map((genre, i) => <label key={genre}><input type="checkbox" defaultChecked={i < 2} /> <span>{genre}</span></label>)}</div>
    <label className="field-label">Release type</label><div className="choice-pills"><button className="active">Album</button><button>EP</button><button>Single</button></div>
    <div className="range-label"><label>Minimum average rating</label><strong>{rating.toFixed(1)}+</strong></div><input className="range" type="range" min=".5" max="5" step=".5" value={rating} onChange={(e) => setRating(Number(e.target.value))} />
    <button className="publish-button" onClick={close}>Show results</button>
  </section></div>;
}

function ListsScreen({ createList, openShare }: { createList: () => void; openShare: () => void }) {
  return <><UniversalHeader action={<button className="header-icon-button" onClick={createList} aria-label="Edit list"><Icon name="edit" /></button>} /><main className="list-viewer">
    <section className="list-hero">
      <div className="cover-collage"><img src={art[1]} alt="" /><img src={art[3]} alt="" /><img src={art[0]} alt="" /></div>
      <span>CURATED LIST</span><h1>Records for<br />the blue hour</h1><div className="list-author"><img src={portrait} alt="" /><p>Curated by <strong>@alexlistens</strong></p></div>
    </section>
    <div className="aggregate-stats"><span><b>12</b> Albums</span><span><b>7h 45m</b> Total</span><span><b>4.2</b> Avg rating</span></div>
    <section className="numbered-grid">{art.slice(0, 6).map((image, i) => <article key={image}><div><img src={image} alt="" /><span>{String(i + 1).padStart(2, "0")}</span></div><strong>{["Blue Hour", "Soft Static", "Afterimage", "Chromatic", "Frequencies", "Still Life"][i]}</strong><small>{["Mila Rae", "Novo Amor", "Lunar Isles", "Sonder", "Baird", "Hana"][i]}</small></article>)}</section>
    <div className="list-footer-actions"><button className="new-list" onClick={createList}><Icon name="plus" size={17} /> New list</button><button className="icon-button" onClick={openShare} aria-label="Share list"><Icon name="share" size={19} /></button></div>
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

function LogSheet({ close }: { close: () => void }) {
  const [rating, setRating] = useState(4.5);
  const [relis, setRelis] = useState(false);
  return (
    <div className="modal-backdrop" onMouseDown={close}>
      <section className="log-sheet" onMouseDown={(e) => e.stopPropagation()} aria-modal="true" role="dialog" aria-labelledby="log-title">
        <UniversalHeader className="modal-safe-header" action={<button className="header-icon-button" onClick={close} aria-label="Close log and review"><Icon name="close" size={20} /></button>} />
        <div className="sheet-title">
          <div><img src={art[0]} alt="" /><div><span>LOG ALBUM</span><h2 id="log-title">Blue Hour</h2><p>Mila Rae</p></div></div>
        </div>
        <div className="rating-block">
          <label>Your rating <strong>{rating.toFixed(1)}</strong></label>
          <div className="rating-selector">
            {[1, 2, 3, 4, 5].map((star) => (
              <button className={star - 0.5 === rating ? "half-active" : ""} key={star} onClick={(e) => {
                const box = e.currentTarget.getBoundingClientRect();
                setRating(e.clientX - box.left < box.width / 2 ? star - 0.5 : star);
              }} aria-label={`Rate up to ${star} stars`}>
                <span className={star <= Math.floor(rating) ? "full" : star - 0.5 === rating ? "half" : ""}>★</span>
              </button>
            ))}
          </div>
        </div>
        <label className="field-label">Date listened</label>
        <div className="date-field"><div><Icon name="calendar" size={18} /><span>Today <small>Default</small></span></div><button>Edit</button></div>
        <label className="field-label">Favorite track</label>
        <select defaultValue="">
          <option value="" disabled>Choose a track</option>
          <option>Blue Hour</option><option>Half Awake</option><option>City in Reverse</option>
        </select>
        <label className="field-label" htmlFor="review">Your review</label>
        <textarea id="review" placeholder="What did you think?" rows={3} />
        <div className="toggle-row">
          <div><strong>Re-listen</strong><span>I’ve listened to this album before</span></div>
          <button className={`toggle ${relis ? "on" : ""}`} onClick={() => setRelis(!relis)} aria-label="Toggle re-listen"><i /></button>
        </div>
        <button className="publish-button" onClick={close}>Publish & Share</button>
      </section>
    </div>
  );
}

function ListCreator({ close }: { close: () => void }) {
  const [isPublic, setIsPublic] = useState(true);
  return <div className="modal-backdrop" onMouseDown={close}><section className="list-creator" onMouseDown={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
    <UniversalHeader className="modal-safe-header" action={<button className="header-icon-button" onClick={close} aria-label="Close list creator"><Icon name="close" size={19} /></button>} />
    <div className="filter-title"><div><span>NEW COLLECTION</span><h2>Create a list</h2></div></div>
    <label className="field-label">List title</label><input className="text-field" defaultValue="Records for the blue hour" />
    <label className="field-label">Description</label><textarea rows={2} placeholder="What connects these records?" />
    <label className="field-label">Albums</label><div className="add-search"><Icon name="search" size={18} /><input placeholder="Search & add album" /></div>
    <div className="added-albums">
      {[["Blue Hour", "Mila Rae", art[0]], ["Soft Static", "Novo Amor", art[1]], ["Afterimage", "Lunar Isles", art[2]]].map(([title, artist, image], i) => <div key={title}><Icon name="drag" size={18} /><span>{i + 1}</span><img src={image} alt="" /><p><strong>{title}</strong><small>{artist}</small></p><button><Icon name="close" size={16} /></button></div>)}
    </div>
    <div className="toggle-row privacy-row"><div><strong>{isPublic ? "Public list" : "Private list"}</strong><span>{isPublic ? "Anyone can find and share this list" : "Only you can view this list"}</span></div><button className={`toggle ${isPublic ? "on" : ""}`} onClick={() => setIsPublic(!isPublic)}><i /></button></div>
    <button className="publish-button" onClick={close}>Save List</button>
  </section></div>;
}

function ShareCard({ close }: { close: () => void }) {
  return <div className="modal-backdrop share-backdrop" onMouseDown={close}><section className="share-generator" onMouseDown={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
    <UniversalHeader className="modal-safe-header" action={<button className="header-icon-button" onClick={close} aria-label="Close social share card"><Icon name="close" size={19} /></button>} />
    <div className="share-top"><div><span>SOCIAL CARD</span><h2>Share your listen</h2></div></div>
    <div className="story-card">
      <div className="story-bg" style={{ backgroundImage: `url(${art[0]})` }} />
      <div className="story-brand">ec<span>o</span></div>
      <div className="story-content"><img src={art[0]} alt="Blue Hour by Mila Rae" /><div className="story-rating"><span>★★★★★</span><b>4.5 / 5.0</b></div><h3>Blue Hour</h3><p className="story-artist">MILA RAE</p><blockquote>“An album that glows brighter after midnight.”</blockquote><div className="story-user"><img src={portrait} alt="" /><span><b>@alexlistens</b><small>Logged on Eco</small></span></div></div>
    </div>
    <div className="share-actions"><button className="publish-button"><Icon name="share" size={18} /> Share to Instagram Stories</button><button className="square-action" aria-label="Download image"><Icon name="download" /></button></div>
  </section></div>;
}

function EditProfileScreen({ close }: { close: () => void }) {
  return <main className="account-screen edit-profile-screen">
    <UniversalHeader onLogo={close} action={<button className="save-button" onClick={close}>Save</button>} />
    <div className="screen-heading"><span>YOUR ACCOUNT</span><h1>Edit Profile</h1></div>
    <section className="photo-editor">
      <div><img src={portrait} alt="Alex Morgan" /><button aria-label="Change profile photo"><Icon name="camera" size={20} /></button></div>
      <button>Change Photo</button>
    </section>
    <section className="favorite-editor">
      <div className="edit-section-title"><div><span>SHOWCASE</span><h2>Top 4 Favorite Albums</h2></div><p>Drag to reorder</p></div>
      <div className="edit-favorite-grid">{art.slice(0, 4).map((image, i) => <button key={image}><img src={image} alt={`Favorite album ${i + 1}`} /><span><Icon name="edit" size={14} /> Change</span></button>)}</div>
    </section>
    <section className="edit-form">
      <label>Display Name</label><input defaultValue="Alex Morgan" />
      <label>Username</label><div className="handle-field"><span>@</span><input defaultValue="alexlistens" /></div>
      <div className="label-row"><label htmlFor="profile-bio">Bio</label><span>120/160</span></div><textarea id="profile-bio" rows={4} defaultValue="Always listening. Dream pop, late-night jazz, and records that feel like places." />
      <label>Last.fm Username</label><div className="integration-field"><input defaultValue="alexscrobbles" /><span>Connected</span></div>
      <label>Spotify Account</label><div className="spotify-account"><div className="spotify-mark"><Icon name="spotify" size={23} /></div><div><strong>Connected as @alexmusic</strong><span>Listening activity is syncing</span></div><button>Disconnect</button></div>
    </section>
  </main>;
}

function SettingsScreen({ close }: { close: () => void }) {
  const [spotifySync, setSpotifySync] = useState(true);
  const [scrobble, setScrobble] = useState(true);
  const [privateProfile, setPrivateProfile] = useState(false);
  const Toggle = ({ value, setValue, label }: { value: boolean; setValue: (value: boolean) => void; label: string }) => <button className={`toggle ${value ? "on" : ""}`} onClick={() => setValue(!value)} aria-label={label}><i /></button>;
  return <main className="account-screen settings-screen">
    <UniversalHeader onLogo={close} action={<button className="header-text-action" onClick={close}>Done</button>} />
    <div className="screen-heading"><span>YOUR ECO</span><h1>Settings</h1></div>
    <section className="settings-group"><h2>Account & Sync</h2><div className="settings-card">
      <div className="setting-row"><span><strong>Spotify Live Sync</strong><small>Show what you’re listening to now</small></span><Toggle value={spotifySync} setValue={setSpotifySync} label="Toggle Spotify Live Sync" /></div>
      <div className="setting-row"><span><strong>Last.fm Auto-Scrobble</strong><small>Import listens automatically</small></span><Toggle value={scrobble} setValue={setScrobble} label="Toggle Last.fm scrobbling" /></div>
      <button className="setting-link"><span><strong>Change Email & Password</strong><small>alex@example.com</small></span><Icon name="chevron" size={19} /></button>
    </div></section>
    <section className="settings-group"><h2>Preferences</h2><div className="settings-card">
      <button className="setting-link"><span><strong>Default Rating Scale</strong><small>0.5 – 5.0 Stars</small></span><Icon name="chevron" size={19} /></button>
      <button className="setting-link"><span><strong>Notification Settings</strong><small>Push, email, and activity alerts</small></span><Icon name="chevron" size={19} /></button>
    </div></section>
    <section className="settings-group"><h2>Privacy & Data</h2><div className="settings-card">
      <div className="setting-row"><span><strong>Private Profile</strong><small>Only followers can see your activity</small></span><Toggle value={privateProfile} setValue={setPrivateProfile} label="Toggle private profile" /></div>
      <button className="setting-link"><span><strong>Export Listening History</strong><small>Download your data as CSV</small></span><Icon name="chevron" size={19} /></button>
    </div></section>
    <section className="settings-group account-actions"><h2>Account Actions</h2><div className="settings-card"><button>Log Out</button><button>Delete Account</button></div></section>
    <p className="settings-version"> Version 1.0.0</p>
  </main>;
}

export default function App() {
  const [screen, setScreen] = useState<Screen>("home");
  const [logOpen, setLogOpen] = useState(false);
  const [listOpen, setListOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const showNav = !["album", "edit-profile", "settings"].includes(screen);
  return (
    <div className="app-shell">
      {screen === "home" && <HomeScreen openAlbum={() => setScreen("album")} openSearch={() => setScreen("search")} />}
      {screen === "album" && <AlbumScreen goBack={() => setScreen("home")} openLog={() => setLogOpen(true)} />}
      {screen === "profile" && <ProfileScreen openShare={() => setShareOpen(true)} editProfile={() => setScreen("edit-profile")} openSettings={() => setScreen("settings")} />}
      {screen === "edit-profile" && <EditProfileScreen close={() => setScreen("profile")} />}
      {screen === "settings" && <SettingsScreen close={() => setScreen("profile")} />}
      {screen === "search" && <SearchScreen openAlbum={() => setScreen("album")} />}
      {screen === "lists" && <ListsScreen createList={() => setListOpen(true)} openShare={() => setShareOpen(true)} />}
      {showNav && <BottomNav active={screen} setScreen={setScreen} openLog={() => setLogOpen(true)} />}
      {logOpen && <LogSheet close={() => setLogOpen(false)} />}
      {listOpen && <ListCreator close={() => setListOpen(false)} />}
      {shareOpen && <ShareCard close={() => setShareOpen(false)} />}
    </div>
  );
}
