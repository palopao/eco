import type { Album, Review, User } from "../types";
import { AppHeader } from "../components/ui/AppHeader";
import { Icon } from "../components/ui/Icon";
import { AlbumTile } from "../components/ui/AlbumTile";
import { SectionTitle } from "../components/ui/SectionTitle";
import { Stars } from "../components/ui/Stars";

export function HomeScreen({
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
      <AppHeader onHome={() => window.scrollTo({ top: 0, behavior: "smooth" })} action={<button className="header-icon-button" onClick={openSearch} aria-label="Search"><Icon name="search" /></button>} />
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
              <AlbumTile key={album.id} album={album} onClick={openAlbum} />
            ))}
            {albums.length === 0 && <p className="empty-state">The local catalog is empty. Run the MusicBrainz importer to add albums.</p>}
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
          {reviews.length === 0 && <p className="empty-state">Community reviews will appear here.</p>}
        </section>
      </main>
    </>
  );
}
