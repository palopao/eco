import { useState } from "react";
import type { Album, Review, Track } from "../types";
import { AppHeader } from "../components/ui/AppHeader";
import { Icon } from "../components/ui/Icon";
import { SectionTitle } from "../components/ui/SectionTitle";
import { Stars } from "../components/ui/Stars";

export function AlbumScreen({
  album,
  tracks,
  reviews,
  goBack,
  openLog,
}: {
  album: Album | null;
  tracks: Track[];
  reviews: Review[];
  goBack: () => void;
  openLog: () => void;
}) {
  const [reviewOrder, setReviewOrder] = useState<"popular" | "recent">("popular");
  const sortedReviews = reviewOrder === "popular"
    ? [...reviews].sort((left, right) => (right.likesCount ?? right.likes ?? 0) - (left.likesCount ?? left.likes ?? 0))
    : reviews;
  const ratingBins = [5, 4, 3, 2, 1].map((rating) => ({
    rating,
    count: reviews.filter((review) => Math.round(review.rating) === rating).length,
  }));
  const averageRating = reviews.length
    ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
    : 0;
  const trackReviewStats = new Map<string, { count: number; totalRating: number }>();
  for (const review of reviews) {
    if (!review.trackId) continue;
    const stats = trackReviewStats.get(review.trackId) ?? { count: 0, totalRating: 0 };
    stats.count += 1;
    stats.totalRating += review.rating;
    trackReviewStats.set(review.trackId, stats);
  }
  const maximumBin = Math.max(1, ...ratingBins.map((bin) => bin.count));
  const popularTrackId = reviews.reduce<string | undefined>((popular, review) => {
    if (!review.favoriteTrackId) return popular;
    const popularCount = reviews.filter((entry) => entry.favoriteTrackId === popular).length;
    const currentCount = reviews.filter((entry) => entry.favoriteTrackId === review.favoriteTrackId).length;
    return currentCount > popularCount ? review.favoriteTrackId : popular;
  }, undefined);
  if (!album) {
    return <main className="album-page"><AppHeader onHome={goBack} action={<span />} /><p className="screen-heading">Album not found in the local music catalog.</p></main>;
  }
  return (
    <main className="album-page">
      <AppHeader onBack={goBack} title={album.title} action={<button className="header-icon-button" aria-label="Share album"><Icon name="share" /></button>} />
      <div className="album-hero">
        <div className="hero-blur" style={{ backgroundImage: `url(${album.coverUrl})` }} />
        <img className="hero-cover" src={album.coverUrl} alt={`${album.title} by ${album.artist}`} />
      </div>
      <div className="album-content">
        <div className="album-heading">
          <p>{album.artist.toUpperCase()}</p>
          <h1>{album.title}</h1>
          <span>
            {album.year}
            {album.trackCount > 0 ? ` · ${album.trackCount} tracks` : ""}
            {album.duration ? ` · ${album.duration}` : ""}
            {album.trackCount === 0 && !album.duration ? " · Track details unavailable" : ""}
          </span>
          <div className="pills">{album.genres.map((genre) => <span key={genre}>{genre}</span>)}</div>
          {album.metadataSource && <small className="metadata-attribution">
            Metadata: <a href="https://musicbrainz.org/" target="_blank" rel="noreferrer">{album.metadataSource}</a>
            {album.metadataSource === "MusicBrainz" && <> · Artwork: <a href="https://coverartarchive.org/" target="_blank" rel="noreferrer">Cover Art Archive</a></>}
          </small>}
        </div>

        <div className="score-card">
          <div className="score-main">
            {reviews.length > 0
              ? <><strong>{averageRating.toFixed(1)}</strong><span>out of 5</span><Stars value={averageRating} /><small>{reviews.length.toLocaleString()} ratings loaded</small></>
              : <><strong>—</strong><span>Not rated yet</span><small>Be the first to review</small></>}
          </div>
          <div className="histogram" aria-label="Rating distribution">
            {ratingBins.map(({ rating, count }) => (
              <div key={rating}><span>{rating}</span><i><b style={{ width: `${(count / maximumBin) * 100}%` }} /></i><small>{count}</small></div>
            ))}
          </div>
        </div>

        <div className="action-bar">
          <button className="primary-button" onClick={openLog}><Icon name="plus" size={19} /> Log / Review</button>
          <button className="square-action" aria-label="Add to favorites"><Icon name="heart" /></button>
          <button className="square-action" aria-label="Want to listen"><Icon name="bookmark" /></button>
        </div>

        <section className="tracklist">
          <SectionTitle>Tracklist</SectionTitle>
          <div className="track-card">
            {tracks.map((track) => {
              const trackStats = track.id ? trackReviewStats.get(track.id) : undefined;
              return <div className="track" key={track.id ?? track.trackNumber}>
                <span>{String(track.trackNumber).padStart(2, "0")}</span>
                <strong>{track.title}{trackStats && <small className="track-review-count">★ {(trackStats.totalRating / trackStats.count).toFixed(1)} · {trackStats.count} review(s)</small>}</strong>
                <span aria-label={popularTrackId && track.id === popularTrackId ? "Most popular favorite track" : "Track"}><Icon name="star" size={17} fill={popularTrackId && track.id === popularTrackId ? "currentColor" : "none"} /></span>
                <time>{track.duration}</time>
              </div>;
            })}
            {tracks.length === 0 && <p className="screen-heading">Track information is not available yet.</p>}
          </div>
        </section>

        <section className="community">
          <SectionTitle>Community reviews</SectionTitle>
          <div className="filter-pills">
            <button className={reviewOrder === "popular" ? "active" : ""} onClick={() => setReviewOrder("popular")}>Popular</button>
            <button className={reviewOrder === "recent" ? "active" : ""} onClick={() => setReviewOrder("recent")}>Recent</button>
          </div>
          {sortedReviews.map((review) => <article className="community-card" key={review.id}>
            <div className="review-user"><div className="avatar avatar-lilac">{review.userId.slice(0, 1).toUpperCase()}</div><div><strong>{review.userId}</strong><Stars value={review.rating} /></div></div>
            {(review.textContent ?? review.content) && <p>{review.textContent ?? review.content}</p>}
            <div className="review-footer"><span>{review.likesCount ?? review.likes ?? 0} likes</span><span>{review.isRewatch ? "Re-listen" : "Listen"}</span></div>
          </article>)}
          {reviews.length === 0 && <p className="screen-heading">No reviews yet. Be the first to log this album.</p>}
        </section>
      </div>
    </main>
  );
}
