import { useState } from "react";
import { reviewService } from "../../lib/services/firestore-service";
import { AlbumSelectionModal } from "./AlbumSelectionModal";
import { AppHeader } from "../../components/ui/AppHeader";
import { Icon } from "../../components/ui/Icon";
import type { Album, Review, Track } from "../../types";
import { ALBUM_PLACEHOLDER } from "../../lib/constants";

export function LogSheet({
  close,
  albumId,
  album,
  tracks,
  userId,
  onPublished,
}: {
  close: () => void;
  albumId: string | null;
  album: Album | null;
  tracks: Track[];
  userId?: string;
  onPublished: () => Promise<void>;
}) {
  const [rating, setRating] = useState(4.5);
  const [relis, setRelis] = useState(false);
  const [listenedAt, setListenedAt] = useState(new Date().toISOString().slice(0, 10));
  const [trackId, setTrackId] = useState("");
  const [review, setReview] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [albumSelectOpen, setAlbumSelectOpen] = useState(false);
  const [selectedAlbumForLog, setSelectedAlbumForLog] = useState<Album | null>(null);

  const publishReview = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const targetAlbumId = selectedAlbumForLog?.id ?? albumId;
    if (!targetAlbumId || !userId) {
      setError("Choose an album and sign in before publishing.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await reviewService.createReview({
        userId,
        albumId: targetAlbumId,
        rating,
        trackId: trackId || undefined,
        textContent: review.trim(),
        listenedAt: new Date(`${listenedAt}T12:00:00`),
        favoriteTrackId: trackId || undefined,
        isRewatch: relis,
      });
      await onPublished();
      close();
    } catch (publishError) {
      console.error("Could not publish review.", publishError);
      setError("Review could not be saved. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleAlbumSelected = (selected: Album) => {
    setSelectedAlbumForLog(selected);
    setAlbumSelectOpen(false);
  };

  return (
    <div className="modal-backdrop" onMouseDown={close}>
      {albumSelectOpen && selectedAlbumForLog ? (
        <AlbumSelectionModal close={() => setAlbumSelectOpen(false)} onAlbumSelected={handleAlbumSelected} />
      ) : null}
      <form className="log-sheet" onSubmit={publishReview} onMouseDown={(e) => e.stopPropagation()} aria-modal="true" role="dialog" aria-labelledby="log-title">
        <AppHeader className="modal-safe-header" onLogo={close} action={<button type="button" className="header-icon-button" onClick={close} aria-label="Close log and review"><Icon name="close" size={20} /></button>} />
        <div className="sheet-title">
          <div><img src={selectedAlbumForLog?.coverUrl ?? album?.coverUrl ?? ALBUM_PLACEHOLDER} alt="" /><div><span>LOG ALBUM</span><h2 id="log-title">{selectedAlbumForLog?.title ?? album?.title ?? "Select an album"}</h2><p>{selectedAlbumForLog?.artist ?? album?.artist ?? ""}</p></div></div>
          {(!selectedAlbumForLog && !album) && (
            <button type="button" className="choose-album-btn" onClick={() => setAlbumSelectOpen(true)}><Icon name="plus" size={18} /> Choose album</button>
          )}
        </div>
        {!selectedAlbumForLog && !album && <p className="screen-heading" style={{ textAlign: "center", margin: "20px 0" }}>Tap "Choose album" to search and select an album to review.</p>}
        {selectedAlbumForLog || album ? (
          <>
            <div className="rating-block">
              <label>Your rating <strong>{rating.toFixed(1)}</strong></label>
              <div className="rating-selector">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button type="button" className={star - 0.5 === rating ? "half-active" : ""} key={star} onClick={(e) => {
                    const box = e.currentTarget.getBoundingClientRect();
                    setRating(e.clientX - box.left < box.width / 2 ? star - 0.5 : star);
                  }} aria-label={`Rate up to ${star} stars`}>
                    <span className={star <= Math.floor(rating) ? "full" : star - 0.5 === rating ? "half" : ""}>★</span>
                  </button>
                ))}
              </div>
            </div>
            <label className="field-label">Date listened</label>
            <input className="text-field" type="date" value={listenedAt} onChange={(event) => setListenedAt(event.target.value)} required />
            <label className="field-label">Track reviewed (optional)</label>
            <select value={trackId} onChange={(event) => setTrackId(event.target.value)}>
              <option value="">Album review only</option>
              {(selectedAlbumForLog?.tracks ?? tracks ?? []).map((track) => <option key={track.id} value={track.id}>{track.title}</option>)}
            </select>
            <label className="field-label" htmlFor="review">Your review</label>
            <textarea id="review" placeholder="What did you think?" rows={3} maxLength={2000} value={review} onChange={(event) => setReview(event.target.value)} />
            <div className="toggle-row">
              <div><strong>Re-listen</strong><span>I’ve listened to this album before</span></div>
              <button type="button" className={`toggle ${relis ? "on" : ""}`} onClick={() => setRelis(!relis)} aria-label="Toggle re-listen"><i /></button>
            </div>
            {error && <p role="alert" className="error-text">{error}</p>}
            <button className="publish-button" disabled={loading}>{loading ? "Publishing..." : "Publish & Share"}</button>
          </>
        ) : null}
      </form>
    </div>
  );
}
