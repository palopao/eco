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
