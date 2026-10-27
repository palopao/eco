import type { Album } from "../types";
import { AppHeader } from "../components/ui/AppHeader";
import { Icon } from "../components/ui/Icon";
import { SectionTitle } from "../components/ui/SectionTitle";

export function ArtistScreen({
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
  openAlbum: (id?: string) => void;
}) {
  return (
    <main className="artist-page">
      <AppHeader onBack={goBack} title={artist ?? ""} action={<button className="header-icon-button" aria-label="Share"><Icon name="share" /></button>} />
      <section className="artist-header">
        <div className="artist-avatar">{artist?.slice(0, 1).toUpperCase()}</div>
        <div>
          <h1>{artist}</h1>
          <p>Artist</p>
        </div>
      </section>
      <SectionTitle>Albums by {artist}</SectionTitle>
      <div className="artist-albums-grid">
        {albums.map((album) => (
          <button key={album.id} className="artist-album-tile" onClick={() => openAlbum(album.id)}>
            <div className="cover-wrap">
              <img src={album.coverUrl} alt={`${album.title} by ${album.artist}`} />
            </div>
            <strong>{album.title}</strong>
            <span>{album.year}</span>
          </button>
        ))}
        {albums.length === 0 && <p className="screen-heading">No albums found for this artist.</p>}
      </div>
      {hasMore && (
        <div className="load-more-container">
          <button className="publish-button" onClick={loadMore}>Load More</button>
        </div>
      )}
    </main>
  );
}
