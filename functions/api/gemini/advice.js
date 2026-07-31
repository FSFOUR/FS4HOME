
import { GoogleGenAI } from "@google/genai";

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
    const { state } = await request.json();
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
        model: 'gemini-1.5-flash',
        contents: prompt,
    });
    return new Response(JSON.stringify({ text: response.text }), { 
        status: 200,
        headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message || "Failed to get advice" }), { status: 500 });
  }
}
