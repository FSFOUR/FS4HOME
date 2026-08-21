import React, { useState, useMemo, useEffect } from 'react';
import {
  AppState,
  Transaction,
  UserStrategy,
  FinancialGoal,
  FinancialDebt
} from '../../types';
import {
  calculateParetoInsights,
  CategoryParetoItem,
  SavingsOpportunity,
  RecurringLeakItem,
  HighImpactAction,
  getRealisticSampleState
} from '../../services/paretoEngine';
import { fetchParetoAIInsight } from '../../services/geminiService';
import ParetoChart from './ParetoChart';
import CategoryDrilldownModal from './CategoryDrilldownModal';
import AddGoalFromInsightModal from './AddGoalFromInsightModal';

interface Props {
  state: AppState;
  onUpdateState?: (updater: (prev: AppState) => AppState) => void;
  onAddTransaction?: (t: Omit<Transaction, 'id'>) => void;
  onAddGoal?: (g: Omit<FinancialGoal, 'id'>) => void;
  onUpdateStrategy?: (strat: UserStrategy) => void;
}

type TabType =
  | 'OVERVIEW'
  | 'SPENDING'
  | 'OPPORTUNITIES'
  | 'LEAKS'
  | 'ACTIONS'
  | 'INCOME_DEBT'
  | 'GOALS'
  | 'SIMULATOR'
  | 'REPORT';

const STRATEGY_OPTIONS: { id: UserStrategy; label: string; icon: string; desc: string }[] = [
  { id: 'SAVE_MORE', label: 'Max Savings', icon: '💰', desc: 'Prioritize building monthly cash surplus' },
  { id: 'DEBT_FREE', label: 'Debt-Free Fast', icon: '💳', desc: 'Focus on high-interest loan and credit card elimination' },
  { id: 'EMERGENCY_FUND', label: 'Emergency Reserve', icon: '🛡️', desc: 'Safeguard 3-6 months of essential living expenses' },
  { id: 'LIFESTYLE_CONTROL', label: 'Lifestyle Discipline', icon: '🛑', desc: 'Trim dining out, impulse shopping & OTT leaks' },
  { id: 'INCREASE_INVESTMENT', label: 'Wealth Growth', icon: '📈', desc: 'Channel high-impact surplus into compounding assets' },
  { id: 'MAJOR_PURCHASE', label: 'Major Goal Prep', icon: '🏠', desc: 'Accelerate down-payment or large family milestone' },
];

