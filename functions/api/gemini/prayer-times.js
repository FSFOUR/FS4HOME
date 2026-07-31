import { GoogleGenAI, Type } from "@google/genai";

export async function onRequestPost(context) {
  const { request, env } = context;
  const apiKey = env.GEMINI_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ error: "Gemini API key not configured" }), { status: 500 });
  }

  const ai = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });

  try {
    const { location } = await request.json();
    const date = new Date().toISOString().split('T')[0];
    const prompt = `Get the Islamic prayer times (Fajr, Sunrise, Dhuhr, Asr, Maghrib, Isha) for ${location || "Malappuram, Kerala"} on ${date}. 
    The response must be in strict JSON format. Use 24-hour HH:mm format for times.`;
    
    const response = await ai.models.generateContent({
        model: 'gemini-1.5-flash',
        contents: prompt,
        config: {
        responseMimeType: "application/json",
        responseSchema: {
            type: Type.OBJECT,
            properties: {
            fajr: { type: Type.STRING },
            sunrise: { type: Type.STRING },
            dhuhr: { type: Type.STRING },
            asr: { type: Type.STRING },
            maghrib: { type: Type.STRING },
            isha: { type: Type.STRING },
            },
            required: ["fajr", "sunrise", "dhuhr", "asr", "maghrib", "isha"]
        }
        }
    });
    return new Response(response.text, { 
        status: 200,
        headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message || "Failed to fetch prayer times" }), { status: 500 });
  }
}
