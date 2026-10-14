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
    <div className="space-y-3.5 md:space-y-4 animate-in fade-in duration-300 text-slate-100 max-w-6xl mx-auto pb-12">
      
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
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
        {/* KPI 1: Net Balance */}
        <div className="glass-card p-3 md:p-3.5 rounded-xl border border-emerald-500/20 flex flex-col justify-between">
          <div className="flex items-center justify-between text-[11px] text-emerald-300/70 font-bold uppercase">
            <span>Net Balance</span>
            <button 
              onClick={() => setShowBalance(!showBalance)}
              className="text-emerald-400 hover:text-white p-0.5"
              title="Toggle visibility"
            >
              {showBalance ? '👁️' : '🔒'}
            </button>
          </div>
          <div className="my-1">
            <span className="text-xl md:text-2xl font-black text-white tracking-tight">
              {showBalance ? `₹${stats.savings.toLocaleString()}` : '••••••'}
            </span>
          </div>
          <div className="text-[10px] text-lime-400 font-bold flex items-center gap-1">
            <span>↗ +8.2%</span>
            <span className="text-emerald-400/60 font-normal">vs last month</span>
          </div>
        </div>

        {/* KPI 2: Income */}
        <div className="glass-card p-3 md:p-3.5 rounded-xl border border-emerald-500/20 flex flex-col justify-between">
          <div className="text-[11px] text-emerald-300/70 font-bold uppercase">
            Monthly Income
          </div>
          <div className="my-1">
            <span className="text-xl md:text-2xl font-black text-lime-400 tracking-tight">
              ₹{stats.income.toLocaleString()}
            </span>
          </div>
          <div className="text-[10px] text-emerald-300/70 font-medium">
            Active salary & returns
          </div>
        </div>

        {/* KPI 3: Expenses */}
        <div className="glass-card p-3 md:p-3.5 rounded-xl border border-emerald-500/20 flex flex-col justify-between">
          <div className="text-[11px] text-emerald-300/70 font-bold uppercase">
            Monthly Expenses
          </div>
          <div className="my-1">
            <span className="text-xl md:text-2xl font-black text-rose-400 tracking-tight">
              ₹{stats.expenses.toLocaleString()}
            </span>
          </div>
          <div className="text-[10px] text-emerald-300/70 font-medium">
            {stats.expenses > 0 ? `${Math.round((stats.expenses / stats.income) * 100)}% of income` : '0% of income'}
          </div>
        </div>

        {/* KPI 4: Savings Goal */}
        <div className="glass-card p-3 md:p-3.5 rounded-xl border border-emerald-500/20 flex flex-col justify-between">
          <div className="flex items-center justify-between text-[11px] text-emerald-300/70 font-bold uppercase">
            <span>Savings Target</span>
            <span className="text-lime-300 font-black">{savingsProgress}%</span>
          </div>
          <div className="my-1">
            <span className="text-xl md:text-2xl font-black text-emerald-200 tracking-tight">
              ₹{stats.savings > 0 ? stats.savings.toLocaleString() : '0'}
            </span>
          </div>
          <div className="w-full bg-emerald-950 rounded-full h-1.5 overflow-hidden border border-emerald-800">
            <div className="h-full bg-lime-400 rounded-full" style={{ width: `${savingsProgress}%` }} />
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* DAILY SPENDING LIMIT & MONTHLY PACER PROGRESS                             */}
      {/* ========================================================================= */}
      <div className="glass-card p-3.5 md:p-4 rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-[#072415]/95 via-[#0c2f1e]/90 to-[#081e13]/95 shadow-lg relative overflow-hidden">
        {/* Ambient glow accent */}
        <div className="absolute -top-16 -right-16 w-44 h-44 rounded-full bg-lime-400/10 blur-2xl pointer-events-none" />

        {/* Header with Title, Status Badge, and Quick Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-emerald-500/15 relative z-10">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="p-1 rounded-lg bg-lime-400/20 text-lime-300 text-sm">⏱️</span>
              <h2 className="text-sm md:text-base font-black text-white tracking-tight">
                Daily Spending Limit
              </h2>
              <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full border ${dailyPacerStats.paceColor}`}>
                {dailyPacerStats.paceStatus === 'over' ? '⚠️ Exceeded Daily Limit' : dailyPacerStats.paceStatus === 'nearing' ? '⚡ Nearing Daily Limit' : '✓ On Track'}
              </span>
              {budgetAlertsSummary.alerts.length > 0 && (
                <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full border ${
                  budgetAlertsSummary.criticalCount > 0 
                    ? 'bg-rose-500/15 text-rose-300 border-rose-500/30' 
                    : 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                }`}>
                  ⚠️ {budgetAlertsSummary.alerts.length} Category Alert{budgetAlertsSummary.alerts.length > 1 ? 's' : ''} (≥80%)
                </span>
              )}
            </div>
            <p className="text-[11px] text-emerald-200/80 mt-1">
              Calculated from your <span className="text-lime-300 font-bold">₹{dailyPacerStats.monthlyBudget.toLocaleString()}</span> monthly budget for {dailyPacerStats.monthName}.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-2.5 py-1.5 rounded-xl bg-lime-400 hover:bg-lime-300 text-emerald-950 text-xs font-black shadow-sm transition-all flex items-center gap-1.5"
            >
              <span>+</span>
              <span>Log Expense</span>
            </button>
            <Link
              to="/budget"
              className="px-2.5 py-1.5 rounded-xl bg-emerald-950/60 hover:bg-emerald-900/60 border border-emerald-500/20 text-emerald-300 text-xs font-bold transition-all"
            >
              Budget Details →
            </Link>
          </div>
        </div>

        {/* Primary Daily Spending Bar */}
        <div className="mt-3.5 space-y-2 relative z-10">
          <div className="flex items-baseline justify-between flex-wrap gap-2">
            <div>
              <span className="text-xs text-emerald-300/80 font-medium">Today's Spend: </span>
              <span className="text-xl md:text-2xl font-black text-white tracking-tight">
                ₹{dailyPacerStats.todayExpenses.toLocaleString()}
              </span>
              <span className="text-xs text-emerald-400/70 font-medium ml-1">
                / ₹{dailyPacerStats.targetDailyLimit.toLocaleString()} daily limit
              </span>
            </div>

            <div className="text-xs font-bold">
              {dailyPacerStats.paceStatus === 'over' ? (
                <span className="text-rose-400">
                  +₹{dailyPacerStats.overSpentToday.toLocaleString()} over limit today
                </span>
              ) : (
                <span className="text-lime-300">
                  ₹{dailyPacerStats.remainingToday.toLocaleString()} left to spend today
                </span>
              )}
              <span className="text-emerald-400/70 ml-1.5 font-normal">
                ({dailyPacerStats.percentSpentToday}%)
              </span>
            </div>
          </div>

          {/* Visual Progress Bar with markers */}
          <div className="space-y-1">
            <div className="w-full bg-emerald-950/90 rounded-full h-3.5 p-0.5 border border-emerald-500/30 overflow-hidden relative shadow-inner">
              {/* Reference indicator markers */}
              <div className="absolute top-0 bottom-0 left-1/2 w-px bg-emerald-600/40 z-10" title="50% Target Marker" />
              <div className="absolute top-0 bottom-0 left-3/4 w-px bg-emerald-600/40 z-10" title="75% Warning Marker" />

              <div
                className={`h-full rounded-full transition-all duration-500 relative ${
                  dailyPacerStats.paceStatus === 'over'
                    ? 'bg-gradient-to-r from-amber-500 to-rose-500 shadow-[0_0_12px_rgba(244,63,94,0.6)]'
                    : dailyPacerStats.paceStatus === 'nearing'
                    ? 'bg-gradient-to-r from-lime-400 to-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.5)]'
                    : 'bg-gradient-to-r from-emerald-400 to-lime-400 shadow-[0_0_8px_rgba(163,230,53,0.5)]'
                }`}
                style={{ width: `${dailyPacerStats.clampedProgress}%` }}
              />
            </div>

            <div className="flex justify-between text-[10px] text-emerald-400/60 font-medium px-0.5">
              <span>₹0</span>
              <span>50%</span>
              <span>75%</span>
              <span className="font-bold text-emerald-300/80">Limit: ₹{dailyPacerStats.targetDailyLimit.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* 3-Column Contextual Breakdown: Daily Allowance, Monthly Remaining, Pace Health */}
        <div className="mt-3.5 grid grid-cols-1 sm:grid-cols-3 gap-2 pt-3 border-t border-emerald-500/15 text-xs relative z-10">
          {/* Card 1: Dynamic Safe Allowance */}
          <div className="p-2.5 rounded-xl bg-emerald-950/60 border border-emerald-500/15 flex flex-col justify-between">
            <span className="text-[10px] text-emerald-300/70 font-semibold uppercase tracking-wider">
              Remaining Daily Pace
            </span>
            <div className="my-1 flex items-baseline gap-1.5">
              <span className="text-base md:text-lg font-black text-lime-300">
                ₹{dailyPacerStats.dynamicDailyLimit.toLocaleString()}
              </span>
              <span className="text-[11px] text-emerald-400/70 font-medium">/ day</span>
            </div>
            <span className="text-[10px] text-emerald-300/60">
              For remaining {dailyPacerStats.daysRemaining} days in month
            </span>
          </div>

          {/* Card 2: Remaining Month Budget */}
          <div className="p-2.5 rounded-xl bg-emerald-950/60 border border-emerald-500/15 flex flex-col justify-between">
            <span className="text-[10px] text-emerald-300/70 font-semibold uppercase tracking-wider">
              Month Budget Remaining
            </span>
            <div className="my-1 flex items-baseline gap-1.5">
              <span className="text-base md:text-lg font-black text-white">
                ₹{dailyPacerStats.remainingMonthlyBudget.toLocaleString()}
              </span>
              <span className="text-[10px] text-emerald-400/60">
                of ₹{dailyPacerStats.monthlyBudget.toLocaleString()}
              </span>
            </div>
            <div className="w-full bg-emerald-950 rounded-full h-1.5 overflow-hidden border border-emerald-800/80">
              <div 
                className={`h-full rounded-full ${dailyPacerStats.budgetSpentPct > 90 ? 'bg-rose-400' : 'bg-lime-400'}`} 
                style={{ width: `${Math.min(100, dailyPacerStats.budgetSpentPct)}%` }} 
              />
            </div>
          </div>

          {/* Card 3: Month Time vs Budget Burn Rate */}
          <div className="p-2.5 rounded-xl bg-emerald-950/60 border border-emerald-500/15 flex flex-col justify-between">
            <span className="text-[10px] text-emerald-300/70 font-semibold uppercase tracking-wider">
              Time vs Spending Pace
            </span>
            <div className="my-1 flex items-center justify-between text-[11px]">
              <span className="text-white font-bold">
                Day {dailyPacerStats.currentDayOfMonth}/{dailyPacerStats.totalDaysInMonth} ({dailyPacerStats.monthTimeProgressPct}%)
              </span>
              <span className={dailyPacerStats.budgetSpentPct > dailyPacerStats.monthTimeProgressPct ? 'text-amber-400 font-bold' : 'text-lime-400 font-bold'}>
                {dailyPacerStats.budgetSpentPct}% spent
              </span>
            </div>
            <span className="text-[10px] text-emerald-300/70 font-medium">
              {dailyPacerStats.budgetSpentPct <= dailyPacerStats.monthTimeProgressPct 
                ? '🟢 Spending slower than time elapsed (On Track)' 
                : '🟡 Spending faster than time elapsed (Caution)'}
            </span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* ROW 2: 80/20 INSIGHT BANNER & BUDGET OVERVIEW PROGRESS                    */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-2.5">
        {/* 80/20 Spotlight Banner (Spans 2 cols) */}
        <div className="lg:col-span-2 glass-card p-3.5 md:p-4 rounded-2xl border border-lime-400/30 bg-gradient-to-r from-[#072415] via-[#0b2f1c] to-[#124227] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 glow-lime-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-lime-400 text-emerald-950 flex items-center justify-center font-black text-lg shrink-0 shadow-md">
              ⚡
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xs md:text-sm font-black text-white">80/20 Financial Focus</h3>
                <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-lime-400 text-emerald-950">
                  Pareto Rule
                </span>
              </div>
              <p className="text-[11px] text-emerald-200/90 mt-0.5 leading-snug">
                Top 20% of decisions drive ~80% of outcome. Optimize key categories to unlock ₹4,500+ monthly.
              </p>
            </div>
          </div>

          <Link
            to="/pareto"
            className="w-full sm:w-auto px-3.5 py-1.5 rounded-xl bg-lime-400 hover:bg-lime-300 text-emerald-950 text-xs font-black shadow-sm transition-all whitespace-nowrap text-center"
          >
            Explore 80/20 →
          </Link>
        </div>

        {/* Quick Kakeibo Status (1 col) */}
        <div className="glass-card p-3.5 rounded-2xl border border-emerald-500/20 flex flex-col justify-between space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-white">
            <span>Kakeibo Allocation</span>
            <Link to="/budget" className="text-[10px] text-lime-400 hover:underline">Details →</Link>
          </div>
          <div className="grid grid-cols-2 gap-1.5 text-[10px]">
            <div className="p-1.5 rounded-lg bg-emerald-950/60 border border-emerald-500/10">
              <span className="text-emerald-300/70 block">Needs (50%)</span>
              <span className="font-black text-white">₹{(stats.kakeiboBreakdown[KakeiboCategory.NEEDS] || 0).toLocaleString()}</span>
            </div>
            <div className="p-1.5 rounded-lg bg-emerald-950/60 border border-emerald-500/10">
              <span className="text-emerald-300/70 block">Wants (30%)</span>
              <span className="font-black text-white">₹{(stats.kakeiboBreakdown[KakeiboCategory.WANTS] || 0).toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* ROW 3: RECENT TRANSACTIONS (Compact Table) & RECURRING BILLS              */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-2.5">
        
        {/* Left: Recent Transactions (Spans 2 cols) */}
        <div className="lg:col-span-2 glass-card p-3.5 md:p-4 rounded-2xl border border-emerald-500/20 space-y-2.5">
          <div className="flex items-center justify-between border-b border-emerald-500/20 pb-2">
            <div className="flex items-center gap-2">
              <h3 className="text-xs md:text-sm font-black text-white">Recent Transactions</h3>
              <span className="text-[10px] text-emerald-400/70">({recentTransactions.length})</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsModalOpen(true)}
                className="px-2 py-1 rounded-lg bg-lime-400 text-emerald-950 text-[11px] font-black hover:bg-lime-300 transition-colors"
              >
                + Add
              </button>
              <Link to="/finance" className="text-[11px] text-lime-400 font-bold hover:underline">
                View All →
              </Link>
            </div>
          </div>

          {/* Compact Transaction Rows */}
          {recentTransactions.length === 0 ? (
            <div className="text-center py-6 text-emerald-300/60 text-xs">
              No transactions recorded yet. Click "+ Add" to log your first transaction.
            </div>
          ) : (
            <div className="space-y-1.5">
              {recentTransactions.map((t) => {
                const isIncome = t.type === WealthType.INCOME;
                const icon = t.kakeiboCategory ? CATEGORY_ICONS[t.kakeiboCategory] : '💳';

                return (
                  <div
                    key={t.id}
                    className="flex items-center justify-between p-2 rounded-xl bg-emerald-950/40 border border-emerald-500/10 hover:border-lime-500/30 transition-colors"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="text-sm shrink-0">{icon}</span>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-white truncate">{t.description}</div>
                        <div className="text-[10px] text-emerald-300/60 flex items-center gap-1.5">
                          <span>{new Date(t.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                          <span>•</span>
                          <span>{t.kakeiboCategory || t.type}</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className={`text-xs font-black ${isIncome ? 'text-lime-400' : 'text-white'}`}>
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
        <div className="glass-card p-3.5 md:p-4 rounded-2xl border border-emerald-500/20 space-y-2.5">
          <div className="flex items-center justify-between border-b border-emerald-500/20 pb-2">
            <h3 className="text-xs md:text-sm font-black text-white">Upcoming & Recurring</h3>
            <span className="text-[10px] text-lime-400 font-bold">This Month</span>
          </div>

          {stats.recurringExpenses.length === 0 ? (
            <div className="text-center py-6 space-y-1">
              <span className="text-xl">⚡</span>
              <p className="text-xs text-emerald-300/70 font-medium">No recurring bills logged.</p>
              <p className="text-[10px] text-emerald-400/50">Mark rent, WiFi, or EMIs as "Recurring" to track here.</p>
            </div>
          ) : (
            <div className="space-y-2 text-xs">
              {stats.recurringExpenses.slice(0, 4).map((bill) => (
                <div key={bill.id} className="p-2 rounded-xl bg-emerald-950/40 border border-emerald-500/10 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span>{bill.kakeiboCategory ? CATEGORY_ICONS[bill.kakeiboCategory] : '📱'}</span>
                    <div>
                      <div className="text-xs font-bold text-white truncate max-w-[140px]">{bill.description}</div>
                      <div className="text-[10px] text-emerald-300/60">{new Date(bill.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</div>
                    </div>
                  </div>
                  <span className="font-black text-white text-xs">₹{bill.amount.toLocaleString()}</span>
                </div>
              ))}
            </div>
          )}

          {stats.recurringExpenses.length > 0 && (
            <div className="p-2 rounded-xl bg-lime-400/10 border border-lime-400/20 text-[10px] text-lime-300 flex items-center justify-between">
              <span>Total Committed: ₹{stats.totalRecurring.toLocaleString()}</span>
              <Link to="/finance" className="font-bold underline">Manage</Link>
            </div>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* ROW 4: FINANCIAL GOALS PROGRESS & CATEGORY BREAKDOWN CHART                */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-2.5">
        {/* Goals Progress */}
        <div className="glass-card p-3.5 md:p-4 rounded-2xl border border-emerald-500/20 space-y-2.5">
          <div className="flex items-center justify-between border-b border-emerald-500/20 pb-2">
            <h3 className="text-xs md:text-sm font-black text-white">Financial Milestones</h3>
            <Link to="/goals" className="text-[11px] text-lime-400 font-bold hover:underline">
              View Goals →
            </Link>
          </div>

          {(!state.financialGoals || state.financialGoals.length === 0) ? (
            <div className="text-center py-6 space-y-2">
              <span className="text-xl">🎯</span>
              <p className="text-xs text-emerald-300/70 font-medium">No financial goals created yet.</p>
              <Link 
                to="/goals"
                className="inline-block px-3 py-1 bg-lime-400 text-emerald-950 font-black text-[11px] rounded-lg shadow-sm"
              >
                + Set Your First Goal
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {state.financialGoals.slice(0, 3).map(g => {
                const pct = g.targetAmount > 0 ? Math.min(100, Math.round((g.currentAmount / g.targetAmount) * 100)) : 0;
                return (
                  <div key={g.id} className="p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-500/10 space-y-1.5">
                    <div className="flex justify-between text-xs font-bold">
                      <span className="text-white">{g.title}</span>
                      <span className="text-lime-400">{pct}%</span>
                    </div>
                    <div className="w-full bg-emerald-950 rounded-full h-1.5 overflow-hidden border border-emerald-800">
                      <div className="h-full bg-lime-400 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                    <div className="flex justify-between text-[10px] text-emerald-300/60">
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
        <div className="glass-card p-3.5 md:p-4 rounded-2xl border border-emerald-500/20 flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-emerald-500/20 pb-2 mb-2">
            <div className="flex items-center gap-2">
              <h3 className="text-xs md:text-sm font-black text-white">Spending Trends vs Targets</h3>
              <span className="text-[10px] text-lime-400 font-mono">Recharts</span>
            </div>
            <div className="flex items-center gap-2">
              <Link to="/report" className="text-[10px] text-lime-400 hover:text-lime-300 font-bold bg-lime-400/10 hover:bg-lime-400/20 px-2 py-0.5 rounded border border-lime-400/20 transition-colors">
                📊 Monthly Report →
              </Link>
              <Link to="/budget" className="text-[10px] text-emerald-400/70 hover:text-lime-300 font-bold">
                Budget Rules →
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
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        <div className="glass-card p-3.5 rounded-xl border border-lime-500/25 bg-emerald-950/30 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-lime-300 flex items-center gap-1.5">
              <span>🤖</span> AI Kakeibo Advice
            </span>
            <Link to="/pareto" className="text-[10px] text-lime-400 font-bold hover:underline">Analysis →</Link>
          </div>
          <p className="text-[11px] text-emerald-100/90 leading-relaxed font-medium">
            {kakeiboInsight}
          </p>
        </div>

        <div className="glass-card p-3.5 rounded-xl border border-emerald-500/20 bg-emerald-950/30 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-emerald-300 flex items-center gap-1.5">
              <span>📖</span> Ethical & Sharia Wisdom
            </span>
            <Link to="/zakat" className="text-[10px] text-emerald-400 font-bold hover:underline">Zakat →</Link>
          </div>
          <p className="text-[11px] text-emerald-100/90 leading-relaxed font-medium">
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
