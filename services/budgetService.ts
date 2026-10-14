import { BudgetCategory, MonthlyBudgetPlan, Transaction, WealthType, RecurringExpenseItem, AutofillMemoryItem } from '../types';

export const DEFAULT_MONTHLY_BUDGET = 20000;

export const DEFAULT_BUDGET_CATEGORIES: BudgetCategory[] = [
  {
    id: 'cat-food',
    name: 'Food & Groceries',
    icon: '🛒',
    isSavings: false,
    order: 1,
    subcategories: [
      { id: 'sub-ration', name: 'Ration Shop', plannedAmount: 1000, order: 1 },
      { id: 'sub-maveli', name: 'Maveli Store', plannedAmount: 1500, order: 2 },
      { id: 'sub-veg', name: 'Vegetables', plannedAmount: 2500, order: 3 },
      { id: 'sub-fish', name: 'Fish', plannedAmount: 800, order: 4 },
      { id: 'sub-meat', name: 'Chicken / Meat', plannedAmount: 1200, order: 5 },
      { id: 'sub-fruits', name: 'Fruits', plannedAmount: 500, order: 6 },
    ],
  },
  {
    id: 'cat-edu',
    name: 'Education & Schooling',
    icon: '🎓',
    isSavings: false,
    order: 2,
    subcategories: [
      { id: 'sub-azu-fee', name: "Azu's Fee", plannedAmount: 1000, order: 1 },
      { id: 'sub-snacks', name: 'Snacks', plannedAmount: 500, order: 2 },
      { id: 'sub-edu-other', name: 'Other', plannedAmount: 500, order: 3 },
    ],
  },
  {
    id: 'cat-util',
    name: 'Utilities & House Rent',
    icon: '⚡',
    isSavings: false,
    order: 3,
    subcategories: [
      { id: 'sub-elec', name: 'Electricity', plannedAmount: 1200, order: 1 },
      { id: 'sub-gas', name: 'Gas', plannedAmount: 1100, order: 2 },
      { id: 'sub-mobile', name: 'Mobile', plannedAmount: 700, order: 3 },
      { id: 'sub-house', name: 'Household', plannedAmount: 1000, order: 4 },
      { id: 'sub-rent', name: 'House Rent', plannedAmount: 0, order: 5 },
    ],
  },
  {
    id: 'cat-trans',
    name: 'Transport & Travel',
    icon: '🛵',
    isSavings: false,
    order: 4,
    subcategories: [
      { id: 'sub-scooter', name: 'Scooter', plannedAmount: 2500, order: 1 },
      { id: 'sub-car', name: 'Car', plannedAmount: 1000, order: 2 },
      { id: 'sub-service', name: 'Service', plannedAmount: 500, order: 3 },
      { id: 'sub-shop', name: 'Shopping', plannedAmount: 1000, order: 4 },
      { id: 'sub-ent', name: 'Entertainment', plannedAmount: 500, order: 5 },
    ],
  },
  {
    id: 'cat-sav',
    name: 'Chitty / Savings',
    icon: '💰',
    isSavings: true, // Separates savings/transfers from day-to-day spending
    order: 5,
    subcategories: [
      { id: 'sub-chitty', name: 'Chitty', plannedAmount: 5000, order: 1 },
      { id: 'sub-savings', name: 'Savings', plannedAmount: 5000, order: 2 },
    ],
  },
];

