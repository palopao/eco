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
  loading = false,
}: {
  artist: string | null;
  albums: Album[];
  goBack: () => void;
  loadMore: () => void;
  hasMore: boolean;
  openAlbum: (id?: string) => void;
  loading?: boolean;
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
      {loading && albums.length === 0 && (
        <div className="search-loading" style={{ justifyContent: "center", alignItems: "center", height: "400px" }}>
          <div className="search-spinner" />
          <p className="screen-heading">Loading albums…</p>
        </div>
      )}
      {(!loading || albums.length > 0) && (
        <>
          <SectionTitle>Albums by {artist}</SectionTitle>
          <div className="search-albums">
            {albums.map((album) => (
              <button key={album.id} className="search-album-button" onClick={() => openAlbum(album.id)}>
                <img src={album.coverUrl} alt={`${album.title} by ${album.artist}`} />
                <strong>{album.title}</strong>
                <span>{album.year}</span>
              </button>
            ))}
            {albums.length === 0 && !loading && <p className="empty-state">No albums found for this artist.</p>}
          </div>
          {hasMore && (
            <div className="load-more-container">
              <button className="publish-button" onClick={loadMore}>Load More</button>
            </div>
          )}
        </>
      )}
    </main>
  );
}
