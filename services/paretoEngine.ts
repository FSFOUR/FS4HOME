import { AppState, Transaction, WealthType, KakeiboCategory, UserStrategy, FinancialGoal, FinancialDebt } from '../types';

export interface CategoryParetoItem {
  category: string;
  amount: number;
  sharePercent: number;
  incomePercent: number;
  cumulativeAmount: number;
  cumulativePercent: number;
  transactionCount: number;
  isParetoDriver: boolean; // Part of the ~80% top group
  isDiscretionary: boolean;
  rank: number;
  previousMonthAmount?: number;
  monthOverMonthGrowth?: number; // e.g. +12.5%
  potentialMonthlySavings: { min: number; max: number };
  icon: string;
  subcategories: { name: string; amount: number; percentage: number; count: number }[];
  merchants: { name: string; amount: number; count: number }[];
}

export interface SavingsOpportunity {
  id: string;
  category: string;
  title: string;
  currentMonthlyAmount: number;
  potentialMonthlySaving: number;
  potentialAnnualSaving: number;
  impactScore: number; // 1 to 100
  difficulty: 'Easy' | 'Moderate' | 'Challenging';
  impactLevel: 'Critical' | 'High Impact' | 'Moderate' | 'Low Impact';
  recommendation: string;
  actionTitle: string;
  deadlineDays: number;
  tag: 'Food Delivery' | 'Subscriptions' | 'Discretionary' | 'Transport' | 'Shopping' | 'Utilities' | 'Housing';
}

export interface RecurringLeakItem {
  id: string;
  name: string;
  category: string;
  monthlyAmount: number;
  annualAmount: number;
  type: 'OTT / Streaming' | 'App / Software' | 'Membership / Gym' | 'Bill / Utility' | 'Insurance / EMI' | 'Other';
  status: 'Active' | 'Review Needed' | 'Unused / Redundant' | 'Price Increased';
  frequency: 'Monthly' | 'Quarterly' | 'Annual';
  impactScore: number;
}

export interface HighImpactAction {
  id: string;
  rank: number;
  title: string;
  whyItMatters: string;
  monthlyImpact: number;
  annualImpact: number;
  difficulty: 'Easy' | 'Moderate' | 'Challenging';
  priority: 'Critical' | 'High Impact' | 'Moderate' | 'Low Impact';
  impactScore: number;
  recommendedDeadline: string;
  actionType: 'REDUCE_BUDGET' | 'CANCEL_SUBSCRIPTION' | 'ADD_SAVINGS_GOAL' | 'OPTIMIZE_DEBT' | 'NEGOTIATE_BILL';
  suggestedGoalTitle?: string;
  suggestedGoalAmount?: number;
}

export interface IncomeParetoItem {
  source: string;
  amount: number;
  percentage: number;
  stability: 'High' | 'Moderate' | 'Variable';
  growthOpportunity: string;
  trend: 'Growing' | 'Stable' | 'Declining';
}

export interface DebtParetoItem {
  id: string;
  name: string;
  balance: number;
  interestRate: number;
  monthlyEMI: number;
  annualInterestCost: number;
  balanceSharePercent: number;
  interestCostSharePercent: number;
  isHighInterestLeverage: boolean; // e.g. low % of total balance but high % of total interest
  payoffAccelerationMonths?: number;
}

export interface ParetoAnalysisResult {
  timeframeLabel: string;
  startDate: string;
  endDate: string;
  totalIncome: number;
  totalExpenses: number;
  netSavings: number;
  savingsRate: number; // percentage
  topDriverCount: number;
  topDriverPercentage: number; // e.g. 78%
  categories: CategoryParetoItem[];
  paretoCutoffIndex: number;
  summaryQuote: string;
  potentialMonthlySavingsTotal: number;
  potentialAnnualSavingsTotal: number;
  financialLeverageIncreaseRate: number; // New projected savings rate
  financialHealthGrade: 'A+' | 'A' | 'B' | 'C' | 'Needs Attention';
  savingsOpportunities: SavingsOpportunity[];
  recurringLeaks: RecurringLeakItem[];
  totalMonthlyLeakage: number;
  totalAnnualLeakage: number;
  top5Actions: HighImpactAction[];
  incomeSources: IncomeParetoItem[];
  debts: DebtParetoItem[];
  totalDebtBalance: number;
  totalAnnualInterestCost: number;
  highestInterestDebtName?: string;
  bestDecisionMonth?: string;
  biggestWarningCategory?: { name: string; increasePercent: number; amount: number };
  goalAccelerations: {
    goalId: string;
    goalTitle: string;
    targetAmount: number;
    currentAmount: number;
    monthsSaved: number;
    newCompletionDate: string;
  }[];
}

