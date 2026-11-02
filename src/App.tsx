import { useState, useEffect, useRef, type ReactNode } from "react";
import { albumService, listService, reviewService, userService } from "./lib/services/firestore-service";
import { Album, Review, Track, User, UserList } from "./types";
import { auth, firebaseConfigured } from "./lib/firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import LoginScreen from "./components/auth/LoginScreen";
import RegisterScreen from "./components/auth/RegisterScreen";
import { useNavigation } from "./hooks/useNavigation";
import { mergeAlbums } from "./hooks/useSearch";
import { HomeScreen } from "./screens/HomeScreen";
import { SearchScreen } from "./screens/SearchScreen";
import { ArtistScreen } from "./screens/ArtistScreen";
import { AlbumScreen } from "./screens/AlbumScreen";
import { ProfileScreen } from "./screens/ProfileScreen";
import { ListsScreen } from "./screens/ListsScreen";
import { SettingsScreen } from "./screens/SettingsScreen";
import { EditProfileScreen } from "./screens/EditProfileScreen";
import { LogSheet } from "./components/modals/LogSheet";
import { ListCreator } from "./components/modals/ListCreator";
import { ShareScreen } from "./components/modals/ShareScreen";
import { AlbumSelectionModal } from "./components/modals/AlbumSelectionModal";

type Screen = "home" | "album" | "artist" | "search" | "lists" | "profile" | "edit-profile" | "settings" | "login" | "register";

const art = [
  "https://images.unsplash.com/photo-1597773150796-e5c14ebecbf5?auto=format&fit=crop&w=700&q=85",
  "https://images.unsplash.com/photo-1557264322-b44d383a2906?auto=format&fit=crop&w=700&q=85",
  "https://images.unsplash.com/photo-1567095751004-aa51a2690368?auto=format&fit=crop&w=700&q=85",
  "https://images.unsplash.com/photo-1566410824233-a8011929225c?auto=format&fit=crop&w=700&q=85",
  "https://images.unsplash.com/photo-1584968124544-d10ce10dd21f?auto=format&fit=crop&w=700&q=85",
  "https://images.unsplash.com/photo-1563305096-9af2877f57f9?auto=format&fit=crop&w=700&q=85",
  "https://images.unsplash.com/photo-1582721691120-d1db3852893e?auto=format&fit=crop&w=700&q=85",
];

function BottomNav({ active, setScreen, openLog }: { active: Screen; setScreen: (s: Screen) => void; openLog: () => void }) {
  return (
    <nav className="bottom-nav" aria-label="Main navigation">
      <button className={active === "home" ? "active" : ""} onClick={() => setScreen("home")}><span><Icon name="home" size={24} /></span><span>Home</span></button>
      <button className={active === "search" ? "active" : ""} onClick={() => setScreen("search")}><span><Icon name="search" size={24} /></span><span>Search</span></button>
      <button className="log-button" onClick={openLog} aria-label="Log an album"><span><Icon name="plus" size={28} /></span></button>
      <button className={active === "lists" ? "active" : ""} onClick={() => setScreen("lists")}><span><Icon name="list" size={24} /></span><span>Lists</span></button>
      <button className={active === "profile" ? "active" : ""} onClick={() => setScreen("profile")}><span><Icon name="user" size={24} /></span><span>Profile</span></button>
    </nav>
  );
}

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
    star: <path d="m12 2.7 2.8 5.7 6.2 .9-4.5 4.4 1.1 6.2-5.6-2.9-5.6 2.9 1.1-6.2L3 9.3l6.2-.9L12 2.7Z" />,
    back: <><path d="m15 18-6-6 6-6" /><path d="M9 12h10" /></>,
    more: <><circle cx="5" cy="12" r="1" fill="currentColor" /><circle cx="12" cy="12" r="1" fill="currentColor" /><circle cx="19" cy="12" r="1" fill="currentColor" /></>,
    close: <><path d="M6 6l12 12M18 6 6 18" /></>,
    spotify: <><circle cx="12" cy="12" r="9" /><path d="M7.5 9.5c3.5-1 7.1-.5 9.6 .8M8.2 12.7c3-.7 6-.3 8.2 .8M9 15.7c2.3-.5 4.5-.2 6.3 .7" /></>,
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

