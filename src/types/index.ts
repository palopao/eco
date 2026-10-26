import type { Timestamp } from "firebase/firestore";

export interface Album {
  id?: string;
  title: string;
  artist: string;
  year: number;
  releaseDate?: string;
  coverUrl: string;
  metadataSource?: string;
  trackCount: number;
  duration: string;
  genres: string[];
  averageRating: number;
  totalRatings: number;
  tracks?: Track[];
}

export interface Track {
  id?: string;
  albumId: string;
  title: string;
  duration?: string;
  trackNumber: number;
}

export interface TrackSearchResult extends Track {
  albumTitle: string;
  artist: string;
  year: number;
}

export interface Review {
  id?: string;
  userId: string;
  albumId: string;
  trackId?: string;
  rating: number;
  textContent?: string;
  content?: string;
  listenedAt?: Timestamp | Date | null;
  timestamp?: Timestamp | Date | null;
  likesCount?: number;
  likes?: number;
  favoriteTrackId?: string;
  isRewatch?: boolean;
}

export interface User {
  id?: string;
  displayName: string;
  username: string;
  bio: string;
  avatarUrl: string;
  photoURL?: string;
  favoriteAlbums?: string[];
  lastfmUsername?: string;
  spotifyConnected?: boolean;
  stats: {
    albumsLogged: number;
    reviewsCount: number;
    listsCount: number;
  };
  integrations: {
    spotify: string | null;
    lastfm: string | null;
  };
}

export interface UserList {
  id?: string;
  title: string;
  description: string;
  ownerId?: string;
  authorId?: string;
  albumIds?: string[];
  albums?: Array<{ albumId: string; position: number }>;
  likesCount?: number;
  isPublic: boolean;
}