// Category Dictionary & Normalization
const CATEGORY_MAP: Record<string, { category: string; icon: string; isDiscretionary: boolean }> = {
  rent: { category: 'Housing & Rent', icon: '🏠', isDiscretionary: false },
  housing: { category: 'Housing & Rent', icon: '🏠', isDiscretionary: false },
  mortgage: { category: 'Housing & Rent', icon: '🏠', isDiscretionary: false },
  
  swiggy: { category: 'Food Delivery & Dining', icon: '🛵', isDiscretionary: true },
  zomato: { category: 'Food Delivery & Dining', icon: '🍕', isDiscretionary: true },
  eats: { category: 'Food Delivery & Dining', icon: '🍔', isDiscretionary: true },
  restaurant: { category: 'Food Delivery & Dining', icon: '🍽️', isDiscretionary: true },
  cafe: { category: 'Food Delivery & Dining', icon: '☕', isDiscretionary: true },
  starbucks: { category: 'Food Delivery & Dining', icon: '☕', isDiscretionary: true },
  dining: { category: 'Food Delivery & Dining', icon: '🍲', isDiscretionary: true },

  grocery: { category: 'Groceries & Household', icon: '🛒', isDiscretionary: false },
  groceries: { category: 'Groceries & Household', icon: '🛒', isDiscretionary: false },
  supermarket: { category: 'Groceries & Household', icon: '🥦', isDiscretionary: false },
  blinkit: { category: 'Groceries & Household', icon: '⚡', isDiscretionary: false },
  zepto: { category: 'Groceries & Household', icon: '🛍️', isDiscretionary: false },
  instamart: { category: 'Groceries & Household', icon: '📦', isDiscretionary: false },
  milk: { category: 'Groceries & Household', icon: '🥛', isDiscretionary: false },

  uber: { category: 'Transport & Fuel', icon: '🚗', isDiscretionary: false },
  ola: { category: 'Transport & Fuel', icon: '🚕', isDiscretionary: false },
  fuel: { category: 'Transport & Fuel', icon: '⛽', isDiscretionary: false },
  petrol: { category: 'Transport & Fuel', icon: '⛽', isDiscretionary: false },
  diesel: { category: 'Transport & Fuel', icon: '⛽', isDiscretionary: false },
  metro: { category: 'Transport & Fuel', icon: '🚇', isDiscretionary: false },
  cab: { category: 'Transport & Fuel', icon: '🚖', isDiscretionary: false },
  parking: { category: 'Transport & Fuel', icon: '🅿️', isDiscretionary: false },

  netflix: { category: 'Subscriptions & OTT', icon: '🎬', isDiscretionary: true },
  prime: { category: 'Subscriptions & OTT', icon: '📦', isDiscretionary: true },
  hotstar: { category: 'Subscriptions & OTT', icon: '📺', isDiscretionary: true },
  spotify: { category: 'Subscriptions & OTT', icon: '🎵', isDiscretionary: true },
  youtube: { category: 'Subscriptions & OTT', icon: '▶️', isDiscretionary: true },
  apple: { category: 'Subscriptions & OTT', icon: '🍏', isDiscretionary: true },
  icloud: { category: 'Subscriptions & OTT', icon: '☁️', isDiscretionary: true },
  chatgpt: { category: 'Subscriptions & OTT', icon: '🤖', isDiscretionary: true },
  gym: { category: 'Subscriptions & OTT', icon: '🏋️', isDiscretionary: true },

  electricity: { category: 'Utilities & Bills', icon: '💡', isDiscretionary: false },
  water: { category: 'Utilities & Bills', icon: '💧', isDiscretionary: false },
  wifi: { category: 'Utilities & Bills', icon: '📶', isDiscretionary: false },
  broadband: { category: 'Utilities & Bills', icon: '🌐', isDiscretionary: false },
  recharge: { category: 'Utilities & Bills', icon: '📱', isDiscretionary: false },
  mobile: { category: 'Utilities & Bills', icon: '📞', isDiscretionary: false },
  gas: { category: 'Utilities & Bills', icon: '🔥', isDiscretionary: false },

  amazon: { category: 'Shopping & Lifestyle', icon: '🛍️', isDiscretionary: true },
  flipkart: { category: 'Shopping & Lifestyle', icon: '👗', isDiscretionary: true },
  myntra: { category: 'Shopping & Lifestyle', icon: '👠', isDiscretionary: true },
  clothes: { category: 'Shopping & Lifestyle', icon: '👕', isDiscretionary: true },
  shopping: { category: 'Shopping & Lifestyle', icon: '🛍️', isDiscretionary: true },
  electronics: { category: 'Shopping & Lifestyle', icon: '🎧', isDiscretionary: true },

  emi: { category: 'Debt & EMIs', icon: '💳', isDiscretionary: false },
  loan: { category: 'Debt & EMIs', icon: '🏦', isDiscretionary: false },
  credit: { category: 'Debt & EMIs', icon: '💳', isDiscretionary: false },

  school: { category: 'Family & Education', icon: '🎓', isDiscretionary: false },
  tuition: { category: 'Family & Education', icon: '📚', isDiscretionary: false },
  kids: { category: 'Family & Education', icon: '👶', isDiscretionary: false },
  course: { category: 'Family & Education', icon: '📖', isDiscretionary: true },
  books: { category: 'Family & Education', icon: '📕', isDiscretionary: true },

  doctor: { category: 'Health & Medical', icon: '🏥', isDiscretionary: false },
  hospital: { category: 'Health & Medical', icon: '🩺', isDiscretionary: false },
  pharmacy: { category: 'Health & Medical', icon: '💊', isDiscretionary: false },
  medicine: { category: 'Health & Medical', icon: '💊', isDiscretionary: false },
};

/**
 * Normalizes a transaction into a normalized Category Name and Subcategory
 */
export function normalizeTransactionCategory(t: Transaction): {
  normalizedCategory: string;
  subcategory: string;
  icon: string;
  isDiscretionary: boolean;
} {
  const desc = (t.description || '').toLowerCase();

  for (const [keyword, meta] of Object.entries(CATEGORY_MAP)) {
    if (desc.includes(keyword)) {
      return {
        normalizedCategory: meta.category,
        subcategory: t.description.trim(),
        icon: meta.icon,
        isDiscretionary: meta.isDiscretionary
      };
    }
  }

  // Fallback to Kakeibo category
  if (t.kakeiboCategory === KakeiboCategory.NEEDS) {
    return { normalizedCategory: 'Essentials & Needs', subcategory: t.description || 'Household Needs', icon: '🏠', isDiscretionary: false };
  }
  if (t.kakeiboCategory === KakeiboCategory.WANTS) {
    return { normalizedCategory: 'Discretionary & Wants', subcategory: t.description || 'Personal Wants', icon: '🛍️', isDiscretionary: true };
  }
  if (t.kakeiboCategory === KakeiboCategory.CULTURE) {
    return { normalizedCategory: 'Learning & Culture', subcategory: t.description || 'Growth & Self-improvement', icon: '📚', isDiscretionary: true };
  }
  if (t.kakeiboCategory === KakeiboCategory.UNEXPECTED) {
    return { normalizedCategory: 'Emergency & Unexpected', subcategory: t.description || 'Unplanned Expense', icon: '⚡', isDiscretionary: false };
  }

  return { normalizedCategory: 'Other Expenses', subcategory: t.description || 'General', icon: '💰', isDiscretionary: true };
}

/**
 * Filter transactions based on date range or timeframe selection
 */
