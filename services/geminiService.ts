import { GoogleGenAI, Type } from "@google/genai";
import { AppState, Reflection, PrayerTimes } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getFinancialAdvice = async (state: AppState) => {
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

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text;
  } catch (error) {
    console.error("Islamic Wisdom Error:", error);
    return "### Seek Contentment\nTrue wealth is not in the abundance of goods but in the richness of the soul. Focus on what is necessary and find Barakah in what you have.\n\n> 'Wealth is not having many possessions, but wealth is being content with oneself.' — Prophet Muhammad (PBUH)";
  }
};

export const getMonthlyAdvisory = async (monthKey: string, reflection: Reflection, stats: any) => {
  const prompt = `
    Role: Professional Kakeibo Coach & Ethical Finance Advisor.
    Context for ${monthKey}:
    - Income: ₹${stats.income}
    - Expenses: ₹${stats.expenses}
    - Savings: ₹${stats.savings}
    - User Reflection:
      1. Money had: ${reflection.q1}
      2. Spent: ${reflection.q2}
      3. Saved: ${reflection.q3}
      4. Improvement ideas: ${reflection.q4}

    Task: Provide a specific, actionable "Advisory for Next Month" (max 100 words). 
    Focus on how they can hit their goals using Kakeibo principles (mindfulness) and Sharia-compliant wealth building.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text;
  } catch (error) {
    return "Keep monitoring your 'Wants' category. Small daily savings in non-essentials can lead to significant Barakah in your monthly surplus.";
  }
};

export const fetchPrayerTimes = async (location: string = "Malappuram, Kerala"): Promise<PrayerTimes | null> => {
  const date = new Date().toISOString().split('T')[0];
  const prompt = `Get the Islamic prayer times (Fajr, Sunrise, Dhuhr, Asr, Maghrib, Isha) for ${location} on ${date}. 
  The response must be in strict JSON format. Use 24-hour HH:mm format for times.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
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

    const data = JSON.parse(response.text);
    return data as PrayerTimes;
  } catch (error) {
    console.error("Error fetching prayer times:", error);
    return null;
  }
};