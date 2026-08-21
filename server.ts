import express from "express";
import path from "path";
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from "@google/genai";
import { createServer } from "vite";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Initialize Gemini safely
  const apiKey = process.env.GEMINI_API_KEY;
  console.log("GEMINI_API_KEY length:", apiKey ? apiKey.length : "undefined");
  const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

  // Helper for retries
  async function callGeminiWithRetry(fn: () => Promise<any>, retries = 3, delay = 2000): Promise<any> {
    for (let i = 0; i < retries; i++) {
      try {
        return await fn();
      } catch (error: any) {
        // Check if it's a 503 or "high demand"
        const isTransient = error?.status === 503 || error?.message?.includes("high demand");
        if (isTransient && i < retries - 1) {
          console.warn(`Gemini API transient error, retrying (${i + 1}/${retries})...`);
          await new Promise(resolve => setTimeout(resolve, delay * (i + 1)));
          continue;
        }
        throw error;
      }
    }
  }

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
      const response = await callGeminiWithRetry(() => ai.models.generateContent({
        model: 'gemini-3.5-flash-lite',
        contents: prompt,
      }));
      res.json({ text: response.text });
    } catch (error: any) {
      console.error("Islamic Wisdom Error:", error);
      res.status(500).json({ error: error.message || "Failed to get advice" });
    }
  });

  app.post("/api/gemini/prayer-times", async (req, res) => {
      if (!ai) return res.status(500).json({ error: "Gemini API key not configured" });
      try {
          const { location } = req.body;
          const date = new Date().toISOString().split('T')[0];
          const prompt = `Get the Islamic prayer times (Fajr, Sunrise, Dhuhr, Asr, Maghrib, Isha) for ${location || "Malappuram, Kerala"} on ${date}. 
          The response must be in strict JSON format. Use 24-hour HH:mm format for times.`;
          
          const response = await callGeminiWithRetry(() => ai.models.generateContent({
              model: 'gemini-3.5-flash-lite',
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
          }));
          res.json(JSON.parse(response.text));
      } catch (error: any) {
          console.error("Error fetching prayer times:", error);
          res.status(500).json({ error: error.message || "Failed to fetch prayer times" });
      }
  });

  app.post("/api/gemini/kakeibo-insight", async (req, res) => {
    if (!ai) return res.status(500).json({ error: "Gemini API key not configured" });
    try {
      const { state } = req.body;
      const recentTransactions = state.transactions.slice(-10);
      const prompt = `
        Analyze the following recent transactions: ${JSON.stringify(recentTransactions)}.
        Suggest exactly ONE actionable, specific, and practical way to reduce spending based on the Kakeibo methodology (mindful spending, focusing on needs vs wants).
        Keep the response under 50 words and maintain an encouraging, supportive tone.
      `;
      const response = await callGeminiWithRetry(() => ai.models.generateContent({
        model: 'gemini-3.5-flash-lite',
        contents: prompt,
      }));
      res.json({ text: response.text });
    } catch (error: any) {
      console.error("Kakeibo Insight Error:", error);
      res.status(500).json({ error: error.message || "Failed to get insight" });
    }
  });

  app.post("/api/gemini/pareto-insight", async (req, res) => {
    if (!ai) return res.status(500).json({ error: "Gemini API key not configured" });
    try {
      const { paretoData, userStrategy } = req.body;
      const prompt = `
        You are a top-tier personal CFO analyzing the user's finances using the 80/20 Pareto principle (focus on the few drivers causing 80% of impact).
        
        Financial Summary:
        - Total Income: ₹${paretoData.totalIncome}
        - Total Spending: ₹${paretoData.totalExpenses}
        - Net Savings: ₹${paretoData.netSavings} (Savings Rate: ${paretoData.savingsRate}%)
        - Top 80/20 Drivers: ${JSON.stringify(paretoData.categories.slice(0, 4).map((c: any) => ({ category: c.category, amount: c.amount, share: c.sharePercent + '%' })))}
        - Detected Recurring Leaks: ${JSON.stringify(paretoData.recurringLeaks.slice(0, 3).map((r: any) => ({ name: r.name, monthly: r.monthlyAmount })))}
        - User Goal/Strategy: ${userStrategy || 'SAVE_MORE'}
        
        Provide a concise, direct, high-impact 80/20 executive briefing in simple, clear language (no complex jargon).
        Answer these 4 key points in clean Markdown:
        1. **What Happened**: (1 sentence highlighting the concentration)
        2. **Why It Matters**: (1 sentence showing the long-term leverage)
        3. **What To Do**: (2 direct, high-impact actionable steps)
        4. **Potential Impact**: (Estimated monthly & annual cash flow unlocked, e.g. "Unlocking ~₹3,500/month (₹42,000/year)")
        
        Keep the total answer under 120 words. Be motivating, precise, and practical.
      `;
      const response = await callGeminiWithRetry(() => ai.models.generateContent({
        model: 'gemini-3.5-flash-lite',
        contents: prompt,
      }));
      res.json({ text: response.text });
    } catch (error: any) {
      console.error("Pareto Insight Error:", error);
      res.status(500).json({ error: error.message || "Failed to get Pareto insight" });
    }
  });

  // Vite middleware
  if (process.env.NODE_ENV !== "production") {
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
}

startServer();