// Default Autofill Memory / Intelligent suggestions
export const DEFAULT_AUTOFILL_ITEMS: AutofillMemoryItem[] = [
  {
    id: 'af-1',
    type: 'Expense',
    description: 'Petrol',
    category: 'Transport & Travel',
    subcategory: 'Scooter',
    account: 'UPI / GPay',
    paymentMethod: 'UPI',
    remarks: 'Monthly scooter fuel',
    frequencyCount: 15,
    lastUsed: new Date().toISOString(),
  },
  {
    id: 'af-2',
    type: 'Expense',
    description: 'Electricity Bill',
    category: 'Utilities & House Rent',
    subcategory: 'Electricity',
    account: 'Bank Account',
    paymentMethod: 'Net Banking',
    remarks: 'KSEB monthly bill',
    frequencyCount: 12,
    lastUsed: new Date().toISOString(),
  },
  {
    id: 'af-3',
    type: 'Expense',
    description: 'LPG Cylinder',
    category: 'Utilities & House Rent',
    subcategory: 'Gas',
    account: 'UPI / GPay',
    paymentMethod: 'UPI',
    remarks: 'Cooking gas refill',
    frequencyCount: 8,
    lastUsed: new Date().toISOString(),
  },
  {
    id: 'af-4',
    type: 'Expense',
    description: 'School Fee',
    category: 'Education & Schooling',
    subcategory: "Azu's Fee",
    account: 'Bank Account',
    paymentMethod: 'Net Banking',
    remarks: 'Monthly tuition & term fee',
    frequencyCount: 10,
    lastUsed: new Date().toISOString(),
  },
  {
    id: 'af-5',
    type: 'Expense',
    description: 'Vegetables',
    category: 'Food & Groceries',
    subcategory: 'Vegetables',
    account: 'Cash in Hand',
    paymentMethod: 'Cash',
    remarks: 'Weekly market veggies',
    frequencyCount: 20,
    lastUsed: new Date().toISOString(),
  },
  {
    id: 'af-6',
    type: 'Expense',
    description: 'Fish Market',
    category: 'Food & Groceries',
    subcategory: 'Fish',
    account: 'Cash in Hand',
    paymentMethod: 'Cash',
    remarks: 'Fresh catch from harbor',
    frequencyCount: 18,
    lastUsed: new Date().toISOString(),
  },
  {
    id: 'af-7',
    type: 'Expense',
    description: 'Maveli Store Groceries',
    category: 'Food & Groceries',
    subcategory: 'Maveli Store',
    account: 'UPI / GPay',
    paymentMethod: 'UPI',
    remarks: 'Subsidized kitchen staples',
    frequencyCount: 14,
    lastUsed: new Date().toISOString(),
  },
  {
    id: 'af-8',
    type: 'Expense',
    description: 'Chitty Installment',
    category: 'Chitty / Savings',
    subcategory: 'Chitty',
    account: 'Bank Account',
    paymentMethod: 'Net Banking',
    remarks: 'Monthly KSFE Chitty remittance',
    frequencyCount: 12,
    lastUsed: new Date().toISOString(),
  },
  {
    id: 'af-9',
    type: 'Income',
    description: 'Salary Credit',
    category: 'Income',
    subcategory: 'Salary',
    account: 'Bank Account',
    paymentMethod: 'Direct Deposit',
    remarks: 'Primary monthly employment income',
    frequencyCount: 12,
    lastUsed: new Date().toISOString(),
  },
  {
    id: 'af-10',
    type: 'Income',
    description: 'Freelance Design / Consulting',
    category: 'Income',
    subcategory: 'Freelance',
    account: 'Bank Account',
    paymentMethod: 'UPI',
    remarks: 'Client project milestone',
    frequencyCount: 6,
    lastUsed: new Date().toISOString(),
  },
];

export const COMMON_ACCOUNTS = [
  'Bank Account (Primary)',
  'Bank Account (Savings)',
  'Cash in Hand',
  'UPI / GPay',
  'Credit Card',
  'Post Office / KSFE',
];

export const COMMON_PAYMENT_METHODS = [
  'UPI',
  'Cash',
  'Net Banking',
  'Debit Card',
  'Credit Card',
  'Auto Debit / ECS',
];

export const INCOME_CATEGORIES = [
  'Salary',
  'Business Income',
  'Freelance',
  'Rental Income',
  'Interest',
  'Dividends',
  'Gift / Family',
  'Other Income',
];

// Helper to get or clone plan for a given month
export function getOrCreateMonthlyPlan(
  monthlyPlans: Record<string, MonthlyBudgetPlan> | undefined,
  masterCategories: BudgetCategory[] | undefined,
  monthKey: string
): MonthlyBudgetPlan {
  if (monthlyPlans && monthlyPlans[monthKey]) {
    return monthlyPlans[monthKey];
  }

  // Use custom categories if user customized them, else DEFAULT_BUDGET_CATEGORIES
  const baseCategories = (masterCategories && masterCategories.length > 0)
    ? masterCategories
    : DEFAULT_BUDGET_CATEGORIES;

  // Deep clone to isolate month's planned amounts
  const clonedCategories: BudgetCategory[] = JSON.parse(JSON.stringify(baseCategories));

  return {
    monthKey,
    totalMonthlyBudget: DEFAULT_MONTHLY_BUDGET,
    categories: clonedCategories,
  };
}