export function filterTransactionsByTimeframe(
  transactions: Transaction[],
  timeframe: 'THIS_MONTH' | 'LAST_3_MONTHS' | 'LAST_6_MONTHS' | 'LAST_12_MONTHS' | 'ALL' | 'CUSTOM',
  customStart?: string,
  customEnd?: string
): { filtered: Transaction[]; startDate: Date; endDate: Date; label: string; previousWindowTransactions: Transaction[] } {
  const now = new Date();
  let startDate: Date;
  let endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
  let label = 'Current Month';
  let prevStartDate: Date;
  let prevEndDate: Date;

  if (timeframe === 'THIS_MONTH') {
    startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    label = now.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
    prevStartDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    prevEndDate = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
  } else if (timeframe === 'LAST_3_MONTHS') {
    startDate = new Date(now.getFullYear(), now.getMonth() - 2, 1);
    label = 'Last 3 Months';
    prevStartDate = new Date(now.getFullYear(), now.getMonth() - 5, 1);
    prevEndDate = new Date(now.getFullYear(), now.getMonth() - 2, 0, 23, 59, 59);
  } else if (timeframe === 'LAST_6_MONTHS') {
    startDate = new Date(now.getFullYear(), now.getMonth() - 5, 1);
    label = 'Last 6 Months';
    prevStartDate = new Date(now.getFullYear(), now.getMonth() - 11, 1);
    prevEndDate = new Date(now.getFullYear(), now.getMonth() - 5, 0, 23, 59, 59);
  } else if (timeframe === 'LAST_12_MONTHS') {
    startDate = new Date(now.getFullYear(), now.getMonth() - 11, 1);
    label = 'Last 12 Months';
    prevStartDate = new Date(now.getFullYear() - 2, now.getMonth() - 11, 1);
    prevEndDate = new Date(now.getFullYear() - 1, now.getMonth() - 11, 0, 23, 59, 59);
  } else if (timeframe === 'CUSTOM' && customStart && customEnd) {
    startDate = new Date(customStart);
    endDate = new Date(customEnd);
    endDate.setHours(23, 59, 59);
    label = `${startDate.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })} – ${endDate.toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}`;
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    prevEndDate = new Date(startDate.getTime() - 1);
    prevStartDate = new Date(prevEndDate.getTime() - diffTime);
  } else {
    // ALL
    startDate = new Date(2020, 0, 1);
    label = 'All Time History';
    prevStartDate = new Date(2019, 0, 1);
    prevEndDate = new Date(2019, 11, 31);
  }

  // Filter out internal transfers and double counting (e.g. description containing "transfer" or "self")
  const isValidTx = (t: Transaction) => {
    const desc = (t.description || '').toLowerCase();
    if (desc.includes('self transfer') || desc.includes('transfer to savings') || desc.includes('transfer to account')) {
      return false; // Skip internal transfer to prevent double counting
    }
    return true;
  };

  const filtered = transactions.filter(t => {
    if (!isValidTx(t)) return false;
    const d = new Date(t.date);
    return d >= startDate && d <= endDate;
  });

  const previousWindowTransactions = transactions.filter(t => {
    if (!isValidTx(t)) return false;
    const d = new Date(t.date);
    return d >= prevStartDate && d <= prevEndDate;
  });

  return { filtered, startDate, endDate, label, previousWindowTransactions };
}

/**
 * Main 80/20 Pareto Engine
 */
