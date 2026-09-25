const MESSAGES = {
  malformed_json: "The AI's response wasn't valid JSON, so it couldn't be parsed.",
  wrong_shape: "The AI returned JSON, but not in the itinerary shape we expected.",
  empty: 'The AI returned an empty response.',
  network: "Couldn't reach the server. Check your connection and try again.",
  request_failed: 'The request failed on the server side.',
  timeout: 'The request took too long and timed out.',
  unknown: 'Something unexpected went wrong.',
};

export default function ErrorState({ reason = 'unknown', onRetry }) {
  return (
    <div className="state-panel error-state" role="alert">
      <p className="error-title">Couldn't build your itinerary</p>
      <p className="error-detail">{MESSAGES[reason] || MESSAGES.unknown}</p>
      {onRetry && (
        <button type="button" onClick={onRetry}>
          Try again
        </button>
      )}
    </div>
  );
}