const ParetoDashboard: React.FC<Props> = ({
  state,
  onUpdateState,
  onAddTransaction,
  onAddGoal,
  onUpdateStrategy
}) => {
  // Navigation & Filter States
  const [activeTab, setActiveTab] = useState<TabType>('OVERVIEW');
  const [timeframe, setTimeframe] = useState<'THIS_MONTH' | 'LAST_3_MONTHS' | 'LAST_6_MONTHS' | 'LAST_12_MONTHS' | 'ALL' | 'CUSTOM'>('THIS_MONTH');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  
  // Selected items for modals
  const [drilldownCategory, setDrilldownCategory] = useState<CategoryParetoItem | null>(null);
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [goalModalDefaults, setGoalModalDefaults] = useState<{ title: string; amount: number }>({
    title: '80/20 Savings Acceleration Pool',
    amount: 50000
  });

  // AI Briefing State
  const [aiBriefing, setAiBriefing] = useState<string>('');
  const [isLoadingAi, setIsLoadingAi] = useState(false);

  // Simulator Sliders State (Percentage reduction 0 - 40%)
  const [simReductions, setSimReductions] = useState<Record<string, number>>({
    'Food Delivery & Dining': 30,
    'Shopping & Lifestyle': 25,
    'Subscriptions & OTT': 40,
    'Transport & Fuel': 15,
    'Housing & Rent': 0
  });

  // Calculate 80/20 Pareto data
  const paretoData = useMemo(() => {
    return calculateParetoInsights(state, timeframe, customStart, customEnd);
  }, [state, timeframe, customStart, customEnd]);

  // Trigger AI analysis when timeframe or transactions change
  useEffect(() => {
    let isMounted = true;
    const loadAiInsight = async () => {
      if (paretoData.totalExpenses === 0) return;
      setIsLoadingAi(true);
      const text = await fetchParetoAIInsight(paretoData, state.userStrategy);
      if (isMounted) {
        setAiBriefing(text);
        setIsLoadingAi(false);
      }
    };
    loadAiInsight();
    return () => {
      isMounted = false;
    };
  }, [paretoData.totalExpenses, paretoData.totalIncome, state.userStrategy]);

  // Handler for loading rich sample profile
  const handleLoadSampleData = () => {
    if (confirm('Load realistic 80/20 financial sample dataset (₹75k salary, rent, food delivery, subscriptions, EMIs) to explore all insights?')) {
      if (onUpdateState) {
        onUpdateState(() => getRealisticSampleState());
      }
    }
  };

  // Strategy change handler
  const handleStrategySelect = (strat: UserStrategy) => {
    if (onUpdateStrategy) {
      onUpdateStrategy(strat);
    } else if (onUpdateState) {
      onUpdateState(prev => ({ ...prev, userStrategy: strat }));
    }
  };

  // Handle adding goal from action
  const handleOpenGoalModal = (title: string, monthlyImpact: number) => {
    setGoalModalDefaults({
      title,
      amount: monthlyImpact * 12
    });
    setIsGoalModalOpen(true);
  };

  const handleSaveGoal = (newGoal: Omit<FinancialGoal, 'id'>) => {
    if (onAddGoal) {
      onAddGoal(newGoal);
    } else if (onUpdateState) {
      onUpdateState(prev => ({
        ...prev,
        financialGoals: [...(prev.financialGoals || []), { ...newGoal, id: crypto.randomUUID() }]
      }));
    }
  };

  const handleApplyToExistingGoal = (goalId: string, extraMonthly: number) => {
    if (onUpdateState) {
      onUpdateState(prev => ({
        ...prev,
        financialGoals: (prev.financialGoals || []).map(g =>
          g.id === goalId ? { ...g, monthlyContribution: g.monthlyContribution + extraMonthly } : g
        )
      }));
    }
  };

  // Simulator dynamic calculations
  const simulationResults = useMemo(() => {
    let simulatedMonthlySavings = 0;
    paretoData.categories.forEach(cat => {
      const reductionPercent = simReductions[cat.category] || 0;
      if (reductionPercent > 0) {
        simulatedMonthlySavings += (cat.amount * reductionPercent) / 100;
      }
    });

    const simulatedAnnualSavings = simulatedMonthlySavings * 12;
    const newTotalSavings = paretoData.netSavings + simulatedMonthlySavings;
    const newSavingsRate = paretoData.totalIncome > 0 ? Math.round((newTotalSavings / paretoData.totalIncome) * 100) : 0;

    return {
      monthlySavings: Math.round(simulatedMonthlySavings),
      annualSavings: Math.round(simulatedAnnualSavings),
      newSavingsRate,
      emergencyFundMonths: simulatedMonthlySavings > 0 ? Number(((paretoData.totalExpenses * 3) / (newTotalSavings || 1)).toFixed(1)) : 12
    };
  }, [paretoData, simReductions]);

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in duration-500 max-w-7xl mx-auto text-slate-100 pb-16">
      
      {/* 1. TOP 80/20 HERO BANNER & FINANCIAL PICTURE */}
      <div className="glass-card p-6 md:p-8 rounded-3xl glow-lime relative overflow-hidden bg-gradient-to-br from-[#072415] via-[#0b331c] to-[#124b2a]">
        <div className="absolute -right-16 -top-16 w-64 h-64 bg-lime-400/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-16 -bottom-16 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-3 py-1 rounded-full bg-lime-400 text-emerald-950 text-[11px] font-black uppercase tracking-wider shadow-md">
                80/20 Pareto Engine
              </span>
              <span className="text-xs text-emerald-300 font-bold">
                {paretoData.timeframeLabel}
              </span>
            </div>
            
            <h2 className="text-2xl md:text-4xl font-black text-white tracking-tight">
              {paretoData.topDriverCount > 0 ? (
                <>
                  <span className="text-lime-300">{paretoData.topDriverCount} categories</span> account for{' '}
                  <span className="text-lime-300">{paretoData.topDriverPercentage}%</span> of your spending
                </>
              ) : (
                'Your 80/20 Financial Picture'
              )}
            </h2>

            <p className="text-xs md:text-sm text-emerald-200/90 max-w-3xl leading-relaxed font-medium">
              {paretoData.summaryQuote}
            </p>
          </div>

          {/* Quick Profile / Sample Data Trigger */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">
            {state.transactions.length < 5 && (
              <button
                onClick={handleLoadSampleData}
                className="px-4 py-2.5 rounded-2xl bg-emerald-900/80 hover:bg-emerald-800 border border-lime-400/30 text-lime-300 text-xs font-black transition-all shadow-md flex items-center justify-center gap-2"
              >
                <span>⚡ Load Sample Data</span>
              </button>
            )}
            <div className="p-3.5 rounded-2xl bg-emerald-950/80 border border-lime-500/30 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-lime-400 text-emerald-950 flex items-center justify-center font-black text-lg">
                {paretoData.financialHealthGrade}
              </div>
              <div>
                <span className="text-[10px] text-emerald-300/80 uppercase font-black tracking-wider block">Health Grade</span>
                <span className="text-xs font-black text-white">
                  {paretoData.savingsRate >= 20 ? 'Strong Leverage' : 'Optimization Room'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Hero KPI Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mt-6 pt-6 border-t border-emerald-800/40">
          <div className="p-3 rounded-2xl bg-emerald-950/50 border border-emerald-800/30">
            <span className="text-[10px] text-emerald-400/80 uppercase font-black block">Total Income</span>
            <span className="text-base md:text-lg font-black text-white">₹{paretoData.totalIncome.toLocaleString('en-IN')}</span>
          </div>
          <div className="p-3 rounded-2xl bg-emerald-950/50 border border-emerald-800/30">
            <span className="text-[10px] text-emerald-400/80 uppercase font-black block">Total Spending</span>
            <span className="text-base md:text-lg font-black text-rose-300">₹{paretoData.totalExpenses.toLocaleString('en-IN')}</span>
          </div>
          <div className="p-3 rounded-2xl bg-emerald-950/50 border border-emerald-800/30">
            <span className="text-[10px] text-emerald-400/80 uppercase font-black block">Net Saved</span>
            <span className="text-base md:text-lg font-black text-emerald-300">₹{paretoData.netSavings.toLocaleString('en-IN')}</span>
          </div>
          <div className="p-3 rounded-2xl bg-emerald-950/50 border border-emerald-800/30">
            <span className="text-[10px] text-emerald-400/80 uppercase font-black block">Savings Rate</span>
            <span className="text-base md:text-lg font-black text-lime-300">{paretoData.savingsRate}%</span>
          </div>
          <div className="p-3 rounded-2xl bg-emerald-950/50 border border-emerald-800/30">
            <span className="text-[10px] text-lime-400 uppercase font-black block">80/20 Monthly Leak</span>
            <span className="text-base md:text-lg font-black text-amber-300">₹{paretoData.totalMonthlyLeakage.toLocaleString('en-IN')}</span>
          </div>
          <div className="p-3 rounded-2xl bg-lime-400/15 border border-lime-400/40">
            <span className="text-[10px] text-lime-300 uppercase font-black block">Potential Savings</span>
            <span className="text-base md:text-lg font-black text-lime-400">+₹{paretoData.potentialMonthlySavingsTotal.toLocaleString('en-IN')}/mo</span>
          </div>
        </div>
      </div>

      {/* 2. TIMEFRAME & STRATEGY CONTROLS */}
      <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4 glass-card p-4 rounded-2xl border border-emerald-800/40">
        {/* Timeframe Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 custom-scrollbar">
          {[
            { id: 'THIS_MONTH', label: 'Current Month' },
            { id: 'LAST_3_MONTHS', label: 'Last 3M' },
            { id: 'LAST_6_MONTHS', label: 'Last 6M' },
            { id: 'LAST_12_MONTHS', label: 'Last 1Y' },
            { id: 'ALL', label: 'All Time' },
          ].map((tf) => (
            <button
              key={tf.id}
              onClick={() => setTimeframe(tf.id as any)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                timeframe === tf.id
                  ? 'bg-lime-400 text-emerald-950 font-black shadow-md'
                  : 'bg-emerald-950/60 text-emerald-300/80 hover:text-white hover:bg-emerald-900/60'
              }`}
            >
              {tf.label}
            </button>
          ))}
        </div>

        {/* Strategy Selector Dropdown / Pill */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-emerald-300/80 hidden sm:inline">Priority Focus:</span>
          <select
            value={state.userStrategy || 'SAVE_MORE'}
            onChange={(e) => handleStrategySelect(e.target.value as UserStrategy)}
            className="px-3 py-1.5 rounded-xl bg-emerald-950 border border-lime-500/30 text-xs font-black text-lime-300 focus:outline-none focus:border-lime-400 cursor-pointer"
          >
            {STRATEGY_OPTIONS.map((opt) => (
              <option key={opt.id} value={opt.id}>
                {opt.icon} {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 3. NAVIGATION TABS */}
      <div className="flex items-center gap-2 overflow-x-auto p-1.5 bg-emerald-950/80 rounded-2xl border border-emerald-800/50 custom-scrollbar">
        {[
          { id: 'OVERVIEW', label: 'Overview', icon: '⚡' },
          { id: 'SPENDING', label: 'Spending 80/20', icon: '📊' },
          { id: 'OPPORTUNITIES', label: 'Savings Opportunities', icon: '💡', count: paretoData.savingsOpportunities.length },
          { id: 'LEAKS', label: 'Money Leaks', icon: '🔄', count: paretoData.recurringLeaks.length },
          { id: 'ACTIONS', label: 'Top 5 Actions', icon: '🎯' },
          { id: 'INCOME_DEBT', label: 'Income & Debt', icon: '💰' },
          { id: 'GOALS', label: 'Goal Acceleration', icon: '🚀' },
          { id: 'SIMULATOR', label: '80/20 Simulator', icon: '🎛️' },
          { id: 'REPORT', label: 'Monthly Review', icon: '📑' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as TabType)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black whitespace-nowrap transition-all duration-200 ${
              activeTab === tab.id
                ? 'bg-lime-400 text-emerald-950 shadow-md glow-lime-sm'
                : 'text-emerald-200/70 hover:text-white hover:bg-emerald-900/40'
            }`}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
            {tab.count !== undefined && tab.count > 0 && (
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                activeTab === tab.id ? 'bg-emerald-950 text-lime-400 font-bold' : 'bg-emerald-900 text-emerald-300'
              }`}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* 4. TAB CONTENTS */}

      {/* --- TAB 1: OVERVIEW --- */}
      {activeTab === 'OVERVIEW' && (
        <div className="space-y-6">
          {/* AI Explanation Engine Card */}
          <div className="glass-card p-6 rounded-3xl border border-lime-400/30 bg-gradient-to-br from-[#092918] to-[#124227] relative">
            <div className="flex items-center justify-between mb-3 pb-3 border-b border-emerald-800/40">
              <div className="flex items-center gap-2.5">
                <span className="w-8 h-8 rounded-xl bg-lime-400 text-emerald-950 flex items-center justify-center font-black text-sm">
                  AI
                </span>
                <div>
                  <h3 className="text-base font-black text-white">80/20 Executive Synthesis</h3>
                  <p className="text-[11px] text-emerald-300/80">Jargon-free analysis answering What, Why, and Action</p>
                </div>
              </div>
              <button
                onClick={async () => {
                  setIsLoadingAi(true);
                  const res = await fetchParetoAIInsight(paretoData, state.userStrategy);
                  setAiBriefing(res);
                  setIsLoadingAi(false);
                }}
                disabled={isLoadingAi}
                className="text-xs font-bold text-lime-400 hover:text-lime-300 flex items-center gap-1.5"
              >
                <span>{isLoadingAi ? 'Analyzing...' : '↻ Refresh AI Brief'}</span>
              </button>
            </div>

            {isLoadingAi ? (
              <div className="py-6 flex items-center justify-center gap-3 text-xs text-lime-300 font-bold">
                <span className="w-2 h-2 rounded-full bg-lime-400 animate-ping" />
                Consulting 80/20 Financial Intelligence...
              </div>
            ) : aiBriefing ? (
              <div className="text-xs md:text-sm text-emerald-100/90 leading-relaxed space-y-2 prose-invert">
                <div dangerouslySetInnerHTML={{ __html: aiBriefing.replace(/\n/g, '<br/>') }} />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-emerald-100/90">
                <div className="p-3.5 rounded-2xl bg-emerald-950/60 border border-emerald-800/30">
                  <span className="font-bold text-lime-300 block mb-1">1. What Happened</span>
                  {paretoData.topDriverCount} categories drive {paretoData.topDriverPercentage}% of all spending.
                </div>
                <div className="p-3.5 rounded-2xl bg-emerald-950/60 border border-emerald-800/30">
                  <span className="font-bold text-lime-300 block mb-1">2. Why It Matters</span>
                  Cutting small ₹50 items won't move the needle; optimizing your top drivers unlocks ~₹{paretoData.potentialMonthlySavingsTotal.toLocaleString('en-IN')}/month.
                </div>
                <div className="p-3.5 rounded-2xl bg-emerald-950/60 border border-emerald-800/30">
                  <span className="font-bold text-lime-300 block mb-1">3. What To Do</span>
                  Focus first on {paretoData.categories[0]?.category || 'Housing'} and recurring subscriptions review.
                </div>
                <div className="p-3.5 rounded-2xl bg-emerald-950/60 border border-emerald-800/30">
                  <span className="font-bold text-lime-300 block mb-1">4. Potential Impact</span>
                  Estimated potential savings of ₹{paretoData.potentialAnnualSavingsTotal.toLocaleString('en-IN')}/year into your goals.
                </div>
              </div>
            )}
          </div>

          {/* Quick Pareto Mini Chart & Top Drivers */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left: Pareto Chart */}
            <div className="lg:col-span-7 glass-card p-6 rounded-3xl border border-emerald-800/40 flex flex-col justify-between">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-base font-black text-white">Pareto Spending Curve</h3>
                  <p className="text-xs text-emerald-300/80">Cumulative expenditure concentration</p>
                </div>
                <button
                  onClick={() => setActiveTab('SPENDING')}
                  className="text-xs font-bold text-lime-400 hover:underline"
                >
                  Full Analysis →
                </button>
              </div>

              <ParetoChart
                categories={paretoData.categories}
                onSelectCategory={(cat) => setDrilldownCategory(cat)}
              />
            </div>

            {/* Right: Top 4 Drivers List */}
            <div className="lg:col-span-5 glass-card p-6 rounded-3xl border border-emerald-800/40 flex flex-col justify-between">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-base font-black text-white">Top Spending Drivers</h3>
                  <p className="text-xs text-emerald-300/80">Where 80% of your money goes</p>
                </div>
                <span className="text-[10px] font-black px-2.5 py-1 rounded-full bg-emerald-900/80 text-lime-300 border border-lime-500/20">
                  {paretoData.categories.filter(c => c.isParetoDriver).length} Key Areas
                </span>
              </div>

              <div className="space-y-3 flex-1">
                {paretoData.categories.slice(0, 4).map((cat) => (
                  <div
                    key={cat.category}
                    onClick={() => setDrilldownCategory(cat)}
                    className="p-3.5 rounded-2xl bg-emerald-950/50 border border-emerald-800/30 hover:border-lime-400/40 hover:bg-emerald-900/30 transition-all cursor-pointer flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-900/60 flex items-center justify-center text-xl group-hover:scale-105 transition-transform">
                        {cat.icon}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-white group-hover:text-lime-300 transition-colors">
                            {cat.category}
                          </span>
                          <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-lime-400/20 text-lime-300">
                            #{cat.rank}
                          </span>
                        </div>
                        <span className="text-[11px] text-emerald-400/80 font-medium">
                          {cat.sharePercent}% of total ({cat.transactionCount} transactions)
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-xs font-black text-white block">
                        ₹{cat.amount.toLocaleString('en-IN')}
                      </span>
                      <span className="text-[10px] text-lime-400 font-bold">
                        ~₹{cat.potentialMonthlySavings.min.toLocaleString('en-IN')} save
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={() => setActiveTab('SPENDING')}
                className="w-full mt-4 py-2.5 rounded-xl bg-emerald-900/60 hover:bg-emerald-800 text-emerald-200 text-xs font-bold transition-all text-center"
              >
                Inspect All Categories ({paretoData.categories.length})
              </button>
            </div>
          </div>

          {/* Bottom Grid: Leaks + Top 3 Actions preview */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Recurring Leaks Box */}
            <div className="glass-card p-6 rounded-3xl border border-emerald-800/40">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2.5">
                  <span className="text-xl">🔄</span>
                  <div>
                    <h3 className="text-sm font-black text-white">Recurring Money Leaks</h3>
                    <p className="text-[11px] text-emerald-300/80">Monthly subscriptions & automatic charges</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs font-black text-amber-300 block">₹{paretoData.totalMonthlyLeakage.toLocaleString('en-IN')}/mo</span>
                  <span className="text-[10px] text-emerald-400/70">₹{paretoData.totalAnnualLeakage.toLocaleString('en-IN')}/yr</span>
                </div>
              </div>

              <div className="space-y-2.5">
                {paretoData.recurringLeaks.slice(0, 3).map((leak) => (
                  <div key={leak.id} className="p-3 rounded-2xl bg-emerald-950/40 border border-emerald-800/30 flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-white block">{leak.name}</span>
                      <span className="text-[10px] text-emerald-400/80">{leak.type} • {leak.status}</span>
                    </div>
                    <span className="text-xs font-black text-amber-300">₹{leak.monthlyAmount.toLocaleString('en-IN')}/mo</span>
                  </div>
                ))}
              </div>

              <button
                onClick={() => setActiveTab('LEAKS')}
                className="w-full mt-4 py-2.5 rounded-xl bg-lime-400/20 hover:bg-lime-400/30 text-lime-300 border border-lime-400/30 text-xs font-black transition-all text-center"
              >
                Review All Leaks ({paretoData.recurringLeaks.length}) →
              </button>
            </div>

            {/* Top Recommended Actions Box */}
            <div className="glass-card p-6 rounded-3xl border border-emerald-800/40">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2.5">
                  <span className="text-xl">🎯</span>
                  <div>
                    <h3 className="text-sm font-black text-white">Highest-Impact Next Steps</h3>
                    <p className="text-[11px] text-emerald-300/80">Prioritized by 1–100 Impact Score</p>
                  </div>
                </div>
                <button
                  onClick={() => setActiveTab('ACTIONS')}
                  className="text-xs font-bold text-lime-400 hover:underline"
                >
                  View All →
                </button>
              </div>

              <div className="space-y-2.5">
                {paretoData.top5Actions.slice(0, 3).map((act) => (
                  <div key={act.id} className="p-3 rounded-2xl bg-emerald-950/40 border border-emerald-800/30 flex items-center justify-between">
                    <div className="flex-1 mr-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white">{act.title}</span>
                        <span className={`text-[9px] font-black px-1.5 py-0.2 rounded ${
                          act.priority === 'Critical' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' : 'bg-lime-400/20 text-lime-300 border border-lime-400/30'
                        }`}>
                          Score {act.impactScore}
                        </span>
                      </div>
                      <p className="text-[10px] text-emerald-300/80 line-clamp-1 mt-0.5">{act.whyItMatters}</p>
                    </div>
                    <div className="text-right whitespace-nowrap">
                      <span className="text-xs font-black text-lime-300 block">+₹{act.monthlyImpact.toLocaleString('en-IN')}/mo</span>
                      <span className="text-[9px] text-emerald-400/70">{act.recommendedDeadline}</span>
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={() => setActiveTab('ACTIONS')}
                className="w-full mt-4 py-2.5 rounded-xl bg-lime-400 hover:bg-lime-300 text-emerald-950 text-xs font-black transition-all shadow-md text-center"
              >
                Execute Top Actions 🚀
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- TAB 2: SPENDING 80/20 & PARETO ANALYSIS --- */}
      {activeTab === 'SPENDING' && (
        <div className="space-y-6">
          <div className="glass-card p-6 md:p-8 rounded-3xl border border-emerald-800/40">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
              <div>
                <h3 className="text-lg md:text-xl font-black text-white tracking-tight">
                  Pareto Spending Concentration Analysis
                </h3>
                <p className="text-xs text-emerald-300/80">
                  Identifies the smallest cluster of categories driving ~80% of total expenses.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-xs font-black px-3 py-1.5 rounded-full bg-lime-400 text-emerald-950 shadow-md">
                  {paretoData.topDriverCount} Drivers = {paretoData.topDriverPercentage}% of spending
                </span>
              </div>
            </div>

            {/* Pareto Chart */}
            <ParetoChart
              categories={paretoData.categories}
              onSelectCategory={(cat) => setDrilldownCategory(cat)}
            />
          </div>

          {/* Ranked Category Table & Cards */}
          <div className="space-y-3">
            <h4 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
              <span>🏆 Ranked Expense Drivers</span>
              <span className="text-xs text-emerald-400 font-normal">({paretoData.categories.length} Categories total)</span>
            </h4>

            <div className="grid grid-cols-1 gap-3">
              {paretoData.categories.map((cat) => (
                <div
                  key={cat.category}
                  className={`p-5 rounded-3xl border transition-all ${
                    cat.isParetoDriver
                      ? 'bg-[#092c1a]/90 border-lime-400/40 glow-lime-sm'
                      : 'bg-emerald-950/40 border-emerald-800/30'
                  }`}
                >
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    {/* Category Title & Icon */}
                    <div className="flex items-center gap-3.5">
                      <div className="w-12 h-12 rounded-2xl bg-emerald-900/60 border border-emerald-700/40 flex items-center justify-center text-2xl shadow-inner">
                        {cat.icon}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h5 className="text-base font-black text-white">{cat.category}</h5>
                          {cat.isParetoDriver ? (
                            <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-lime-400 text-emerald-950">
                              80/20 Driver #{cat.rank}
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-900 text-emerald-300">
                              Rank #{cat.rank}
                            </span>
                          )}
                          {cat.isDiscretionary ? (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30">
                              Discretionary
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-800/40 text-emerald-300">
                              Essential
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-4 text-xs text-emerald-300/80 mt-1">
                          <span>{cat.sharePercent}% of expenses</span>
                          <span>•</span>
                          <span>{cat.incomePercent}% of income</span>
                          <span>•</span>
                          <span>{cat.transactionCount} transactions</span>
                          {cat.monthOverMonthGrowth !== undefined && (
                            <>
                              <span>•</span>
                              <span className={cat.monthOverMonthGrowth > 0 ? 'text-rose-400 font-bold' : 'text-lime-400 font-bold'}>
                                {cat.monthOverMonthGrowth > 0 ? `+${cat.monthOverMonthGrowth}%` : `${cat.monthOverMonthGrowth}%`} vs last month
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Spend & Potential Savings */}
                    <div className="flex items-center justify-between md:justify-end gap-6 w-full md:w-auto pt-3 md:pt-0 border-t md:border-t-0 border-emerald-800/40">
                      <div className="text-left md:text-right">
                        <span className="text-[10px] text-emerald-400/80 uppercase font-black block">Current Spend</span>
                        <span className="text-lg font-black text-white">₹{cat.amount.toLocaleString('en-IN')}</span>
                      </div>

                      <div className="text-left md:text-right">
                        <span className="text-[10px] text-lime-400 uppercase font-black block">Potential Saving</span>
                        <span className="text-sm font-black text-lime-300">
                          ₹{cat.potentialMonthlySavings.min.toLocaleString('en-IN')} – ₹{cat.potentialMonthlySavings.max.toLocaleString('en-IN')}/mo
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setDrilldownCategory(cat)}
                          className="px-3.5 py-2 rounded-xl bg-emerald-900/60 hover:bg-emerald-800 text-emerald-200 text-xs font-bold transition-all"
                        >
                          View Transactions
                        </button>
                        <button
                          onClick={() => setActiveTab('OPPORTUNITIES')}
                          className="px-3.5 py-2 rounded-xl bg-lime-400 hover:bg-lime-300 text-emerald-950 text-xs font-black transition-all shadow-md"
                        >
                          Find Savings 💡
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* --- TAB 3: SAVINGS OPPORTUNITIES --- */}
      {activeTab === 'OPPORTUNITIES' && (
        <div className="space-y-6">
          <div className="glass-card p-6 rounded-3xl border border-emerald-800/40 bg-gradient-to-br from-[#082817] to-[#0e3b22]">
            <h3 className="text-lg md:text-xl font-black text-white tracking-tight mb-1">
              Biggest Savings Opportunities
            </h3>
            <p className="text-xs text-emerald-200/90 leading-relaxed max-w-3xl">
              High-value discretionary spending reductions that save significant money without reducing essential quality of life.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {paretoData.savingsOpportunities.map((opp) => (
              <div
                key={opp.id}
                className="glass-card p-6 rounded-3xl border border-emerald-800/40 hover:border-lime-400/40 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">
                        {opp.tag === 'Food Delivery' ? '🛵' : opp.tag === 'Subscriptions' ? '🎬' : opp.tag === 'Shopping' ? '🛍️' : '💡'}
                      </span>
                      <h4 className="text-base font-black text-white">{opp.title}</h4>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full ${
                        opp.impactLevel === 'Critical' ? 'bg-rose-500 text-white' : opp.impactLevel === 'High Impact' ? 'bg-lime-400 text-emerald-950' : 'bg-amber-400 text-emerald-950'
                      }`}>
                        Impact: {opp.impactScore}/100
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 p-3.5 rounded-2xl bg-emerald-950/60 border border-emerald-800/30 mb-4">
                    <div>
                      <span className="text-[10px] text-emerald-400/80 uppercase font-black block">Current Spend</span>
                      <span className="text-sm font-black text-white">₹{opp.currentMonthlyAmount.toLocaleString('en-IN')}/mo</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-lime-400 uppercase font-black block">Potential Reduction</span>
                      <span className="text-sm font-black text-lime-300">₹{opp.potentialMonthlySaving.toLocaleString('en-IN')}/mo</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-emerald-400/80 uppercase font-black block">Annual Value</span>
                      <span className="text-sm font-black text-emerald-200">₹{opp.potentialAnnualSaving.toLocaleString('en-IN')}/yr</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-emerald-400/80 uppercase font-black block">Difficulty</span>
                      <span className="text-sm font-bold text-lime-300">{opp.difficulty}</span>
                    </div>
                  </div>

                  <p className="text-xs text-emerald-200/90 leading-relaxed font-medium mb-4">
                    👉 <span className="text-white font-bold">{opp.recommendation}</span>
                  </p>
                </div>

                <div className="pt-3 border-t border-emerald-800/40 flex items-center justify-between gap-3">
                  <span className="text-[11px] text-emerald-400/80 font-medium">
                    Suggested Deadline: {opp.deadlineDays} days
                  </span>
                  <button
                    onClick={() => handleOpenGoalModal(`${opp.category} Savings Reserve`, opp.potentialMonthlySaving)}
                    className="px-4 py-2 rounded-xl bg-lime-400 hover:bg-lime-300 text-emerald-950 text-xs font-black shadow-md transition-all flex items-center gap-1.5"
                  >
                    <span>+ Add Savings Goal</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* --- TAB 4: RECURRING MONEY LEAKS --- */}
      {activeTab === 'LEAKS' && (
        <div className="space-y-6">
          {/* Header summary banner */}
          <div className="glass-card p-6 md:p-8 rounded-3xl border border-amber-500/30 bg-gradient-to-br from-[#1c1808] via-[#241f09] to-[#0c2415] flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xl">🔄</span>
                <h3 className="text-lg md:text-2xl font-black text-white">Recurring Expenditure Leaks</h3>
              </div>
              <p className="text-xs md:text-sm text-amber-200/80 max-w-2xl">
                Automatically detected subscriptions, memberships, software, and repeated charges that silently drain wealth.
              </p>
            </div>

            <div className="flex items-center gap-4">
              <div className="p-4 rounded-2xl bg-black/40 border border-amber-400/30 text-center">
                <span className="text-[10px] text-amber-300 uppercase font-black tracking-wider block">Monthly Leakage</span>
                <span className="text-xl font-black text-white">₹{paretoData.totalMonthlyLeakage.toLocaleString('en-IN')}</span>
              </div>
              <div className="p-4 rounded-2xl bg-black/40 border border-amber-400/30 text-center">
                <span className="text-[10px] text-amber-300 uppercase font-black tracking-wider block">Annualized Leakage</span>
                <span className="text-xl font-black text-amber-300">₹{paretoData.totalAnnualLeakage.toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>

          {/* Leaks list */}
          <div className="space-y-3">
            {paretoData.recurringLeaks.length === 0 ? (
              <div className="p-12 glass-card rounded-3xl text-center text-emerald-300/70 text-xs">
                No recurring money leaks detected in this period. Keep tracking transactions to monitor subscriptions!
              </div>
            ) : (
              paretoData.recurringLeaks.map((leak) => (
                <div
                  key={leak.id}
                  className="p-4 md:p-5 rounded-3xl glass-card border border-emerald-800/40 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:border-amber-400/40 transition-all"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-2xl bg-amber-400/15 border border-amber-400/30 flex items-center justify-center text-2xl">
                      {leak.type === 'OTT / Streaming' ? '🎬' : leak.type === 'Membership / Gym' ? '🏋️' : leak.type === 'App / Software' ? '☁️' : '💳'}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-sm md:text-base font-black text-white">{leak.name}</h4>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-900 text-emerald-300">
                          {leak.type}
                        </span>
                        {leak.status === 'Review Needed' && (
                          <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse">
                            ⚠️ Review Needed
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-emerald-400/80 font-medium">
                        Category: {leak.category} • Impact Score: {leak.impactScore}/100
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto pt-3 sm:pt-0 border-t sm:border-t-0 border-emerald-800/40">
                    <div className="text-left sm:text-right">
                      <span className="text-sm md:text-base font-black text-amber-300 block">₹{leak.monthlyAmount.toLocaleString('en-IN')}/mo</span>
                      <span className="text-[10px] text-emerald-400/70">₹{leak.annualAmount.toLocaleString('en-IN')}/yr</span>
                    </div>

                    <button
                      onClick={() => handleOpenGoalModal(`Redirect ${leak.name} to Savings`, leak.monthlyAmount)}
                      className="px-4 py-2 rounded-xl bg-amber-400/20 hover:bg-amber-400/30 text-amber-300 border border-amber-400/40 text-xs font-black transition-all whitespace-nowrap"
                    >
                      Audit / Cancel ✂️
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* --- TAB 5: TOP 5 ACTIONS & PRIORITY MATRIX --- */}
      {activeTab === 'ACTIONS' && (
        <div className="space-y-6">
          {/* Priority Matrix Philosophy Card */}
          <div className="glass-card p-6 md:p-8 rounded-3xl border border-emerald-800/40 bg-gradient-to-br from-[#062013] to-[#0e3b23]">
            <h3 className="text-lg md:text-xl font-black text-white tracking-tight mb-2">
              Financial Health Priority Matrix
            </h3>
            <p className="text-xs md:text-sm text-emerald-200/90 leading-relaxed max-w-3xl mb-4 font-medium">
              💡 <span className="font-bold text-white">Rule of High Leverage:</span> Don’t spend an hour agonizing over a ₹50 coffee when a ₹5,000 recurring or discretionary expense is left unmanaged.
            </p>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="p-3 rounded-2xl bg-rose-950/40 border border-rose-500/30">
                <span className="text-xs font-black text-rose-400 block mb-1">🔴 Critical (Score 80–100)</span>
                <p className="text-[10px] text-rose-200/80">High financial impact + urgent action needed.</p>
              </div>
              <div className="p-3 rounded-2xl bg-amber-950/40 border border-amber-500/30">
                <span className="text-xs font-black text-amber-400 block mb-1">🟠 High Impact (Score 60–79)</span>
                <p className="text-[10px] text-amber-200/80">Large opportunity to immediately increase monthly cashflow.</p>
              </div>
              <div className="p-3 rounded-2xl bg-yellow-950/40 border border-yellow-500/30">
                <span className="text-xs font-black text-yellow-300 block mb-1">🟡 Moderate (Score 40–59)</span>
                <p className="text-[10px] text-yellow-100/80">Useful optimizations without high friction.</p>
              </div>
              <div className="p-3 rounded-2xl bg-emerald-950/40 border border-emerald-500/30">
                <span className="text-xs font-black text-lime-400 block mb-1">🟢 Low Impact (&lt; 40)</span>
                <p className="text-[10px] text-emerald-200/80">Small optimizations; do not obsess over.</p>
              </div>
            </div>
          </div>

          {/* Top 5 Ranked Actions */}
          <div className="space-y-4">
            <h4 className="text-sm font-black text-white uppercase tracking-wider">
              Your Top 5 Financial Actions
            </h4>

            {paretoData.top5Actions.map((action) => (
              <div
                key={action.id}
                className="glass-card p-6 rounded-3xl border border-emerald-800/40 hover:border-lime-400/40 transition-all flex flex-col md:flex-row justify-between items-start md:items-center gap-6"
              >
                <div className="flex items-start gap-4 flex-1">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-lime-400 to-emerald-600 text-emerald-950 font-black text-xl flex items-center justify-center shadow-lg shrink-0">
                    #{action.rank}
                  </div>
                  <div>
                    <div className="flex items-center gap-2.5 flex-wrap mb-1">
                      <h5 className="text-base font-black text-white">{action.title}</h5>
                      <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full ${
                        action.priority === 'Critical' ? 'bg-rose-500 text-white' : action.priority === 'High Impact' ? 'bg-lime-400 text-emerald-950' : 'bg-amber-400 text-emerald-950'
                      }`}>
                        {action.priority} • Score {action.impactScore}/100
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-900 text-emerald-300">
                        Difficulty: {action.difficulty}
                      </span>
                    </div>

                    <p className="text-xs text-emerald-200/90 leading-relaxed font-medium">
                      {action.whyItMatters}
                    </p>

                    <div className="flex items-center gap-4 text-[11px] text-emerald-400/80 mt-2">
                      <span>⏰ Deadline: <strong className="text-white">{action.recommendedDeadline}</strong></span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between md:justify-end gap-6 w-full md:w-auto pt-4 md:pt-0 border-t md:border-t-0 border-emerald-800/40">
                  <div className="text-left md:text-right">
                    <span className="text-[10px] text-lime-400 uppercase font-black block">Potential Impact</span>
                    <span className="text-base font-black text-lime-300 block">+₹{action.monthlyImpact.toLocaleString('en-IN')}/mo</span>
                    <span className="text-[10px] text-emerald-400/70">₹{action.annualImpact.toLocaleString('en-IN')}/year</span>
                  </div>

                  <button
                    onClick={() => handleOpenGoalModal(action.suggestedGoalTitle || action.title, action.monthlyImpact)}
                    className="px-5 py-3 rounded-2xl bg-lime-400 hover:bg-lime-300 text-emerald-950 font-black text-xs shadow-lg glow-lime-sm transition-all whitespace-nowrap"
                  >
                    Take Action 🚀
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* --- TAB 6: INCOME & DEBT 80/20 --- */}
      {activeTab === 'INCOME_DEBT' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Income 80/20 */}
            <div className="glass-card p-6 md:p-8 rounded-3xl border border-emerald-800/40 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2.5">
                    <span className="text-xl">💰</span>
                    <div>
                      <h3 className="text-base font-black text-white">Income 80/20 Analysis</h3>
                      <p className="text-xs text-emerald-300/80">Revenue concentration & expansion drivers</p>
                    </div>
                  </div>
                  <span className="text-xs font-black text-lime-300">
                    ₹{paretoData.totalIncome.toLocaleString('en-IN')} Total
                  </span>
                </div>

                <div className="space-y-3 mb-4">
                  {paretoData.incomeSources.map((inc, idx) => (
                    <div key={idx} className="p-3.5 rounded-2xl bg-emerald-950/50 border border-emerald-800/30 space-y-1.5">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-white">{inc.source}</span>
                        <span className="text-xs font-black text-lime-300">₹{inc.amount.toLocaleString('en-IN')} ({inc.percentage}%)</span>
                      </div>
                      <div className="w-full h-1.5 bg-emerald-900/50 rounded-full overflow-hidden">
                        <div className="h-full bg-lime-400 rounded-full" style={{ width: `${inc.percentage}%` }} />
                      </div>
                      <p className="text-[11px] text-emerald-300/80">{inc.growthOpportunity}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-emerald-900/30 border border-lime-400/20 text-xs text-emerald-200">
                💡 <strong>80/20 Income Insight:</strong> Your primary employment anchors your cashflow. Expanding freelance, dividends or side business represents your highest leveraged path to surplus.
              </div>
            </div>

            {/* Debt 80/20 Leverage */}
            <div className="glass-card p-6 md:p-8 rounded-3xl border border-emerald-800/40 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2.5">
                    <span className="text-xl">💳</span>
                    <div>
                      <h3 className="text-base font-black text-white">Debt 80/20 Leverage</h3>
                      <p className="text-xs text-emerald-300/80">Interest cost vs principal balance leverage</p>
                    </div>
                  </div>
                  <span className="text-xs font-black text-rose-300">
                    ₹{paretoData.totalDebtBalance.toLocaleString('en-IN')} Balance
                  </span>
                </div>

                <div className="space-y-3 mb-4">
                  {paretoData.debts.map((d) => (
                    <div key={d.id} className="p-3.5 rounded-2xl bg-emerald-950/50 border border-emerald-800/30 space-y-1.5">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-white">{d.name}</span>
                          <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-300">
                            {d.interestRate}% APR
                          </span>
                        </div>
                        <span className="text-xs font-black text-white">₹{d.balance.toLocaleString('en-IN')}</span>
                      </div>
                      <div className="flex justify-between text-[11px] text-emerald-400/80">
                        <span>Balance Share: {d.balanceSharePercent}%</span>
                        <span className="text-rose-400 font-bold">Interest Cost Share: {d.interestCostSharePercent}%</span>
                      </div>
                      {d.isHighInterestLeverage && (
                        <p className="text-[10px] text-rose-300 font-bold">
                          ⚡ High Leverage: Represents a small balance portion but drives {d.interestCostSharePercent}% of interest costs!
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-rose-950/30 border border-rose-500/20 text-xs text-rose-200">
                🎯 <strong>Avalanche Payoff Focus:</strong> Prioritizing your highest APR debt ({paretoData.highestInterestDebtName || 'Credit Card'}) eliminates the fastest compounding drain on your wealth.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- TAB 7: GOALS ACCELERATION --- */}
      {activeTab === 'GOALS' && (
        <div className="space-y-6">
          <div className="glass-card p-6 md:p-8 rounded-3xl border border-emerald-800/40 bg-gradient-to-br from-[#062415] to-[#124d2d] flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div>
              <h3 className="text-lg md:text-2xl font-black text-white">
                80/20 Financial Goal Acceleration
              </h3>
              <p className="text-xs md:text-sm text-emerald-200/80 max-w-2xl mt-1">
                See how directing your unlocked ₹{paretoData.potentialMonthlySavingsTotal.toLocaleString('en-IN')}/mo surplus propels your major life milestones forward.
              </p>
            </div>

            <button
              onClick={() => handleOpenGoalModal('New Accelerated Milestone', paretoData.potentialMonthlySavingsTotal)}
              className="px-5 py-3 rounded-2xl bg-lime-400 hover:bg-lime-300 text-emerald-950 font-black text-xs shadow-lg glow-lime-sm transition-all"
            >
              + Create New Goal 🎯
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {paretoData.goalAccelerations.map((goal) => (
              <div
                key={goal.goalId}
                className="glass-card p-6 rounded-3xl border border-emerald-800/40 flex flex-col justify-between space-y-4"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-base font-black text-white">{goal.goalTitle}</h4>
                    <span className="text-xs font-black text-lime-400 bg-lime-400/15 px-2.5 py-1 rounded-full">
                      -{goal.monthsSaved} Months
                    </span>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-xs text-emerald-300/80">
                      <span>Saved: ₹{goal.currentAmount.toLocaleString('en-IN')}</span>
                      <span>Target: ₹{goal.targetAmount.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="w-full h-2 bg-emerald-950 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-emerald-500 to-lime-400 rounded-full"
                        style={{ width: `${Math.min(100, Math.round((goal.currentAmount / (goal.targetAmount || 1)) * 100))}%` }}
                      />
                    </div>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-emerald-950/60 border border-emerald-800/30 text-xs space-y-1">
                    <span className="text-[10px] text-emerald-400/80 uppercase font-black block">New Accelerated Horizon</span>
                    <span className="text-sm font-black text-lime-300">{goal.newCompletionDate}</span>
                  </div>
                </div>

                <button
                  onClick={() => handleOpenGoalModal(goal.goalTitle, paretoData.potentialMonthlySavingsTotal * 0.5)}
                  className="w-full py-2.5 rounded-xl bg-lime-400/20 hover:bg-lime-400/30 border border-lime-400/30 text-lime-300 text-xs font-black transition-all text-center"
                >
                  Apply 80/20 Surplus 🚀
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* --- TAB 8: 80/20 SAVINGS SIMULATOR --- */}
      {activeTab === 'SIMULATOR' && (
        <div className="space-y-6">
          <div className="glass-card p-6 md:p-8 rounded-3xl border border-emerald-800/40 bg-gradient-to-br from-[#062415] via-[#0b331c] to-[#124b2a]">
            <h3 className="text-lg md:text-2xl font-black text-white mb-2">
              80/20 Savings Simulator
            </h3>
            <p className="text-xs md:text-sm text-emerald-200/80 max-w-3xl leading-relaxed">
              Model hypothetical percentage reductions across your top spending drivers to see real-time impact on monthly savings, annual wealth accumulation, and goal acceleration.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left: Sliders */}
            <div className="lg:col-span-7 glass-card p-6 rounded-3xl border border-emerald-800/40 space-y-5">
              <h4 className="text-sm font-black text-white uppercase tracking-wider">
                Adjust Optimization Levers
              </h4>

              {paretoData.categories.slice(0, 5).map((cat) => {
                const currentReduction = simReductions[cat.category] || 0;
                const simulatedCut = Math.round((cat.amount * currentReduction) / 100);

                return (
                  <div key={cat.category} className="p-4 rounded-2xl bg-emerald-950/50 border border-emerald-800/30 space-y-2">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <span className="text-base">{cat.icon}</span>
                        <span className="text-xs font-bold text-white">{cat.category}</span>
                      </div>
                      <span className="text-xs font-black text-lime-300">
                        {currentReduction}% Cut = -₹{simulatedCut.toLocaleString('en-IN')}/mo
                      </span>
                    </div>

                    <input
                      type="range"
                      min="0"
                      max="40"
                      step="5"
                      value={currentReduction}
                      onChange={(e) =>
                        setSimReductions((prev) => ({
                          ...prev,
                          [cat.category]: Number(e.target.value)
                        }))
                      }
                      className="w-full accent-lime-400 cursor-pointer h-2 bg-emerald-900 rounded-lg"
                    />

                    <div className="flex justify-between text-[10px] text-emerald-400/70 font-medium">
                      <span>0% (No Change)</span>
                      <span>Current: ₹{cat.amount.toLocaleString('en-IN')}</span>
                      <span>40% Max Trim</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Right: Real-time Simulation Results */}
            <div className="lg:col-span-5 glass-card p-6 md:p-8 rounded-3xl border border-lime-400/40 bg-gradient-to-br from-[#082b19] to-[#124d2c] flex flex-col justify-between">
              <div className="space-y-6">
                <div>
                  <span className="text-[10px] text-lime-400 font-black uppercase tracking-wider block">
                    Simulated Financial Leap
                  </span>
                  <h4 className="text-2xl font-black text-white mt-1">
                    +₹{simulationResults.monthlySavings.toLocaleString('en-IN')}{' '}
                    <span className="text-sm font-bold text-emerald-300">/ month</span>
                  </h4>
                  <p className="text-xs text-emerald-200/80 font-medium mt-0.5">
                    ₹{simulationResults.annualSavings.toLocaleString('en-IN')} extra accumulated every year.
                  </p>
                </div>

                <div className="space-y-3 pt-4 border-t border-emerald-800/40 text-xs">
                  <div className="flex justify-between items-center p-3 rounded-2xl bg-emerald-950/60">
                    <span className="text-emerald-300/80 font-bold">New Savings Rate:</span>
                    <span className="text-base font-black text-lime-300">{simulationResults.newSavingsRate}%</span>
                  </div>
                  <div className="flex justify-between items-center p-3 rounded-2xl bg-emerald-950/60">
                    <span className="text-emerald-300/80 font-bold">Emergency Fund Reached:</span>
                    <span className="text-base font-black text-white">{simulationResults.emergencyFundMonths} Months</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-emerald-800/40">
                <p className="text-[11px] text-emerald-200/90 mb-3 font-medium">
                  💬 &quot;A 20% reduction across your top 3 discretionary drivers can fund an entire emergency reserve in under 12 months.&quot;
                </p>
                <button
                  onClick={() => handleOpenGoalModal('Simulated 80/20 Surplus Goal', simulationResults.monthlySavings)}
                  className="w-full py-3 rounded-2xl bg-lime-400 hover:bg-lime-300 text-emerald-950 font-black text-xs shadow-lg glow-lime-sm transition-all"
                >
                  Commit This Surplus To Goal 🚀
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- TAB 9: MONTHLY 80/20 REPORT --- */}
      {activeTab === 'REPORT' && (
        <div className="space-y-6">
          <div className="glass-card p-6 md:p-10 rounded-3xl border border-emerald-800/50 bg-[#072415] space-y-6">
            {/* Report Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b border-emerald-800/50">
              <div>
                <span className="text-[10px] font-black uppercase text-lime-400 tracking-widest block">
                  FS4HOME Executive Review
                </span>
                <h3 className="text-2xl md:text-3xl font-black text-white">
                  80/20 Monthly Financial Statement
                </h3>
                <p className="text-xs text-emerald-300/80 mt-0.5">
                  Period: {paretoData.timeframeLabel} • Prepared for {state.userName}
                </p>
              </div>

              <button
                onClick={() => window.print()}
                className="px-4 py-2.5 rounded-2xl bg-emerald-900/60 hover:bg-emerald-800 text-emerald-200 text-xs font-bold transition-all flex items-center gap-2"
              >
                <span>🖨️ Print / Save PDF</span>
              </button>
            </div>

            {/* Financial Snapshot */}
            <div className="space-y-2">
              <h4 className="text-xs font-black uppercase tracking-wider text-lime-400">1. Financial Snapshot</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-2xl bg-emerald-950/60 border border-emerald-800/30">
                  <span className="text-[10px] text-emerald-400/80 uppercase block">Total Income</span>
                  <span className="text-base font-black text-white">₹{paretoData.totalIncome.toLocaleString('en-IN')}</span>
                </div>
                <div className="p-3.5 rounded-2xl bg-emerald-950/60 border border-emerald-800/30">
                  <span className="text-[10px] text-emerald-400/80 uppercase block">Total Expenses</span>
                  <span className="text-base font-black text-rose-300">₹{paretoData.totalExpenses.toLocaleString('en-IN')}</span>
                </div>
                <div className="p-3.5 rounded-2xl bg-emerald-950/60 border border-emerald-800/30">
                  <span className="text-[10px] text-emerald-400/80 uppercase block">Net Savings</span>
                  <span className="text-base font-black text-emerald-300">₹{paretoData.netSavings.toLocaleString('en-IN')}</span>
                </div>
                <div className="p-3.5 rounded-2xl bg-emerald-950/60 border border-emerald-800/30">
                  <span className="text-[10px] text-emerald-400/80 uppercase block">Savings Rate</span>
                  <span className="text-base font-black text-lime-300">{paretoData.savingsRate}%</span>
                </div>
              </div>
            </div>

            {/* Top 5 Spending Drivers */}
            <div className="space-y-2">
              <h4 className="text-xs font-black uppercase tracking-wider text-lime-400">2. Biggest Spending Drivers</h4>
              <div className="space-y-2">
                {paretoData.categories.slice(0, 5).map((c) => (
                  <div key={c.category} className="p-3 rounded-2xl bg-emerald-950/40 border border-emerald-800/30 flex justify-between items-center text-xs">
                    <span className="font-bold text-white">{c.icon} {c.category}</span>
                    <span className="font-black text-emerald-200">₹{c.amount.toLocaleString('en-IN')} ({c.sharePercent}%)</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Key Leaks & Opportunities */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h4 className="text-xs font-black uppercase tracking-wider text-amber-400">3. Recurring Leaks</h4>
                <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-800/30 text-xs space-y-2">
                  <div className="flex justify-between font-bold text-white">
                    <span>Total Monthly Subscriptions</span>
                    <span className="text-amber-300">₹{paretoData.totalMonthlyLeakage.toLocaleString('en-IN')}/mo</span>
                  </div>
                  <div className="flex justify-between text-emerald-300/80">
                    <span>Annualized Drain</span>
                    <span>₹{paretoData.totalAnnualLeakage.toLocaleString('en-IN')}/yr</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="text-xs font-black uppercase tracking-wider text-lime-400">4. Best Decision & Warning</h4>
                <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-800/30 text-xs space-y-2">
                  <div>
                    <span className="text-[10px] text-emerald-400 font-bold uppercase block">Best Decision:</span>
                    <span className="text-white font-bold">{paretoData.bestDecisionMonth}</span>
                  </div>
                  {paretoData.biggestWarningCategory && (
                    <div>
                      <span className="text-[10px] text-rose-400 font-bold uppercase block">Biggest Warning:</span>
                      <span className="text-rose-200">{paretoData.biggestWarningCategory.name} (+{paretoData.biggestWarningCategory.increasePercent}%)</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Next Month Action Plan */}
            <div className="space-y-2 pt-2">
              <h4 className="text-xs font-black uppercase tracking-wider text-lime-400">5. Top 3 Actions for Next Month</h4>
              <div className="space-y-2">
                {paretoData.top5Actions.slice(0, 3).map((act, idx) => (
                  <div key={act.id} className="p-3.5 rounded-2xl bg-emerald-950/60 border border-emerald-800/30 flex justify-between items-center text-xs">
                    <div>
                      <span className="font-black text-white mr-2">#{idx + 1} {act.title}</span>
                      <span className="text-emerald-300/80 text-[11px] block md:inline">{act.whyItMatters}</span>
                    </div>
                    <span className="font-black text-lime-300 whitespace-nowrap ml-4">+₹{act.monthlyImpact.toLocaleString('en-IN')}/mo</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Drilldown Modal */}
      <CategoryDrilldownModal
        category={drilldownCategory}
        allTransactions={state.transactions}
        onClose={() => setDrilldownCategory(null)}
        onOpenSavings={() => {
          setActiveTab('OPPORTUNITIES');
        }}
      />

      {/* Add Goal Modal */}
      <AddGoalFromInsightModal
        isOpen={isGoalModalOpen}
        defaultTitle={goalModalDefaults.title}
        defaultMonthlyImpact={goalModalDefaults.amount / 12}
        existingGoals={state.financialGoals}
        onClose={() => setIsGoalModalOpen(false)}
        onSaveGoal={handleSaveGoal}
        onApplyToExistingGoal={handleApplyToExistingGoal}
      />
    </div>
  );
};

export default ParetoDashboard;
