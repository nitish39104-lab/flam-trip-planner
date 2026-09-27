/**
 * The only function in the frontend that makes a network call for
 * generation. It always hits our own backend, never the AI provider directly.
 */
export async function requestTrip(description, { signal } = {}) {
  const res = await fetch('/api/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ description }),
    signal,
  });

  if (!res.ok) {
    const data = await res.json().catch(() => null);
    const err = new Error(data?.error || `Request failed with status ${res.status}`);
    err.status = res.status;
    throw err;
  }

  const data = await res.json();
  // Backend always responds with { raw: "<model text>" } — parsing/validation
  // of that text happens on the frontend (validateResult.js) so failure
  // states are easy to unit test independently of the network layer.
  return data.raw;
}
