import LoadingState from './LoadingState.jsx';
import ErrorState from './ErrorState.jsx';
import TripPlanner from './TripPlanner.jsx';

export default function ResultView({ status, trip, errorReason, onRetry, onTripChange }) {
  if (status === 'idle') {
    return (
      <div className="state-panel empty-state">
        <p>Describe a trip above and your itinerary will show up here.</p>
      </div>
    );
  }
  if (status === 'loading') return <LoadingState />;
  if (status === 'error') return <ErrorState reason={errorReason} onRetry={onRetry} />;
  if (status === 'success' && trip) return <TripPlanner trip={trip} onChange={onTripChange} />;

  // Defensive fallback — should be unreachable, but never silently render nothing.
  return <ErrorState reason="unknown" onRetry={onRetry} />;
}
