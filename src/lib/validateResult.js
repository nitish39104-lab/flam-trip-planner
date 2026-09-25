/**
 * Defensive parsing + structural validation for the model's response.
 *
 * Returns { ok: true, trip } on success, or { ok: false, reason } on any
 * kind of bad output. Never throws. Never returns something half-shaped —
 * callers should treat ok:false as "route to the error state", full stop.
 */

let nextId = 1;
function freshId() {
  return `stop-${nextId++}`;
}

const VALID_CATEGORIES = new Set(['food', 'sightseeing', 'activity', 'transport', 'rest']);

export function parseModelOutput(raw) {
  if (typeof raw !== 'string' || raw.trim().length === 0) {
    return { ok: false, reason: 'empty' };
  }

  // Models sometimes wrap JSON in ```json ... ``` fences despite instructions.
  // Strip fences defensively before parsing, but don't try to "fix" anything
  // beyond that — genuinely malformed JSON should fail, not be guessed at.
  const cleaned = raw
    .trim()
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/, '')
    .replace(/```\s*$/, '');

  let data;
  try {
    data = JSON.parse(cleaned);
  } catch {
    return { ok: false, reason: 'malformed_json' };
  }

  return validateShape(data);
}

function validateShape(data) {
  if (!data || typeof data !== 'object') return { ok: false, reason: 'wrong_shape' };

  const trip = data.trip;
  if (!trip || typeof trip !== 'object') return { ok: false, reason: 'wrong_shape' };
  if (typeof trip.title !== 'string' || typeof trip.destination !== 'string') {
    return { ok: false, reason: 'wrong_shape' };
  }
  if (!Array.isArray(trip.days) || trip.days.length === 0) {
    return { ok: false, reason: 'wrong_shape' };
  }

  const days = [];
  for (const rawDay of trip.days) {
    if (!rawDay || typeof rawDay !== 'object') return { ok: false, reason: 'wrong_shape' };
    if (typeof rawDay.day !== 'number' || typeof rawDay.title !== 'string') {
      return { ok: false, reason: 'wrong_shape' };
    }
    if (!Array.isArray(rawDay.stops)) return { ok: false, reason: 'wrong_shape' };

    const stops = [];
    for (const rawStop of rawDay.stops) {
      if (!rawStop || typeof rawStop !== 'object') return { ok: false, reason: 'wrong_shape' };
      if (typeof rawStop.name !== 'string' || rawStop.name.trim() === '') {
        return { ok: false, reason: 'wrong_shape' };
      }
      stops.push({
        id: freshId(),
        time: typeof rawStop.time === 'string' ? rawStop.time : '',
        name: rawStop.name,
        description: typeof rawStop.description === 'string' ? rawStop.description : '',
        category: VALID_CATEGORIES.has(rawStop.category) ? rawStop.category : 'activity',
      });
    }

    if (stops.length === 0) return { ok: false, reason: 'wrong_shape' };
    days.push({ day: rawDay.day, title: rawDay.title, stops });
  }

  return {
    ok: true,
    trip: { title: trip.title, destination: trip.destination, days },
  };
}
