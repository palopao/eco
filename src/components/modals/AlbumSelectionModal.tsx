import { useEffect, useRef, useState } from "react";
import type { Album } from "../../types";
import { albumService } from "../../lib/services/firestore-service";
import { AppHeader } from "../../components/ui/AppHeader";
import { Icon } from "../../components/ui/Icon";
import { SectionTitle } from "../../components/ui/SectionTitle";

export function AlbumSelectionModal({
  close,
  onAlbumSelected,
}: {
  close: () => void;
  onAlbumSelected: (album: Album) => void;
}) {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<Album[]>([]);
  const [loading, setLoading] = useState(false);
  const latest = useRef(0);
  const abortController = useRef<AbortController | null>(null);

  useEffect(() => {
    // Cancel any in-flight request
    if (abortController.current) {
      abortController.current.abort();
    }
    abortController.current = new AbortController();

    if (!query.trim()) {
      setSuggestions([]);
      return;
    }
    const requestId = ++latest.current;
    setLoading(true);
    albumService
      .searchAlbums(query, undefined, 0, abortController.current!.signal)
      .then((results) => {
        if (requestId === latest.current && !abortController.current!.signal.aborted) {
          setSuggestions(results);
          setLoading(false);
        }
      })
      .catch(() => {
        if (requestId === latest.current && !abortController.current!.signal.aborted) setLoading(false);
      });

    return () => {
      abortController.current?.abort();
    };
  }, [query]);

  useEffect(() => {
    return () => {
      abortController.current?.abort();
    };
  }, []);

  return (
    <div className="modal-backdrop" onMouseDown={close}>
      <form className="log-sheet" onSubmit={(e) => e.preventDefault()} onMouseDown={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="select-album-title">
        <AppHeader className="modal-safe-header" onLogo={close} action={<button type="button" className="header-icon-button" onClick={close} aria-label="Close album selection"><Icon name="close" size={20} /></button>} />
        <div className="sheet-title">
          <div><span>SELECT ALBUM</span><h2 id="select-album-title">Choose an album to review</h2></div>
        </div>
        <div className="rating-block">
          <label className="field-label">Search album</label>
          <div className="add-search">
            <Icon name="search" size={18} />
            <input
              id="album-search-input"
              placeholder="Type album name..."
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              autoFocus
            />
          </div>
          {loading && <span>Searching…</span>}
        </div>
        <SectionTitle>Results</SectionTitle>
        <div className="added-albums">
          {suggestions.map((album) => (
            <div key={album.id ?? album.title} onClick={() => onAlbumSelected(album)} style={{ cursor: "pointer", padding: "10px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: "10px" }}>
              <img src={album.coverUrl} alt="" style={{ width: 48, height: 48, borderRadius: 6, objectFit: "cover" }} />
              <div style={{ flex: 1 }}>
                <strong style={{ display: "block" }}>{album.title}</strong>
                <small style={{ color: "var(--text-2)" }}>{album.artist}</small>
              </div>
              <span style={{ color: "var(--text-3)" }}><Icon name="chevron" size={16} /></span>
            </div>
          ))}
          {suggestions.length === 0 && query.trim() && <p className="screen-heading">No albums found matching your search.</p>}
        </div>
      </form>
    </div>
  );
}