export default function App() {
  const { screen, setScreen, pushScreen, goBack } = useNavigation();
  const [logOpen, setLogOpen] = useState(false);
  const [listOpen, setListOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [shareReview, setShareReview] = useState<Review | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [albumSelectOpen, setAlbumSelectOpen] = useState(false);
  const [selectedLogAlbum, setSelectedLogAlbum] = useState<Album | null>(null);

  // Data state
  const [albums, setAlbums] = useState<Album[]>([]);
  const [selectedAlbumId, setSelectedAlbumId] = useState<string | null>(null);
  const [selectedArtist, setSelectedArtist] = useState<string | null>(null);
  const [artistAlbums, setArtistAlbums] = useState<Album[]>([]);
  const [artistOffset, setArtistOffset] = useState(0);
  const [artistHasMore, setArtistHasMore] = useState(false);
  const [loadingArtist, setLoadingArtist] = useState(false);
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
    let cancelled = false;
    Promise.all([reviewService.getUserReviews(userId), listService.getUserLists(userId)])
      .then(([reviews, lists]) => {
        if (cancelled) return;
        setUserReviews(reviews);
        setUserLists(lists);
        const listAlbumIds = lists.flatMap((list) => list.albumIds ?? list.albums?.map((item) => item.albumId) ?? []);
        const albumIds = [...reviews.map((review) => review.albumId), ...listAlbumIds];
        if (albumIds.length === 0) return;
        albumService.getAlbumsByIds(albumIds)
          .then((referencedAlbums) => {
            if (!cancelled) setAlbums((current) => mergeAlbums(current, referencedAlbums));
          })
          .catch((albumError) => {
            console.error("Could not load profile album metadata.", albumError);
          });
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        console.error("Could not load profile activity.", error);
        setLoadError("Your profile activity could not be loaded.");
      });
    return () => { cancelled = true; };
  }, [screen, currentUser?.id]);

  const openAlbum = async (id?: string, fromScreen?: string) => {
    const albumId = id ?? albums[0]?.id;
    if (albumId) {
      pushScreen("album", fromScreen);
      setSelectedAlbumId(albumId);
      setAlbumReviews([]);
      setAlbumTracks([]);
      void refreshAlbumReviews(albumId);
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
    pushScreen("album", fromScreen);
  };

  const openArtist = async (artist: string, fromScreen?: string) => {
    pushScreen("artist", fromScreen);
    setSelectedArtist(artist);
    setArtistAlbums([]);
    setArtistOffset(0);
    setArtistHasMore(false);
    setLoadingArtist(true);
    try {
      const results = await albumService.getAlbumsByArtist(artist, 50, 0);
      setArtistAlbums(results);
      setArtistHasMore(results.length >= 50);
      setAlbums((current) => mergeAlbums(current, results));
    } catch (error) {
      console.error("Could not load artist albums.", error);
      setLoadError("Artist albums could not be loaded.");
    } finally {
      setLoadingArtist(false);
    }
  };

  const loadMoreArtistAlbums = async () => {
    if (!selectedArtist) return;
    setLoadingArtist(true);
    try {
      const results = await albumService.getAlbumsByArtist(selectedArtist, 50, artistOffset);
      setArtistOffset((prev) => prev + 50);
      setArtistAlbums((current) => mergeAlbums(current, results));
      setArtistHasMore(results.length >= 50);
      setAlbums((all) => mergeAlbums(all, results));
    } catch (error) {
      console.error("Could not load more artist albums.", error);
    } finally {
      setLoadingArtist(false);
    }
  };

  const openLog = () => {
    setAlbumSelectOpen(true);
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
      {screen === "album" && <AlbumScreen album={selectedAlbum} tracks={albumTracks} reviews={albumReviews} goBack={goBack} openLog={openLog} onHome={() => setScreen("home")} />}
      {screen === "artist" && <ArtistScreen artist={selectedArtist} albums={artistAlbums} goBack={goBack} loadMore={loadMoreArtistAlbums} hasMore={artistHasMore} openAlbum={openAlbum} loading={loadingArtist} />}
      {screen === "profile" && <ProfileScreen user={currentUser} albums={albums} reviews={userReviews} lists={userLists} openShare={openShare} editProfile={() => setScreen("edit-profile")} openSettings={() => setScreen("settings")} onHome={() => setScreen("home")} />}
      {screen === "edit-profile" && <EditProfileScreen close={() => setScreen("profile")} user={currentUser} albums={albums} onSave={saveProfile} />}
      {screen === "settings" && <SettingsScreen close={() => setScreen("profile")} onLogout={handleLogout} />}
      {screen === "search" && <SearchScreen albums={albums} openAlbum={openAlbum} openArtist={openArtist} />}
      {screen === "lists" && <ListsScreen lists={publicLists} albums={albums} createList={() => setListOpen(true)} openShare={() => openShare()} onHome={() => setScreen("home")} />}
      {screen === "login" && <LoginScreen setScreen={setScreen} />}
      {screen === "register" && <RegisterScreen setScreen={setScreen} />}
      {showNav && <BottomNav active={screen} setScreen={setScreen} openLog={openLog} />}
      {logOpen && <LogSheet close={() => setLogOpen(false)} albumId={selectedAlbumId} album={selectedAlbum} tracks={albumTracks} userId={auth?.currentUser?.uid} onPublished={async () => { await refreshRecentReviews(); if (selectedAlbumId) await refreshAlbumReviews(selectedAlbumId); }} />}
      {listOpen && <ListCreator close={() => setListOpen(false)} albums={albums} userId={auth?.currentUser?.uid} onCreated={refreshPublicLists} />}
      {shareOpen && <ShareScreen close={() => setShareOpen(false)} album={albums.find((item) => item.id === shareReview?.albumId) ?? selectedAlbum ?? albums[0] ?? null} review={shareReview} user={currentUser} />}
      {albumSelectOpen && <AlbumSelectionModal close={() => setAlbumSelectOpen(false)} onAlbumSelected={(album) => { setSelectedLogAlbum(album); setAlbumSelectOpen(false); setLogOpen(true); }} />}
      {loadError && <p role="alert" className="error-text app-error">{loadError}</p>}
    </div>
  );
}
