import { useState } from "react";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { Eye, EyeOff } from "lucide-react";
import ProfileAvatar from "../ProfileAvatar";
import { userService } from "../../lib/services/firestore-service";
import { requireAuth } from "../../lib/firebase";
import { encodeProfileImage } from "../../lib/profile-image";

export default function RegisterScreen({ setScreen }: { setScreen: (s: "home" | "login") => void }) {
  const [formData, setFormData] = useState({
    displayName: "",
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [photoURL, setPhotoURL] = useState("");
  const [loading, setLoading] = useState(false);
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

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (imageLoading) return;
    setLoading(true);
    setError("");
    try {
      const userCredential = await createUserWithEmailAndPassword(requireAuth(), formData.email, formData.password);
      const user = userCredential.user;

      await userService.createUserProfile(user.uid, {
        displayName: formData.displayName,
        username: formData.username,
        bio: "",
        avatarUrl: "",
        photoURL,
        favoriteAlbums: [],
        lastfmUsername: "",
        spotifyConnected: false,
        stats: { albumsLogged: 0, reviewsCount: 0, listsCount: 0 },
        integrations: { spotify: null, lastfm: null },
      });

      setScreen("home");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create account. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="account-screen register-screen">
      <div className="screen-heading">
        <span>JOIN THE COMMUNITY</span>
        <h1>Create Account</h1>
      </div>

      <form onSubmit={handleRegister} className="edit-form">
        <label htmlFor="register-name">Display Name</label>
        <input
          id="register-name"
          className="text-field"
          type="text"
          value={formData.displayName}
          onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
          required
          placeholder="Alex Morgan"
        />

        <label htmlFor="register-username">Username</label>
        <div className="handle-field">
          <span aria-hidden="true">@</span>
          <input
            id="register-username"
            className="text-field"
            style={{ paddingLeft: "2rem" }}
            type="text"
            value={formData.username}
            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
            required
            placeholder="alexlistens"
          />
        </div>

        <label htmlFor="register-email">Email Address</label>
        <input
          id="register-email"
          className="text-field"
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          required
          placeholder="email@example.com"
        />

        <label htmlFor="register-password">Password</label>
        <div className="password-field">
          <input
            id="register-password"
            className="text-field"
            type={showPassword ? "text" : "password"}
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            required
            minLength={6}
            placeholder="••••••••"
          />
          <button type="button" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? "Hide password" : "Show password"}>
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>

        <label htmlFor="register-confirm-password">Confirm password</label>
        <div className="password-field">
          <input
            id="register-confirm-password"
            className="text-field"
            type={showConfirmation ? "text" : "password"}
            value={formData.confirmPassword}
            onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
            required
            minLength={6}
            placeholder="••••••••"
          />
          <button type="button" onClick={() => setShowConfirmation(!showConfirmation)} aria-label={showConfirmation ? "Hide confirmation" : "Show confirmation"}>
            {showConfirmation ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>

        <label htmlFor="register-photo">Profile photo (optional)</label>
        <div className="profile-upload">
          <ProfileAvatar className="upload-avatar" src={photoURL} alt="Profile photo preview" />
          <input id="register-photo" type="file" accept="image/*" onChange={(event) => void handlePhotoChange(event.currentTarget.files?.[0])} />
          {imageLoading && <span>Processing image...</span>}
        </div>

        {error && <p role="alert" className="error-text" style={{ color: "red", fontSize: "0.875rem", marginBottom: "1rem" }}>{error}</p>}

        <button className="publish-button" disabled={loading || imageLoading}>
          {imageLoading ? "Processing photo..." : loading ? "Creating account..." : "Create Account"}
        </button>
      </form>

      <div className="auth-footer" style={{ marginTop: "2rem", textAlign: "center" }}>
        <p>Already have an account? <button type="button" onClick={() => setScreen("login")} style={{ background: "none", border: "none", color: "var(--accent-color, #6366f1)", cursor: "pointer", fontWeight: "bold", padding: 0 }}>Log in</button></p>
      </div>
    </main>
  );
}
