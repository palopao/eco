export function SearchGuide({ onClose }: { onClose: () => void }) {
  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <section className="filter-sheet" onMouseDown={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <UniversalHeader className="modal-safe-header" action={<button type="button" className="header-icon-button" onClick={onClose} aria-label="Close search guide"><Icon name="close" size={19} /></button>} />
        <div className="filter-title"><div><span>SEARCH GUIDE</span><h2>How to search</h2></div></div>
        <div className="guide-section">
          <h3>Search by title</h3>
          <p>Type an album name to find matching titles. Exact matches appear first, followed by albums that start with or contain your query.</p>
        </div>
        <div className="guide-section">
          <h3>Search by artist</h3>
          <p>Select the Artists tab and type an artist name to view their full discography.</p>
        </div>
        <div className="guide-section">
          <h3>Search by track</h3>
          <p>Select the Tracks tab to search song titles across all albums in the catalog.</p>
        </div>
        <div className="guide-section">
          <h3>Filters</h3>
          <p>Use decade, year, genre, and minimum rating filters to narrow your results. Active filters appear below the search bar.</p>
        </div>
        <div className="guide-section">
          <h3>Categories</h3>
          <p>Browse results organized by Title, Artist, Tracks, Users, and Lists using the category tabs.</p>
        </div>
      </section>
    </div>
  );
}

import { UniversalHeader } from "./UniversalHeader";
import { Icon } from "./Icon";
