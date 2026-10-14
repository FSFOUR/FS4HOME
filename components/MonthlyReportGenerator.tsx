import React, { useState, useMemo } from 'react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend, 
  CartesianGrid, 
  ReferenceLine,
  Cell 
} from 'recharts';
import { Link } from 'react-router-dom';
import { AppState, Transaction, WealthType, KakeiboCategory } from '../types';

interface Props {
  state: AppState;
  onAddTransaction?: (t: Omit<Transaction, 'id'>) => void;
  onShowToast?: (msg: string) => void;
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const CATEGORY_META: Record<KakeiboCategory, { icon: string; label: string; pct: number; color: string; desc: string }> = {
  [KakeiboCategory.NEEDS]: { icon: '🏠', label: 'Essential Needs', pct: 0.50, color: '#38bdf8', desc: 'Housing, food, utilities, commute' },
  [KakeiboCategory.WANTS]: { icon: '🛍️', label: 'Lifestyle Wants', pct: 0.30, color: '#f43f5e', desc: 'Dining out, shopping, hobbies' },
  [KakeiboCategory.CULTURE]: { icon: '📚', label: 'Culture & Growth', pct: 0.10, color: '#a78bfa', desc: 'Books, learning, donations' },
  [KakeiboCategory.UNEXPECTED]: { icon: '⚡', label: 'Unexpected & Emergency', pct: 0.10, color: '#fbbf24', desc: 'Repairs, urgent medical, backup' },
};

export const MonthlyReportGenerator: React.FC<Props> = ({ 
  state, 
  onShowToast 
}) => {
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState<number>(now.getMonth());
  const [selectedYear, setSelectedYear] = useState<number>(now.getFullYear());
  const [chartView, setChartView] = useState<'summary' | 'weekly' | 'categories'>('summary');
  const [tableSearch, setTableSearch] = useState('');
  const [tableFilter, setTableFilter] = useState<'ALL' | 'INCOME' | 'EXPENSE' | KakeiboCategory>('ALL');

  // Extract all distinct months with transactions so user can easily jump
  const activeMonths = useMemo(() => {
    const set = new Set<string>();
    state.transactions.forEach(t => {
      const d = new Date(t.date);
      if (!isNaN(d.getTime())) {
        set.add(`${d.getFullYear()}-${d.getMonth()}`);
      }
    });
    // Ensure current month is always available
    set.add(`${now.getFullYear()}-${now.getMonth()}`);

    return Array.from(set).map(item => {
      const [year, month] = item.split('-').map(Number);
      return { year, month, label: `${MONTH_NAMES[month].slice(0, 3)} ${year}` };
    }).sort((a, b) => (b.year * 12 + b.month) - (a.year * 12 + a.month));
  }, [state.transactions]);

  // Navigate between months
  const handlePrevMonth = () => {
    if (selectedMonth === 0) {
      setSelectedMonth(11);
      setSelectedYear(prev => prev - 1);
    } else {
      setSelectedMonth(prev => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonth === 11) {
      setSelectedMonth(0);
      setSelectedYear(prev => prev + 1);
    } else {
      setSelectedMonth(prev => prev + 1);
    }
  };

  // Filter transactions for the selected month and year
  const monthlyTransactions = useMemo(() => {
    return state.transactions.filter(t => {
      const d = new Date(t.date);
      return !isNaN(d.getTime()) && d.getMonth() === selectedMonth && d.getFullYear() === selectedYear;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [state.transactions, selectedMonth, selectedYear]);

  // Calculate detailed financial metrics
  const metrics = useMemo(() => {
    const incomeTransactions = monthlyTransactions.filter(t => t.type === WealthType.INCOME);
    const expenseTransactions = monthlyTransactions.filter(t => t.type === WealthType.EXPENSE);

    const totalIncome = incomeTransactions.reduce((acc, t) => acc + (Number(t.amount) || 0), 0);
    const totalExpenses = expenseTransactions.reduce((acc, t) => acc + (Number(t.amount) || 0), 0);
    const netSavings = totalIncome - totalExpenses;

    const savingsRate = totalIncome > 0 
      ? Math.max(0, Math.round((netSavings / totalIncome) * 100)) 
      : (netSavings > 0 ? 100 : 0);

    const savingsTarget = Number(state.monthlySavingsTarget) || 0;
    const targetProgressPct = savingsTarget > 0 
      ? Math.max(0, Math.round((netSavings / savingsTarget) * 100)) 
      : (netSavings > 0 ? 100 : 0);

    const targetVariance = netSavings - savingsTarget; // positive = surplus, negative = deficit

    // Kakeibo category spending
    const kakeiboSpent: Record<KakeiboCategory, number> = {
      [KakeiboCategory.NEEDS]: 0,
      [KakeiboCategory.WANTS]: 0,
      [KakeiboCategory.CULTURE]: 0,
      [KakeiboCategory.UNEXPECTED]: 0,
    };

    expenseTransactions.forEach(t => {
      if (t.kakeiboCategory && kakeiboSpent[t.kakeiboCategory] !== undefined) {
        kakeiboSpent[t.kakeiboCategory] += (Number(t.amount) || 0);
      }
    });

    // Effective budget allocation based on Kakeibo guidelines
    const effectiveBaseIncome = totalIncome > 0 ? totalIncome : totalExpenses;
    const kakeiboBudgets: Record<KakeiboCategory, number> = {
      [KakeiboCategory.NEEDS]: Math.round(effectiveBaseIncome * CATEGORY_META[KakeiboCategory.NEEDS].pct),
      [KakeiboCategory.WANTS]: Math.round(effectiveBaseIncome * CATEGORY_META[KakeiboCategory.WANTS].pct),
      [KakeiboCategory.CULTURE]: Math.round(effectiveBaseIncome * CATEGORY_META[KakeiboCategory.CULTURE].pct),
      [KakeiboCategory.UNEXPECTED]: Math.round(effectiveBaseIncome * CATEGORY_META[KakeiboCategory.UNEXPECTED].pct),
    };

    // Weekly distribution across the month (Weeks 1 to 5)
    const weeklyData = [
      { week: 'Week 1 (1-7)', income: 0, expenses: 0, net: 0 },
      { week: 'Week 2 (8-14)', income: 0, expenses: 0, net: 0 },
      { week: 'Week 3 (15-21)', income: 0, expenses: 0, net: 0 },
      { week: 'Week 4 (22-28)', income: 0, expenses: 0, net: 0 },
      { week: 'Week 5 (29+)', income: 0, expenses: 0, net: 0 },
    ];

    monthlyTransactions.forEach(t => {
      const day = new Date(t.date).getDate();
      let weekIdx = 0;
      if (day <= 7) weekIdx = 0;
      else if (day <= 14) weekIdx = 1;
      else if (day <= 21) weekIdx = 2;
      else if (day <= 28) weekIdx = 3;
      else weekIdx = 4;

      const amt = Number(t.amount) || 0;
      if (t.type === WealthType.INCOME) {
        weeklyData[weekIdx].income += amt;
      } else if (t.type === WealthType.EXPENSE) {
        weeklyData[weekIdx].expenses += amt;
      }
    });

    weeklyData.forEach(w => {
      w.net = w.income - w.expenses;
    });

    // Top 5 individual expenses
    const topExpenses = [...expenseTransactions]
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);

    // Financial Health Grade Assessment
    let healthGrade = 'B';
    let healthLabel = 'Stable';
    let healthColor = 'text-amber-400';
    let healthBadgeBg = 'bg-amber-400/10 border-amber-400/30';

    if (totalIncome > 0) {
      if (netSavings >= savingsTarget && savingsRate >= 30) {
        healthGrade = 'A+';
        healthLabel = 'Exceptional Surplus';
        healthColor = 'text-lime-400';
        healthBadgeBg = 'bg-lime-400/15 border-lime-400/30';
      } else if (netSavings > 0 && savingsRate >= 20) {
        healthGrade = 'A';
        healthLabel = 'Healthy Progress';
        healthColor = 'text-lime-400';
        healthBadgeBg = 'bg-lime-400/15 border-lime-400/30';
      } else if (netSavings > 0) {
        healthGrade = 'B';
        healthLabel = 'Moderate Savings';
        healthColor = 'text-emerald-400';
        healthBadgeBg = 'bg-emerald-400/10 border-emerald-400/30';
      } else if (netSavings === 0) {
        healthGrade = 'C';
        healthLabel = 'Break Even';
        healthColor = 'text-amber-400';
        healthBadgeBg = 'bg-amber-400/10 border-amber-400/30';
      } else {
        healthGrade = 'D';
        healthLabel = 'Deficit Spend';
        healthColor = 'text-rose-400';
        healthBadgeBg = 'bg-rose-400/15 border-rose-400/30';
      }
    } else if (totalExpenses > 0) {
      healthGrade = 'D';
      healthLabel = 'Deficit (No Recorded Income)';
      healthColor = 'text-rose-400';
      healthBadgeBg = 'bg-rose-400/15 border-rose-400/30';
    } else {
      healthGrade = 'N/A';
      healthLabel = 'No Activity';
      healthColor = 'text-slate-400';
      healthBadgeBg = 'bg-slate-400/10 border-slate-400/30';
    }

    return {
      totalIncome,
      totalExpenses,
      netSavings,
      savingsRate,
      savingsTarget,
      targetProgressPct,
      targetVariance,
      incomeCount: incomeTransactions.length,
      expenseCount: expenseTransactions.length,
      kakeiboSpent,
      kakeiboBudgets,
      weeklyData,
      topExpenses,
      healthGrade,
      healthLabel,
      healthColor,
      healthBadgeBg
    };
  }, [monthlyTransactions, state.monthlySavingsTarget]);

  // Primary Macro Bar Chart Data (Income, Expenses, Savings Realized, Savings Target)
  const summaryBarData = useMemo(() => {
    return [
      {
        name: 'Total Income',
        amount: metrics.totalIncome,
        fill: '#a3e635', // Lime-400
        category: 'Inflow',
        formatted: `₹${metrics.totalIncome.toLocaleString('en-IN')}`
      },
      {
        name: 'Total Expenses',
        amount: metrics.totalExpenses,
        fill: '#f43f5e', // Rose-500
        category: 'Outflow',
        formatted: `₹${metrics.totalExpenses.toLocaleString('en-IN')}`
      },
      {
        name: 'Net Savings',
        amount: Math.max(0, metrics.netSavings),
        fill: metrics.netSavings >= 0 ? '#10b981' : '#ef4444', // Emerald-500 or Red-500
        category: 'Realized',
        formatted: `₹${metrics.netSavings.toLocaleString('en-IN')}`
      },
      {
        name: 'Savings Target',
        amount: metrics.savingsTarget,
        fill: '#38bdf8', // Sky-400
        category: 'Target',
        formatted: `₹${metrics.savingsTarget.toLocaleString('en-IN')}`
      }
    ];
  }, [metrics]);

  // Category Bar Chart Data (Actual Spent vs Budget Allocated)
  const categoryBarData = useMemo(() => {
    return [
      {
        name: 'Needs (50%)',
        category: KakeiboCategory.NEEDS,
        spent: metrics.kakeiboSpent[KakeiboCategory.NEEDS],
        budget: metrics.kakeiboBudgets[KakeiboCategory.NEEDS],
        icon: '🏠'
      },
      {
        name: 'Wants (30%)',
        category: KakeiboCategory.WANTS,
        spent: metrics.kakeiboSpent[KakeiboCategory.WANTS],
        budget: metrics.kakeiboBudgets[KakeiboCategory.WANTS],
        icon: '🛍️'
      },
      {
        name: 'Culture (10%)',
        category: KakeiboCategory.CULTURE,
        spent: metrics.kakeiboSpent[KakeiboCategory.CULTURE],
        budget: metrics.kakeiboBudgets[KakeiboCategory.CULTURE],
        icon: '📚'
      },
      {
        name: 'Unexpected (10%)',
        category: KakeiboCategory.UNEXPECTED,
        spent: metrics.kakeiboSpent[KakeiboCategory.UNEXPECTED],
        budget: metrics.kakeiboBudgets[KakeiboCategory.UNEXPECTED],
        icon: '⚡'
      }
    ];
  }, [metrics]);

  // Filtered transactions for the audit log table
  const filteredTableList = useMemo(() => {
    return monthlyTransactions.filter(t => {
      // Type / Category Filter
      if (tableFilter === 'INCOME' && t.type !== WealthType.INCOME) return false;
      if (tableFilter === 'EXPENSE' && t.type !== WealthType.EXPENSE) return false;
      if (
        tableFilter !== 'ALL' && 
        tableFilter !== 'INCOME' && 
        tableFilter !== 'EXPENSE' && 
        t.kakeiboCategory !== tableFilter
      ) {
        return false;
      }

      // Search Filter
      if (tableSearch.trim()) {
        const q = tableSearch.toLowerCase();
        const matchDesc = t.description.toLowerCase().includes(q);
        const matchCat = t.kakeiboCategory?.toLowerCase().includes(q) || false;
        const matchType = t.type.toLowerCase().includes(q);
        const matchAmt = t.amount.toString().includes(q);
        if (!matchDesc && !matchCat && !matchType && !matchAmt) return false;
      }

      return true;
    });
  }, [monthlyTransactions, tableFilter, tableSearch]);



  // Export Month CSV
  const handleExportCSV = () => {
    if (monthlyTransactions.length === 0) {
      if (onShowToast) onShowToast('No transactions to export for this month');
      return;
    }
    const headers = ['Date', 'Description', 'Type', 'Category', 'Amount', 'Recurring'];
    const rows = monthlyTransactions.map(t => [
      t.date,
      `"${t.description.replace(/"/g, '""')}"`,
      t.type,
      t.kakeiboCategory || '',
      t.amount,
      t.isRecurring ? 'Yes' : 'No'
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const link = document.createElement('a');
    link.setAttribute('href', encodeURI(csvContent));
    link.setAttribute('download', `fs4home_report_${MONTH_NAMES[selectedMonth].toLowerCase()}_${selectedYear}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    if (onShowToast) onShowToast(`Exported ${MONTH_NAMES[selectedMonth]} CSV ✓`);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-4 max-w-6xl mx-auto text-slate-100 animate-in fade-in duration-200 pb-20">
      
      {/* ========================================================================= */}
      {/* 1. REPORT HEADER & MONTH SWITCHER                                         */}
      {/* ========================================================================= */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-emerald-500/20 pb-3.5 print:border-b-2 print:border-slate-800 print:pb-2">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-lime-400/10 border border-lime-400/20 text-lime-400 text-sm">
              📊
            </span>
            <h1 className="text-xl md:text-2xl font-black text-white tracking-tight">
              Monthly Financial Report
            </h1>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black border ${metrics.healthBadgeBg} ${metrics.healthColor}`}>
              Grade {metrics.healthGrade} • {metrics.healthLabel}
            </span>
          </div>
          <p className="text-xs text-emerald-300/70 mt-0.5">
            Executive cashflow breakdown, Kakeibo budget adherence, and savings progress
          </p>
        </div>

        {/* Action Buttons (Hidden when printing) */}
        <div className="flex flex-wrap items-center gap-2 print:hidden">
          <button
            onClick={handleExportCSV}
            className="px-2.5 py-1.5 rounded-xl bg-emerald-950/70 border border-emerald-500/20 hover:border-lime-400/40 text-emerald-300 text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm active:scale-95"
            title="Download CSV for this month"
          >
            <span>📥</span>
            <span>Export CSV</span>
          </button>

          <button
            onClick={handlePrint}
            className="px-3 py-1.5 rounded-xl bg-lime-400 hover:bg-lime-300 text-emerald-950 text-xs font-black shadow-sm glow-lime-sm transition-all flex items-center gap-1.5 active:scale-95"
          >
            <span>🖨️</span>
            <span>Print / PDF</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. MONTH SELECTOR & ACTIVE MONTH BADGES                                   */}
      {/* ========================================================================= */}
      <div className="glass-card p-3 rounded-2xl border border-emerald-500/20 flex flex-col sm:flex-row items-center justify-between gap-3 print:hidden">
        
        {/* Month Stepper */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-start">
          <button
            onClick={handlePrevMonth}
            className="w-8 h-8 rounded-xl bg-emerald-950/60 border border-emerald-500/20 hover:border-lime-400 text-emerald-300 flex items-center justify-center font-bold text-sm transition-colors"
            title="Previous Month"
          >
            ◀
          </button>

          <div className="flex items-center gap-1.5">
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              aria-label="Select report month"
              className="px-3 py-1.5 bg-[#061f12] border border-emerald-500/30 rounded-xl text-white font-bold text-xs md:text-sm outline-none focus:border-lime-400 cursor-pointer"
            >
              {MONTH_NAMES.map((name, idx) => (
                <option key={name} value={idx}>{name}</option>
              ))}
            </select>

            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              aria-label="Select report year"
              className="px-3 py-1.5 bg-[#061f12] border border-emerald-500/30 rounded-xl text-white font-bold text-xs md:text-sm outline-none focus:border-lime-400 cursor-pointer"
            >
              {[2024, 2025, 2026, 2027].map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>

          <button
            onClick={handleNextMonth}
            className="w-8 h-8 rounded-xl bg-emerald-950/60 border border-emerald-500/20 hover:border-lime-400 text-emerald-300 flex items-center justify-center font-bold text-sm transition-colors"
            title="Next Month"
          >
            ▶
          </button>
        </div>

        {/* Quick select active months */}
        <div className="flex items-center gap-1.5 flex-wrap justify-end">
          <span className="text-[10px] text-emerald-300/60 font-bold uppercase mr-1 hidden md:inline">
            Active Months:
          </span>
          {activeMonths.slice(0, 5).map(m => {
            const isSelected = m.month === selectedMonth && m.year === selectedYear;
            return (
              <button
                key={`${m.year}-${m.month}`}
                onClick={() => {
                  setSelectedMonth(m.month);
                  setSelectedYear(m.year);
                }}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                  isSelected
                    ? 'bg-lime-400 text-emerald-950 font-black shadow-sm'
                    : 'bg-emerald-950/40 text-emerald-300/80 hover:text-white hover:bg-emerald-900/50 border border-emerald-500/10'
                }`}
              >
                {m.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Print-only Month Header Title */}
      <div className="hidden print:block text-slate-800 text-center py-2">
        <h2 className="text-xl font-bold">{MONTH_NAMES[selectedMonth]} {selectedYear} Financial Statement</h2>
        <p className="text-xs text-slate-500">FS4HOME Intelligent Finance Engine</p>
      </div>

      {/* ========================================================================= */}
      {/* 3. CORE SUMMARY KPI CARDS                                                */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
        
        {/* KPI 1: Income */}
        <div className="glass-card p-3 md:p-3.5 rounded-2xl border border-emerald-500/20 flex flex-col justify-between">
          <div className="flex items-center justify-between text-[11px] text-emerald-300/70 font-bold uppercase">
            <span>Total Income</span>
            <span className="text-xs">💰</span>
          </div>
          <div className="my-1">
            <span className="text-xl md:text-2xl font-black text-lime-400 tracking-tight">
              ₹{metrics.totalIncome.toLocaleString('en-IN')}
            </span>
          </div>
          <div className="text-[10px] text-emerald-300/60 flex items-center justify-between">
            <span>{metrics.incomeCount} inflow records</span>
            <span className="text-lime-300 font-bold">100% Inflow</span>
          </div>
        </div>

        {/* KPI 2: Expenses */}
        <div className="glass-card p-3 md:p-3.5 rounded-2xl border border-emerald-500/20 flex flex-col justify-between">
          <div className="flex items-center justify-between text-[11px] text-emerald-300/70 font-bold uppercase">
            <span>Total Expenses</span>
            <span className="text-xs">💳</span>
          </div>
          <div className="my-1">
            <span className="text-xl md:text-2xl font-black text-rose-400 tracking-tight">
              ₹{metrics.totalExpenses.toLocaleString('en-IN')}
            </span>
          </div>
          <div className="text-[10px] text-emerald-300/60 flex items-center justify-between">
            <span>{metrics.expenseCount} outflow records</span>
            <span className="text-rose-300 font-bold">
              {metrics.totalIncome > 0 ? `${Math.round((metrics.totalExpenses / metrics.totalIncome) * 100)}% of income` : 'Outflow'}
            </span>
          </div>
        </div>

        {/* KPI 3: Net Savings */}
        <div className="glass-card p-3 md:p-3.5 rounded-2xl border border-emerald-500/20 flex flex-col justify-between">
          <div className="flex items-center justify-between text-[11px] text-emerald-300/70 font-bold uppercase">
            <span>Net Savings</span>
            <span className="text-xs">🏦</span>
          </div>
          <div className="my-1">
            <span className={`text-xl md:text-2xl font-black tracking-tight ${metrics.netSavings >= 0 ? 'text-white' : 'text-rose-400'}`}>
              {metrics.netSavings < 0 ? '-' : ''}₹{Math.abs(metrics.netSavings).toLocaleString('en-IN')}
            </span>
          </div>
          <div className="text-[10px] text-emerald-300/60 flex items-center justify-between">
            <span>Savings Rate:</span>
            <span className={`font-black ${metrics.savingsRate >= 20 ? 'text-lime-400' : metrics.savingsRate > 0 ? 'text-emerald-300' : 'text-rose-400'}`}>
              {metrics.savingsRate}%
            </span>
          </div>
        </div>

        {/* KPI 4: Savings Target Progress */}
        <div className="glass-card p-3 md:p-3.5 rounded-2xl border border-emerald-500/20 flex flex-col justify-between">
          <div className="flex items-center justify-between text-[11px] text-emerald-300/70 font-bold uppercase">
            <span>Savings Target Progress</span>
            <span className="text-xs">🎯</span>
          </div>
          <div className="my-1 flex items-baseline justify-between">
            <span className="text-xl md:text-2xl font-black text-lime-300 tracking-tight">
              {metrics.targetProgressPct}%
            </span>
            <span className="text-xs text-emerald-300/70 font-bold">
              Target: ₹{metrics.savingsTarget.toLocaleString('en-IN')}
            </span>
          </div>
          
          {/* Progress bar */}
          <div className="space-y-1">
            <div className="w-full bg-emerald-950/80 rounded-full h-1.5 overflow-hidden border border-emerald-800/60">
              <div 
                className={`h-full rounded-full transition-all duration-500 ${metrics.netSavings >= metrics.savingsTarget ? 'bg-lime-400' : 'bg-emerald-400'}`}
                style={{ width: `${Math.min(100, metrics.targetProgressPct)}%` }}
              />
            </div>
            <div className="flex justify-between text-[9px] text-emerald-400/60 font-medium">
              <span>
                {metrics.targetVariance >= 0 
                  ? `+₹${metrics.targetVariance.toLocaleString('en-IN')} surplus` 
                  : `₹${Math.abs(metrics.targetVariance).toLocaleString('en-IN')} remaining`}
              </span>
              <span>{metrics.netSavings >= metrics.savingsTarget && metrics.savingsTarget > 0 ? 'Goal Reached ✓' : ''}</span>
            </div>
          </div>
        </div>

      </div>

      {/* ========================================================================= */}
      {/* 4. RECHARTS BAR CHART VISUALIZER                                          */}
      {/* ========================================================================= */}
      <div className="glass-card p-3.5 md:p-5 rounded-2xl border border-emerald-500/20 space-y-4">
        
        {/* Chart Header & View Mode Switcher */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-emerald-500/15 pb-3">
          <div>
            <h2 className="text-sm md:text-base font-black text-white flex items-center gap-2">
              <span>📊</span>
              <span>{MONTH_NAMES[selectedMonth]} {selectedYear} Bar Chart Analysis</span>
            </h2>
            <p className="text-[11px] text-emerald-300/70">
              Comparative visualization of income, expenses, and savings progress
            </p>
          </div>

          {/* View Mode Buttons */}
          <div className="flex items-center gap-1 bg-[#061f12] p-1 rounded-xl border border-emerald-500/30 print:hidden">
            <button
              onClick={() => setChartView('summary')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                chartView === 'summary'
                  ? 'bg-lime-400 text-emerald-950 font-black shadow-sm'
                  : 'text-emerald-300/80 hover:text-white'
              }`}
            >
              Macro Summary
            </button>
            <button
              onClick={() => setChartView('weekly')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                chartView === 'weekly'
                  ? 'bg-lime-400 text-emerald-950 font-black shadow-sm'
                  : 'text-emerald-300/80 hover:text-white'
              }`}
            >
              Weekly Flow
            </button>
            <button
              onClick={() => setChartView('categories')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                chartView === 'categories'
                  ? 'bg-lime-400 text-emerald-950 font-black shadow-sm'
                  : 'text-emerald-300/80 hover:text-white'
              }`}
            >
              Budget vs Actual
            </button>
          </div>
        </div>

        {/* Empty state when no transactions exist */}
        {monthlyTransactions.length === 0 ? (
          <div className="text-center py-12 px-4 space-y-3 bg-emerald-950/20 rounded-xl border border-dashed border-emerald-500/20">
            <span className="text-3xl block">📁</span>
            <p className="text-sm font-bold text-white">No transactions recorded for {MONTH_NAMES[selectedMonth]} {selectedYear}</p>
            <p className="text-xs text-emerald-300/60 max-w-md mx-auto">
              Add transactions for this month or switch to a month with recorded transactions using the selector above.
            </p>
            <div className="pt-2">
              <Link
                to="/finance"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-lime-400 hover:bg-lime-300 text-emerald-950 font-black text-xs rounded-xl shadow-sm transition-all"
              >
                <span>+</span> Add Transactions in Finance
              </Link>
            </div>
          </div>
        ) : (
          <div>
            {/* View 1: Summary Bar Chart (Income vs Expense vs Savings vs Target) */}
            {chartView === 'summary' && (
              <div className="space-y-3">
                <div className="h-[280px] md:h-[320px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={summaryBarData}
                      margin={{ top: 20, right: 20, left: 10, bottom: 25 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#065f46" opacity={0.3} vertical={false} />
                      <XAxis 
                        dataKey="name" 
                        stroke="#6ee7b7" 
                        tick={{ fill: '#a7f3d0', fontSize: 11, fontWeight: 700 }}
                        tickLine={false}
                      />
                      <YAxis 
                        stroke="#6ee7b7" 
                        tick={{ fill: '#6ee7b7', fontSize: 10 }}
                        tickFormatter={(v) => `₹${Number(v) >= 1000 ? `${(Number(v) / 1000).toFixed(0)}k` : v}`}
                        tickLine={false}
                        axisLine={false}
                      />
                      <Tooltip 
                        cursor={{ fill: 'rgba(16, 185, 129, 0.08)' }}
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload;
                            return (
                              <div className="bg-[#051f12]/95 border border-lime-400/40 p-3 rounded-xl shadow-2xl backdrop-blur-xl text-xs space-y-1">
                                <div className="font-black text-white flex items-center justify-between gap-4">
                                  <span>{data.name}</span>
                                  <span className="text-[10px] text-lime-400 font-mono">{data.category}</span>
                                </div>
                                <div className="text-base font-black text-lime-300">
                                  {data.formatted}
                                </div>
                                {metrics.totalIncome > 0 && data.name !== 'Total Income' && (
                                  <div className="text-[10px] text-emerald-300/70">
                                    {Math.round((data.amount / metrics.totalIncome) * 100)}% of total income
                                  </div>
                                )}
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <ReferenceLine 
                        y={metrics.savingsTarget} 
                        stroke="#38bdf8" 
                        strokeDasharray="4 4" 
                        label={{ value: 'Target Line', fill: '#38bdf8', fontSize: 10, position: 'top' }}
                      />
                      <Bar 
                        dataKey="amount" 
                        radius={[8, 8, 2, 2]} 
                        animationDuration={600}
                      >
                        {summaryBarData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 border-t border-emerald-500/10 text-center">
                  <div className="p-2 rounded-xl bg-lime-400/5 border border-lime-400/20">
                    <span className="text-[10px] text-lime-300/80 uppercase font-bold block">Income Inflow</span>
                    <span className="text-sm font-black text-lime-400">₹{metrics.totalIncome.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="p-2 rounded-xl bg-rose-500/5 border border-rose-500/20">
                    <span className="text-[10px] text-rose-300/80 uppercase font-bold block">Total Outflow</span>
                    <span className="text-sm font-black text-rose-400">₹{metrics.totalExpenses.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="p-2 rounded-xl bg-emerald-500/5 border border-emerald-500/20">
                    <span className="text-[10px] text-emerald-300/80 uppercase font-bold block">Net Retained</span>
                    <span className="text-sm font-black text-emerald-300">₹{metrics.netSavings.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="p-2 rounded-xl bg-sky-500/5 border border-sky-500/20">
                    <span className="text-[10px] text-sky-300/80 uppercase font-bold block">Goal Target</span>
                    <span className="text-sm font-black text-sky-300">₹{metrics.savingsTarget.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>
            )}

            {/* View 2: Weekly Cashflow Breakdown */}
            {chartView === 'weekly' && (
              <div className="space-y-3">
                <div className="h-[280px] md:h-[320px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={metrics.weeklyData}
                      margin={{ top: 20, right: 20, left: 10, bottom: 25 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#065f46" opacity={0.3} vertical={false} />
                      <XAxis 
                        dataKey="week" 
                        stroke="#6ee7b7" 
                        tick={{ fill: '#a7f3d0', fontSize: 11, fontWeight: 700 }}
                        tickLine={false}
                      />
                      <YAxis 
                        stroke="#6ee7b7" 
                        tick={{ fill: '#6ee7b7', fontSize: 10 }}
                        tickFormatter={(v) => `₹${Number(v) >= 1000 ? `${(Number(v) / 1000).toFixed(0)}k` : v}`}
                        tickLine={false}
                        axisLine={false}
                      />
                      <Tooltip 
                        cursor={{ fill: 'rgba(16, 185, 129, 0.08)' }}
                        content={({ active, payload, label }) => {
                          if (active && payload && payload.length) {
                            return (
                              <div className="bg-[#051f12]/95 border border-lime-400/40 p-3 rounded-xl shadow-2xl backdrop-blur-xl text-xs space-y-1.5">
                                <div className="font-black text-white border-b border-emerald-800/60 pb-1">
                                  {label}
                                </div>
                                {payload.map((item: any, i: number) => (
                                  <div key={i} className="flex justify-between items-center gap-4">
                                    <span className="flex items-center gap-1.5 text-emerald-300/80">
                                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                                      {item.name}:
                                    </span>
                                    <span className="font-black text-white">
                                      ₹{Number(item.value).toLocaleString('en-IN')}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Legend 
                        wrapperStyle={{ paddingTop: 10, fontSize: 11 }}
                        formatter={(val) => <span className="text-emerald-200 font-bold">{val}</span>}
                      />
                      <Bar dataKey="income" name="Income" fill="#a3e635" radius={[6, 6, 0, 0]} />
                      <Bar dataKey="expenses" name="Expenses" fill="#f43f5e" radius={[6, 6, 0, 0]} />
                      <Bar dataKey="net" name="Net Savings" fill="#10b981" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <p className="text-[11px] text-center text-emerald-300/70">
                  Track weekly cashflow velocity to identify which week experienced the heaviest expense spikes.
                </p>
              </div>
            )}

            {/* View 3: Category Budget vs Actual */}
            {chartView === 'categories' && (
              <div className="space-y-3">
                <div className="h-[280px] md:h-[320px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={categoryBarData}
                      margin={{ top: 20, right: 20, left: 10, bottom: 25 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#065f46" opacity={0.3} vertical={false} />
                      <XAxis 
                        dataKey="name" 
                        stroke="#6ee7b7" 
                        tick={{ fill: '#a7f3d0', fontSize: 11, fontWeight: 700 }}
                        tickLine={false}
                      />
                      <YAxis 
                        stroke="#6ee7b7" 
                        tick={{ fill: '#6ee7b7', fontSize: 10 }}
                        tickFormatter={(v) => `₹${Number(v) >= 1000 ? `${(Number(v) / 1000).toFixed(0)}k` : v}`}
                        tickLine={false}
                        axisLine={false}
                      />
                      <Tooltip 
                        cursor={{ fill: 'rgba(16, 185, 129, 0.08)' }}
                        content={({ active, payload, label }) => {
                          if (active && payload && payload.length) {
                            const spent = Number(payload.find((p: any) => p.dataKey === 'spent')?.value) || 0;
                            const budget = Number(payload.find((p: any) => p.dataKey === 'budget')?.value) || 0;
                            const variance = budget - spent;
                            return (
                              <div className="bg-[#051f12]/95 border border-lime-400/40 p-3 rounded-xl shadow-2xl backdrop-blur-xl text-xs space-y-1.5">
                                <div className="font-black text-white border-b border-emerald-800/60 pb-1">
                                  {label}
                                </div>
                                <div className="flex justify-between gap-4">
                                  <span className="text-rose-300">Actual Spent:</span>
                                  <span className="font-black text-white">₹{spent.toLocaleString('en-IN')}</span>
                                </div>
                                <div className="flex justify-between gap-4">
                                  <span className="text-sky-300">Target Budget:</span>
                                  <span className="font-bold text-white">₹{budget.toLocaleString('en-IN')}</span>
                                </div>
                                <div className="flex justify-between gap-4 pt-1 border-t border-emerald-900/40">
                                  <span className="text-emerald-300">Variance:</span>
                                  <span className={`font-black ${variance >= 0 ? 'text-lime-400' : 'text-rose-400'}`}>
                                    {variance >= 0 ? `₹${variance.toLocaleString('en-IN')} under budget` : `₹${Math.abs(variance).toLocaleString('en-IN')} over budget`}
                                  </span>
                                </div>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Legend 
                        wrapperStyle={{ paddingTop: 10, fontSize: 11 }}
                        formatter={(val) => <span className="text-emerald-200 font-bold">{val}</span>}
                      />
                      <Bar dataKey="spent" name="Actual Spent" fill="#f43f5e" radius={[6, 6, 0, 0]} />
                      <Bar dataKey="budget" name="Allocated Budget" fill="#38bdf8" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <p className="text-[11px] text-center text-emerald-300/70">
                  Comparing actual expenditures directly against recommended Kakeibo targets (50/30/10/10).
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 5. KAKEIBO 50/30/10/10 BUDGET ADHERENCE BREAKDOWN                          */}
      {/* ========================================================================= */}
      <div className="glass-card p-3.5 md:p-5 rounded-2xl border border-emerald-500/20 space-y-3.5">
        <div className="flex items-center justify-between border-b border-emerald-500/15 pb-2.5">
          <div>
            <h3 className="text-sm font-black text-white flex items-center gap-2">
              <span>🏠</span>
              <span>Kakeibo Allocation Adherence</span>
            </h3>
            <p className="text-[11px] text-emerald-300/70">
              Optimal rule-based balance: 50% Needs, 30% Wants, 10% Culture & Growth, 10% Backup
            </p>
          </div>
          <Link
            to="/budget"
            className="text-[11px] font-bold text-lime-400 hover:underline print:hidden"
          >
            Manage Targets →
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          {(Object.keys(CATEGORY_META) as KakeiboCategory[]).map(cat => {
            const meta = CATEGORY_META[cat];
            const spent = metrics.kakeiboSpent[cat] || 0;
            const budget = metrics.kakeiboBudgets[cat] || 0;
            const pctUsed = budget > 0 ? Math.round((spent / budget) * 100) : (spent > 0 ? 100 : 0);
            const isOver = spent > budget && budget > 0;

            return (
              <div 
                key={cat} 
                className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/15 space-y-2 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between text-xs font-bold text-white mb-1">
                    <span className="flex items-center gap-1.5">
                      <span>{meta.icon}</span>
                      <span>{meta.label}</span>
                    </span>
                    <span className={`text-[10px] font-black px-1.5 py-0.5 rounded ${
                      isOver 
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' 
                        : 'bg-emerald-500/20 text-emerald-300'
                    }`}>
                      {pctUsed}%
                    </span>
                  </div>
                  <div className="text-[10px] text-emerald-300/60 leading-tight">
                    {meta.desc}
                  </div>
                </div>

                <div className="space-y-1.5 pt-1">
                  <div className="flex justify-between items-baseline text-xs">
                    <span className="font-black text-white">₹{spent.toLocaleString('en-IN')}</span>
                    <span className="text-[10px] text-emerald-300/70">Budget: ₹{budget.toLocaleString('en-IN')}</span>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full bg-emerald-950 rounded-full h-1.5 overflow-hidden border border-emerald-800">
                    <div 
                      className={`h-full rounded-full transition-all ${isOver ? 'bg-rose-500' : 'bg-lime-400'}`}
                      style={{ width: `${Math.min(100, pctUsed)}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 6. TOP EXPENSE DRIVERS & EXECUTIVE INSIGHTS                               */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5">
        
        {/* Top 5 Heavy-Hitters (Pareto Drivers) */}
        <div className="glass-card p-3.5 md:p-4 rounded-2xl border border-emerald-500/20 space-y-3">
          <div className="flex items-center justify-between border-b border-emerald-500/15 pb-2">
            <h3 className="text-xs md:text-sm font-black text-white flex items-center gap-1.5">
              <span>⚡</span>
              <span>Top Expense Drivers</span>
            </h3>
            <span className="text-[10px] text-emerald-300/70">Largest outflows</span>
          </div>

          {metrics.topExpenses.length === 0 ? (
            <div className="text-center py-6 text-xs text-emerald-300/60">
              No expense items recorded for this month.
            </div>
          ) : (
            <div className="space-y-2">
              {metrics.topExpenses.map((tx, idx) => {
                const shareOfExpenses = metrics.totalExpenses > 0 
                  ? Math.round((tx.amount / metrics.totalExpenses) * 100) 
                  : 0;

                return (
                  <div 
                    key={tx.id || idx} 
                    className="p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-500/10 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="w-5 h-5 rounded-full bg-rose-500/15 text-rose-300 text-[10px] font-black flex items-center justify-center shrink-0">
                        #{idx + 1}
                      </span>
                      <div className="truncate">
                        <div className="font-bold text-white truncate max-w-[170px] md:max-w-[220px]">
                          {tx.description}
                        </div>
                        <div className="text-[10px] text-emerald-300/60 flex items-center gap-1.5">
                          <span>{tx.date}</span>
                          {tx.kakeiboCategory && (
                            <>
                              <span>•</span>
                              <span>{tx.kakeiboCategory}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="font-black text-white text-xs block">
                        ₹{tx.amount.toLocaleString('en-IN')}
                      </span>
                      <span className="text-[9px] text-rose-300 font-bold">
                        {shareOfExpenses}% of spend
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Executive Takeaways & Recommendations */}
        <div className="glass-card p-3.5 md:p-4 rounded-2xl border border-emerald-500/20 space-y-3 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-emerald-500/15 pb-2 mb-3">
              <h3 className="text-xs md:text-sm font-black text-white flex items-center gap-1.5">
                <span>💡</span>
                <span>Executive Findings & Advisory</span>
              </h3>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${metrics.healthBadgeBg} ${metrics.healthColor}`}>
                {metrics.healthLabel}
              </span>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="p-2.5 rounded-xl bg-emerald-950/50 border border-emerald-500/15 flex items-start gap-2.5">
                <span className="text-lime-400 mt-0.5">✓</span>
                <div>
                  <span className="font-bold text-white block">Savings Target Fulfillment</span>
                  <span className="text-emerald-300/80 text-[11px] leading-relaxed">
                    {metrics.netSavings >= metrics.savingsTarget && metrics.savingsTarget > 0
                      ? `Target achieved! You saved ₹${metrics.netSavings.toLocaleString('en-IN')}, beating your ₹${metrics.savingsTarget.toLocaleString('en-IN')} target by ₹${metrics.targetVariance.toLocaleString('en-IN')}.`
                      : metrics.savingsTarget > 0
                      ? `Achieved ${metrics.targetProgressPct}% of your ₹${metrics.savingsTarget.toLocaleString('en-IN')} target. Additional ₹${Math.abs(metrics.targetVariance).toLocaleString('en-IN')} needed.`
                      : `You maintained a ${metrics.savingsRate}% net savings rate this month.`}
                  </span>
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-emerald-950/50 border border-emerald-500/15 flex items-start gap-2.5">
                <span className="text-sky-400 mt-0.5">ℹ</span>
                <div>
                  <span className="font-bold text-white block">Cashflow Balance</span>
                  <span className="text-emerald-300/80 text-[11px] leading-relaxed">
                    {metrics.totalIncome >= metrics.totalExpenses
                      ? `Positive cashflow retention: ${(metrics.totalIncome - metrics.totalExpenses).toLocaleString('en-IN')} surplus remaining after all commitments.`
                      : `Deficit detected: Outflows exceeded recorded inflow by ₹${Math.abs(metrics.netSavings).toLocaleString('en-IN')}. Verify all income sources are logged.`}
                  </span>
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-emerald-950/50 border border-emerald-500/15 flex items-start gap-2.5">
                <span className="text-amber-400 mt-0.5">✦</span>
                <div>
                  <span className="font-bold text-white block">Next Month Optimization</span>
                  <span className="text-emerald-300/80 text-[11px] leading-relaxed">
                    Review your highest expense category ({Object.entries(metrics.kakeiboSpent).sort((a, b) => Number(b[1]) - Number(a[1]))[0]?.[0] || 'Expenses'}) to uncover potential subscription or recurring leaks.
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-2 text-right">
            <Link
              to="/pareto"
              className="text-xs text-lime-400 font-black hover:underline inline-flex items-center gap-1"
            >
              Run 80/20 Deep Pareto Audit →
            </Link>
          </div>
        </div>

      </div>

      {/* ========================================================================= */}
      {/* 7. ITEMIZED MONTHLY TRANSACTIONS AUDIT TABLE                              */}
      {/* ========================================================================= */}
      <div className="glass-card p-3.5 md:p-5 rounded-2xl border border-emerald-500/20 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-emerald-500/15 pb-3">
          <div>
            <h3 className="text-sm font-black text-white flex items-center gap-2">
              <span>📋</span>
              <span>Month Audit Log ({filteredTableList.length} of {monthlyTransactions.length})</span>
            </h3>
            <p className="text-[10px] text-emerald-300/70">
              All transactions recorded within {MONTH_NAMES[selectedMonth]} {selectedYear}
            </p>
          </div>

          {/* Quick Filters */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs print:hidden">
            <input
              type="text"
              placeholder="Search month records..."
              value={tableSearch}
              onChange={(e) => setTableSearch(e.target.value)}
              className="px-2.5 py-1 bg-[#061f12] border border-emerald-500/30 rounded-lg text-white font-medium text-xs outline-none focus:border-lime-400 w-36 sm:w-44"
            />
            <select
              value={tableFilter}
              onChange={(e) => setTableFilter(e.target.value as any)}
              aria-label="Filter audit log records"
              className="px-2 py-1 bg-[#061f12] border border-emerald-500/30 rounded-lg text-emerald-200 font-bold text-xs outline-none focus:border-lime-400 cursor-pointer"
            >
              <option value="ALL">All Types</option>
              <option value="INCOME">Income Only</option>
              <option value="EXPENSE">Expenses Only</option>
              <option value={KakeiboCategory.NEEDS}>Needs</option>
              <option value={KakeiboCategory.WANTS}>Wants</option>
              <option value={KakeiboCategory.CULTURE}>Culture</option>
              <option value={KakeiboCategory.UNEXPECTED}>Unexpected</option>
            </select>
          </div>
        </div>

        {/* Table View */}
        {filteredTableList.length === 0 ? (
          <div className="text-center py-8 text-xs text-emerald-300/60">
            No transactions match the selected filters for this month.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-emerald-500/20 text-emerald-300/70 font-bold text-[10px] uppercase tracking-wider">
                  <th className="py-2 px-2.5">Date</th>
                  <th className="py-2 px-2.5">Description</th>
                  <th className="py-2 px-2.5">Category</th>
                  <th className="py-2 px-2.5">Type</th>
                  <th className="py-2 px-2.5 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-emerald-500/10">
                {filteredTableList.map(tx => {
                  const isInc = tx.type === WealthType.INCOME;
                  return (
                    <tr key={tx.id} className="hover:bg-emerald-950/40 transition-colors">
                      <td className="py-2.5 px-2.5 text-emerald-300/80 font-mono text-[11px] whitespace-nowrap">
                        {tx.date}
                      </td>
                      <td className="py-2.5 px-2.5 font-bold text-white">
                        <div className="flex items-center gap-1.5">
                          <span>{tx.description}</span>
                          {tx.isRecurring && (
                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-normal">
                              Recurring
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-2.5 px-2.5 text-emerald-300/80">
                        {tx.kakeiboCategory ? (
                          <span className="inline-flex items-center gap-1">
                            <span>{CATEGORY_META[tx.kakeiboCategory]?.icon || '•'}</span>
                            <span>{tx.kakeiboCategory}</span>
                          </span>
                        ) : '—'}
                      </td>
                      <td className="py-2.5 px-2.5">
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                          isInc 
                            ? 'bg-lime-400/15 text-lime-400 border border-lime-400/20' 
                            : 'bg-rose-500/15 text-rose-300 border border-rose-500/20'
                        }`}>
                          {tx.type}
                        </span>
                      </td>
                      <td className={`py-2.5 px-2.5 text-right font-black whitespace-nowrap ${
                        isInc ? 'text-lime-400' : 'text-rose-400'
                      }`}>
                        {isInc ? '+' : '-'}₹{tx.amount.toLocaleString('en-IN')}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
};
