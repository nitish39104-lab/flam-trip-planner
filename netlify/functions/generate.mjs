import { GoogleGenAI } from '@google/genai';

const MODEL = 'gemini-3-flash-preview';
const UPSTREAM_TIMEOUT_MS = 18000;
const MAX_DESCRIPTION_LENGTH = 2000;

function json(body, status = 200) {
  return Response.json(body, { status });
}

function buildPrompt(description) {
  return `You are a trip-planning assistant. Return only valid JSON, without prose or markdown fences.

Create a practical itinerary matching exactly this shape:
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
            "time": "string",
            "name": "string",
            "description": "string",
            "category": "food | sightseeing | activity | transport | rest"
          }
        ]
      }
    ]
  }
}

Use consecutive day numbers beginning at 1, include 3 to 6 chronologically ordered stops per day, use one of the five exact category values, and keep each description to one concise sentence.

Traveler request: ${description}`;
}

export default async (req) => {
  if (req.method !== 'POST') {
    return json({ error: 'Method not allowed.' }, 405);
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return json({ error: 'Request body must be valid JSON.' }, 400);
  }

  const description = typeof body?.description === 'string' ? body.description.trim() : '';
  if (!description) {
    return json({ error: 'A trip description is required.' }, 400);
  }
  if (description.length > MAX_DESCRIPTION_LENGTH) {
    return json({ error: `Trip descriptions must be ${MAX_DESCRIPTION_LENGTH} characters or fewer.` }, 400);
  }

  try {
    const ai = new GoogleGenAI({});
    const response = await ai.models.generateContent({
      model: MODEL,
      contents: buildPrompt(description),
      config: {
        responseMimeType: 'application/json',
        temperature: 0.7,
        abortSignal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
      },
    });

    const raw = response.text ?? '';
    if (!raw.trim()) {
      return json({ error: 'The trip planner returned an empty response.' }, 502);
    }

    return json({ raw });
  } catch (error) {
    console.error('Trip generation failed', error instanceof Error ? error.name : 'UnknownError');
    if (error?.name === 'AbortError' || error?.name === 'TimeoutError') {
      return json({ error: 'Trip generation timed out. Please try again.' }, 504);
    }
    return json({ error: 'The trip planner is temporarily unavailable.' }, 502);
  }
};

