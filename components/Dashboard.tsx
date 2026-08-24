import React, { useMemo, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { AppState, WealthType, KakeiboCategory, Transaction } from '../types';
import { getDashboardIntel } from '../services/geminiService';
import QuickAddModal from './QuickAddModal';
import MonthlySpendingChart from './MonthlySpendingChart';

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
      .reduce((acc, t) => acc + t.amount, 0) || 75000;

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

    return { income, expenses, savings, kakeiboBreakdown, currentMonthTransactions };
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

  return (
    <div className="space-y-3.5 md:space-y-4 animate-in fade-in duration-300 text-slate-100 max-w-6xl mx-auto pb-12">
      
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

          <div className="space-y-2 text-xs">
            {[
              { title: 'Home Rent / EMI', amount: 22000, date: '1st of month', icon: '🏠' },
              { title: 'Electricity & Internet', amount: 3200, date: '10th of month', icon: '⚡' },
              { title: 'Cloud & Subscriptions', amount: 1499, date: '15th of month', icon: '📱' },
            ].map((bill, i) => (
              <div key={i} className="p-2 rounded-xl bg-emerald-950/40 border border-emerald-500/10 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span>{bill.icon}</span>
                  <div>
                    <div className="text-xs font-bold text-white">{bill.title}</div>
                    <div className="text-[10px] text-emerald-300/60">{bill.date}</div>
                  </div>
                </div>
                <span className="font-black text-white text-xs">₹{bill.amount.toLocaleString()}</span>
              </div>
            ))}
          </div>

          <div className="p-2 rounded-xl bg-lime-400/10 border border-lime-400/20 text-[10px] text-lime-300 flex items-center justify-between">
            <span>Total Committed: ₹26,699</span>
            <Link to="/budget" className="font-bold underline">Manage</Link>
          </div>
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

          <div className="space-y-2">
            {(state.financialGoals || [
              { id: 'g1', title: '6-Month Emergency Fund', targetAmount: 150000, currentAmount: 65000, targetDate: '2026-12-31', category: 'Security' },
              { id: 'g2', title: 'Hajj & Umrah Pilgrimage', targetAmount: 400000, currentAmount: 180000, targetDate: '2027-06-30', category: 'Spiritual' },
            ]).map(g => {
              const pct = Math.min(100, Math.round((g.currentAmount / g.targetAmount) * 100));
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
        </div>

        {/* Monthly Spending Trends & Targets Chart */}
        <div className="glass-card p-3.5 md:p-4 rounded-2xl border border-emerald-500/20 flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-emerald-500/20 pb-2 mb-2">
            <div className="flex items-center gap-2">
              <h3 className="text-xs md:text-sm font-black text-white">Spending Trends vs Targets</h3>
              <span className="text-[10px] text-lime-400 font-mono">Recharts</span>
            </div>
            <Link to="/budget" className="text-[10px] text-emerald-400/70 hover:text-lime-300 font-bold">
              Budget Rules →
            </Link>
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
        onAddTransaction={onAddTransaction} 
      />
    </div>
  );
};

export default Dashboard;
