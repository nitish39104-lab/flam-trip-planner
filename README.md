# AI Trip Planner

A React app for the Flam frontend internship assignment. You describe a trip
in a sentence or two; Gemini returns a structured day-by-day itinerary; the
app renders it as an interactive planner — tabs per day, expandable stop
details, reorder (↑/↓), and remove — no chat window involved.

## Data shape

Designed before writing the prompt (see `src/types/result.js`):

```json
{
  "trip": {
    "title": "string",
    "destination": "string",
    "days": [
      {
        "day": 1,
        "title": "string",
        "stops": [
          {
            "time": "9:00 AM",
            "name": "string",
            "description": "string",
            "category": "food | sightseeing | activity | transport | rest"
          }
        ]
      }
    ]
  }
}
```

## Setup

Requires Node 18+ (built-in `fetch` is used on both frontend and backend).

**1. Backend**
```bash
cd server
npm install
cp .env.example .env
# edit .env and add GEMINI_API_KEY (free tier: https://aistudio.google.com/app/apikey)
npm start
# -> listening on http://localhost:8787
```

**2. Frontend** (new terminal, from project root)
```bash
npm install
npm run dev
# -> http://localhost:5173
```

The Vite dev server proxies `/api/*` to the backend, so the browser only
ever calls your own server — never Gemini directly, and the API key never
ships to the client.

## Usage

1. Describe a trip in the text box (destination, length, interests, pace,
   constraints — whatever you'd tell a friend).
2. Click **Plan my trip**.
3. Browse days via the tabs, click a stop to expand its description, use
   ↑ / ↓ to reorder stops within a day, and ✕ to remove one.

## Error handling

Every failure mode routes to a visible state, never a crash or a blank
screen:

| Case | Behavior |
|---|---|
| Malformed JSON from the model | Parsed with `try/catch`, error state + retry |
| Valid JSON, wrong shape | Structurally validated field-by-field, error state + retry |
| Empty response | Treated as failure, not an empty-but-valid result |
| Slow response | Loading state shown; 20s client-side / 15s server-side timeout |
| Failed request (4xx/5xx/network) | Error state distinguishing network vs. server failure |
| Stale response | `requestId` ref guard — an older, slower request can never overwrite a newer result |

## AI usage note

> **Fill this in honestly before you submit.** This scaffold (component
> structure, validation logic, prompt, backend proxy, and this README) was
> generated with Claude. Replace this paragraph with your own account of
> what you used AI for, what you wrote or changed yourself, and — since
> you'll be asked to explain and extend this code live in the interview —
> make sure that's actually true by the time you submit. Read through
> `App.jsx`, `validateResult.js`, and `generate.js` first; those three files
> are where nearly all of the assignment's grading weight lives.

## Known limitations

- Reordering is buttons (↑/↓), not drag-and-drop.
- No persistence — refreshing the page loses the current itinerary (save/reload is a stretch goal, not implemented).
- No streaming — the full response is awaited before rendering.
- Category icons are a fixed small set; anything the model mislabels falls back to a generic pin.
- Not deployed by default — see "Deployment" below if you want a live link.

## Time spent

> Fill in honestly, per the assignment's submission guidelines.

## Deployment (optional but preferred)

- Backend: any Node host (Render, Railway, Fly.io) — set `GEMINI_API_KEY` as an environment variable there, never commit `.env`.
- Frontend: `npm run build` produces `dist/`, deployable to Vercel/Netlify — point its `/api` requests at your deployed backend URL instead of the Vite dev proxy (e.g. via a `VITE_API_BASE` env var).

## Stretch goals not implemented

Left out to keep the core solid within the time budget: multiple block
types beyond itinerary stops, streaming, a refinement/follow-up loop,
save/reload sessions, drag-and-drop reordering, dark-mode toggle (dark
theme is the only theme here), keyboard navigation.
