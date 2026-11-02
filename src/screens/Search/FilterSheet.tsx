import { useState } from "react";
import { AppHeader } from "../../components/ui/AppHeader";
import { Icon } from "../../components/ui/Icon";

export function FilterSheet({ close, filters, onApply }: { close: () => void; filters: { decade?: string; year?: string; genres?: string[]; minRating?: number }; onApply: (filters: { decade?: string; year?: string; genres?: string[]; minRating?: number }) => void }) {
  const [draft, setDraft] = useState({ ...filters });
  const toggleGenre = (genre: string) => setDraft((current) => ({
    ...current,
    genres: current.genres?.includes(genre) ? current.genres.filter((item) => item !== genre) : [...(current.genres ?? []), genre],
  }));
  return <div className="modal-backdrop" onMouseDown={close}><section className="filter-sheet" onMouseDown={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
    <AppHeader className="modal-safe-header" onLogo={close} action={<button type="button" className="header-icon-button" onClick={close} aria-label="Close filters"><Icon name="close" size={19} /></button>} />
    <div className="filter-title"><div><span>DISCOVERY</span><h2>Filters & categories</h2></div></div>
    <label className="field-label" htmlFor="filter-decade">Era / decade</label><select id="filter-decade" value={draft.decade ?? ""} onChange={(event) => setDraft({ ...draft, decade: event.target.value })}><option value="">Any decade</option>{[2025, 2020, 2010, 2000, 1990, 1980, 1970, 1960].map((decade) => <option value={String(decade)} key={decade}>{decade}s</option>)}</select>
    <label className="field-label" htmlFor="filter-year">Specific year</label><input id="filter-year" className="text-field" type="number" min="1800" max="2100" placeholder="Year" value={draft.year ?? ""} onChange={(event) => setDraft({ ...draft, year: event.target.value })} />
    <label className="field-label">Genres</label><div className="check-grid">{["Indie", "Hip-Hop", "Electronic", "R&B", "Jazz", "Rock"].map((genre) => <label key={genre}><input type="checkbox" checked={(draft.genres ?? []).includes(genre)} onChange={() => toggleGenre(genre)} /> <span>{genre}</span></label>)}</div>
    <div className="range-label"><label htmlFor="min-rating">Minimum average rating</label><strong>{(draft.minRating ?? 0) === 0 ? "Any" : `${(draft.minRating ?? 0).toFixed(1)}+`}</strong></div><input id="min-rating" className="range" type="range" min="0" max="5" step=".5" value={draft.minRating ?? 0} onChange={(event) => setDraft({ ...draft, minRating: Number(event.target.value) })} />
    <button className="publish-button" onClick={() => { onApply(draft); close(); }}>Show results</button>
  </section></div>;
}
