import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({});
const MODEL = "gemini-3-flash-preview";

function json(body, status = 200) {
  return Response.json(body, { status });
}

function buildPrompt(description) {
  return `You are a trip-planning assistant. Return only valid JSON with this exact shape:
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

Create 3 to 6 stops per day, ordered by time. Keep each stop description to one short sentence. Do not include markdown fences or text outside the JSON object.

Traveler's description: ${description}`;
}

export default async (req) => {
  if (req.method !== "POST") {
    return json({ error: "Method not allowed." }, 405);
  }

  try {
    const body = await req.json();
    const description = body?.description;

    if (typeof description !== "string" || !description.trim()) {
      return json({ error: "A trip description is required." }, 400);
    }

    const response = await ai.models.generateContent({
      model: MODEL,
      contents: buildPrompt(description.trim()),
      config: {
        responseMimeType: "application/json",
        temperature: 0.7,
      },
    });

    const raw = response.text ?? "";
    if (!raw) {
      console.error("[generate] AI provider returned an empty response");
      return json({ error: "The AI provider returned an empty response." }, 502);
    }

    return json({ raw });
  } catch (error) {
    console.error("[generate] AI generation failed", error);
    return json({ error: "The itinerary could not be generated." }, 502);
  }
};

