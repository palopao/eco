import type { Album, Track, TrackSearchResult } from "../../types";

const catalogApiUrl = (import.meta.env.VITE_CATALOG_API_URL || "/api/catalog").replace(/\/$/, "");

async function requestCatalog(path: string): Promise<unknown> {
  const response = await fetch(`${catalogApiUrl}${path}`);
  const data: unknown = await response.json();
  if (!response.ok) {
    const message =
      typeof data === "object" && data !== null && "error" in data && typeof data.error === "string"
        ? data.error
        : `Catalog request failed (${response.status}).`;
    throw new Error(message);
  }
  return data;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function parseAlbum(value: unknown): Album {
  if (
    !isRecord(value) ||
    typeof value.id !== "string" ||
    typeof value.title !== "string" ||
    typeof value.artist !== "string" ||
    typeof value.year !== "number" ||
    typeof value.releaseDate !== "string" ||
    typeof value.coverUrl !== "string" ||
    typeof value.trackCount !== "number" ||
    typeof value.duration !== "string" ||
    !Array.isArray(value.genres)
  ) {
    throw new Error("The catalog API returned an invalid album.");
  }
  return {
    id: value.id,
    title: value.title,
    artist: value.artist,
    year: value.year,
    releaseDate: value.releaseDate,
    coverUrl: `${import.meta.env.BASE_URL}images/music-cover-placeholder.svg`,
    metadataSource: typeof value.metadataSource === "string" ? value.metadataSource : undefined,
    trackCount: value.trackCount,
    duration: value.duration,
    genres: value.genres.filter((genre): genre is string => typeof genre === "string"),
    averageRating: typeof value.averageRating === "number" ? value.averageRating : 0,
    totalRatings: typeof value.totalRatings === "number" ? value.totalRatings : 0,
    tracks: Array.isArray(value.tracks) ? value.tracks.map(parseTrack) : [],
  };
}

function parseTrack(value: unknown): Track {
  if (
    !isRecord(value) ||
    typeof value.id !== "string" ||
    typeof value.albumId !== "string" ||
    typeof value.title !== "string" ||
    typeof value.trackNumber !== "number"
  ) {
    throw new Error("The catalog API returned an invalid track.");
  }
  return {
    id: value.id,
    albumId: value.albumId,
    title: value.title,
    duration: typeof value.duration === "string" ? value.duration : undefined,
    trackNumber: value.trackNumber,
  };
}

function parseTrackSearchResult(value: unknown): TrackSearchResult {
  const track = parseTrack(value);
  if (
    !isRecord(value) ||
    typeof value.albumTitle !== "string" ||
    typeof value.artist !== "string" ||
    typeof value.year !== "number"
  ) {
    throw new Error("The catalog API returned an invalid track search result.");
  }
  return { ...track, albumTitle: value.albumTitle, artist: value.artist, year: value.year };
}

export const catalogService = {
  async getRecentAlbums(limitCount = 60): Promise<Album[]> {
    const data = await requestCatalog(`/albums?limit=${limitCount}`);
    if (!Array.isArray(data)) throw new Error("The catalog API returned an invalid album list.");
    return data.map(parseAlbum);
  },

  async getAlbumsByIds(ids: string[]): Promise<Album[]> {
    const uniqueIds = [...new Set(ids)].filter(Boolean);
    const albums: Album[] = [];
    for (let index = 0; index < uniqueIds.length; index += 100) {
      const batch = uniqueIds.slice(index, index + 100);
      const data = await requestCatalog(`/albums-by-id?ids=${batch.map(encodeURIComponent).join(",")}`);
      if (!Array.isArray(data)) throw new Error("The catalog API returned an invalid album list.");
      albums.push(...data.map(parseAlbum));
    }
    return albums;
  },

  async getAlbumById(id: string): Promise<Album | null> {
    const data = await requestCatalog(`/album?id=${encodeURIComponent(id)}`);
    return data === null ? null : parseAlbum(data);
  },

  async getTracksByAlbum(albumId: string): Promise<Track[]> {
    const data = await requestCatalog(`/tracks?albumId=${encodeURIComponent(albumId)}`);
    if (!Array.isArray(data)) throw new Error("The catalog API returned an invalid track list.");
    return data.map(parseTrack);
  },

  async searchAlbums(
    query: string,
    limitCount = 30,
    offsetCount = 0,
    filters?: { decade?: string; year?: string; genre?: string }
  ): Promise<Album[]> {
    const params = new URLSearchParams({ kind: "albums", q: query, limit: String(limitCount), offset: String(offsetCount) });
    if (filters?.decade) params.set("decade", filters.decade);
    if (filters?.year) params.set("year", filters.year);
    if (filters?.genre) params.set("genre", filters.genre);
    const data = await requestCatalog(`/search?${params.toString()}`);
    if (!Array.isArray(data)) throw new Error("The catalog API returned an invalid album search result.");
    return data.map(parseAlbum);
  },

  async getAlbumsByArtist(artist: string, limitCount = 50, offsetCount = 0): Promise<Album[]> {
    const params = new URLSearchParams({ artist, limit: String(limitCount), offset: String(offsetCount) });
    const data = await requestCatalog(`/albums-by-artist?${params.toString()}`);
    if (!Array.isArray(data)) throw new Error("The catalog API returned an invalid artist album list.");
    return data.map(parseAlbum);
  },

  async searchTracks(query: string, limitCount = 30): Promise<TrackSearchResult[]> {
    const data = await requestCatalog(`/search?kind=tracks&q=${encodeURIComponent(query)}&limit=${limitCount}`);
    if (!Array.isArray(data)) throw new Error("The catalog API returned an invalid track search result.");
    return data.map(parseTrackSearchResult);
  },
};
