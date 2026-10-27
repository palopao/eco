export function SearchLoading({ message = "Searching…" }: { message?: string }) {
  return (
    <div className="search-loading">
      <div className="search-spinner" />
      <p className="screen-heading">{message}</p>
    </div>
  );
}
