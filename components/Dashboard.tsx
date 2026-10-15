import React, { useMemo, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { AppState, WealthType, KakeiboCategory, Transaction } from '../types';
import { getDashboardIntel } from '../services/geminiService';
import { 
  DEFAULT_MONTHLY_BUDGET, 
  getOrCreateMonthlyPlan, 
  calculateBudgetSummary,
  calculateBudgetCategoryAlerts
} from '../services/budgetService';
import QuickAddModal from './QuickAddModal';
import MonthlySpendingChart from './MonthlySpendingChart';
import { WelcomeBanner } from './WelcomeBanner';
import { motion } from 'motion/react';

const CATEGORY_ICONS: Record<KakeiboCategory, string> = {
  [KakeiboCategory.NEEDS]: '🏠',
  [KakeiboCategory.WANTS]: '🛍️',
  [KakeiboCategory.CULTURE]: '🎭',
  [KakeiboCategory.UNEXPECTED]: '⚡',
};

const Dashboard: React.FC<{ 
  state: AppState; 
  onUpdateUser: (name: string) => void;
  onAddTransaction: (t: Omit<Transaction, 'id'>) => void;
}> = ({ state, onUpdateUser, onAddTransaction }) => {
  const [advice, setAdvice] = useState<string>('Seeking financial wisdom...');
  const [kakeiboInsight, setKakeiboInsight] = useState<string>('Analyzing spending patterns...');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showBalance, setShowBalance] = useState(true);

  const stats = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const currentMonthTransactions = state.transactions.filter(t => {
      const d = new Date(t.date);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });

    const income = currentMonthTransactions
      .filter(t => t.type === WealthType.INCOME)
      .reduce((acc, t) => acc + t.amount, 0);

    const expenses = currentMonthTransactions
      .filter(t => t.type === WealthType.EXPENSE)
      .reduce((acc, t) => acc + t.amount, 0);

    const savings = income - expenses;

    const kakeiboBreakdown: Record<string, number> = {
      [KakeiboCategory.NEEDS]: 0,
      [KakeiboCategory.WANTS]: 0,
      [KakeiboCategory.CULTURE]: 0,
      [KakeiboCategory.UNEXPECTED]: 0,
    };

    currentMonthTransactions.forEach(t => {
      if (t.type === WealthType.EXPENSE && t.kakeiboCategory) {
        kakeiboBreakdown[t.kakeiboCategory] += t.amount;
      }
    });

    const recurringExpenses = state.transactions
      .filter(t => t.isRecurring && t.type === WealthType.EXPENSE);

    const totalRecurring = recurringExpenses.reduce((sum, t) => sum + t.amount, 0);

    return { income, expenses, savings, kakeiboBreakdown, currentMonthTransactions, recurringExpenses, totalRecurring };
  }, [state]);

  useEffect(() => {
    let isMounted = true;
    const fetchIntel = async () => {
      const intel = await getDashboardIntel(state);
      if (isMounted) {
        setAdvice(intel.advice);
        setKakeiboInsight(intel.kakeiboInsight);
      }
    };
    fetchIntel();
    return () => { isMounted = false; };
  }, [state.transactions.length, state.monthlySavingsTarget, state.zakatGiven]);

  // Savings Goal calculation
  const savingsTarget = state.monthlySavingsTarget || 5000;
  const savingsProgress = Math.min(100, Math.max(0, Math.round((stats.savings / savingsTarget) * 100)));

  // Recent Transactions (top 5)
  const recentTransactions = useMemo(() => {
    return [...state.transactions]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 6);
  }, [state.transactions]);

  // Top 80/20 Insight calculation
  const topExpenseRatio = stats.expenses > 0
    ? Math.round(((stats.kakeiboBreakdown[KakeiboCategory.NEEDS] + stats.kakeiboBreakdown[KakeiboCategory.WANTS]) / stats.expenses) * 100)
    : 80;

  // Daily Spending Limit & Monthly Pacer Calculations
  const dailyPacerStats = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const currentDayOfMonth = now.getDate();
    const currentMonthKey = `${currentYear}-${(currentMonth + 1).toString().padStart(2, '0')}`;
    
    const totalDaysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const daysRemaining = Math.max(1, totalDaysInMonth - currentDayOfMonth + 1);
    const daysElapsed = currentDayOfMonth;

    // Monthly plan & summary
    const plan = getOrCreateMonthlyPlan(
      state.monthlyBudgetPlans,
      state.customBudgetCategories,
      currentMonthKey
    );
    const summary = calculateBudgetSummary(plan, state.transactions || [], currentMonthKey);
    const monthlyBudget = plan.totalMonthlyBudget || DEFAULT_MONTHLY_BUDGET;
    const actualSpentThisMonth = summary.actualExpenses;
    const remainingMonthlyBudget = Math.max(0, monthlyBudget - actualSpentThisMonth);

    // Baseline daily allocation (spread evenly across all days of the month)
    const baselineDailyLimit = Math.max(1, Math.round(monthlyBudget / totalDaysInMonth));

    // Dynamic daily spending limit: remaining budget spread over remaining days
    const dynamicDailyLimit = Math.max(0, Math.round(remainingMonthlyBudget / daysRemaining));

    // Target daily limit: prioritize dynamic daily limit if budget remains, else baseline
    const targetDailyLimit = dynamicDailyLimit > 0 ? dynamicDailyLimit : baselineDailyLimit;

    // Today's eligible day-to-day expenses
    const todayExpenses = (state.transactions || []).filter(t => {
      if (!t.date) return false;
      const d = new Date(t.date);
      const isToday = (
        d.getFullYear() === currentYear &&
        d.getMonth() === currentMonth &&
        d.getDate() === currentDayOfMonth
      );
      const tType = t.transactionType || (t.type === WealthType.EXPENSE ? 'Expense' : t.type);
      const isEligibleExpense = tType === 'Expense' || tType === 'Debt Payment';
      return isToday && isEligibleExpense;
    }).reduce((sum, t) => sum + t.amount, 0);

    const remainingToday = Math.max(0, targetDailyLimit - todayExpenses);
    const overSpentToday = Math.max(0, todayExpenses - targetDailyLimit);

    // Daily percentage spent
    const percentSpentToday = targetDailyLimit > 0 
      ? Math.round((todayExpenses / targetDailyLimit) * 100) 
      : 0;
    const clampedProgress = Math.min(100, Math.max(0, percentSpentToday));

    // Monthly pacing comparison
    const monthTimeProgressPct = Math.round((daysElapsed / totalDaysInMonth) * 100);
    const budgetSpentPct = monthlyBudget > 0 
      ? Math.round((actualSpentThisMonth / monthlyBudget) * 100) 
      : 0;

    let paceStatus: 'under' | 'nearing' | 'over';
    let paceColor = '';

    if (todayExpenses > targetDailyLimit) {
      paceStatus = 'over';
      paceColor = 'text-rose-400 bg-rose-500/10 border-rose-500/30';
    } else if (percentSpentToday >= 75) {
      paceStatus = 'nearing';
      paceColor = 'text-amber-300 bg-amber-500/10 border-amber-500/30';
    } else {
      paceStatus = 'under';
      paceColor = 'text-lime-300 bg-lime-500/10 border-lime-500/30';
    }

    return {
      currentDayOfMonth,
      totalDaysInMonth,
      daysRemaining,
      daysElapsed,
      monthlyBudget,
      actualSpentThisMonth,
      remainingMonthlyBudget,
      baselineDailyLimit,
      dynamicDailyLimit,
      targetDailyLimit,
      todayExpenses,
      remainingToday,
      overSpentToday,
      percentSpentToday,
      clampedProgress,
      monthTimeProgressPct,
      budgetSpentPct,
      paceStatus,
      paceColor,
      monthName: now.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })
    };
  }, [state.monthlyBudgetPlans, state.customBudgetCategories, state.transactions]);

  // Intelligent Budget Category Alerts (Triggers when any category exceeds >=80% of planned allocation)
  const budgetAlertsSummary = useMemo(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    const currentMonthKey = `${currentYear}-${(currentMonth + 1).toString().padStart(2, '0')}`;
    
    const plan = getOrCreateMonthlyPlan(
      state.monthlyBudgetPlans,
      state.customBudgetCategories,
      currentMonthKey
    );
    return calculateBudgetCategoryAlerts(plan, state.transactions || [], currentMonthKey);
  }, [state.monthlyBudgetPlans, state.customBudgetCategories, state.transactions]);

  return (
    <div className="space-y-3.5 md:space-y-4 animate-in fade-in duration-300 text-[#24342B] max-w-6xl mx-auto pb-12">
      
      {/* ========================================================================= */}
      {/* WELCOME BANNER & INTELLIGENT BUDGET NOTIFICATION CENTER                   */}
      {/* ========================================================================= */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
      >
        <WelcomeBanner 
          userName={state.userName}
          onUpdateUserName={onUpdateUser}
          alertsSummary={budgetAlertsSummary}
          dailyPacerStats={dailyPacerStats}
          onOpenQuickAdd={() => setIsModalOpen(true)}
        />
      </motion.div>

      {/* ========================================================================= */}
      {/* ROW 1: COMPACT KPI GRID (4 cols desktop, 2 cols mobile)                   */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* KPI 1: Net Balance */}
        <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-[#E1E5DC] shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs font-semibold text-[#68756C]">
            <span>Net Balance</span>
            <div className="flex items-center gap-1.5">
              <button 
                onClick={() => setShowBalance(!showBalance)}
                className="text-[#81897F] hover:text-[#244A38] p-0.5 text-xs transition-colors"
                title="Toggle visibility"
              >
                {showBalance ? '👁️' : '🔒'}
              </button>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-[#EAF7ED] text-[#287548]">
                ↑ +8.2%
              </span>
            </div>
          </div>
          <div className="my-1.5">
            <span className="text-xl sm:text-2xl font-bold text-[#24342B] tracking-tight">
              {showBalance ? `₹${stats.savings.toLocaleString()}` : '••••••'}
            </span>
          </div>
          <div className="text-[11px] text-[#68756C]">
            Active saved position
          </div>
        </div>

        {/* KPI 2: Income */}
        <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-[#E1E5DC] shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs font-semibold text-[#68756C]">
            <span>Monthly Income</span>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-[#EAF7ED] text-[#287548]">
              Inflow
            </span>
          </div>
          <div className="my-1.5">
            <span className="text-xl sm:text-2xl font-bold text-[#287548] tracking-tight">
              ₹{stats.income.toLocaleString()}
            </span>
          </div>
          <div className="text-[11px] text-[#68756C]">
            Salary & monthly credits
          </div>
        </div>

        {/* KPI 3: Expenses */}
        <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-[#E1E5DC] shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs font-semibold text-[#68756C]">
            <span>Monthly Expenses</span>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-[#FDF1EF] text-[#B85D4B]">
              Outflow
            </span>
          </div>
          <div className="my-1.5">
            <span className="text-xl sm:text-2xl font-bold text-[#B85D4B] tracking-tight">
              ₹{stats.expenses.toLocaleString()}
            </span>
          </div>
          <div className="text-[11px] text-[#68756C]">
            {stats.expenses > 0 ? `${Math.round((stats.expenses / (stats.income || 1)) * 100)}% of income` : '0% of income'}
          </div>
        </div>

        {/* KPI 4: Savings Goal */}
        <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-[#E1E5DC] shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs font-semibold text-[#68756C]">
            <span>Savings Target</span>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-[#EAF1E6] text-[#315F43]">
              {savingsProgress}%
            </span>
          </div>
          <div className="my-1.5">
            <span className="text-xl sm:text-2xl font-bold text-[#315F43] tracking-tight">
              ₹{stats.savings > 0 ? stats.savings.toLocaleString() : '0'}
            </span>
          </div>
          <div className="w-full bg-[#F0F1E9] rounded-full h-1.5 overflow-hidden">
            <div className="h-full bg-[#244A38] rounded-full" style={{ width: `${savingsProgress}%` }} />
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* DAILY SPENDING LIMIT & MONTHLY PACER PROGRESS                             */}
      {/* ========================================================================= */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-[#E1E5DC] shadow-xs space-y-3.5">
        {/* Header with Title, Status Badge, and Quick Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#E1E5DC]">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="p-1 rounded-lg bg-[#EAF1E6] text-[#244A38] text-sm">⏱️</span>
              <h2 className="text-sm md:text-base font-bold text-[#24342B] tracking-tight">
                Daily Spending Limit
              </h2>
              <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${
                dailyPacerStats.paceStatus === 'over'
                  ? 'bg-[#FDF2F2] text-[#B63D3D] border-[#CBD5C8]'
                  : dailyPacerStats.paceStatus === 'nearing'
                  ? 'bg-[#FEF7ED] text-[#A96C18] border-[#E1E5DC]'
                  : 'bg-[#EAF7ED] text-[#287548] border-[#CBD5C8]'
              }`}>
                {dailyPacerStats.paceStatus === 'over' ? '⚠️ Exceeded Limit' : dailyPacerStats.paceStatus === 'nearing' ? '⚡ Nearing Limit' : '✓ On Track'}
              </span>
              {budgetAlertsSummary.alerts.length > 0 && (
                <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${
                  budgetAlertsSummary.criticalCount > 0 
                    ? 'bg-[#FDF2F2] text-[#B63D3D] border-[#CBD5C8]' 
                    : 'bg-[#FEF7ED] text-[#A96C18] border-[#E1E5DC]'
                }`}>
                  ⚠️ {budgetAlertsSummary.alerts.length} Category Alert{budgetAlertsSummary.alerts.length > 1 ? 's' : ''} (≥80%)
                </span>
              )}
            </div>
            <p className="text-xs text-[#68756C] mt-1">
              Estimated safe limit based on your <span className="text-[#24342B] font-bold">₹{dailyPacerStats.monthlyBudget.toLocaleString()}</span> budget for {dailyPacerStats.monthName}.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-3 py-1.5 rounded-xl bg-[#244A38] hover:bg-[#1a382a] text-white text-xs font-bold shadow-xs transition-all flex items-center gap-1.5"
            >
              <span>+</span>
              <span>Log Expense</span>
            </button>
            <Link
              to="/budget"
              className="px-3 py-1.5 rounded-xl bg-white hover:bg-[#F0F1E9] border border-[#CBD5C8] text-[#244A38] text-xs font-bold transition-all"
            >
              Budget Details →
            </Link>
          </div>
        </div>

        {/* Primary Daily Spending Bar */}
        <div className="space-y-2">
          <div className="flex items-baseline justify-between flex-wrap gap-2">
            <div>
              <span className="text-xs text-[#68756C] font-medium">Today's Spend: </span>
              <span className="text-xl sm:text-2xl font-bold text-[#24342B] tracking-tight">
                ₹{dailyPacerStats.todayExpenses.toLocaleString()}
              </span>
              <span className="text-xs text-[#68756C] ml-1">
                / ₹{dailyPacerStats.targetDailyLimit.toLocaleString()} daily limit
              </span>
            </div>

            <div className="text-xs font-semibold">
              {dailyPacerStats.paceStatus === 'over' ? (
                <span className="text-[#B63D3D]">
                  +₹{dailyPacerStats.overSpentToday.toLocaleString()} over limit today
                </span>
              ) : (
                <span className="text-[#287548]">
                  ₹{dailyPacerStats.remainingToday.toLocaleString()} left to spend today
                </span>
              )}
              <span className="text-[#81897F] ml-1.5 font-normal">
                ({dailyPacerStats.percentSpentToday}%)
              </span>
            </div>
          </div>

          {/* Visual Progress Bar */}
          <div className="space-y-1">
            <div className="w-full bg-[#F0F1E9] rounded-full h-2.5 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  dailyPacerStats.paceStatus === 'over'
                    ? 'bg-[#B63D3D]'
                    : dailyPacerStats.paceStatus === 'nearing'
                    ? 'bg-[#A96C18]'
                    : 'bg-[#244A38]'
                }`}
                style={{ width: `${dailyPacerStats.clampedProgress}%` }}
              />
            </div>

            <div className="flex justify-between text-[10px] text-[#81897F] px-0.5">
              <span>₹0</span>
              <span>50%</span>
              <span>75%</span>
              <span className="font-semibold text-[#68756C]">Limit: ₹{dailyPacerStats.targetDailyLimit.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* 3-Column Contextual Breakdown: Daily Allowance, Monthly Remaining, Pace Health */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-3 border-t border-[#E1E5DC] text-xs">
          {/* Card 1: Dynamic Safe Allowance */}
          <div className="p-3 rounded-xl bg-[#F0F1E9] border border-[#E1E5DC] flex flex-col justify-between">
            <span className="text-[10px] text-[#68756C] font-semibold uppercase tracking-wider">
              Remaining Daily Pace
            </span>
            <div className="my-1 flex items-baseline gap-1.5">
              <span className="text-base sm:text-lg font-bold text-[#24342B]">
                ₹{dailyPacerStats.dynamicDailyLimit.toLocaleString()}
              </span>
              <span className="text-[11px] text-[#68756C]">/ day</span>
            </div>
            <span className="text-[10px] text-[#81897F]">
              For remaining {dailyPacerStats.daysRemaining} days in month
            </span>
          </div>

          {/* Card 2: Remaining Month Budget */}
          <div className="p-3 rounded-xl bg-[#F0F1E9] border border-[#E1E5DC] flex flex-col justify-between">
            <span className="text-[10px] text-[#68756C] font-semibold uppercase tracking-wider">
              Month Budget Remaining
            </span>
            <div className="my-1 flex items-baseline gap-1.5">
              <span className="text-base sm:text-lg font-bold text-[#24342B]">
                ₹{dailyPacerStats.remainingMonthlyBudget.toLocaleString()}
              </span>
              <span className="text-[10px] text-[#68756C]">
                of ₹{dailyPacerStats.monthlyBudget.toLocaleString()}
              </span>
            </div>
            <div className="w-full bg-[#E1E5DC] rounded-full h-1.5 overflow-hidden">
              <div 
                className={`h-full rounded-full ${dailyPacerStats.budgetSpentPct > 90 ? 'bg-[#B63D3D]' : 'bg-[#244A38]'}`} 
                style={{ width: `${Math.min(100, dailyPacerStats.budgetSpentPct)}%` }} 
              />
            </div>
          </div>

          {/* Card 3: Month Time vs Budget Burn Rate */}
          <div className="p-3 rounded-xl bg-[#F0F1E9] border border-[#E1E5DC] flex flex-col justify-between">
            <span className="text-[10px] text-[#68756C] font-semibold uppercase tracking-wider">
              Time vs Spending Pace
            </span>
            <div className="my-1 flex items-center justify-between text-[11px]">
              <span className="text-[#24342B] font-bold">
                Day {dailyPacerStats.currentDayOfMonth}/{dailyPacerStats.totalDaysInMonth} ({dailyPacerStats.monthTimeProgressPct}%)
              </span>
              <span className={dailyPacerStats.budgetSpentPct > dailyPacerStats.monthTimeProgressPct ? 'text-[#A96C18] font-bold' : 'text-[#287548] font-bold'}>
                {dailyPacerStats.budgetSpentPct}% spent
              </span>
            </div>
            <span className="text-[10px] text-[#68756C]">
              {dailyPacerStats.budgetSpentPct <= dailyPacerStats.monthTimeProgressPct 
                ? '🟢 Spending slower than time elapsed (On Track)' 
                : '🟡 Spending faster than time elapsed (Caution)'}
            </span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* ROW 2: 80/20 INSIGHT BANNER & KAKEIBO ALLOCATION                          */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        {/* 80/20 Spotlight Banner (Spans 2 cols) */}
        <div className="lg:col-span-2 bg-[#244A38] text-white p-4 sm:p-5 rounded-2xl border border-[#315B45] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#315B45] text-white flex items-center justify-center font-bold text-lg shrink-0 shadow-inner">
              ⚡
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xs sm:text-sm font-bold text-white">80/20 Financial Focus</h3>
                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-[#A8C5A0] text-[#244A38]">
                  Pareto Rule
                </span>
              </div>
              <p className="text-xs text-[#EAF1E6] mt-0.5 leading-snug">
                Top 20% of decisions drive ~80% of wealth outcome. Optimize core drivers to unlock ₹4,500+ monthly.
              </p>
            </div>
          </div>

          <Link
            to="/pareto"
            className="w-full sm:w-auto px-4 py-2 rounded-xl bg-[#A8C5A0] hover:bg-[#b8d4b0] text-[#244A38] text-xs font-bold shadow-xs transition-all whitespace-nowrap text-center"
          >
            Explore 80/20 →
          </Link>
        </div>

        {/* Quick Kakeibo Status (1 col) */}
        <div className="bg-white p-4 rounded-2xl border border-[#E1E5DC] shadow-xs flex flex-col justify-between space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-[#24342B]">
            <span>Kakeibo Allocation</span>
            <Link to="/budget" className="text-[10px] text-[#244A38] hover:underline font-semibold">Details →</Link>
          </div>
          <div className="grid grid-cols-2 gap-2 text-[10px]">
            <div className="p-2 rounded-xl bg-[#F0F1E9] border border-[#E1E5DC]">
              <span className="text-[#68756C] block font-medium">Needs (50%)</span>
              <span className="font-bold text-[#24342B] text-xs">₹{(stats.kakeiboBreakdown[KakeiboCategory.NEEDS] || 0).toLocaleString()}</span>
            </div>
            <div className="p-2 rounded-xl bg-[#F0F1E9] border border-[#E1E5DC]">
              <span className="text-[#68756C] block font-medium">Wants (30%)</span>
              <span className="font-bold text-[#24342B] text-xs">₹{(stats.kakeiboBreakdown[KakeiboCategory.WANTS] || 0).toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* ROW 3: RECENT TRANSACTIONS (Compact Table) & RECURRING BILLS              */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        
        {/* Left: Recent Transactions (Spans 2 cols) */}
        <div className="lg:col-span-2 bg-white p-4 sm:p-5 rounded-2xl border border-[#E1E5DC] shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-[#E1E5DC] pb-2.5">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-[#24342B]">Recent Transactions</h3>
              <span className="text-xs text-[#68756C]">({recentTransactions.length})</span>
            </div>
            <div className="flex items-center gap-2.5">
              <button
                onClick={() => setIsModalOpen(true)}
                className="px-2.5 py-1 rounded-lg bg-[#244A38] text-white text-xs font-bold hover:bg-[#1a382a] transition-colors"
              >
                + Add
              </button>
              <Link to="/finance" className="text-xs text-[#244A38] font-semibold hover:underline">
                View All →
              </Link>
            </div>
          </div>

          {/* Compact Transaction Rows */}
          {recentTransactions.length === 0 ? (
            <div className="text-center py-6 text-[#68756C] text-xs">
              No transactions recorded yet. Click "+ Add" to log your first transaction.
            </div>
          ) : (
            <div className="space-y-2">
              {recentTransactions.map((t) => {
                const isIncome = t.type === WealthType.INCOME;
                const icon = t.kakeiboCategory ? CATEGORY_ICONS[t.kakeiboCategory] : '💳';

                return (
                  <div
                    key={t.id}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-[#F0F1E9] border border-[#E1E5DC] hover:bg-[#E9EEE5] transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-xs shrink-0 shadow-xs border border-[#E1E5DC]">
                        {icon}
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-[#24342B] truncate">{t.description}</div>
                        <div className="text-[11px] text-[#68756C] flex items-center gap-1.5">
                          <span>{new Date(t.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                          <span>•</span>
                          <span>{t.kakeiboCategory || t.type}</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className={`text-xs font-bold ${isIncome ? 'text-[#287548]' : 'text-[#24342B]'}`}>
                        {isIncome ? '+' : '-'}₹{t.amount.toLocaleString()}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right: Upcoming / Recurring Payments (1 col) */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-[#E1E5DC] shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-[#E1E5DC] pb-2.5">
            <h3 className="text-sm font-bold text-[#24342B]">Upcoming & Recurring</h3>
            <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-[#EAF1E6] text-[#315F43]">This Month</span>
          </div>

          {stats.recurringExpenses.length === 0 ? (
            <div className="text-center py-6 space-y-1">
              <span className="text-xl">⚡</span>
              <p className="text-xs text-[#68756C] font-medium">No recurring bills logged.</p>
              <p className="text-[10px] text-[#81897F]">Mark rent, WiFi, or EMIs as "Recurring" to track here.</p>
            </div>
          ) : (
            <div className="space-y-2 text-xs">
              {stats.recurringExpenses.slice(0, 4).map((bill) => (
                <div key={bill.id} className="p-2.5 rounded-xl bg-[#F0F1E9] border border-[#E1E5DC] flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="text-base">{bill.kakeiboCategory ? CATEGORY_ICONS[bill.kakeiboCategory] : '📱'}</span>
                    <div>
                      <div className="text-xs font-bold text-[#24342B] truncate max-w-[140px]">{bill.description}</div>
                      <div className="text-[11px] text-[#68756C]">{new Date(bill.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</div>
                    </div>
                  </div>
                  <span className="font-bold text-[#24342B] text-xs">₹{bill.amount.toLocaleString()}</span>
                </div>
              ))}
            </div>
          )}

          {stats.recurringExpenses.length > 0 && (
            <div className="p-2.5 rounded-xl bg-[#EAF1E6] border border-[#CBD5C8] text-xs text-[#315F43] flex items-center justify-between font-medium">
              <span>Committed: ₹{stats.totalRecurring.toLocaleString()}</span>
              <Link to="/finance" className="font-bold underline hover:text-[#244A38]">Manage</Link>
            </div>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* ROW 4: FINANCIAL GOALS PROGRESS & SPENDING TRENDS CHART                   */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {/* Goals Progress */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-[#E1E5DC] shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-[#E1E5DC] pb-2.5">
            <h3 className="text-sm font-bold text-[#24342B]">Financial Milestones</h3>
            <Link to="/goals" className="text-xs text-[#244A38] font-semibold hover:underline">
              View Goals →
            </Link>
          </div>

          {(!state.financialGoals || state.financialGoals.length === 0) ? (
            <div className="text-center py-6 space-y-2">
              <span className="text-2xl">🎯</span>
              <p className="text-xs text-[#68756C] font-medium">No financial goals created yet.</p>
              <Link 
                to="/goals"
                className="inline-block px-3 py-1.5 bg-[#244A38] text-white font-bold text-xs rounded-xl shadow-xs"
              >
                + Set Your First Goal
              </Link>
            </div>
          ) : (
            <div className="space-y-2.5">
              {state.financialGoals.slice(0, 3).map(g => {
                const pct = g.targetAmount > 0 ? Math.min(100, Math.round((g.currentAmount / g.targetAmount) * 100)) : 0;
                return (
                  <div key={g.id} className="p-3 rounded-xl bg-[#F0F1E9] border border-[#E1E5DC] space-y-1.5">
                    <div className="flex justify-between text-xs font-bold">
                      <span className="text-[#24342B]">{g.title}</span>
                      <span className="text-[#244A38]">{pct}%</span>
                    </div>
                    <div className="w-full bg-[#E1E5DC] rounded-full h-1.5 overflow-hidden">
                      <div className="h-full bg-[#244A38] rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                    <div className="flex justify-between text-[11px] text-[#68756C]">
                      <span>₹{g.currentAmount.toLocaleString()} saved</span>
                      <span>Target: ₹{g.targetAmount.toLocaleString()}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Monthly Spending Trends & Targets Chart */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-[#E1E5DC] shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-[#E1E5DC] pb-2.5 mb-2">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-[#24342B]">Spending Trends vs Targets</h3>
            </div>
            <div className="flex items-center gap-2">
              <Link to="/report" className="text-xs text-[#244A38] font-bold bg-[#EAF1E6] hover:bg-[#d8e8d2] px-2.5 py-1 rounded-lg border border-[#CBD5C8] transition-colors">
                📊 Monthly Report →
              </Link>
            </div>
          </div>
          <MonthlySpendingChart 
            spending={stats.kakeiboBreakdown} 
            targets={state.monthlyTargets['current'] || {}} 
            transactions={state.transactions}
            monthlySavingsTarget={state.monthlySavingsTarget}
          />
        </div>
      </div>

      {/* ========================================================================= */}
      {/* ROW 5: AI FINANCIAL & ETHICAL BRIEFING                                    */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-[#E1E5DC] shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#244A38] flex items-center gap-1.5">
              <span>🤖</span> AI Kakeibo Insight
            </span>
            <Link to="/pareto" className="text-[11px] text-[#244A38] font-semibold hover:underline">Analysis →</Link>
          </div>
          <p className="text-xs text-[#68756C] leading-relaxed">
            {kakeiboInsight}
          </p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-[#E1E5DC] shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#244A38] flex items-center gap-1.5">
              <span>📖</span> Ethical & Mindful Guidance
            </span>
            <Link to="/zakat" className="text-[11px] text-[#244A38] font-semibold hover:underline">Zakat →</Link>
          </div>
          <p className="text-xs text-[#68756C] leading-relaxed">
            {advice.split('\n\n')[0].replace(/^[#>]\s*/, '')}
          </p>
        </div>
      </div>

      {/* Quick Add Modal */}
      <QuickAddModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        state={state}
        onAddTransaction={onAddTransaction} 
      />
    </div>
  );
};

export default Dashboard;
