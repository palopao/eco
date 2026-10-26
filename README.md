# Eco

Eco is a React + Vite app backed by Firebase Authentication and Firestore for community activity. Its music catalog is the set of yearly SQLite databases in `music/` (about 5.8 GiB); album and track metadata stays there, while Firestore stores reviews and references by album/track ID only.

https://ecomusica.web.app

The interface adapts from 320px phones through tablets to desktop: small screens use the bottom navigation, while wide screens get a fixed side navigation, multi-column content, and centered dialogs.

## Connect Firebase

1. In [Firebase Console](https://console.firebase.google.com/), open the Eco project and add a **Web app** under Project settings → General. Copy its web configuration.
2. In Authentication → Sign-in method, enable **Email/Password** and **Google**. In Authentication → Settings → Authorized domains, add the domain where Eco will run (for example `localhost` and `ecomusica.web.app`).
3. Create a Cloud Firestore database. Then at the project root, create `.env.local` (never commit it) using the web app configuration:

   ```env
   VITE_FIREBASE_API_KEY=
   VITE_FIREBASE_AUTH_DOMAIN=
   VITE_FIREBASE_PROJECT_ID=
   VITE_FIREBASE_STORAGE_BUCKET=
   VITE_FIREBASE_MESSAGING_SENDER_ID=
   VITE_FIREBASE_APP_ID=
   ```

4. In Firebase Console → Firestore → Rules, publish the rules in `firestore.rules`. Deploy indexes with Firebase CLI:

   ```sh
   firebase login
   firebase use --add
   firebase deploy --only firestore:rules,firestore:indexes
   ```

5. Keep the yearly SQLite files in `music/`. The catalog API reads them directly without copying them to Firestore or converting them to JSON.
6. Start `npm run dev:catalog` in one terminal and `npm run dev` in another. Register an account, then test searching albums/tracks and submitting a review. For production, host the catalog API with access to the same `music/` directory, set `VITE_CATALOG_API_URL` to that API's `/api/catalog` URL, build the app, and deploy the frontend.

Profile photos are resized to a maximum of 512 px, converted to WebP, gzip-compressed, Base64-encoded and stored as text in the user's Firestore document. The compressed representation is limited to 450,000 characters to stay below Firestore's document-size limit. No Storage bucket is needed for profile photos.

## Local music catalog

- **Database format:** each `music/<year>.db` file is SQLite, with an `albums` table whose columns are `id`, `title`, `artist`, `releaseDate`, `genres` (JSON array), and `tracks` (JSON array of song titles). `unknown.db` holds records without a usable year. The app reads the files through `scripts/catalog_api.py`; it uses read-only SQLite connections and does not alter or upload the source data.
- **Run locally:** Python 3 is sufficient; no Python packages are needed for the read-only catalog API. The API defaults to `music/` and `127.0.0.1:8765`. Vite proxies `/api/catalog` to that address.

  ```sh
  npm run dev:catalog
  # in another terminal
  npm run dev
  ```

  Album searches match title, artist, and genres; the Tracks tab searches track titles and opens the album containing a match. Discogs IDs remain strings in Firestore references. Track IDs are stable composites of the album ID and 1-based track number (`albumId:trackNumber`). Missing covers use the local dummy image at `public/images/music-cover-placeholder.svg`.

- **Production:** Firebase Hosting is static and cannot read files from your repository at runtime. Host `scripts/catalog_api.py` (or an equivalent API) on a machine/service that can read the `music/` directory, expose `/api/catalog`, configure its allowed CORS origin for the website, and set `VITE_CATALOG_API_URL` to the full API base URL when building the frontend. Set `ECO_CATALOG_HOST=0.0.0.0` on the API host. Do not copy these 5.8 GiB SQLite databases into Firestore or a static web build.

- **Firestore data:** no album/track catalog collection or service-account credentials are needed. Review documents include `albumId` and, when a track is chosen, `trackId`; list `albumIds` and profile `favoriteAlbums` are catalog IDs. Review text/ratings and list details remain in Firestore as user-generated activity. Rules no longer allow legacy `albums`/`tracks` collections; the rules change does not delete existing data. Export it first if needed, then delete old collections manually in Firebase Console → Firestore Database → Data.

- **Spotify catalogue, listening status, and Last.fm auto-scrobbles are not connected yet.** Spotify's API is not inherently a paid API, but it is not needed for a free metadata catalogue and has developer access/usage restrictions. Last.fm API access requires a free API key. For either provider, keep private credentials in a backend, never in `VITE_*` variables.
- Spotify sign-in is not provided by Firebase Authentication's standard providers; it needs a custom OAuth flow/backend. Google and email/password are implemented.
- Likes/comments, drag-and-drop list ordering, review Markdown/spoilers, complete rating aggregates, and following feeds still need implementation.
- `Eco.md` recommends Next.js SSR/SEO. This repo is deliberately kept on Vite for its Figma Make setup; it does not provide SSR or dynamic per-album SEO. Serving those pages to search engines requires migrating the app to Next.js and changing the hosting setup.