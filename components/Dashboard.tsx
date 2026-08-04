import React, { useMemo, useState, useEffect } from 'react';
import { AppState, WealthType, KakeiboCategory, Transaction } from '../types';
import { getFinancialAdvice, getKakeiboInsight } from '../services/geminiService';
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
  const [kakeiboInsight, setKakeiboInsight] = useState<string>('Analyzing spending...');
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

    const assets = state.transactions
      .filter(t => t.type === WealthType.ASSET)
      .reduce((acc, t) => acc + t.amount, 0);

    const liabilities = state.transactions
      .filter(t => t.type === WealthType.LIABILITY)
      .reduce((acc, t) => acc + t.amount, 0);

    return { income, expenses, savings, kakeiboBreakdown, assets, liabilities };
  }, [state]);

  useEffect(() => {
    const fetchAdvice = async () => {
      const res = await getFinancialAdvice(state);
      setAdvice(res || "### Seek Barakah\nBe moderate in your spending and consistent in your charity.\n\n> 'The best of wealth is the soul.'");
    };
    const fetchInsight = async () => {
      const res = await getKakeiboInsight(state);
      setKakeiboInsight(res || "Reflect on your recent 'Wants' purchases. Could any be deferred to next month to increase your savings?");
    };
    fetchAdvice();
    fetchInsight();
  }, [state]);

  const handleEditName = () => {
    const newName = prompt('Enter your name:', state.userName);
    if (newName && newName.trim()) {
      onUpdateUser(newName.trim());
    }
  };

  // Savings Goal percentage
  const savingsTarget = state.monthlySavingsTarget || 5000;
  const savingsProgress = Math.min(100, Math.max(0, Math.round((stats.savings / savingsTarget) * 100)));

  // SVG Ring calculation
  const ringRadius = 42;
  const ringCircumference = 2 * Math.PI * ringRadius;
  const ringOffset = ringCircumference - (savingsProgress / 100) * ringCircumference;

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in duration-500 max-w-7xl mx-auto text-slate-100">
      
      {/* 1. GREETING HEADER */}
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 glass-card p-5 md:p-6 rounded-3xl glow-lime-sm">
        <div className="flex items-center gap-3.5">
          <div className="relative cursor-pointer group" onClick={handleEditName}>
            <div className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-gradient-to-br from-lime-400 to-emerald-600 border-2 border-lime-300 flex items-center justify-center text-emerald-950 font-black text-xl shadow-lg glow-lime-sm group-hover:scale-105 transition-transform">
              {state.userName.slice(0, 2).toUpperCase()}
            </div>
            <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-950 border border-lime-400 text-lime-400 flex items-center justify-center text-[10px]">
              ✏️
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-emerald-300/80 font-bold uppercase tracking-wider">Welcome back,</span>
            </div>
            <h2 className="text-xl md:text-3xl font-black text-white tracking-tight flex items-center gap-2">
              {state.userName}
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
          <div className="text-xs font-black bg-emerald-950/60 border border-lime-500/20 px-4 py-2 rounded-full text-lime-300 flex items-center gap-2 shadow-inner">
            <span className="w-2 h-2 rounded-full bg-lime-400 animate-pulse" />
            {new Date().toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
          </div>

          <div className="relative p-2.5 rounded-full bg-emerald-900/40 border border-lime-500/20 text-lime-400 hover:bg-lime-400/20 cursor-pointer transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 rounded-full bg-lime-400 border-2 border-[#0a2e1a] glow-lime-sm" />
          </div>
        </div>
      </header>

      <QuickAddModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onAddTransaction={onAddTransaction} />

      {/* 2. PROMINENT "TOTAL BALANCE" CARD */}
      <div className="glass-card p-6 md:p-8 rounded-3xl glow-lime relative overflow-hidden bg-gradient-to-br from-[#0c311f] via-[#103e28] to-[#185336]">
        <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-lime-400/10 rounded-full blur-2xl pointer-events-none" />
        
        <div className="flex justify-between items-start mb-4">
          <div>
            <div className="flex items-center gap-2 text-emerald-300/80 mb-1">
              <span className="text-[10px] md:text-xs font-black uppercase tracking-widest">Total Net Balance</span>
              <button 
                onClick={() => setShowBalance(!showBalance)}
                className="text-emerald-400 hover:text-lime-300 transition-colors p-1"
                title={showBalance ? "Hide Balance" : "Show Balance"}
              >
                {showBalance ? (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858-5.908a10.025 10.025 0 012.122-.363c4.478 0 8.268 2.943 9.542 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21M3 3l18 18" /></svg>
                )}
              </button>
            </div>
            <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight">
              {showBalance ? `₹${stats.savings.toLocaleString()}` : '••••••••'}
            </h1>
          </div>

          <div className="bg-lime-400/15 border border-lime-400/30 text-lime-400 px-3.5 py-1.5 rounded-full text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-sm glow-lime-sm">
            <span className="text-sm">↗</span>
            <span>+12.5% this month</span>
          </div>
        </div>

        {/* Sub-stats Row inside Balance Card */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4 mt-6 pt-6 border-t border-emerald-500/20">
          <div className="bg-emerald-950/40 p-3.5 rounded-2xl border border-emerald-500/15">
            <span className="text-[10px] text-emerald-300/70 font-black uppercase tracking-wider block mb-1">Monthly Income</span>
            <span className="text-base md:text-xl font-black text-lime-400">₹{stats.income.toLocaleString()}</span>
          </div>
          <div className="bg-emerald-950/40 p-3.5 rounded-2xl border border-emerald-500/15">
            <span className="text-[10px] text-emerald-300/70 font-black uppercase tracking-wider block mb-1">Monthly Expenses</span>
            <span className="text-base md:text-xl font-black text-rose-400">₹{stats.expenses.toLocaleString()}</span>
          </div>
          <div className="bg-emerald-950/40 p-3.5 rounded-2xl border border-emerald-500/15 col-span-2 md:col-span-1">
            <span className="text-[10px] text-emerald-300/70 font-black uppercase tracking-wider block mb-1">Savings Goal</span>
            <span className="text-base md:text-xl font-black text-emerald-200">₹{savingsTarget.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* 3. "BUDGET OVERVIEW" ROW OF COMPACT STAT CARDS */}
      <div>
        <h3 className="text-sm font-black text-lime-400 uppercase tracking-widest mb-3 flex items-center gap-2">
          <span>📊</span> Budget Overview
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Card 1: Monthly Budget/Savings */}
          <div className="glass-card p-5 rounded-2xl glass-card-hover flex flex-col justify-between space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-emerald-200">Monthly Savings</span>
              <span className="text-xs font-black text-lime-400">{savingsProgress}%</span>
            </div>
            <div className="text-2xl font-black text-white">₹{stats.savings.toLocaleString()}</div>
            <div className="space-y-1">
              <div className="w-full bg-emerald-950 rounded-full h-2 overflow-hidden border border-emerald-800">
                <div 
                  className="h-full bg-lime-400 rounded-full glow-lime-sm transition-all duration-1000" 
                  style={{ width: `${savingsProgress}%` }}
                />
              </div>
              <div className="text-[10px] text-emerald-300/60 font-semibold flex justify-between">
                <span>Current</span>
                <span>Target ₹{savingsTarget.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Card 2: Needs Budget */}
          {(() => {
            const needsSpent = stats.kakeiboBreakdown[KakeiboCategory.NEEDS] || 0;
            const needsBudget = Math.max(1, stats.income * 0.5); // 50% standard Kakeibo Needs target
            const needsPct = Math.min(100, Math.round((needsSpent / needsBudget) * 100));
            return (
              <div className="glass-card p-5 rounded-2xl glass-card-hover flex flex-col justify-between space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-emerald-200 flex items-center gap-1.5">
                    <span>🏠</span> Needs (Essential)
                  </span>
                  <span className={`text-xs font-black ${needsPct >= 80 ? 'text-amber-400' : 'text-lime-400'}`}>{needsPct}%</span>
                </div>
                <div className="text-2xl font-black text-white">₹{needsSpent.toLocaleString()}</div>
                <div className="space-y-1">
                  <div className="w-full bg-emerald-950 rounded-full h-2 overflow-hidden border border-emerald-800">
                    <div 
                      className={`h-full rounded-full transition-all duration-1000 ${needsPct >= 80 ? 'bg-amber-400 glow-lime-sm' : 'bg-lime-400 glow-lime-sm'}`} 
                      style={{ width: `${needsPct}%` }}
                    />
                  </div>
                  <div className="text-[10px] text-emerald-300/60 font-semibold flex justify-between">
                    <span>Essential Needs</span>
                    <span>Target ~₹{Math.round(needsBudget).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Card 3: Wants Budget */}
          {(() => {
            const wantsSpent = stats.kakeiboBreakdown[KakeiboCategory.WANTS] || 0;
            const wantsBudget = Math.max(1, stats.income * 0.3); // 30% standard Kakeibo Wants target
            const wantsPct = Math.min(100, Math.round((wantsSpent / wantsBudget) * 100));
            return (
              <div className="glass-card p-5 rounded-2xl glass-card-hover flex flex-col justify-between space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-emerald-200 flex items-center gap-1.5">
                    <span>🛍️</span> Wants (Discretionary)
                  </span>
                  <span className={`text-xs font-black ${wantsPct >= 80 ? 'text-rose-400' : 'text-lime-400'}`}>{wantsPct}%</span>
                </div>
                <div className="text-2xl font-black text-white">₹{wantsSpent.toLocaleString()}</div>
                <div className="space-y-1">
                  <div className="w-full bg-emerald-950 rounded-full h-2 overflow-hidden border border-emerald-800">
                    <div 
                      className={`h-full rounded-full transition-all duration-1000 ${wantsPct >= 80 ? 'bg-rose-400' : 'bg-lime-400 glow-lime-sm'}`} 
                      style={{ width: `${wantsPct}%` }}
                    />
                  </div>
                  <div className="text-[10px] text-emerald-300/60 font-semibold flex justify-between">
                    <span>Lifestyle & Wants</span>
                    <span>Target ~₹{Math.round(wantsBudget).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      </div>

      {/* 4. "EXPENSES BY CATEGORY" LIST */}
      <div className="glass-card p-6 md:p-8 rounded-3xl space-y-6">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 border-b border-emerald-500/20 pb-4">
          <div>
            <h3 className="text-lg font-black text-white tracking-tight flex items-center gap-2">
              Expenses by Category
            </h3>
            <p className="text-xs text-emerald-300/70 font-medium">Monthly Kakeibo allocation & threshold monitor</p>
          </div>
          <span className="text-xs font-black text-lime-400 bg-lime-400/10 border border-lime-400/20 px-3 py-1 rounded-full self-start sm:self-auto">
            Total Spent: ₹{stats.expenses.toLocaleString()}
          </span>
        </div>

        <div className="space-y-4">
          {Object.entries(stats.kakeiboBreakdown).map(([cat, rawAmount]) => {
            const amount = Number(rawAmount) || 0;
            const icon = CATEGORY_ICONS[cat as KakeiboCategory] || '🏷️';
            const total = stats.expenses > 0 ? stats.expenses : 1;
            const pct = Math.round((amount / total) * 100);
            const isNearLimit = pct >= 80 || (stats.expenses > 0 && pct >= 40);

            return (
              <div key={cat} className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/15 hover:border-lime-500/30 transition-all space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-lime-400/20 border border-lime-400/40 text-lime-400 flex items-center justify-center text-lg font-bold shadow-sm">
                      {icon}
                    </div>
                    <div>
                      <h4 className="font-black text-sm text-white flex items-center gap-2">
                        {cat}
                        {isNearLimit && amount > 0 && (
                          <span className="text-[9px] bg-rose-500/20 text-rose-400 border border-rose-500/30 px-2 py-0.5 rounded-full font-black uppercase tracking-wider animate-pulse">
                            Near Limit (80%+)
                          </span>
                        )}
                      </h4>
                      <p className="text-[10px] text-emerald-300/60 font-semibold uppercase">Category allocation</p>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="font-black text-base text-white">₹{amount.toLocaleString()}</div>
                    <div className="text-xs font-bold text-lime-400">{pct}%</div>
                  </div>
                </div>

                {/* Thin rounded lime progress bar */}
                <div className="w-full bg-emerald-950 rounded-full h-2 overflow-hidden border border-emerald-800/80">
                  <div 
                    className={`h-full rounded-full transition-all duration-1000 ${
                      isNearLimit && amount > 0 ? 'bg-rose-400' : 'bg-lime-400 glow-lime-sm'
                    }`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 5. TWO-COLUMN BOTTOM ROW: SAVINGS GOAL RING + MONTHLY SPENDING BAR CHART */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Left Column: Circular Savings Goal Ring */}
        <div className="glass-card p-6 rounded-3xl flex flex-col items-center text-center justify-between space-y-4">
          <div className="w-full text-left">
            <h4 className="text-xs font-black text-lime-400 uppercase tracking-widest">Savings Goal Tracker</h4>
            <p className="text-[11px] text-emerald-300/60 font-medium">Monthly target achievement status</p>
          </div>

          <div className="relative w-44 h-44 my-2 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r={ringRadius}
                className="text-emerald-950 stroke-current"
                strokeWidth="10"
                fill="transparent"
              />
              <circle
                cx="50"
                cy="50"
                r={ringRadius}
                className="text-lime-400 stroke-current transition-all duration-1000 glow-lime-sm"
                strokeWidth="10"
                strokeDasharray={ringCircumference}
                strokeDashoffset={ringOffset}
                strokeLinecap="round"
                fill="transparent"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="text-3xl font-black text-white tracking-tight">{savingsProgress}%</span>
              <span className="text-[10px] text-lime-400 font-bold uppercase tracking-widest">Completed</span>
            </div>
          </div>

          <div className="w-full bg-emerald-950/60 p-3 rounded-2xl border border-emerald-500/15 flex justify-around text-xs font-bold">
            <div>
              <span className="text-emerald-300/60 block text-[10px] uppercase">Saved</span>
              <span className="text-lime-400 font-black">₹{stats.savings.toLocaleString()}</span>
            </div>
            <div className="w-px bg-emerald-800" />
            <div>
              <span className="text-emerald-300/60 block text-[10px] uppercase">Goal</span>
              <span className="text-white font-black">₹{savingsTarget.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Right Column: Monthly Spending Bar Chart */}
        <MonthlySpendingChart 
          spending={stats.kakeiboBreakdown} 
          targets={state.monthlyTargets['current'] || {}} 
        />
      </div>

      {/* 6. AI FINANCIAL INSIGHTS & ISLAMIC FINANCIAL WISDOM */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* AI Financial Insights Card */}
        <div className="glass-card p-6 rounded-3xl border border-lime-500/30 flex flex-col justify-between space-y-4 glow-lime-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-lime-400 text-emerald-950 font-black flex items-center justify-center text-lg shadow-md glow-lime-sm">
                🤖
              </div>
              <div>
                <h4 className="font-black text-white text-base">AI Kakeibo Insights</h4>
                <p className="text-[10px] text-lime-400 font-bold uppercase tracking-wider">Automated Savings Tip</p>
              </div>
            </div>
            <span className="bg-lime-400/10 border border-lime-400/30 text-lime-400 text-[10px] font-black px-2.5 py-1 rounded-full uppercase">
              Smart Analysis
            </span>
          </div>

          <p className="text-emerald-100/90 font-medium leading-relaxed text-xs md:text-sm bg-emerald-950/40 p-4 rounded-2xl border border-emerald-500/15">
            {kakeiboInsight}
          </p>
        </div>

        {/* Daily Islamic Wisdom Card */}
        <div className="glass-card p-6 rounded-3xl border border-emerald-500/20 flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-500 text-emerald-950 font-black flex items-center justify-center text-lg shadow-md">
                📖
              </div>
              <div>
                <h4 className="font-black text-white text-base">Ethical Financial Wisdom</h4>
                <p className="text-[10px] text-emerald-300/80 font-bold uppercase tracking-wider">Sharia Guidance</p>
              </div>
            </div>
            <span className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-[10px] font-black px-2.5 py-1 rounded-full uppercase">
              Daily Tip
            </span>
          </div>

          <div className="text-emerald-100/90 font-medium leading-relaxed text-xs md:text-sm bg-emerald-950/40 p-4 rounded-2xl border border-emerald-500/15 space-y-2">
            {advice.split('\n\n').slice(0, 2).map((block, i) => (
              <p key={i}>{block.replace(/^[#>]\s*/, '')}</p>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
};

export default Dashboard;