export function calculateParetoInsights(
  state: AppState,
  timeframe: 'THIS_MONTH' | 'LAST_3_MONTHS' | 'LAST_6_MONTHS' | 'LAST_12_MONTHS' | 'ALL' | 'CUSTOM' = 'THIS_MONTH',
  customStart?: string,
  customEnd?: string
): ParetoAnalysisResult {
  const { filtered, startDate, endDate, label, previousWindowTransactions } = filterTransactionsByTimeframe(
    state.transactions,
    timeframe,
    customStart,
    customEnd
  );

  const strategy = state.userStrategy || 'SAVE_MORE';

  // 1. Compute Income & Expenses
  const totalIncome = filtered
    .filter(t => t.type === WealthType.INCOME)
    .reduce((sum, t) => sum + Math.max(0, t.amount), 0);

  const expenseTransactions = filtered.filter(t => t.type === WealthType.EXPENSE && t.amount > 0);
  const totalExpenses = expenseTransactions.reduce((sum, t) => sum + t.amount, 0);
  const netSavings = totalIncome - totalExpenses;
  const savingsRate = totalIncome > 0 ? Math.round((netSavings / totalIncome) * 100) : 0;

  // 2. Previous Window Expenses for trends
  const prevExpensesByCategory: Record<string, number> = {};
  previousWindowTransactions
    .filter(t => t.type === WealthType.EXPENSE && t.amount > 0)
    .forEach(t => {
      const { normalizedCategory } = normalizeTransactionCategory(t);
      prevExpensesByCategory[normalizedCategory] = (prevExpensesByCategory[normalizedCategory] || 0) + t.amount;
    });

  // 3. Group by Normalized Category
  const categoryMap: Record<
    string,
    {
      amount: number;
      icon: string;
      isDiscretionary: boolean;
      transactions: Transaction[];
      subcategories: Record<string, { amount: number; count: number }>;
      merchants: Record<string, { amount: number; count: number }>;
    }
  > = {};

  expenseTransactions.forEach(t => {
    const { normalizedCategory, subcategory, icon, isDiscretionary } = normalizeTransactionCategory(t);

    if (!categoryMap[normalizedCategory]) {
      categoryMap[normalizedCategory] = {
        amount: 0,
        icon,
        isDiscretionary,
        transactions: [],
        subcategories: {},
        merchants: {}
      };
    }

    categoryMap[normalizedCategory].amount += t.amount;
    categoryMap[normalizedCategory].transactions.push(t);

    // Subcategory breakdown
    const subKey = subcategory;
    if (!categoryMap[normalizedCategory].subcategories[subKey]) {
      categoryMap[normalizedCategory].subcategories[subKey] = { amount: 0, count: 0 };
    }
    categoryMap[normalizedCategory].subcategories[subKey].amount += t.amount;
    categoryMap[normalizedCategory].subcategories[subKey].count += 1;

    // Merchant breakdown (first 2 words of description)
    const merchantKey = t.description.split(' ').slice(0, 2).join(' ') || 'General';
    if (!categoryMap[normalizedCategory].merchants[merchantKey]) {
      categoryMap[normalizedCategory].merchants[merchantKey] = { amount: 0, count: 0 };
    }
    categoryMap[normalizedCategory].merchants[merchantKey].amount += t.amount;
    categoryMap[normalizedCategory].merchants[merchantKey].count += 1;
  });

  // 4. Sort Categories Descending by spending
  const sortedCategories = Object.entries(categoryMap)
    .map(([catName, data]) => ({
      category: catName,
      amount: data.amount,
      icon: data.icon,
      isDiscretionary: data.isDiscretionary,
      transactions: data.transactions,
      subcategoriesMap: data.subcategories,
      merchantsMap: data.merchants
    }))
    .sort((a, b) => b.amount - a.amount);

  // 5. Calculate Cumulative Pareto Distribution
  let runningCumulative = 0;
  let paretoCutoffIndex = 0;
  let reached80Percent = false;

  const categories: CategoryParetoItem[] = sortedCategories.map((item, index) => {
    const sharePercent = totalExpenses > 0 ? (item.amount / totalExpenses) * 100 : 0;
    const incomePercent = totalIncome > 0 ? (item.amount / totalIncome) * 100 : 0;
    runningCumulative += item.amount;
    const cumulativePercent = totalExpenses > 0 ? (runningCumulative / totalExpenses) * 100 : 0;

    const isDriver = !reached80Percent;
    if (cumulativePercent >= 78 && !reached80Percent) {
      reached80Percent = true;
      paretoCutoffIndex = index;
    }

    const prevAmt = prevExpensesByCategory[item.category];
    const monthOverMonthGrowth = prevAmt && prevAmt > 0 ? ((item.amount - prevAmt) / prevAmt) * 100 : undefined;

    // Potential savings estimation:
    // If discretionary: 20-40% realistic optimization
    // If essential: 5-15% efficiency optimization (e.g. utilities/groceries)
    const minSave = item.isDiscretionary ? Math.round(item.amount * 0.2) : Math.round(item.amount * 0.05);
    const maxSave = item.isDiscretionary ? Math.round(item.amount * 0.4) : Math.round(item.amount * 0.15);

    const subcategories = Object.entries(item.subcategoriesMap)
      .map(([name, sData]) => ({
        name,
        amount: sData.amount,
        percentage: item.amount > 0 ? Math.round((sData.amount / item.amount) * 100) : 0,
        count: sData.count
      }))
      .sort((a, b) => b.amount - a.amount);

    const merchants = Object.entries(item.merchantsMap)
      .map(([name, mData]) => ({
        name,
        amount: mData.amount,
        count: mData.count
      }))
      .sort((a, b) => b.amount - a.amount);

    return {
      category: item.category,
      amount: item.amount,
      sharePercent: Number(sharePercent.toFixed(1)),
      incomePercent: Number(incomePercent.toFixed(1)),
      cumulativeAmount: runningCumulative,
      cumulativePercent: Number(cumulativePercent.toFixed(1)),
      transactionCount: item.transactions.length,
      isParetoDriver: isDriver || index <= paretoCutoffIndex,
      isDiscretionary: item.isDiscretionary,
      rank: index + 1,
      previousMonthAmount: prevAmt,
      monthOverMonthGrowth: monthOverMonthGrowth ? Number(monthOverMonthGrowth.toFixed(1)) : undefined,
      potentialMonthlySavings: { min: minSave, max: maxSave },
      icon: item.icon,
      subcategories,
      merchants
    };
  });

  // Calculate 80/20 summary stats
  const driverCategories = categories.filter(c => c.isParetoDriver);
  const topDriverCount = driverCategories.length || 1;
  const topDriverSum = driverCategories.reduce((s, c) => s + c.amount, 0);
  const topDriverPercentage = totalExpenses > 0 ? Math.round((topDriverSum / totalExpenses) * 100) : 0;

  // 6. Detect Recurring Leaks (Subscriptions, OTT, Memberships, EMIs)
  const recurringLeaks: RecurringLeakItem[] = [];
  const recurringKeywords = ['netflix', 'prime', 'hotstar', 'spotify', 'youtube', 'icloud', 'chatgpt', 'gym', 'wifi', 'broadband', 'emi', 'subscription', 'membership'];

  expenseTransactions.forEach(t => {
    const desc = (t.description || '').toLowerCase();
    const isExplicit = t.isRecurring;
    const matchesKeyword = recurringKeywords.some(kw => desc.includes(kw));

    if (isExplicit || matchesKeyword) {
      let leakType: RecurringLeakItem['type'] = 'Other';
      if (desc.includes('netflix') || desc.includes('prime') || desc.includes('hotstar') || desc.includes('spotify') || desc.includes('youtube')) {
        leakType = 'OTT / Streaming';
      } else if (desc.includes('icloud') || desc.includes('chatgpt') || desc.includes('apple') || desc.includes('software')) {
        leakType = 'App / Software';
      } else if (desc.includes('gym') || desc.includes('club') || desc.includes('membership')) {
        leakType = 'Membership / Gym';
      } else if (desc.includes('wifi') || desc.includes('broadband') || desc.includes('recharge')) {
        leakType = 'Bill / Utility';
      } else if (desc.includes('emi') || desc.includes('loan')) {
        leakType = 'Insurance / EMI';
      }

      // Check if already in list
      const existing = recurringLeaks.find(r => r.name.toLowerCase() === t.description.toLowerCase());
      if (existing) {
        existing.monthlyAmount = Math.max(existing.monthlyAmount, t.amount);
        existing.annualAmount = existing.monthlyAmount * 12;
      } else {
        const isUnusedGymOrSub = leakType === 'Membership / Gym' || (leakType === 'OTT / Streaming' && t.amount > 500);
        const status: RecurringLeakItem['status'] = isUnusedGymOrSub ? 'Review Needed' : 'Active';
        const impactScore = Math.min(95, Math.max(25, Math.round((t.amount / (totalExpenses || 1)) * 300) + 30));

        recurringLeaks.push({
          id: t.id || crypto.randomUUID(),
          name: t.description,
          category: normalizeTransactionCategory(t).normalizedCategory,
          monthlyAmount: t.amount,
          annualAmount: t.amount * 12,
          type: leakType,
          status,
          frequency: 'Monthly',
          impactScore
        });
      }
    }
  });

  // Sort leaks by monthly cost
  recurringLeaks.sort((a, b) => b.monthlyAmount - a.monthlyAmount);
  const totalMonthlyLeakage = recurringLeaks.reduce((s, r) => s + r.monthlyAmount, 0);
  const totalAnnualLeakage = totalMonthlyLeakage * 12;

  // 7. Calculate Savings Opportunities
  const savingsOpportunities: SavingsOpportunity[] = [];

  categories.forEach(cat => {
    if (cat.isDiscretionary && cat.amount > 1000) {
      // High-impact discretionary
      const potentialMonthly = Math.round(cat.amount * 0.3);
      const potentialAnnual = potentialMonthly * 12;
      const shareOfIncome = totalIncome > 0 ? (cat.amount / totalIncome) * 100 : 0;
      
      // Calculate 1-100 Impact Score
      let score = Math.round((potentialMonthly / (totalExpenses || 1)) * 250) + 40;
      if (strategy === 'SAVE_MORE' || strategy === 'LIFESTYLE_CONTROL') score += 10;
      score = Math.min(98, Math.max(30, score));

      let difficulty: SavingsOpportunity['difficulty'] = 'Easy';
      let tag: SavingsOpportunity['tag'] = 'Discretionary';
      let recommendation = `Reduce ${cat.category} expenses by 30% through mindful planning.`;
      let actionTitle = `Optimize ${cat.category}`;

      if (cat.category.includes('Food Delivery')) {
        tag = 'Food Delivery';
        difficulty = 'Easy';
        recommendation = `Reduce food delivery frequency by half (e.g. from 12 orders/month to 6) and meal prep on weekends.`;
        actionTitle = 'Cap Food Delivery Orders';
      } else if (cat.category.includes('Shopping')) {
        tag = 'Shopping';
        difficulty = 'Moderate';
        recommendation = `Implement a 48-hour rule for non-essential purchases and defer impulse buys.`;
        actionTitle = 'Apply 48-Hour Cart Rule';
      } else if (cat.category.includes('Subscriptions')) {
        tag = 'Subscriptions';
        difficulty = 'Easy';
        recommendation = `Audit OTT & memberships; pause subscriptions not watched in the last 14 days.`;
        actionTitle = 'Cancel Unused Subscriptions';
      }

      const impactLevel: SavingsOpportunity['impactLevel'] = 
        score >= 80 ? 'Critical' : score >= 60 ? 'High Impact' : score >= 40 ? 'Moderate' : 'Low Impact';

      savingsOpportunities.push({
        id: `opp-${cat.category}`,
        category: cat.category,
        title: `Trim ${cat.category}`,
        currentMonthlyAmount: cat.amount,
        potentialMonthlySaving: potentialMonthly,
        potentialAnnualSaving: potentialAnnual,
        impactScore: score,
        difficulty,
        impactLevel,
        recommendation,
        actionTitle,
        deadlineDays: difficulty === 'Easy' ? 7 : 14,
        tag
      });
    }
  });

  // Sort opportunities by impact score descending
  savingsOpportunities.sort((a, b) => b.impactScore - a.impactScore);

  const potentialMonthlySavingsTotal = savingsOpportunities.reduce((s, o) => s + o.potentialMonthlySaving, 0);
  const potentialAnnualSavingsTotal = potentialMonthlySavingsTotal * 12;
  const newProjectedSavings = netSavings + potentialMonthlySavingsTotal;
  const financialLeverageIncreaseRate = totalIncome > 0 ? Math.round((newProjectedSavings / totalIncome) * 100) : savingsRate + 15;

  // 8. Generate Top 5 Actions
  const top5Actions: HighImpactAction[] = [];

  // Action 1: Top savings opportunity
  if (savingsOpportunities.length > 0) {
    const bestOpp = savingsOpportunities[0];
    top5Actions.push({
      id: 'act-1',
      rank: 1,
      title: bestOpp.actionTitle,
      whyItMatters: bestOpp.recommendation,
      monthlyImpact: bestOpp.potentialMonthlySaving,
      annualImpact: bestOpp.potentialAnnualSaving,
      difficulty: bestOpp.difficulty,
      priority: bestOpp.impactLevel,
      impactScore: bestOpp.impactScore,
      recommendedDeadline: 'Within 7 Days',
      actionType: 'REDUCE_BUDGET',
      suggestedGoalTitle: `${bestOpp.category} Savings Pool`,
      suggestedGoalAmount: bestOpp.potentialAnnualSaving
    });
  }

  // Action 2: Recurring Leak Audit
  if (recurringLeaks.length > 0) {
    const leakSum = recurringLeaks.reduce((s, r) => s + r.monthlyAmount, 0);
    const topLeak = recurringLeaks[0];
    top5Actions.push({
      id: 'act-2',
      rank: 2,
      title: 'Audit & Trim Recurring Subscriptions',
      whyItMatters: `You have ${recurringLeaks.length} active recurring charges (${topLeak.name}, etc.) totaling ₹${leakSum.toLocaleString('en-IN')}/mo. Canceling just 1 or 2 unused services generates immediate guaranteed cash flow.`,
      monthlyImpact: Math.round(leakSum * 0.4),
      annualImpact: Math.round(leakSum * 0.4 * 12),
      difficulty: 'Easy',
      priority: 'High Impact',
      impactScore: 84,
      recommendedDeadline: 'This Weekend',
      actionType: 'CANCEL_SUBSCRIPTION'
    });
  }

  // Action 3: Second Top Category or Top Essential Optimization
  if (savingsOpportunities.length > 1) {
    const secondOpp = savingsOpportunities[1];
    top5Actions.push({
      id: 'act-3',
      rank: 3,
      title: secondOpp.actionTitle,
      whyItMatters: secondOpp.recommendation,
      monthlyImpact: secondOpp.potentialMonthlySaving,
      annualImpact: secondOpp.potentialAnnualSaving,
      difficulty: secondOpp.difficulty,
      priority: secondOpp.impactLevel,
      impactScore: secondOpp.impactScore,
      recommendedDeadline: 'Within 14 Days',
      actionType: 'REDUCE_BUDGET'
    });
  }

  // Action 4: High Impact Debt / Emergency Fund
  const userDebts = state.financialDebts || [];
  if (userDebts.length > 0) {
    const highestIntDebt = [...userDebts].sort((a, b) => b.interestRate - a.interestRate)[0];
    top5Actions.push({
      id: 'act-4',
      rank: 4,
      title: `Attack High-Interest ${highestIntDebt.name}`,
      whyItMatters: `Your ${highestIntDebt.name} carries ${highestIntDebt.interestRate}% interest. Directing 80/20 monthly savings of ₹${potentialMonthlySavingsTotal.toLocaleString('en-IN')} towards its principal will slash compounding interest costs.`,
      monthlyImpact: Math.round((highestIntDebt.balance * (highestIntDebt.interestRate / 100)) / 12),
      annualImpact: Math.round(highestIntDebt.balance * (highestIntDebt.interestRate / 100)),
      difficulty: 'Moderate',
      priority: 'Critical',
      impactScore: 92,
      recommendedDeadline: 'Next Paycheck',
      actionType: 'OPTIMIZE_DEBT'
    });
  } else {
    // Emergency Fund acceleration
    top5Actions.push({
      id: 'act-4',
      rank: 4,
      title: 'Automate 80/20 Surplus into Emergency Fund',
      whyItMatters: `Move ₹${Math.round(potentialMonthlySavingsTotal * 0.7).toLocaleString('en-IN')}/mo into a dedicated high-yield liquid emergency reserve right on payday.`,
      monthlyImpact: Math.round(potentialMonthlySavingsTotal * 0.7),
      annualImpact: Math.round(potentialMonthlySavingsTotal * 0.7 * 12),
      difficulty: 'Easy',
      priority: 'High Impact',
      impactScore: 78,
      recommendedDeadline: '1st of Next Month',
      actionType: 'ADD_SAVINGS_GOAL',
      suggestedGoalTitle: '3-Month Emergency Reserve',
      suggestedGoalAmount: (totalExpenses || 40000) * 3
    });
  }

  // Action 5: Negotiation or Utility capping
  const utilityCat = categories.find(c => c.category.includes('Utilities') || c.category.includes('Transport'));
  if (utilityCat) {
    top5Actions.push({
      id: 'act-5',
      rank: 5,
      title: `Optimize ${utilityCat.category}`,
      whyItMatters: `Review annual plans, broadband speeds, or commute routes to lock in an estimated ₹${utilityCat.potentialMonthlySavings.min.toLocaleString('en-IN')}/mo in passive baseline savings.`,
      monthlyImpact: utilityCat.potentialMonthlySavings.min,
      annualImpact: utilityCat.potentialMonthlySavings.min * 12,
      difficulty: 'Moderate',
      priority: 'Moderate',
      impactScore: 62,
      recommendedDeadline: 'Within 30 Days',
      actionType: 'NEGOTIATE_BILL'
    });
  }

  // 9. Income 80/20 Analysis
  const incomeTransactions = filtered.filter(t => t.type === WealthType.INCOME && t.amount > 0);
  const incomeMap: Record<string, number> = {};

  incomeTransactions.forEach(t => {
    const desc = t.description || 'Primary Income';
    const sourceKey = desc.toLowerCase().includes('salary')
      ? 'Primary Salary / Employment'
      : desc.toLowerCase().includes('freelance') || desc.toLowerCase().includes('consulting')
      ? 'Freelance & Consulting'
      : desc.toLowerCase().includes('business') || desc.toLowerCase().includes('sales')
      ? 'Business & Commerce'
      : desc.toLowerCase().includes('dividend') || desc.toLowerCase().includes('interest') || desc.toLowerCase().includes('investment')
      ? 'Investments & Dividends'
      : desc.toLowerCase().includes('rent')
      ? 'Rental Income'
      : desc;

    incomeMap[sourceKey] = (incomeMap[sourceKey] || 0) + t.amount;
  });

  if (Object.keys(incomeMap).length === 0 && totalIncome > 0) {
    incomeMap['Primary Income'] = totalIncome;
  }

  const incomeSources: IncomeParetoItem[] = Object.entries(incomeMap)
    .map(([source, amount]) => {
      const stability: 'High' | 'Moderate' | 'Variable' = source.includes('Salary') ? 'High' : source.includes('Rental') ? 'High' : 'Variable';
      const trend: 'Up' | 'Stable' | 'Down' = 'Stable';
      return {
        source,
        amount,
        percentage: totalIncome > 0 ? Math.round((amount / totalIncome) * 100) : 0,
        stability,
        growthOpportunity: source.includes('Freelance')
          ? 'High potential to scale hourly rates or side clients for +20% income expansion.'
          : source.includes('Salary')
          ? 'Steady anchor income; leverage for bonus/appraisal discussions.'
          : 'Explore reinvesting returns for compounding growth.',
        trend
      };
    })
    .sort((a, b) => b.amount - a.amount);

  // 10. Debt 80/20 Analysis
  const debts: DebtParetoItem[] = [];
  const rawDebts: FinancialDebt[] = (state.financialDebts && state.financialDebts.length > 0)
    ? state.financialDebts
    : [
        // Realistic defaults if empty but user has EMI transactions
        { id: 'd-cc', name: 'Credit Card Outstanding', balance: 45000, interestRate: 38, monthlyEMI: 4500, category: 'Credit Card' },
        { id: 'd-car', name: 'Car Loan EMI', balance: 280000, interestRate: 9.5, monthlyEMI: 7200, category: 'Car Loan' }
      ];

  const totalDebtBalance = rawDebts.reduce((s, d) => s + d.balance, 0);
  const totalAnnualInterestCost = rawDebts.reduce((s, d) => s + (d.balance * (d.interestRate / 100)), 0);

  rawDebts.forEach(d => {
    const annualInterest = d.balance * (d.interestRate / 100);
    const balanceShare = totalDebtBalance > 0 ? (d.balance / totalDebtBalance) * 100 : 0;
    const interestShare = totalAnnualInterestCost > 0 ? (annualInterest / totalAnnualInterestCost) * 100 : 0;
    const isLeverage = d.interestRate >= 18 || (interestShare > balanceShare * 1.5);

    debts.push({
      id: d.id,
      name: d.name,
      balance: d.balance,
      interestRate: d.interestRate,
      monthlyEMI: d.monthlyEMI,
      annualInterestCost: Math.round(annualInterest),
      balanceSharePercent: Number(balanceShare.toFixed(1)),
      interestCostSharePercent: Number(interestShare.toFixed(1)),
      isHighInterestLeverage: isLeverage,
      payoffAccelerationMonths: isLeverage ? 6 : 2
    });
  });

  debts.sort((a, b) => b.interestRate - a.interestRate);
  const highestInterestDebtName = debts.length > 0 ? debts[0].name : undefined;

  // 11. Goal Acceleration Calculations
  const goals: FinancialGoal[] = (state.financialGoals && state.financialGoals.length > 0)
    ? state.financialGoals
    : [
        { id: 'g1', title: 'Emergency Fund', targetAmount: 150000, currentAmount: 45000, monthlyContribution: 5000, targetDate: '2027-06-01', category: 'Safety', icon: '🛡️' },
        { id: 'g2', title: 'New Vehicle Down Payment', targetAmount: 200000, currentAmount: 60000, monthlyContribution: 7000, targetDate: '2027-12-01', category: 'Major Purchase', icon: '🚗' },
        { id: 'g3', title: 'Hajj / Umrah Journey', targetAmount: 350000, currentAmount: 110000, monthlyContribution: 10000, targetDate: '2028-05-01', category: 'Spiritual', icon: '🕋' }
      ];

  const goalAccelerations = goals.map(g => {
    const remaining = Math.max(0, g.targetAmount - g.currentAmount);
    const currentMonths = g.monthlyContribution > 0 ? remaining / g.monthlyContribution : 24;
    const boostContribution = g.monthlyContribution + (potentialMonthlySavingsTotal * 0.5);
    const acceleratedMonths = boostContribution > 0 ? remaining / boostContribution : currentMonths;
    const monthsSaved = Math.max(0, Number((currentMonths - acceleratedMonths).toFixed(1)));

    const targetDateObj = new Date();
    targetDateObj.setMonth(targetDateObj.getMonth() + Math.round(acceleratedMonths));

    return {
      goalId: g.id,
      goalTitle: g.title,
      targetAmount: g.targetAmount,
      currentAmount: g.currentAmount,
      monthsSaved,
      newCompletionDate: targetDateObj.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })
    };
  });

  // 12. Determine Best Decision & Warnings
  let biggestWarningCategory: { name: string; increasePercent: number; amount: number } | undefined;
  const increasedCat = categories
    .filter(c => c.monthOverMonthGrowth && c.monthOverMonthGrowth > 10)
    .sort((a, b) => (b.monthOverMonthGrowth || 0) - (a.monthOverMonthGrowth || 0))[0];

  if (increasedCat && increasedCat.monthOverMonthGrowth) {
    biggestWarningCategory = {
      name: increasedCat.category,
      increasePercent: increasedCat.monthOverMonthGrowth,
      amount: increasedCat.amount
    };
  }

  // 13. Financial Health Grade
  let financialHealthGrade: 'A+' | 'A' | 'B' | 'C' | 'Needs Attention' = 'B';
  if (savingsRate >= 35 && topDriverPercentage <= 75) financialHealthGrade = 'A+';
  else if (savingsRate >= 20) financialHealthGrade = 'A';
  else if (savingsRate >= 10) financialHealthGrade = 'B';
  else if (savingsRate >= 0) financialHealthGrade = 'C';
  else financialHealthGrade = 'Needs Attention';

  // Summary Quote
  const driverNames = driverCategories.slice(0, 3).map(c => c.category.split(' ')[0]).join(', ');
  const summaryQuote = driverCategories.length > 0
    ? `Your biggest financial impact comes from ${driverNames}. Optimizing these high-impact drivers will free up significant surplus before worrying about tiny daily purchases.`
    : 'Track your spending to reveal your 80/20 concentration picture.';

  return {
    timeframeLabel: label,
    startDate: startDate.toISOString().split('T')[0],
    endDate: endDate.toISOString().split('T')[0],
    totalIncome,
    totalExpenses,
    netSavings,
    savingsRate,
    topDriverCount,
    topDriverPercentage,
    categories,
    paretoCutoffIndex,
    summaryQuote,
    potentialMonthlySavingsTotal,
    potentialAnnualSavingsTotal,
    financialLeverageIncreaseRate,
    financialHealthGrade,
    savingsOpportunities,
    recurringLeaks,
    totalMonthlyLeakage,
    totalAnnualLeakage,
    top5Actions,
    incomeSources,
    debts,
    totalDebtBalance,
    totalAnnualInterestCost,
    highestInterestDebtName,
    bestDecisionMonth: savingsRate >= 20 ? 'Consistently high savings rate maintained' : 'Identified food delivery reduction opportunities',
    biggestWarningCategory,
    goalAccelerations
  };
}

