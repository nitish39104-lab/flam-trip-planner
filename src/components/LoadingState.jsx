export default function LoadingState() {
  return (
    <div className="state-panel loading-state" role="status" aria-live="polite">
      <div className="spinner" />
      <p>Building your itinerary…</p>
    </div>
  );
}
