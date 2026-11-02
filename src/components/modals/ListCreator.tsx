import { useState } from "react";
import { listService } from "../../lib/services/firestore-service";
import type { Album, UserList } from "../../types";
import { AppHeader } from "../../components/ui/AppHeader";
import { Icon } from "../../components/ui/Icon";

export function ListCreator({
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
    <AppHeader className="modal-safe-header" onLogo={close} action={<button type="button" className="header-icon-button" onClick={close} aria-label="Close list creator"><Icon name="close" size={19} /></button>} />
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
