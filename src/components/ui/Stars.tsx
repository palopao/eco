export function Stars({ value = 4.5, large = false }: { value?: number; large?: boolean }) {
  return (
    <div className={`stars ${large ? "stars-large" : ""}`} aria-label={`${value} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <span key={star} className={star <= Math.round(value) ? "star-on" : ""}>★</span>
      ))}
      {!large && <b>{value.toFixed(1)}</b>}
    </div>
  );
}
