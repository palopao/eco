import { requireDb } from "../firebase";
import {
  collection,
  getDocs,
  getDoc,
  doc,
  query,
  where,
  orderBy,
  limit,
  addDoc,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";
import type { DocumentData, QueryDocumentSnapshot } from "firebase/firestore";
import { Album, Review, TrackSearchResult, User, UserList } from "../../types";
import { catalogService } from "./catalog-service";

const REVIEWS_COL = "reviews";
const USERS_COL = "users";
const LISTS_COL = "lists";

function mapReview(snapshot: QueryDocumentSnapshot<DocumentData>): Review {
  const data = snapshot.data();
  return {
    id: snapshot.id,
    ...data,
    textContent: data.textContent ?? data.content ?? "",
    listenedAt: data.listenedAt ?? data.timestamp ?? null,
    likesCount: data.likesCount ?? data.likes ?? 0,
  } as Review;
}

function mergeReviews(...groups: Review[][]): Review[] {
  const unique = new Map<string, Review>();
  for (const review of groups.flat()) {
    if (review.id) unique.set(review.id, review);
  }
  return Array.from(unique.values()).sort((left, right) => {
    const leftDate = left.listenedAt ?? left.timestamp;
    const rightDate = right.listenedAt ?? right.timestamp;
    const leftMillis = leftDate instanceof Date ? leftDate.getTime() : leftDate?.toMillis() ?? 0;
    const rightMillis = rightDate instanceof Date ? rightDate.getTime() : rightDate?.toMillis() ?? 0;
    return rightMillis - leftMillis;
  });
}

export const albumService = {
  async getAlbums(limitCount = 60): Promise<Album[]> {
    return catalogService.getRecentAlbums(limitCount);
  },

  async getAlbumsByIds(ids: string[]): Promise<Album[]> {
    return catalogService.getAlbumsByIds(ids);
  },

  getAlbumById(id: string): Promise<Album | null> {
    return catalogService.getAlbumById(id);
  },

  searchAlbums(
    searchText: string,
    filters?: { decade?: string; year?: string; genre?: string },
    offsetCount = 0
  ): Promise<Album[]> {
    return catalogService.searchAlbums(searchText, 30, offsetCount, filters);
  },

  async getAlbumsByArtist(artist: string, limitCount = 50, offsetCount = 0): Promise<Album[]> {
    return catalogService.getAlbumsByArtist(artist, limitCount, offsetCount);
  },

  searchTracks(searchText: string): Promise<TrackSearchResult[]> {
    return catalogService.searchTracks(searchText);
  },
};

export const reviewService = {
  async getReviewsByAlbum(albumId: string): Promise<Review[]> {
    const db = requireDb();
    const reviews = collection(db, REVIEWS_COL);
    const [current, legacy] = await Promise.all([
      getDocs(query(reviews, where("albumId", "==", albumId), orderBy("listenedAt", "desc"), limit(100))),
      getDocs(query(reviews, where("albumId", "==", albumId), orderBy("timestamp", "desc"), limit(100))),
    ]);
    return mergeReviews(current.docs.map(mapReview), legacy.docs.map(mapReview)).slice(0, 100);
  },

  async getUserReviews(userId: string): Promise<Review[]> {
    const db = requireDb();
    const reviews = collection(db, REVIEWS_COL);
    const [current, legacy] = await Promise.all([
      getDocs(query(reviews, where("userId", "==", userId), orderBy("listenedAt", "desc"), limit(100))),
      getDocs(query(reviews, where("userId", "==", userId), orderBy("timestamp", "desc"), limit(100))),
    ]);
    return mergeReviews(current.docs.map(mapReview), legacy.docs.map(mapReview)).slice(0, 100);
  },

  async getRecentReviews(limitCount = 20): Promise<Review[]> {
    const db = requireDb();
    const reviews = collection(db, REVIEWS_COL);
    const [current, legacy] = await Promise.all([
      getDocs(query(reviews, orderBy("listenedAt", "desc"), limit(limitCount))),
      getDocs(query(reviews, orderBy("timestamp", "desc"), limit(limitCount))),
    ]);
    return mergeReviews(current.docs.map(mapReview), legacy.docs.map(mapReview)).slice(0, limitCount);
  },

  async createReview(reviewData: Omit<Review, "id" | "timestamp" | "likes" | "likesCount">): Promise<string> {
    const db = requireDb();
    const docRef = await addDoc(collection(db, REVIEWS_COL), {
      ...reviewData,
      listenedAt: reviewData.listenedAt ?? serverTimestamp(),
      likesCount: 0,
    });
    return docRef.id;
  },
};

export const userService = {
  async getUserProfile(userId: string): Promise<User | null> {
    const db = requireDb();
    const docSnap = await getDoc(doc(db, USERS_COL, userId));
    if (!docSnap.exists()) return null;
    const data = docSnap.data();
    return {
      id: docSnap.id,
      ...data,
      avatarUrl: data.avatarUrl ?? data.photoURL ?? "",
      photoURL: data.photoURL ?? data.avatarUrl ?? "",
      favoriteAlbums: data.favoriteAlbums ?? [],
      lastfmUsername: data.lastfmUsername ?? "",
      spotifyConnected: data.spotifyConnected ?? false,
      stats: data.stats ?? { albumsLogged: 0, reviewsCount: 0, listsCount: 0 },
    } as User;
  },

  async updateUserProfile(userId: string, data: Partial<User>): Promise<void> {
    const db = requireDb();
    const userRef = doc(db, USERS_COL, userId);
    await setDoc(userRef, data, { merge: true });
  },

  async createUserProfile(userId: string, data: Omit<User, "id">): Promise<void> {
    const db = requireDb();
    await setDoc(doc(db, USERS_COL, userId), data);
  },
};

export const listService = {
  async getLists(): Promise<UserList[]> {
    const db = requireDb();
    const q = query(collection(db, LISTS_COL), where("isPublic", "==", true), limit(20));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as UserList));
  },

  async createList(listData: Omit<UserList, "id">): Promise<string> {
    const db = requireDb();
    const docRef = await addDoc(collection(db, LISTS_COL), listData);
    return docRef.id;
  },

  async getUserLists(userId: string): Promise<UserList[]> {
    const db = requireDb();
    const q = query(collection(db, LISTS_COL), where("ownerId", "==", userId), limit(50));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((listDoc) => ({ id: listDoc.id, ...listDoc.data() }) as UserList);
  },
};
