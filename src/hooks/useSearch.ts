import { useCallback, useEffect, useRef, useState } from "react";
import { albumService } from "../lib/services/firestore-service";
import type { Album, TrackSearchResult } from "../types";

export type SearchCategory = "All" | "Albums" | "Artists" | "Tracks" | "Users" | "Lists";

export type SearchFilters = {
  decade: string;
  year: string;
  genres: string[];
  minRating: number;
};

const DEFAULT_FILTERS: SearchFilters = { decade: "", year: "", genres: [], minRating: 0 };

export function useSearch({ initialAlbums }: { initialAlbums: Album[] }) {
  const [category, setCategory] = useState<SearchCategory>("All");
  const [filters, setFilters] = useState<SearchFilters>({ ...DEFAULT_FILTERS });
  const [searchText, setSearchText] = useState("");
  const [searchAlbums, setSearchAlbums] = useState<Album[]>([]);
  const [searchTracks, setSearchTracks] = useState<TrackSearchResult[]>([]);
  const [searchOffset, setSearchOffset] = useState(0);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [hasSearched, setHasSearched] = useState(false);

  const latestSearch = useRef(0);
  const abortController = useRef<AbortController | null>(null);

  const normalizedSearch = searchText.trim();
  const hasFullSearch = normalizedSearch.length >= 2;
  const hasActiveFilters =
    filters.decade || filters.year || filters.genres.length > 0 || filters.minRating > 0;

  const shouldSearch =
    (hasFullSearch || hasActiveFilters) &&
    ["All", "Albums", "Artists", "Tracks"].includes(category);

  useEffect(() => {
    // Cancel any in-flight request before starting a new one
    if (abortController.current) {
      abortController.current.abort();
    }
    abortController.current = new AbortController();

    if (!shouldSearch || !hasSearched) {
      setSearchAlbums([]);
      setSearchTracks([]);
      setSearching(false);
      setSearchError("");
      return;
    }

    const requestId = ++latestSearch.current;

    const timer = window.setTimeout(async () => {
      setSearching(true);
      setSearchError("");
      try {
        if (category === "Tracks") {
          const results = await albumService.searchTracks(normalizedSearch, abortController.current!.signal);
          if (requestId === latestSearch.current && !abortController.current!.signal.aborted) {
            setSearchTracks(results);
          }
        } else {
          const results = await albumService.searchAlbums(
            normalizedSearch,
            {
              decade: filters.decade || undefined,
              year: filters.year || undefined,
              genre: filters.genres[0] || undefined,
            },
            searchOffset,
            abortController.current!.signal
          );
          if (requestId === latestSearch.current && !abortController.current!.signal.aborted) {
            if (searchOffset === 0) setSearchAlbums(results);
            else setSearchAlbums((prev) => mergeAlbums(prev, results));
          }
        }
      } catch (error: unknown) {
        if (abortController.current!.signal.aborted) return;
        console.error("Could not search the local music catalog.", error);
        if (requestId === latestSearch.current)
          setSearchError("Music search failed. Check that the catalog API is running.");
      } finally {
        if (requestId === latestSearch.current && !abortController.current!.signal.aborted) {
          setSearching(false);
        }
      }
    }, 0);

    return () => {
      window.clearTimeout(timer);
      abortController.current?.abort();
    };
  }, [category, hasFullSearch, normalizedSearch, filters, searchOffset, hasSearched]);

  useEffect(() => {
    setSearchOffset(0);
  }, [normalizedSearch, filters, category]);

  const filteredAlbums = searchAlbums.filter((album) => {
    const matchesText =
      !normalizedSearch ||
      `${album.title} ${album.artist} ${album.genres.join(" ")}`
        .toLowerCase()
        .includes(normalizedSearch.toLowerCase());
    const matchesDecade =
      !filters.decade || Math.floor(album.year / 10) * 10 === Number(filters.decade);
    const matchesYear = !filters.year || album.year === Number(filters.year);
    const matchesGenre =
      filters.genres.length === 0 ||
      filters.genres.some((genre) => album.genres.includes(genre));
    const matchesRating =
      filters.minRating === 0 ||
      (album.totalRatings > 0 && album.averageRating >= filters.minRating);
    return matchesText && matchesDecade && matchesYear && matchesGenre && matchesRating;
  });

  const baseAlbums = (hasFullSearch || hasActiveFilters) ? filteredAlbums : initialAlbums;

  const artists = Array.from(
    new Map(baseAlbums.map((album) => [album.artist, album])).values()
  );

  const toggleFilter = (updates: Partial<SearchFilters>) => {
    setFilters((current) => ({ ...current, ...updates }));
  };

  const removeFilter = (key: string, value?: string) => {
    setFilters((current) => {
      if (key === "decade") return { ...current, decade: "" };
      if (key === "year") return { ...current, year: "" };
      if (key === "genre")
        return { ...current, genres: current.genres.filter((g) => g !== value) };
      if (key === "minRating") return { ...current, minRating: 0 };
      return current;
    });
  };

  const executeSearch = () => {
    setHasSearched(true);
    setSearchOffset(0);
  };

  const resetSearch = () => {
    if (abortController.current) {
      abortController.current.abort();
    }
    setSearchText("");
    setFilters({ ...DEFAULT_FILTERS });
    setSearchAlbums([]);
    setSearchTracks([]);
    setSearchOffset(0);
    setSearching(false);
    setSearchError("");
    setHasSearched(false);
  };

  const loadMore = () => {
    setSearchOffset((prev) => prev + 30);
  };

  const hasMoreResults = searching ? false : searchAlbums.length > 0 && searchAlbums.length % 30 === 0;

  return {
    category,
    setCategory,
    filters,
    setFilters,
    toggleFilter,
    removeFilter,
    searchText,
    setSearchText,
    normalizedSearch,
    hasFullSearch,
    hasActiveFilters,
    searching,
    searchError,
    searchAlbums,
    searchTracks,
    searchOffset,
    baseAlbums,
    artists,
    filteredAlbums,
    hasSearched,
    executeSearch,
    resetSearch,
    loadMore,
    hasMoreResults,
  };
}

function mergeAlbums(current: Album[], incoming: Album[]): Album[] {
  const byId = new Map(current.map((album) => [album.id, album]));
  for (const album of incoming) {
    if (album.id) byId.set(album.id, album);
  }
  return [...byId.values()];
}
