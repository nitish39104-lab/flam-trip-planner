import { useRef, useState } from 'react';
import PromptInput from './components/PromptInput.jsx';
import ResultView from './components/ResultView.jsx';
import { requestTrip } from './lib/api.js';
import { parseModelOutput } from './lib/validateResult.js';

const REQUEST_TIMEOUT_MS = 20000;

export default function App() {
  const [status, setStatus] = useState('idle'); // idle | loading | success | error
  const [trip, setTrip] = useState(null);
  const [errorReason, setErrorReason] = useState(null);
  const [lastDescription, setLastDescription] = useState('');

  // Staleness guard: if a newer request starts, an older one resolving late
  // must never overwrite it. See the "Guarding against a stale response"
  // pattern in the assignment guide.
  const requestId = useRef(0);

  async function runGenerate(description) {
    const id = ++requestId.current;
    setStatus('loading');
    setErrorReason(null);
    setLastDescription(description);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      const raw = await requestTrip(description, { signal: controller.signal });
      clearTimeout(timeoutId);
      if (id !== requestId.current) return; // a newer request has since started

      const result = parseModelOutput(raw);
      if (!result.ok) {
        setStatus('error');
        setErrorReason(result.reason);
        return;
      }
      setTrip(result.trip);
      setStatus('success');
    } catch (err) {
      clearTimeout(timeoutId);
      if (id !== requestId.current) return;

      if (err.name === 'AbortError') {
        setStatus('error');
        setErrorReason('timeout');
      } else if (err.status && err.status >= 500) {
        setStatus('error');
        setErrorReason('request_failed');
      } else if (err instanceof TypeError) {
        // fetch throws TypeError on network failure (server down, no connection, etc.)
        setStatus('error');
        setErrorReason('network');
      } else {
        setStatus('error');
        setErrorReason('unknown');
      }
    }
  }

  function handleRetry() {
    if (lastDescription) runGenerate(lastDescription);
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>AI Trip Planner</h1>
        <p>Describe your trip in a sentence or two — get back a day-by-day itinerary you can edit.</p>
      </header>

      <PromptInput onSubmit={runGenerate} disabled={status === 'loading'} />

      <ResultView
        status={status}
        trip={trip}
        errorReason={errorReason}
        onRetry={handleRetry}
        onTripChange={setTrip}
      />

      <footer className="app-footer">
        <small>Built for the Flam frontend internship assignment.</small>
      </footer>
    </div>
  );
}
