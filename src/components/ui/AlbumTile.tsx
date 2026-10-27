import type { Album } from "../../types";

export function AlbumTile({ album, onClick }: { album: Album; onClick: (id: string) => void }) {
  return (
    <button className="album-tile" onClick={() => onClick(album.id ?? "")}>
      <div className="cover-wrap">
        <img src={album.coverUrl} alt={`${album.title} by ${album.artist}`} />
      </div>
      <strong>{album.title}</strong>
      <span>{album.artist}</span>
    </button>
  );
}
