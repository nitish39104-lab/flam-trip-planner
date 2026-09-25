import 'dotenv/config';
import express from 'express';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 8787;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-3.8-flash';
const UPSTREAM_TIMEOUT_MS = 15000;

if (!GEMINI_API_KEY) {
  console.warn(
    '[server] GEMINI_API_KEY is not set. Copy server/.env.example to server/.env and add your key.'
  );
}

// The exact structured shape we require back — matches src/types/result.js
// and src/lib/validateResult.js on the frontend. Kept in sync deliberately.
function buildPrompt(description) {
  return `You are a trip-planning assistant. Return ONLY valid JSON, no prose, no markdown fences.

Given the traveler's description below, produce a day-by-day itinerary matching EXACTLY this shape:

{
  "trip": {
    "title": string,
    "destination": string,
    "days": [
      {
        "day": number,
        "title": string,
        "stops": [
          {
            "time": string,
            "name": string,
            "description": string,
            "category": "food" | "sightseeing" | "activity" | "transport" | "rest"
          }
        ]
      }
    ]
  }
}

Rules:
- 3 to 6 stops per day, ordered by time of day.
- "category" must be exactly one of the listed values.
- Keep "description" to one short sentence.
- Do not include any text outside the JSON object.

Traveler's description: ${description}`;
}

app.post('/api/generate', async (req, res) => {
  const { description } = req.body || {};

  if (typeof description !== 'string' || !description.trim()) {
    return res.status(400).json({ error: 'A trip description is required.' });
  }
  if (!GEMINI_API_KEY) {
    return res.status(500).json({ error: 'Server is missing GEMINI_API_KEY.' });
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), UPSTREAM_TIMEOUT_MS);

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

    const upstream = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({
        contents: [{ parts: [{ text: buildPrompt(description) }] }],
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0.7,
        },
      }),
    });

    clearTimeout(timeout);

    if (!upstream.ok) {
      const detail = await upstream.text().catch(() => '');
      console.error('[server] Gemini API error', upstream.status, detail);
      return res.status(502).json({ error: 'The AI provider returned an error.' });
    }

    const data = await upstream.json();
    const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';

    // We deliberately do NOT parse/validate here — that happens on the
    // frontend (src/lib/validateResult.js) so every failure mode (malformed,
    // wrong shape, empty) is testable independently of this server.
    return res.json({ raw });
  } catch (err) {
    clearTimeout(timeout);
    if (err.name === 'AbortError') {
      return res.status(504).json({ error: 'Upstream request to Gemini timed out.' });
    }
    console.error('[server] Unexpected error', err);
    return res.status(500).json({ error: 'Unexpected server error.' });
  }
});

app.listen(PORT, () => {
  console.log(`[server] listening on http://localhost:${PORT}`);
});
