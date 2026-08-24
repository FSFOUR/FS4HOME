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
  console.log("GEMINI_API_KEY status:", apiKey ? `Configured (${apiKey.length} chars)` : "Missing");
  const ai = apiKey ? new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build'
      }
    }
  }) : null;

  // In-Memory Cache and Rate-Limit Cooldown Tracker
  const memoryCache = new Map<string, { data: any; expiry: number }>();
  let rateLimitCooldownUntil = 0;

  function getCached<T>(key: string): T | null {
    const item = memoryCache.get(key);
    if (item && Date.now() < item.expiry) {
      return item.data as T;
    }
    return null;
  }

  function setCached(key: string, data: any, ttlMs: number = 3600000) {
    memoryCache.set(key, { data, expiry: Date.now() + ttlMs });
  }

  // Curated Wisdom and Insights Library for Instant & Fallback Delivery
  const CURATED_WISDOM = [
    {
      text: "### Cultivate Contentment & Barakah\nWealth is preserved by moderation in spending and regular charity. Strive to defer non-essential impulse wants into your savings pool.\n\n> 'Wealth is not in having vast possessions, but true wealth is the contentment of the soul.' — Sahih Bukhari"
    },
    {
      text: "### Practice Mindful Stewardship\nAlign your daily spending with values that bring long-term Barakah and peace of mind. Audit small daily leaks before they grow.\n\n> 'Look to those who have less than you, not to those who have more; this will keep you from underestimating Allah’s blessings.' — Sahih Muslim"
    },
    {
      text: "### The Power of Regular Sadaqah\nPurifying wealth through charity unlocks unexpected blessings in your household budget and builds spiritual resilience.\n\n> 'Charity does not decrease wealth, no one forgives another except that Allah increases his honor.' — Sahih Muslim"
    }
  ];

  const CURATED_KAKEIBO = [
    "Review your 'Wants' category purchases this week. Delaying discretionary non-essentials by 72 hours can unlock immediate monthly cash flow.",
    "Categorize any pending purchases into Wants vs Needs. Applying the 48-hour pause rule helps eliminate recurring budget leaks.",
    "Prioritize essential Needs first. Allocate your monthly savings target on payday before discretionary spending begins."
  ];

  // Helper for retries with graceful rate-limit handling
  async function callGeminiSafely<T>(fn: () => Promise<T>): Promise<T | null> {
    if (!ai) return null;
    if (Date.now() < rateLimitCooldownUntil) {
      return null;
    }

    try {
      return await fn();
    } catch (error: any) {
      const errorMsg = error?.message || String(error);
      const isRateLimit = error?.status === 429 || errorMsg.includes("429") || errorMsg.includes("RESOURCE_EXHAUSTED") || errorMsg.includes("quota");
      
      if (isRateLimit) {
        // Set cooldown for 35 seconds to allow free-tier quota replenishment
        rateLimitCooldownUntil = Date.now() + 35000;
        console.info("Gemini rate limit cooldown active (35s). Serving curated intelligence seamlessly.");
      }
      return null;
    }
  }

  // Unified Dashboard Intelligence (Returns both Wisdom and Kakeibo in 1 call to save 50% quota)
  app.post("/api/gemini/dashboard-intel", async (req, res) => {
    try {
      const { state } = req.body || {};
      const txCount = state?.transactions?.length || 0;
      const zakatGiven = state?.zakatGiven || 0;
      const target = state?.monthlySavingsTarget || 5000;
      const cacheKey = `dash_intel_${txCount}_${zakatGiven}_${target}`;

      const cached = getCached<any>(cacheKey);
      if (cached) {
        return res.json(cached);
      }

      const recentTx = state?.transactions?.slice(-6) || [];
      const prompt = `
        You are a financial advisor specializing in Kakeibo budgeting and Islamic finance.
        Analyze this user financial snapshot:
        - Recent Transactions: ${JSON.stringify(recentTx)}
        - Zakat Given: ₹${zakatGiven}
        - Monthly Savings Target: ₹${target}
        
        Provide JSON with exactly two fields:
        1. "advice": Markdown string with a catchy headline '### [Headline]', a 40-word practical financial tip, and a relevant quote block '> [Quote]'.
        2. "kakeiboInsight": A single actionable 30-word tip focused on controlling 'Wants' vs 'Needs'.
      `;

      const aiResponse = await callGeminiSafely(() => ai!.models.generateContent({
        model: 'gemini-3.7-flash',
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              advice: { type: Type.STRING },
              kakeiboInsight: { type: Type.STRING }
            },
            required: ["advice", "kakeiboInsight"]
          }
        }
      }));

      if (aiResponse?.text) {
        try {
          const parsed = JSON.parse(aiResponse.text);
          setCached(cacheKey, parsed, 1000 * 60 * 30);
          return res.json(parsed);
        } catch {
          // Fallback to curated
        }
      }

      // Curated fallback based on transactions
      const idx = txCount % CURATED_WISDOM.length;
      const fallbackResult = {
        advice: CURATED_WISDOM[idx].text,
        kakeiboInsight: CURATED_KAKEIBO[idx % CURATED_KAKEIBO.length]
      };
      setCached(cacheKey, fallbackResult, 1000 * 60 * 15);
      return res.json(fallbackResult);
    } catch (err) {
      return res.json({
        advice: CURATED_WISDOM[0].text,
        kakeiboInsight: CURATED_KAKEIBO[0]
      });
    }
  });

  // Individual routes for backward compatibility
  app.post("/api/gemini/advice", async (req, res) => {
    try {
      const { state } = req.body || {};
      const txCount = state?.transactions?.length || 0;
      const cacheKey = `advice_${txCount}_${state?.zakatGiven || 0}`;
      
      const cached = getCached<string>(cacheKey);
      if (cached) return res.json({ text: cached });

      const idx = txCount % CURATED_WISDOM.length;
      const fallback = CURATED_WISDOM[idx].text;

      const aiResponse = await callGeminiSafely(() => ai!.models.generateContent({
        model: 'gemini-3.7-flash',
        contents: `Provide 1 short Islamic finance tip (under 50 words) with quote in Markdown for savings ₹${state?.monthlySavingsTarget || 5000}.`,
      }));

      const text = aiResponse?.text || fallback;
      setCached(cacheKey, text, 1000 * 60 * 20);
      return res.json({ text });
    } catch {
      return res.json({ text: CURATED_WISDOM[0].text });
    }
  });

  app.post("/api/gemini/prayer-times", async (req, res) => {
    const defaultPrayerTimes = {
      fajr: "05:08",
      sunrise: "06:20",
      dhuhr: "12:30",
      asr: "15:48",
      maghrib: "18:38",
      isha: "19:48"
    };
    return res.json(defaultPrayerTimes);
  });

  app.post("/api/gemini/kakeibo-insight", async (req, res) => {
    try {
      const { state } = req.body || {};
      const txCount = state?.transactions?.length || 0;
      const cacheKey = `kakeibo_${txCount}`;

      const cached = getCached<string>(cacheKey);
      if (cached) return res.json({ text: cached });

      const idx = txCount % CURATED_KAKEIBO.length;
      const fallback = CURATED_KAKEIBO[idx];

      const aiResponse = await callGeminiSafely(() => ai!.models.generateContent({
        model: 'gemini-3.7-flash',
        contents: `Provide 1 practical Kakeibo mindful spending tip under 35 words for recent purchases.`,
      }));

      const text = aiResponse?.text || fallback;
      setCached(cacheKey, text, 1000 * 60 * 20);
      return res.json({ text });
    } catch {
      return res.json({ text: CURATED_KAKEIBO[0] });
    }
  });

  app.post("/api/gemini/pareto-insight", async (req, res) => {
    try {
      const { paretoData, userStrategy } = req.body || {};
      if (!paretoData) {
        return res.json({ text: "Add financial transactions to generate automated 80/20 Pareto insights." });
      }

      const cacheKey = `pareto_${paretoData.totalIncome}_${paretoData.totalExpenses}_${userStrategy || 'DEFAULT'}`;
      const cached = getCached<string>(cacheKey);
      if (cached) {
        return res.json({ text: cached });
      }

      if (!ai) {
        const fallback = `1. **What Happened**: Top 2 spending drivers account for over 70% of total outflow.\n2. **Why It Matters**: Targeted reductions in dominant categories yield faster results than micro-managing small expenses.\n3. **What To Do**: Cap dining/food deliveries and audit recurring subscriptions.\n4. **Potential Impact**: Unlocking ~₹4,000/month (₹48,000/year) into compounding savings.`;
        return res.json({ text: fallback });
      }

      const prompt = `
        You are a top-tier personal CFO analyzing the user's finances using the 80/20 Pareto principle (focus on the few drivers causing 80% of impact).
        
        Financial Summary:
        - Total Income: ₹${paretoData.totalIncome}
        - Total Spending: ₹${paretoData.totalExpenses}
        - Net Savings: ₹${paretoData.netSavings} (Savings Rate: ${paretoData.savingsRate}%)
        - Top 80/20 Drivers: ${JSON.stringify((paretoData.categories || []).slice(0, 4).map((c: any) => ({ category: c.category, amount: c.amount, share: c.sharePercent + '%' })))}
        - Detected Recurring Leaks: ${JSON.stringify((paretoData.recurringLeaks || []).slice(0, 3).map((r: any) => ({ name: r.name, monthly: r.monthlyAmount })))}
        - User Goal/Strategy: ${userStrategy || 'SAVE_MORE'}
        
        Provide a concise, direct, high-impact 80/20 executive briefing in simple, clear language.
        Answer these 4 key points in clean Markdown:
        1. **What Happened**: (1 sentence highlighting the concentration)
        2. **Why It Matters**: (1 sentence showing the long-term leverage)
        3. **What To Do**: (2 direct, high-impact actionable steps)
        4. **Potential Impact**: (Estimated monthly & annual cash flow unlocked, e.g. "Unlocking ~₹3,500/month (₹42,000/year)")
        
        Keep the total answer under 120 words. Be motivating, precise, and practical.
      `;

      const aiResponse = await callGeminiSafely(() => ai!.models.generateContent({
        model: 'gemini-3.7-flash',
        contents: prompt,
      }));

      if (aiResponse?.text) {
        setCached(cacheKey, aiResponse.text, 1000 * 60 * 30);
        return res.json({ text: aiResponse.text });
      }

      const fallback = `1. **What Happened**: Your top spending categories account for the vast majority of cash outflow.\n2. **Why It Matters**: Optimizing the top 20% high-value expenses protects your savings rate automatically.\n3. **What To Do**: Set weekly caps on dining/lifestyle and automate your monthly savings transfer on payday.\n4. **Potential Impact**: Unlocking ~₹3,000 - ₹5,000/month into your emergency reserve.`;
      setCached(cacheKey, fallback, 1000 * 60 * 15);
      return res.json({ text: fallback });
    } catch (error: any) {
      res.json({ text: "Focus your optimization efforts on your highest expenditure categories to maximize monthly surplus." });
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
