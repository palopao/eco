export function ActiveFilters({ filters, onRemove }: { filters: { decade?: string; year?: string; genres?: string[]; minRating?: number }; onRemove: (key: string, value?: string) => void }) {
  const chips: { label: string; key: string; value: string }[] = [];

  if (filters.decade) chips.push({ label: `${filters.decade}s`, key: "decade", value: filters.decade });
  if (filters.year) chips.push({ label: filters.year, key: "year", value: filters.year });
  if (filters.genres?.length) {
    filters.genres.forEach((g) => chips.push({ label: g, key: "genre", value: g }));
  }
  if (filters.minRating && filters.minRating > 0) chips.push({ label: `${filters.minRating.toFixed(1)}+ ★`, key: "minRating", value: String(filters.minRating) });

  if (chips.length === 0) return null;

  return (
    <div className="active-filters">
      <span className="active-filters-label">Active filters:</span>
      {chips.map((chip, i) => (
        <button key={i} type="button" className="filter-chip" onClick={() => onRemove(chip.key, chip.value)}>
          {chip.label} ×
        </button>
      ))}
    </div>
  );
}