// Calculate summary stats for a month
export interface BudgetSummary {
  monthKey: string;
  totalMonthlyBudget: number;
  totalPlannedAllocation: number;
  spendingPlanned: number; // Planned without savings
  savingsPlanned: number; // Planned savings
  actualExpenses: number; // Day-to-day spending (excluding internal transfers & savings contributions)
  actualSavings: number; // Savings contributions & chitty
  totalActualOutflow: number;
  remainingBudget: number; // Total Monthly Budget - actual eligible expenses
  remainingAllocation: number; // Planned Allocation - actual eligible expenses
  unallocatedBudget: number; // Total Monthly Budget - Total Planned Allocation
  isOverallocated: boolean;
  overallocatedAmount: number;
  items: BudgetItemRow[];
}

export interface BudgetItemRow {
  categoryId: string;
  categoryName: string;
  categoryIcon: string;
  isSavings: boolean;
  subcategoryId: string;
  subcategoryName: string;
  plannedAmount: number;
  actualSpent: number;
  remaining: number; // Planned - Actual
  variance: number; // Planned - Actual
  percentSpent: number;
  status: 'under' | 'near' | 'over';
}

export function calculateBudgetSummary(
  plan: MonthlyBudgetPlan,
  transactions: Transaction[],
  monthKey: string
): BudgetSummary {
  const [yearStr, monthStr] = monthKey.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10) - 1; // 0-indexed

  // Filter transactions for this exact month
  const monthTx = transactions.filter(t => {
    if (!t.date) return false;
    const d = new Date(t.date);
    return d.getFullYear() === year && d.getMonth() === month;
  });

  // Calculate actual spent per category / subcategory
  // Normalize comparison strings
  const getSubcategorySpent = (catName: string, subName: string, isSavingsCat: boolean): number => {
    const cNorm = catName.trim().toLowerCase();
    const sNorm = subName.trim().toLowerCase();

    return monthTx.reduce((sum, t) => {
      // Must be an expense, savings contribution, debt payment, etc.
      // Transfers between own accounts are internal transfers and excluded from spending!
      const tType = t.transactionType || (t.type === WealthType.EXPENSE ? 'Expense' : t.type);
      if (tType === 'Transfer') return sum; // internal transfer excluded

      // Match either by explicit category & subcategory, or by text matching
      const tCat = (t.category || '').trim().toLowerCase();
      const tSub = (t.subcategory || '').trim().toLowerCase();
      const tDesc = (t.description || '').trim().toLowerCase();

      let isMatch = false;

      // 1. Direct subcategory match
      if (tSub && tSub === sNorm) {
        isMatch = true;
      }
      // 2. Direct category match with subcategory in description
      else if (tCat === cNorm && tDesc.includes(sNorm)) {
        isMatch = true;
      }
      // 3. Fallback: description contains subcategory name directly
      else if (tDesc.includes(sNorm) || sNorm.includes(tDesc)) {
        // Double check category or general match
        if (!tCat || tCat === cNorm) {
          isMatch = true;
        }
      }

      if (isMatch) {
        return sum + (Number(t.amount) || 0);
      }
      return sum;
    }, 0);
  };

  const items: BudgetItemRow[] = [];
  let totalPlannedAllocation = 0;
  let spendingPlanned = 0;
  let savingsPlanned = 0;
  let actualExpenses = 0;
  let actualSavings = 0;

  plan.categories.forEach(cat => {
    if (cat.archived) return;

    cat.subcategories.forEach(sub => {
      if (sub.archived) return;

      const planned = Number(sub.plannedAmount) || 0;
      totalPlannedAllocation += planned;

      if (cat.isSavings) {
        savingsPlanned += planned;
      } else {
        spendingPlanned += planned;
      }

      const spent = getSubcategorySpent(cat.name, sub.name, !!cat.isSavings);

      if (cat.isSavings) {
        actualSavings += spent;
      } else {
        actualExpenses += spent;
      }

      const remaining = planned - spent;
      const variance = planned - spent;
      const percent = planned > 0 ? (spent / planned) * 100 : spent > 0 ? 100 : 0;

      let status: 'under' | 'near' | 'over' = 'under';
      if (percent >= 100) status = 'over';
      else if (percent >= 80) status = 'near';

      items.push({
        categoryId: cat.id,
        categoryName: cat.name,
        categoryIcon: cat.icon || '🏷️',
        isSavings: !!cat.isSavings,
        subcategoryId: sub.id,
        subcategoryName: sub.name,
        plannedAmount: planned,
        actualSpent: spent,
        remaining,
        variance,
        percentSpent: percent,
        status,
      });
    });
  });

  const totalMonthlyBudget = Number(plan.totalMonthlyBudget) || DEFAULT_MONTHLY_BUDGET;
  const remainingBudget = totalMonthlyBudget - actualExpenses;
  const remainingAllocation = totalPlannedAllocation - actualExpenses;
  const unallocatedBudget = totalMonthlyBudget - totalPlannedAllocation;
  const isOverallocated = totalPlannedAllocation > totalMonthlyBudget;
  const overallocatedAmount = isOverallocated ? totalPlannedAllocation - totalMonthlyBudget : 0;
  const totalActualOutflow = actualExpenses + actualSavings;

  return {
    monthKey,
    totalMonthlyBudget,
    totalPlannedAllocation,
    spendingPlanned,
    savingsPlanned,
    actualExpenses,
    actualSavings,
    totalActualOutflow,
    remainingBudget,
    remainingAllocation,
    unallocatedBudget,
    isOverallocated,
    overallocatedAmount,
    items,
  };
}

