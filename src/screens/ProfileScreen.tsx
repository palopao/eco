import { useState } from "react";
import type { Album, Review, User, UserList } from "../types";
import { AppHeader } from "../components/ui/AppHeader";
import { Icon } from "../components/ui/Icon";
import { Stars } from "../components/ui/Stars";
import ProfileAvatar from "../components/ProfileAvatar";
import { PORTRAIT } from "../lib/constants";

export function ProfileScreen({
  user,
  albums,
  reviews,
  lists,
  openShare,
  editProfile,
  openSettings,
  onHome,
}: {
  user: User | null;
  albums: Album[];
  reviews: Review[];
  lists: UserList[];
  openShare: (review?: Review) => void;
  editProfile: () => void;
  openSettings: () => void;
  onHome: () => void;
}) {
  const [tab, setTab] = useState<"reviews" | "lists" | "stats">("reviews");
  const avatarUrl = user?.photoURL ?? user?.avatarUrl ?? PORTRAIT;
  const favoriteAlbums = (user?.favoriteAlbums ?? [])
    .map((albumId: string) => albums.find((album) => album.id === albumId))
    .filter((album): album is Album => Boolean(album));
  return (
    <>
      <AppHeader onHome={onHome} title={user?.displayName ?? "Profile"} action={<button className="header-icon-button" aria-label="Settings" onClick={openSettings}><Icon name="gear" /></button>} />
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
          {reviews.length === 0 && <p className="empty-state">You have not reviewed an album yet.</p>}
        </section>}
        {tab === "lists" && <section className="profile-lists">
          {lists.map((list) => (
            <article key={list.id}><div className="mini-stack">{(list.albumIds ?? []).slice(0, 2).map((id: string) => albums.find((album) => album.id === id)).filter((album): album is Album => Boolean(album)).map((album) => <img key={album.id} src={album.coverUrl} alt="" />)}</div><strong>{list.title}</strong><span>{list.albumIds?.length ?? list.albums?.length ?? 0} albums</span></article>
          ))}
          {lists.length === 0 && <p className="empty-state">You have not created a list yet.</p>}
        </section>}
        {tab === "stats" && <section className="stats-dashboard">
          <div className="metric-row"><div><strong>{new Set(reviews.map((review) => review.albumId)).size}</strong><span>Albums logged</span></div><div><strong>{reviews.length}</strong><span>Diary entries</span></div><div><strong>{reviews.length ? (reviews.reduce((sum: number, review: Review) => sum + review.rating, 0) / reviews.length).toFixed(1) : "—"}</strong><span>Avg rating</span></div></div>
          <div className="analytics-card"><h3>Top genres from your reviews</h3>{Array.from(new Set(reviews.flatMap((review) => albums.find((album) => album.id === review.albumId)?.genres ?? []))).slice(0, 5).map((genre: string) => <p key={genre}>{genre}</p>)}{reviews.length === 0 && <p>Rate albums to start your listening statistics.</p>}</div>
        </section>}
      </main>
    </>
  );
}
