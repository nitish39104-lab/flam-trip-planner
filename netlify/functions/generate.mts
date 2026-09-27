const UPSTREAM_TIMEOUT_MS = 15_000

function json(body: unknown, status = 200) {
  return Response.json(body, { status })
}

function buildPrompt(description: string) {
  return `You are a trip-planning assistant. Return ONLY valid JSON, with no prose or markdown fences.

Create a day-by-day itinerary matching exactly this shape:
{
  "trip": {
    "title": string,
    "destination": string,
    "days": [{
      "day": number,
      "title": string,
      "stops": [{
        "time": string,
        "name": string,
        "description": string,
        "category": "food" | "sightseeing" | "activity" | "transport" | "rest"
      }]
    }]
  }
}

Include 3 to 6 stops per day in time order. Keep each stop description to one short sentence.

Traveler's description: ${description}`
}

export default async (req: Request) => {
  if (req.method !== 'POST') return json({ error: 'Method not allowed.' }, 405)

  let body: { description?: unknown }
  try {
    body = await req.json()
  } catch {
    return json({ error: 'The request body must be valid JSON.' }, 400)
  }

  const description = typeof body.description === 'string' ? body.description.trim() : ''
  if (!description) return json({ error: 'A trip description is required.' }, 400)

  const apiKey = Netlify.env.get('GEMINI_API_KEY')
  const model = Netlify.env.get('GEMINI_MODEL') || 'gemini-2.5-flash'
  if (!apiKey) return json({ error: 'The AI service is not configured.' }, 500)

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), UPSTREAM_TIMEOUT_MS)

  try {
    const url = new URL(
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,
    )
    url.searchParams.set('key', apiKey)

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
    })

    if (!upstream.ok) {
      console.error('Gemini request failed with status', upstream.status)
      return json({ error: 'The AI provider returned an error.' }, 502)
    }

    const data = await upstream.json()
    const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text
    if (typeof raw !== 'string' || !raw.trim()) {
      return json({ error: 'The AI provider returned an empty response.' }, 502)
    }

    return json({ raw })
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      return json({ error: 'The AI provider timed out.' }, 504)
    }
    console.error('Unexpected itinerary generation error')
    return json({ error: 'Unexpected server error.' }, 500)
  } finally {
    clearTimeout(timeout)
  }
}

export const config = {
  path: '/api/generate',
  method: 'POST',
}