// Convert recurring expenses to monthly equivalent
export function calculateMonthlyEquivalent(amount: number, freq: string): number {
  switch (freq) {
    case 'Weekly':
      return Math.round(amount * 4.333);
    case 'Every 2 weeks':
      return Math.round(amount * 2.166);
    case 'Monthly':
      return Math.round(amount);
    case 'Every 2 months':
      return Math.round(amount / 2);
    case 'Quarterly':
      return Math.round(amount / 3);
    case 'Every 6 months':
      return Math.round(amount / 6);
    case 'Yearly':
      return Math.round(amount / 12);
    default:
      return Math.round(amount);
  }
}

// ============================================================================
// INTELLIGENT BUDGET CATEGORY ALERTS & NOTIFICATION SYSTEM (>=80% THRESHOLD)
// ============================================================================

export interface BudgetCategoryAlert {
  categoryId: string;
  categoryName: string;
  categoryIcon: string;
  isSavings: boolean;
  totalPlanned: number;
  actualSpent: number;
  remaining: number;
  overrun: number;
  percentSpent: number;
  severity: 'caution' | 'critical'; // caution: 80% <= percent < 100%, critical: percent >= 100%
  daysElapsed: number;
  totalDaysInMonth: number;
  daysRemaining: number;
  dailyBurnRate: number;
  projectedMonthEndSpend: number;
  projectedOverspend: number;
  recommendedDailyCap: number; // safe daily allowance for remaining days
  isPacingFast: boolean; // true if category spend is pacing ahead of month timeline
  pacingRatio: number; // percentSpent / percentOfMonthElapsed
  topSubcategoryDrivers: {
    subcategoryId: string;
    subcategoryName: string;
    plannedAmount: number;
    actualSpent: number;
    percentSpent: number;
    status: 'under' | 'near' | 'over';
  }[];
}

export interface BudgetAlertsSummary {
  alerts: BudgetCategoryAlert[];
  criticalCount: number;
  cautionCount: number;
  totalOverrunAmount: number;
  highestSeverity: 'none' | 'caution' | 'critical';
  allCategories: {
    categoryId: string;
    categoryName: string;
    categoryIcon: string;
    isSavings: boolean;
    totalPlanned: number;
    actualSpent: number;
    percentSpent: number;
    status: 'safe' | 'caution' | 'critical';
  }[];
  daysElapsed: number;
  totalDaysInMonth: number;
  daysRemaining: number;
  monthElapsedPct: number;
}

