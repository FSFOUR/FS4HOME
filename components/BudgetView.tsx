import React, { useMemo } from 'react';
import { AppState, KakeiboCategory, WealthType } from '../types';
import MonthlySpendingChart from './MonthlySpendingChart';

interface BudgetViewProps {
  state: AppState;
  onUpdateTarget: (val: number) => void;
}

export const BudgetView: React.FC<BudgetViewProps> = ({ state, onUpdateTarget }) => {
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

    const kakeibo: Record<string, number> = {
      [KakeiboCategory.NEEDS]: 0,
      [KakeiboCategory.WANTS]: 0,
      [KakeiboCategory.CULTURE]: 0,
      [KakeiboCategory.UNEXPECTED]: 0,
    };

    currentMonthTransactions.forEach(t => {
      if (t.type === WealthType.EXPENSE && t.kakeiboCategory) {
        kakeibo[t.kakeiboCategory] += t.amount;
      }
    });

    return { income, expenses, kakeibo };
  }, [state]);

  const effectiveIncome = stats.income > 0 ? stats.income : 0;

  const budgetRules = [
    {
      category: KakeiboCategory.NEEDS,
      label: 'Essential Needs (50%)',
      icon: '🏠',
      budget: Math.round(effectiveIncome * 0.5),
      spent: stats.kakeibo[KakeiboCategory.NEEDS] || 0,
      desc: 'Housing, groceries, utilities, commute'
    },
    {
      category: KakeiboCategory.WANTS,
      label: 'Lifestyle Wants (30%)',
      icon: '🛍️',
      budget: Math.round(effectiveIncome * 0.3),
      spent: stats.kakeibo[KakeiboCategory.WANTS] || 0,
      desc: 'Dining out, entertainment, hobbies'
    },
    {
      category: KakeiboCategory.CULTURE,
      label: 'Culture & Growth (10%)',
      icon: '📚',
      budget: Math.round(effectiveIncome * 0.1),
      spent: stats.kakeibo[KakeiboCategory.CULTURE] || 0,
      desc: 'Books, learning, workshops, donations'
    },
    {
      category: KakeiboCategory.UNEXPECTED,
      label: 'Unexpected & Emergency (10%)',
      icon: '⚡',
      budget: Math.round(effectiveIncome * 0.1),
      spent: stats.kakeibo[KakeiboCategory.UNEXPECTED] || 0,
      desc: 'Repairs, emergency medical, backup'
    }
  ];

  return (
    <div className="space-y-4 max-w-5xl mx-auto text-slate-100 animate-in fade-in duration-200 pb-16">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-emerald-500/20 pb-3">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-white tracking-tight">Budget & Allocation</h1>
          <p className="text-xs text-emerald-300/70">Kakeibo 50/30/20 framework with real-time threshold monitoring</p>
        </div>
        <div className="text-xs bg-emerald-950/60 border border-lime-400/30 text-lime-300 px-3 py-1.5 rounded-xl font-bold">
          Income Base: ₹{stats.income.toLocaleString()}
        </div>
      </div>

      {/* 4-Category Budget Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {budgetRules.map((rule) => {
          const pct = rule.budget > 0 ? Math.min(100, Math.round((rule.spent / rule.budget) * 100)) : 0;
          const isOver = rule.spent > rule.budget;

          return (
            <div key={rule.category} className="glass-card p-3.5 rounded-xl border border-emerald-500/20 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-base">{rule.icon}</span>
                  <div>
                    <h3 className="font-bold text-white text-xs">{rule.label}</h3>
                    <p className="text-[10px] text-emerald-300/60">{rule.desc}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`text-xs font-black ${isOver ? 'text-rose-400' : 'text-lime-400'}`}>{pct}%</div>
                  <div className="text-[10px] text-emerald-300/60">₹{rule.spent.toLocaleString()} / ₹{rule.budget.toLocaleString()}</div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-emerald-950 rounded-full h-1.5 overflow-hidden border border-emerald-800">
                <div 
                  className={`h-full rounded-full transition-all duration-700 ${isOver ? 'bg-rose-400' : 'bg-lime-400'}`} 
                  style={{ width: `${pct}%` }} 
                />
              </div>

              <div className="flex justify-between text-[10px] text-emerald-300/70 font-semibold pt-0.5">
                <span>Remaining: ₹{Math.max(0, rule.budget - rule.spent).toLocaleString()}</span>
                <span>{isOver ? '⚠️ Over Budget' : '✓ On Track'}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Spending Breakdown & Trends Chart */}
      <div className="glass-card p-4 rounded-2xl border border-emerald-500/20">
        <h3 className="text-xs font-black text-lime-400 uppercase tracking-widest mb-3">Spending Trends vs Kakeibo Targets</h3>
        <MonthlySpendingChart 
          spending={stats.kakeibo} 
          targets={state.monthlyTargets['current'] || {}} 
          transactions={state.transactions}
          monthlySavingsTarget={state.monthlySavingsTarget}
        />
      </div>
    </div>
  );
};
