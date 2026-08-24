import { AppState, Reflection, PrayerTimes } from "../types";

// In-memory and session client cache
const clientCache: Record<string, { data: any; expiry: number }> = {};

function getLocalCached<T>(key: string): T | null {
  const item = clientCache[key];
  if (item && Date.now() < item.expiry) {
    return item.data as T;
  }
  try {
    const session = sessionStorage.getItem(`cache_${key}`);
    if (session) {
      const parsed = JSON.parse(session);
      if (Date.now() < parsed.expiry) {
        clientCache[key] = parsed;
        return parsed.data as T;
      }
    }
  } catch {}
  return null;
}

function setLocalCached(key: string, data: any, ttlMs: number = 600000) {
  const payload = { data, expiry: Date.now() + ttlMs };
  clientCache[key] = payload;
  try {
    sessionStorage.setItem(`cache_${key}`, JSON.stringify(payload));
  } catch {}
}

export interface DashboardIntel {
  advice: string;
  kakeiboInsight: string;
}

export const getDashboardIntel = async (state: AppState): Promise<DashboardIntel> => {
  const cacheKey = `intel_${state.transactions.length}_${state.zakatGiven || 0}_${state.monthlySavingsTarget || 5000}`;
  const cached = getLocalCached<DashboardIntel>(cacheKey);
  if (cached) return cached;

  const fallback: DashboardIntel = {
    advice: "### Cultivate Contentment & Barakah\nWealth is preserved by moderation in spending and regular charity. Strive to defer non-essential impulse wants into your savings pool.\n\n> 'Wealth is not in having vast possessions, but true wealth is the contentment of the soul.' — Sahih Bukhari",
    kakeiboInsight: "Review your 'Wants' category purchases this week. Delaying discretionary non-essentials by 72 hours can unlock immediate monthly cash flow."
  };

  try {
    const response = await fetch("/api/gemini/dashboard-intel", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ state })
    });

    if (!response.ok) {
      return fallback;
    }

    const data = await response.json();
    const result: DashboardIntel = {
      advice: data.advice || fallback.advice,
      kakeiboInsight: data.kakeiboInsight || fallback.kakeiboInsight
    };

    setLocalCached(cacheKey, result, 1000 * 60 * 30);
    return result;
  } catch {
    return fallback;
  }
};

export const getFinancialAdvice = async (state: AppState): Promise<string> => {
  const intel = await getDashboardIntel(state);
  return intel.advice;
};

export const getKakeiboInsight = async (state: AppState): Promise<string> => {
  const intel = await getDashboardIntel(state);
  return intel.kakeiboInsight;
};

export const getMonthlyAdvisory = async (monthKey: string, reflection: Reflection, stats: any) => {
  return "Keep monitoring your 'Wants' category. Small daily savings in non-essentials lead to significant Barakah in your monthly surplus.";
};

export const fetchPrayerTimes = async (location: string = "Malappuram, Kerala"): Promise<PrayerTimes> => {
  const defaultTimes: PrayerTimes = {
    fajr: "05:08",
    sunrise: "06:20",
    dhuhr: "12:30",
    asr: "15:48",
    maghrib: "18:38",
    isha: "19:48"
  };

  const todayKey = new Date().toISOString().split('T')[0];
  const cacheKey = `client_prayer_${location}_${todayKey}`;
  const cached = getLocalCached<PrayerTimes>(cacheKey);
  if (cached) return cached;

  try {
    const response = await fetch("/api/gemini/prayer-times", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ location })
    });

    if (!response.ok) {
      return defaultTimes;
    }

    const data = await response.json();
    if (data && data.fajr) {
      setLocalCached(cacheKey, data, 1000 * 60 * 60 * 6);
      return data;
    }
    return defaultTimes;
  } catch (error) {
    console.warn("Using default prayer times:", error);
    return defaultTimes;
  }
};

export const fetchParetoAIInsight = async (paretoData: any, userStrategy?: string): Promise<string> => {
  if (!paretoData || paretoData.totalExpenses === 0) {
    return "";
  }

  const cacheKey = `client_pareto_${paretoData.totalExpenses}_${paretoData.totalIncome}_${userStrategy || 'DEF'}`;
  const cached = getLocalCached<string>(cacheKey);
  if (cached) return cached;

  try {
    const response = await fetch("/api/gemini/pareto-insight", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paretoData, userStrategy })
    });

    if (!response.ok) {
      throw new Error(`Server returned status ${response.status}`);
    }

    const data = await response.json();
    const result = data.text || "1. **What Happened**: Top 2 spending drivers account for over 70% of total outflow.\n2. **Why It Matters**: Targeted reductions in dominant categories yield faster results than micro-managing small expenses.\n3. **What To Do**: Cap dining/food deliveries and audit recurring subscriptions.\n4. **Potential Impact**: Unlocking ~₹4,000/month into compounding savings.";
    setLocalCached(cacheKey, result, 1000 * 60 * 30);
    return result;
  } catch (error) {
    console.warn("Using fallback Pareto insight:", error);
    return "1. **What Happened**: Top 2 spending drivers account for over 70% of total outflow.\n2. **Why It Matters**: Targeted reductions in dominant categories yield faster results than micro-managing small expenses.\n3. **What To Do**: Cap dining/food deliveries and audit recurring subscriptions.\n4. **Potential Impact**: Unlocking ~₹4,000/month into compounding savings.";
  }
};


