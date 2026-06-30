import express from "express";
import path from "path";
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from "@google/genai";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini safely
const apiKey = process.env.GEMINI_API_KEY;
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

// Proxy API routes
app.post("/api/gemini/advice", async (req, res) => {
  if (!ai) return res.status(500).json({ error: "Gemini API key not configured" });
  try {
    const { state } = req.body;
    const prompt = `
      As an expert in Islamic Finance and Sharia-compliant wealth management, provide a structured "Daily Financial Wisdom" output.
      
      Context:
      - Transactions: ${JSON.stringify(state.transactions.slice(-5))}
      - Zakat Given: ₹${state.zakatGiven}
      - Savings Goal: ₹${state.monthlySavingsTarget}
      
      Output Format (Markdown):
      ### [Catchy Headline]
      [Provide 1 high-impact daily financial tip or trick (max 60 words) about reaching financial freedom through Halal means, avoiding debt, or Kakeibo discipline.]
      
      > [Include a powerful quote about wealth, gratitude, or financial freedom from an Islamic perspective or a wise ethical leader.]
      
      Ensure the advice is practical, motivating, and rooted in true ethical experience.
    `;
    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
    });
    res.json({ text: response.text });
  } catch (error) {
    console.error("Islamic Wisdom Error:", error);
    res.status(500).json({ error: "Failed to get advice" });
  }
});

app.post("/api/gemini/prayer-times", async (req, res) => {
    if (!ai) return res.status(500).json({ error: "Gemini API key not configured" });
    try {
        const { location } = req.body;
        const date = new Date().toISOString().split('T')[0];
        const prompt = `Get the Islamic prayer times (Fajr, Sunrise, Dhuhr, Asr, Maghrib, Isha) for ${location || "Malappuram, Kerala"} on ${date}. 
        The response must be in strict JSON format. Use 24-hour HH:mm format for times.`;
        
        const response = await ai.models.generateContent({
            model: 'gemini-3.5-flash',
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
        res.json(JSON.parse(response.text));
    } catch (error) {
        console.error("Error fetching prayer times:", error);
        res.status(500).json({ error: "Failed to fetch prayer times" });
    }
});

// Vite middleware
if (process.env.NODE_ENV !== "production") {
  const { createServer } = await import("vite");
  const vite = await createServer({
    server: { middlewareMode: true },
    appType: "spa",
  });
  app.use(vite.middlewares);
} else {
  const distPath = path.join(__dirname, 'dist');
  app.use(express.static(distPath));
  app.get('*', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});