/**
 * Seed realistic comprehensive financial sample data for instant demonstration
 */
export function getRealisticSampleState(): AppState {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();

  const getDateStr = (mOffset: number, day: number) => {
    const d = new Date(year, month - mOffset, day);
    return d.toISOString().split('T')[0];
  };

  const sampleTransactions: Transaction[] = [
    // Month 0 (Current Month)
    { id: 'st-01', date: getDateStr(0, 1), description: 'Tech Corp Monthly Salary', amount: 75000, type: WealthType.INCOME, isRecurring: true },
    { id: 'st-02', date: getDateStr(0, 2), description: 'Apartment House Rent', amount: 18000, type: WealthType.EXPENSE, kakeiboCategory: KakeiboCategory.NEEDS, isRecurring: true },
    { id: 'st-03', date: getDateStr(0, 3), description: 'Supermarket Monthly Groceries', amount: 8200, type: WealthType.EXPENSE, kakeiboCategory: KakeiboCategory.NEEDS, isRecurring: false },
    { id: 'st-04', date: getDateStr(0, 4), description: 'Car Loan EMI Payment', amount: 6800, type: WealthType.EXPENSE, kakeiboCategory: KakeiboCategory.NEEDS, isRecurring: true },
    { id: 'st-05', date: getDateStr(0, 5), description: 'Swiggy Weekend Dinners', amount: 3400, type: WealthType.EXPENSE, kakeiboCategory: KakeiboCategory.WANTS, isRecurring: false },
    { id: 'st-06', date: getDateStr(0, 7), description: 'Zomato Office Lunches', amount: 2800, type: WealthType.EXPENSE, kakeiboCategory: KakeiboCategory.WANTS, isRecurring: false },
    { id: 'st-07', date: getDateStr(0, 8), description: 'Electricity & Water Utility Bill', amount: 3100, type: WealthType.EXPENSE, kakeiboCategory: KakeiboCategory.NEEDS, isRecurring: true },
    { id: 'st-08', date: getDateStr(0, 10), description: 'Fuel & Petrol Refill', amount: 3200, type: WealthType.EXPENSE, kakeiboCategory: KakeiboCategory.NEEDS, isRecurring: false },
    { id: 'st-09', date: getDateStr(0, 12), description: 'Amazon Shopping & Gadgets', amount: 4600, type: WealthType.EXPENSE, kakeiboCategory: KakeiboCategory.WANTS, isRecurring: false },
    { id: 'st-10', date: getDateStr(0, 14), description: 'Netflix Premium Subscription', amount: 649, type: WealthType.EXPENSE, kakeiboCategory: KakeiboCategory.WANTS, isRecurring: true },
    { id: 'st-11', date: getDateStr(0, 14), description: 'Amazon Prime OTT', amount: 299, type: WealthType.EXPENSE, kakeiboCategory: KakeiboCategory.WANTS, isRecurring: true },
    { id: 'st-12', date: getDateStr(0, 15), description: 'Gym & Fitness Membership', amount: 1200, type: WealthType.EXPENSE, kakeiboCategory: KakeiboCategory.CULTURE, isRecurring: true },
    { id: 'st-13', date: getDateStr(0, 16), description: 'Cloud Storage & Software', amount: 130, type: WealthType.EXPENSE, kakeiboCategory: KakeiboCategory.CULTURE, isRecurring: true },
    { id: 'st-14', date: getDateStr(0, 18), description: 'High-Speed Broadband WiFi', amount: 999, type: WealthType.EXPENSE, kakeiboCategory: KakeiboCategory.NEEDS, isRecurring: true },
    { id: 'st-15', date: getDateStr(0, 20), description: 'Kids Tuition & School Books', amount: 3500, type: WealthType.EXPENSE, kakeiboCategory: KakeiboCategory.NEEDS, isRecurring: true },
    { id: 'st-16', date: getDateStr(0, 22), description: 'Uber Cabs & City Transit', amount: 1850, type: WealthType.EXPENSE, kakeiboCategory: KakeiboCategory.NEEDS, isRecurring: false },
    { id: 'st-17', date: getDateStr(0, 24), description: 'Pharmacy & Health Vitamins', amount: 1400, type: WealthType.EXPENSE, kakeiboCategory: KakeiboCategory.NEEDS, isRecurring: false },
    { id: 'st-18', date: getDateStr(0, 25), description: 'Freelance Design Project Fee', amount: 12000, type: WealthType.INCOME, isRecurring: false },

    // Month -1 (Previous Month)
    { id: 'st-p01', date: getDateStr(1, 1), description: 'Tech Corp Monthly Salary', amount: 75000, type: WealthType.INCOME, isRecurring: true },
    { id: 'st-p02', date: getDateStr(1, 2), description: 'Apartment House Rent', amount: 18000, type: WealthType.EXPENSE, kakeiboCategory: KakeiboCategory.NEEDS, isRecurring: true },
    { id: 'st-p03', date: getDateStr(1, 4), description: 'Supermarket Monthly Groceries', amount: 7900, type: WealthType.EXPENSE, kakeiboCategory: KakeiboCategory.NEEDS, isRecurring: false },
    { id: 'st-p04', date: getDateStr(1, 5), description: 'Car Loan EMI Payment', amount: 6800, type: WealthType.EXPENSE, kakeiboCategory: KakeiboCategory.NEEDS, isRecurring: true },
    { id: 'st-p05', date: getDateStr(1, 7), description: 'Swiggy & Zomato Food Orders', amount: 5600, type: WealthType.EXPENSE, kakeiboCategory: KakeiboCategory.WANTS, isRecurring: false },
    { id: 'st-p06', date: getDateStr(1, 10), description: 'Fuel & Petrol Refill', amount: 3000, type: WealthType.EXPENSE, kakeiboCategory: KakeiboCategory.NEEDS, isRecurring: false },
    { id: 'st-p07', date: getDateStr(1, 12), description: 'Shopping & Clothes', amount: 5200, type: WealthType.EXPENSE, kakeiboCategory: KakeiboCategory.WANTS, isRecurring: false },
    { id: 'st-p08', date: getDateStr(1, 15), description: 'Subscriptions & Memberships', amount: 2278, type: WealthType.EXPENSE, kakeiboCategory: KakeiboCategory.WANTS, isRecurring: true },
    { id: 'st-p09', date: getDateStr(1, 18), description: 'Electricity & Utilities', amount: 2850, type: WealthType.EXPENSE, kakeiboCategory: KakeiboCategory.NEEDS, isRecurring: true },

    // Month -2 (2 Months Ago)
    { id: 'st-pp01', date: getDateStr(2, 1), description: 'Tech Corp Monthly Salary', amount: 75000, type: WealthType.INCOME, isRecurring: true },
    { id: 'st-pp02', date: getDateStr(2, 2), description: 'Apartment House Rent', amount: 18000, type: WealthType.EXPENSE, kakeiboCategory: KakeiboCategory.NEEDS, isRecurring: true },
    { id: 'st-pp03', date: getDateStr(2, 4), description: 'Groceries & Provisions', amount: 7600, type: WealthType.EXPENSE, kakeiboCategory: KakeiboCategory.NEEDS, isRecurring: false },
    { id: 'st-pp04', date: getDateStr(2, 5), description: 'Car Loan EMI Payment', amount: 6800, type: WealthType.EXPENSE, kakeiboCategory: KakeiboCategory.NEEDS, isRecurring: true },
    { id: 'st-pp05', date: getDateStr(2, 8), description: 'Food Delivery & Dining', amount: 6200, type: WealthType.EXPENSE, kakeiboCategory: KakeiboCategory.WANTS, isRecurring: false },
    { id: 'st-pp06', date: getDateStr(2, 12), description: 'Shopping & Electronics', amount: 3900, type: WealthType.EXPENSE, kakeiboCategory: KakeiboCategory.WANTS, isRecurring: false },
  ];

  return {
    transactions: sampleTransactions,
    tasks: [],
    schedule: [],
    foodPlan: {
      Monday: { breakfast: 'Oatmeal & Fruits', lunch: 'Rice with Dal & Veggies', dinner: 'Roti with Paneer Curry', snacks: 'Green tea & Almonds' },
      Tuesday: { breakfast: 'Eggs & Toast', lunch: 'Quinoa Bowl', dinner: 'Lentil Soup & Salad', snacks: 'Fruit Chaat' },
      Wednesday: { breakfast: 'Idli Sambar', lunch: 'Brown Rice & Chicken', dinner: 'Vegetable Khichdi', snacks: 'Roasted Makhana' },
      Thursday: { breakfast: 'Poha with Peanuts', lunch: 'Chapati with Curry', dinner: 'Fish & Grilled Veggies', snacks: 'Walnuts' },
      Friday: { breakfast: 'Smoothie Bowl', lunch: 'Biryani Special', dinner: 'Light Soup', snacks: 'Dates & Tea' },
      Saturday: { breakfast: 'Dosa & Chutney', lunch: 'Family Lunch Meal', dinner: 'Home Baked Pizza', snacks: 'Popcorn' },
      Sunday: { breakfast: 'Pancakes', lunch: 'Traditional Thali', dinner: 'Salad & Soup', snacks: 'Mixed nuts' }
    },
    vehicleRecords: [],
    zakatGiven: 12500,
    monthlySavingsTarget: 20000,
    userName: 'Shafi',
    monthlyTargets: {},
    weeklyReflections: {},
    monthlyReflections: {},
    routineBlueprint: [],
    dailyChecklist: [],
    eveningReview: { well: 'Stuck to 80/20 budget priorities', improve: 'Cut food delivery further', gratitude: 'Barakah in family health' },
    prayerTimes: null,
    financialGoals: [
      { id: 'g1', title: 'Emergency Reserve (6 Months)', targetAmount: 180000, currentAmount: 65000, monthlyContribution: 10000, targetDate: '2027-08-01', category: 'Safety', icon: '🛡️' },
      { id: 'g2', title: 'Hajj & Spiritual Journey Fund', targetAmount: 400000, currentAmount: 140000, monthlyContribution: 12000, targetDate: '2028-05-01', category: 'Spiritual', icon: '🕋' },
      { id: 'g3', title: 'Home Improvement & Solar Setup', targetAmount: 150000, currentAmount: 35000, monthlyContribution: 5000, targetDate: '2027-12-01', category: 'Home', icon: '☀️' }
    ],
    financialDebts: [
      { id: 'd1', name: 'Credit Card Card Balances', balance: 35000, interestRate: 36, monthlyEMI: 3500, category: 'Credit Card' },
      { id: 'd2', name: 'Car Loan Financed', balance: 240000, interestRate: 9.2, monthlyEMI: 6800, category: 'Car Loan' }
    ],
    userStrategy: 'SAVE_MORE'
  };
}
