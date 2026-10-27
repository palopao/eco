import Database from "better-sqlite3";
import path from "node:path";
import fs from "node:fs";

const MUSIC_DIR = path.resolve(process.cwd(), "music");

function getDbFiles(): string[] {
  if (!fs.existsSync(MUSIC_DIR)) return [];
  return fs
    .readdirSync(MUSIC_DIR)
    .filter((f) => f.endsWith(".db"))
    .sort()
    .map((f) => path.join(MUSIC_DIR, f));
}

function parseGenres(value: string | null): string[] {
  if (!value) return [];
  try {
    const data = JSON.parse(value);
    if (Array.isArray(data)) return data.filter((g): g is string => typeof g === "string");
  } catch {}
  return [];
}

function parseTracks(value: string | null): string[] {
  if (!value) return [];
  try {
    const data = JSON.parse(value);
    if (Array.isArray(data)) return data.filter((t): t is string => typeof t === "string");
  } catch {}
  return [];
}

interface AlbumRow {
  id: number;
  title: string;
  artist: string;
  releaseDate: string;
  genres: string;
  tracks: string;
}

function albumToDict(row: AlbumRow) {
  const trackTitles = parseTracks(row.tracks);
  const genres = parseGenres(row.genres);
  const releaseDate = row.releaseDate || "";
  let year = 0;
  try {
    if (releaseDate && releaseDate.length >= 4) year = parseInt(releaseDate.slice(0, 4), 10) || 0;
  } catch {}
  const trackCount = trackTitles.length;
  const durationMin = trackCount * 3;
  return {
    id: String(row.id),
    title: row.title || "",
    artist: row.artist || "",
    year,
    releaseDate,
    coverUrl: "/images/music-cover-placeholder.svg",
    trackCount,
    duration: `${durationMin} min`,
    genres,
    averageRating: 0,
    totalRatings: 0,
    tracks: trackTitles.map((title, i) => ({
      id: `${row.id}:${i + 1}`,
      albumId: String(row.id),
      title,
      trackNumber: i + 1,
    })),
  };
}

function openReadonly(dbPath: string) {
  return new Database(dbPath, { readonly: true, fileMustExist: true });
}

export function getRecentAlbums(limitCount = 60) {
  const results: any[] = [];
  const dbFiles = getDbFiles();
  const perDb = Math.max(1, Math.ceil(limitCount / dbFiles.length));
  for (const dbPath of dbFiles) {
    const db = openReadonly(dbPath);
    try {
      const rows = db
        .prepare(`SELECT * FROM albums ORDER BY releaseDate DESC LIMIT ?`)
        .all(perDb) as AlbumRow[];
      for (const row of rows) {
        results.push(albumToDict(row));
      }
    } finally {
      db.close();
    }
  }
  results.sort((a, b) => (b.releaseDate ?? "").localeCompare(a.releaseDate ?? ""));
  return results.slice(0, limitCount);
}

export function getAlbumsByIds(ids: string[]) {
  const results: any[] = [];
  const idSet = new Set(ids);
  for (const dbPath of getDbFiles()) {
    const db = openReadonly(dbPath);
    try {
      const placeholders = [...idSet].map(() => "?").join(",");
      const rows = db
        .prepare(`SELECT * FROM albums WHERE id IN (${placeholders})`)
        .all([...idSet]) as AlbumRow[];
      for (const row of rows) {
        results.push(albumToDict(row));
        idSet.delete(String(row.id));
        if (idSet.size === 0) break;
      }
    } finally {
      db.close();
    }
    if (idSet.size === 0) break;
  }
  return results;
}

export function getAlbumById(albumId: string) {
  for (const dbPath of getDbFiles()) {
    const db = openReadonly(dbPath);
    try {
      const row = db.prepare(`SELECT * FROM albums WHERE id = ?`).get(albumId) as AlbumRow | undefined;
      if (row) return albumToDict(row);
    } finally {
      db.close();
    }
  }
  return null;
}

export function getTracksByAlbum(albumId: string) {
  const album = getAlbumById(albumId);
  return album ? album.tracks : [];
}

