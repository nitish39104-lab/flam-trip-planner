/**
 * The only function in the frontend that makes a network call for
 * generation. It always hits our own backend (server/generate.js), never
 * the Gemini API directly — the key lives server-side only.
 */
export async function requestTrip(description, { signal } = {}) {
  const res = await fetch('/api/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ description }),
    signal,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => null);
    const err = new Error(body?.error || `Request failed with status ${res.status}`);
    err.status = res.status;
    throw err;
  }

  const data = await res.json();
  // Backend always responds with { raw: "<model text>" } — parsing/validation
  // of that text happens on the frontend (validateResult.js) so failure
  // states are easy to unit test independently of the network layer.
  if (typeof data.raw !== 'string') {
    throw new Error('The server returned an invalid response.');
  }
  return data.raw;
}