export function calculateBudgetCategoryAlerts(
  plan: MonthlyBudgetPlan,
  transactions: Transaction[],
  monthKey?: string
): BudgetAlertsSummary {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();
  const targetMonthKey = monthKey || `${currentYear}-${(currentMonth + 1).toString().padStart(2, '0')}`;
  
  const [yearStr, monthStr] = targetMonthKey.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10) - 1;

  const isCurrentMonth = year === currentYear && month === currentMonth;
  const totalDaysInMonth = new Date(year, month + 1, 0).getDate();
  const daysElapsed = isCurrentMonth ? Math.min(now.getDate(), totalDaysInMonth) : totalDaysInMonth;
  const daysRemaining = Math.max(1, totalDaysInMonth - daysElapsed + 1);
  const monthElapsedPct = Math.round((daysElapsed / totalDaysInMonth) * 100);

  const summary = calculateBudgetSummary(plan, transactions, targetMonthKey);

  const alerts: BudgetCategoryAlert[] = [];
  const allCategories: BudgetAlertsSummary['allCategories'] = [];
  let criticalCount = 0;
  let cautionCount = 0;
  let totalOverrunAmount = 0;

  plan.categories.forEach(cat => {
    if (cat.archived) return;

    // Subcategories in this category
    const activeSubcategories = cat.subcategories.filter(s => !s.archived);
    const totalPlanned = activeSubcategories.reduce((sum, s) => sum + (Number(s.plannedAmount) || 0), 0);

    // Sum actual spent from summary.items matching this category
    const catItems = summary.items.filter(item => item.categoryId === cat.id);
    const actualSpent = catItems.reduce((sum, item) => sum + item.actualSpent, 0);

    // Map subcategory drivers
    const topSubcategoryDrivers = catItems.map(item => ({
      subcategoryId: item.subcategoryId,
      subcategoryName: item.subcategoryName,
      plannedAmount: item.plannedAmount,
      actualSpent: item.actualSpent,
      percentSpent: Math.round(item.percentSpent),
      status: item.status,
    })).sort((a, b) => b.percentSpent - a.percentSpent);

    const percentSpent = totalPlanned > 0
      ? Math.round((actualSpent / totalPlanned) * 100)
      : actualSpent > 0 ? 100 : 0;

    let status: 'safe' | 'caution' | 'critical' = 'safe';
    if (percentSpent >= 100) {
      status = 'critical';
    } else if (percentSpent >= 80) {
      status = 'caution';
    }

    allCategories.push({
      categoryId: cat.id,
      categoryName: cat.name,
      categoryIcon: cat.icon || '🏷️',
      isSavings: !!cat.isSavings,
      totalPlanned,
      actualSpent,
      percentSpent,
      status,
    });

    // Alert triggers if category reaches or exceeds 80% of its planned allocation
    if (percentSpent >= 80 && totalPlanned > 0) {
      const severity: 'caution' | 'critical' = percentSpent >= 100 ? 'critical' : 'caution';
      if (severity === 'critical') {
        criticalCount++;
        totalOverrunAmount += Math.max(0, actualSpent - totalPlanned);
      } else {
        cautionCount++;
      }

      const remaining = Math.max(0, totalPlanned - actualSpent);
      const overrun = Math.max(0, actualSpent - totalPlanned);
      const dailyBurnRate = daysElapsed > 0 ? Math.round(actualSpent / daysElapsed) : 0;
      const projectedMonthEndSpend = Math.round(dailyBurnRate * totalDaysInMonth);
      const projectedOverspend = Math.max(0, projectedMonthEndSpend - totalPlanned);
      const recommendedDailyCap = Math.max(0, Math.round(remaining / daysRemaining));
      const pacingRatio = monthElapsedPct > 0 ? Number((percentSpent / monthElapsedPct).toFixed(2)) : 1;
      const isPacingFast = percentSpent > (monthElapsedPct * 1.05);

      alerts.push({
        categoryId: cat.id,
        categoryName: cat.name,
        categoryIcon: cat.icon || '🏷️',
        isSavings: !!cat.isSavings,
        totalPlanned,
        actualSpent,
        remaining,
        overrun,
        percentSpent,
        severity,
        daysElapsed,
        totalDaysInMonth,
        daysRemaining,
        dailyBurnRate,
        projectedMonthEndSpend,
        projectedOverspend,
        recommendedDailyCap,
        isPacingFast,
        pacingRatio,
        topSubcategoryDrivers,
      });
    }
  });

  // Sort alerts: critical overruns first, then highest percentSpent
  alerts.sort((a, b) => {
    if (a.severity === 'critical' && b.severity !== 'critical') return -1;
    if (a.severity !== 'critical' && b.severity === 'critical') return 1;
    return b.percentSpent - a.percentSpent;
  });

  const highestSeverity: 'none' | 'caution' | 'critical' = criticalCount > 0 
    ? 'critical' 
    : cautionCount > 0 
    ? 'caution' 
    : 'none';

  return {
    alerts,
    criticalCount,
    cautionCount,
    totalOverrunAmount,
    highestSeverity,
    allCategories,
    daysElapsed,
    totalDaysInMonth,
    daysRemaining,
    monthElapsedPct,
  };
}
