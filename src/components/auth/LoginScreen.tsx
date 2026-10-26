import { useState } from "react";
import { FirebaseError } from "firebase/app";
import { GoogleAuthProvider, signInWithEmailAndPassword, signInWithPopup } from "firebase/auth";
import { Eye, EyeOff } from "lucide-react";
import { requireAuth } from "../../lib/firebase";
import { userService } from "../../lib/services/firestore-service";

export default function LoginScreen({ setScreen }: { setScreen: (s: "home" | "register") => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await signInWithEmailAndPassword(requireAuth(), email, password);
      setScreen("home");
    } catch (err) {
      const code = err instanceof FirebaseError ? err.code : "";
      setError(code === "auth/invalid-credential"
        ? "Email or password is incorrect."
        : err instanceof Error ? err.message : "Failed to sign in. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError("");
    try {
      const credential = await signInWithPopup(requireAuth(), new GoogleAuthProvider());
      const user = credential.user;
      const profile = await userService.getUserProfile(user.uid);
      if (!profile) {
        await userService.createUserProfile(user.uid, {
          displayName: user.displayName ?? "Eco listener",
          username: user.email?.split("@")[0] ?? user.uid.slice(0, 8),
          bio: "",
          avatarUrl: user.photoURL ?? "",
          photoURL: user.photoURL ?? "",
          favoriteAlbums: [],
          lastfmUsername: "",
          spotifyConnected: false,
          stats: { albumsLogged: 0, reviewsCount: 0, listsCount: 0 },
          integrations: { spotify: null, lastfm: null },
        });
      }
      setScreen("home");
    } catch (err) {
      const code = err instanceof FirebaseError ? err.code : "";
      if (code === "auth/popup-closed-by-user" || code === "auth/cancelled-popup-request") return;
      setError(code === "auth/unauthorized-domain"
        ? "This domain is not authorized for Google sign-in. Add it in Firebase Authentication → Settings → Authorized domains."
        : err instanceof Error ? err.message : "Failed to sign in with Google.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="account-screen login-screen">
      <div className="screen-heading">
        <span>WELCOME BACK</span>
        <h1>Login to Eco</h1>
      </div>

      <form onSubmit={handleLogin} className="edit-form">
        <label htmlFor="login-email">Email Address</label>
        <input
          id="login-email"
          className="text-field"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          placeholder="email@example.com"
        />

        <label htmlFor="login-password">Password</label>
        <div className="password-field">
          <input
            id="login-password"
            className="text-field"
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            placeholder="••••••••"
          />
          <button type="button" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? "Hide password" : "Show password"}>
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>

        {error && <p role="alert" className="error-text" style={{ color: "red", fontSize: "0.875rem", marginBottom: "1rem" }}>{error}</p>}

        <button className="publish-button" disabled={loading}>
          {loading ? "Signing in..." : "Sign In"}
        </button>
        <button type="button" className="publish-button" disabled={loading} onClick={handleGoogleSignIn}>
          Continue with Google
        </button>
      </form>

      <div className="auth-footer" style={{ marginTop: "2rem", textAlign: "center" }}>
        <p>Don't have an account? <button type="button" onClick={() => setScreen("register")} style={{ background: "none", border: "none", color: "var(--accent-color, #6366f1)", cursor: "pointer", fontWeight: "bold", padding: 0 }}>Create one</button></p>
      </div>
    </main>
  );
}
