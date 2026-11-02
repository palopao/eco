import { useState } from "react";
import { encodeProfileImage } from "../lib/profile-image";
import { AppHeader } from "../components/ui/AppHeader";
import { Icon } from "../components/ui/Icon";
import type { User } from "../types";
import type { Album } from "../types";
import { PORTRAIT } from "../lib/constants";

export function EditProfileScreen({
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
  const [favoriteSearch, setFavoriteSearch] = useState("");
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

  const toggleFavorite = (albumId: string) => {
    setFavoriteAlbums((current) =>
      current.includes(albumId)
        ? current.filter((id) => id !== albumId)
        : current.length < 4
          ? [...current, albumId]
          : current,
    );
  };

  const isFavorite = (albumId: string) => favoriteAlbums.includes(albumId);

  const searchResults = favoriteSearch.trim()
    ? albums.filter(
        (album) =>
          `${album.title} ${album.artist}`.toLowerCase().includes(favoriteSearch.trim().toLowerCase()),
      )
    : [];

  return <main className="account-screen edit-profile-screen">
    <form onSubmit={saveProfile}>
      <AppHeader onLogo={close} action={<button className="save-button" disabled={saving}>{saving ? "Saving..." : "Save"}</button>} />
      <div className="screen-heading"><span>YOUR ACCOUNT</span><h1>Edit Profile</h1></div>
      <section className="photo-editor">
        <div><img src={photoURL || PORTRAIT} alt="Profile photo preview" className="profile-photo-preview" /></div>
        <label className="field-label" htmlFor="profile-photo">Upload photo or provide an image URL</label>
        <input id="profile-photo" type="file" accept="image/*" onChange={(event) => void handlePhotoChange(event.currentTarget.files?.[0])} />
        <input className="text-field" type="url" aria-label="Or enter photo URL" placeholder="https://..." value={photoURL.startsWith("data:") ? "" : photoURL} onChange={(event) => setPhotoURL(event.target.value)} />
        {imageLoading && <span>Processing image...</span>}
      </section>
      <section className="favorite-editor">
        <div className="edit-section-title"><div><span>SHOWCASE</span><h2>Top 4 Favorite Albums</h2></div><p>Select up to four</p></div>
        <div className="add-search">
          <Icon name="search" size={18} />
          <input
            id="favorite-album-search"
            placeholder="Search for an album…"
            value={favoriteSearch}
            onChange={(event) => setFavoriteSearch(event.target.value)}
          />
        </div>
        <div className="added-albums">
          {searchResults.filter((album): album is Album & { id: string } => Boolean(album.id)).map((album) => (
            <div key={album.id} className={`favorite-album-item ${isFavorite(album.id) ? "selected" : ""}`} onClick={() => toggleFavorite(album.id)}>
              <img src={album.coverUrl} alt="" />
              <div>
                <strong>{album.title}</strong>
                <small>{album.artist}</small>
              </div>
              {isFavorite(album.id) ? <span style={{ color: "var(--cyan)" }}><Icon name="star" size={16} /></span> : null}
            </div>
          ))}
          {favoriteSearch.trim() && searchResults.length === 0 && <p className="empty-state">No albums found matching your search.</p>}
          {!favoriteSearch.trim() && <p className="empty-state" style={{ textAlign: "center", color: "var(--text-3)", fontSize: "12px", marginTop: "16px" }}>Search for an album to add it to your favorites.</p>}
        </div>
        <div className="selected-favorites">
          <strong>Selected ({favoriteAlbums.length}/4):</strong>
          <div className="selected-favorites-grid">
            {favoriteAlbums.map((id) => {
              const album = albums.find((a) => a.id === id);
              if (!album) return null;
              return (
                <div key={id} className="selected-favorite-chip" onClick={() => toggleFavorite(id)}>
                  <img src={album.coverUrl} alt="" />
                  <span>{album.title}</span>
                  <Icon name="close" size={14} />
                </div>
              );
            })}
          </div>
        </div>
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