export function searchAlbums(
  query: string,
  limitCount = 30,
  offsetCount = 0,
  filters?: { decade?: string; year?: string; genre?: string }
): any[] {
  const q = query.toLowerCase();
  const results: any[] = [];
  const MAX_RESULTS_PER_DB = 500;
  const MAX_TOTAL_RESULTS = 2000;
  for (const dbPath of getDbFiles()) {
    if (results.length >= MAX_TOTAL_RESULTS) break;
    const db = openReadonly(dbPath);
    try {
      let sql = `SELECT * FROM albums WHERE 1=1`;
      const params: any[] = [];
      if (q) {
        sql += ` AND (LOWER(title) LIKE ? OR LOWER(artist) LIKE ? OR LOWER(genres) LIKE ?)`;
        params.push(`%${q}%`, `%${q}%`, `%${q}%`);
      }
      if (filters?.year) {
        sql += ` AND releaseDate LIKE ?`;
        params.push(`${filters.year}%`);
      } else if (filters?.decade) {
        const start = filters.decade;
        const end = String(Number(start) + 10);
        sql += ` AND releaseDate >= ? AND releaseDate < ?`;
        params.push(`${start}-01-01`, `${end}-01-01`);
      }
      if (filters?.genre) {
        sql += ` AND LOWER(genres) LIKE ?`;
        params.push(`%${filters.genre.toLowerCase()}%`);
      }
      sql += ` ORDER BY releaseDate DESC LIMIT ?`;
      const remaining = Math.min(MAX_RESULTS_PER_DB, MAX_TOTAL_RESULTS - results.length);
      const rows = db.prepare(sql).all(...params, remaining) as AlbumRow[];
      for (const row of rows) {
        results.push(albumToDict(row));
      }
    } finally {
      db.close();
    }
  }
  const ranked = results.sort((a, b) => {
    // Primary: reverse chronological order (most recent first)
    const dateCompare = (b.releaseDate ?? "").localeCompare(a.releaseDate ?? "");
    if (dateCompare !== 0) return dateCompare;
    // Secondary: relevance score within the same date
    const aScore = relevanceScore(a, q);
    const bScore = relevanceScore(b, q);
    return bScore - aScore;
  });
  return ranked.slice(offsetCount, offsetCount + limitCount);
}

function relevanceScore(album: any, q: string): number {
  if (!q) return 0;
  const title = (album.title || "").toLowerCase();
  const artist = (album.artist || "").toLowerCase();
  let score = 0;
  if (title === q || artist === q) score += 100;
  else if (title.startsWith(q) || artist.startsWith(q)) score += 50;
  else if (title.includes(q) || artist.includes(q)) score += 10;
  return score;
}

export function getAlbumsByArtist(artist: string, limitCount = 50, offsetCount = 0): any[] {
  const q = artist.toLowerCase();
  const results: any[] = [];
  for (const dbPath of getDbFiles()) {
    const db = openReadonly(dbPath);
    try {
      const rows = db.prepare(`SELECT * FROM albums WHERE LOWER(artist) = ? ORDER BY releaseDate DESC LIMIT ? OFFSET ?`)
        .all(q, limitCount, offsetCount) as AlbumRow[];
      for (const row of rows) {
        results.push(albumToDict(row));
      }
    } finally {
      db.close();
    }
  }
  return results;
}

export function searchTracks(query: string, limitCount = 30) {
  const q = query.toLowerCase();
  const results: any[] = [];
  const MAX_RESULTS_PER_DB = 500;
  const MAX_TOTAL_RESULTS = 2000;
  for (const dbPath of getDbFiles()) {
    if (results.length >= MAX_TOTAL_RESULTS) break;
    const db = openReadonly(dbPath);
    try {
      const rows = db.prepare(`SELECT * FROM albums LIMIT ?`).all(MAX_RESULTS_PER_DB) as AlbumRow[];
      for (const row of rows) {
        const trackTitles = parseTracks(row.tracks);
        for (let i = 0; i < trackTitles.length; i++) {
          if (trackTitles[i].toLowerCase().includes(q)) {
            const album = albumToDict(row);
            results.push({
              id: `${row.id}:${i + 1}`,
              albumId: String(row.id),
              title: trackTitles[i],
              trackNumber: i + 1,
              albumTitle: album.title,
              artist: album.artist,
              year: album.year,
            });
            if (results.length >= MAX_TOTAL_RESULTS) break;
          }
        }
        if (results.length >= MAX_TOTAL_RESULTS) break;
      }
    } finally {
      db.close();
    }
    if (results.length >= MAX_TOTAL_RESULTS) break;
  }
  return results.slice(0, limitCount);
}
