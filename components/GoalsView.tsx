import React, { useState } from 'react';
import { AppState, FinancialGoal } from '../types';

interface GoalsViewProps {
  state: AppState;
  onAddGoal: (g: Omit<FinancialGoal, 'id'>) => void;
  onUpdateState: React.Dispatch<React.SetStateAction<AppState>>;
  onShowToast: (msg: string) => void;
}

export const GoalsView: React.FC<GoalsViewProps> = ({ state, onAddGoal, onUpdateState, onShowToast }) => {
  const [showAdd, setShowAdd] = useState(false);
  const [title, setTitle] = useState('');
  const [targetAmount, setTargetAmount] = useState(100000);
  const [currentAmount, setCurrentAmount] = useState(25000);
  const [monthlyContribution, setMonthlyContribution] = useState(5000);
  const [targetDate, setTargetDate] = useState('2027-12-31');
  const [category, setCategory] = useState('Emergency Fund');

  const goals = state.financialGoals || [];

  const handleAddGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || targetAmount <= 0) return;
    onAddGoal({
      title,
      targetAmount,
      currentAmount,
      monthlyContribution,
      targetDate,
      category
    });
    setTitle('');
    setShowAdd(false);
    onShowToast('Goal added successfully ✓');
  };

  const handleQuickAddFunds = (goalId: string, delta: number) => {
    const updated = goals.map(g => g.id === goalId ? { ...g, currentAmount: Math.min(g.targetAmount, g.currentAmount + delta) } : g);
    onUpdateState(prev => ({ ...prev, financialGoals: updated }));
    onShowToast(`Added ₹${delta.toLocaleString()} to goal ✓`);
  };

  const totalTarget = goals.reduce((acc, g) => acc + g.targetAmount, 0);
  const totalSaved = goals.reduce((acc, g) => acc + g.currentAmount, 0);
  const overallPct = totalTarget > 0 ? Math.round((totalSaved / totalTarget) * 100) : 0;

  return (
    <div className="space-y-4 max-w-5xl mx-auto text-slate-100 animate-in fade-in duration-200 pb-16">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-emerald-500/20 pb-3">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-white tracking-tight">Financial Goals</h1>
          <p className="text-xs text-emerald-300/70">Track milestones and accelerate wealth targets via 80/20 cashflow</p>
        </div>
        <button
          onClick={() => setShowAdd(!showAdd)}
          className="px-3 py-1.5 rounded-xl bg-lime-400 text-emerald-950 text-xs font-black hover:bg-lime-300 shadow-md transition-colors"
        >
          {showAdd ? 'Cancel' : '+ New Goal'}
        </button>
      </div>

      {/* KPI Overview Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div className="glass-card p-3 rounded-xl border border-emerald-500/20">
          <div className="text-[10px] text-emerald-300/70 font-bold uppercase">Total Goals Target</div>
          <div className="text-base font-black text-white">₹{totalTarget.toLocaleString()}</div>
        </div>
        <div className="glass-card p-3 rounded-xl border border-emerald-500/20">
          <div className="text-[10px] text-emerald-300/70 font-bold uppercase">Current Saved</div>
          <div className="text-base font-black text-lime-400">₹{totalSaved.toLocaleString()}</div>
        </div>
        <div className="glass-card p-3 rounded-xl border border-emerald-500/20">
          <div className="text-[10px] text-emerald-300/70 font-bold uppercase">Overall Completion</div>
          <div className="text-base font-black text-lime-300">{overallPct}%</div>
        </div>
        <div className="glass-card p-3 rounded-xl border border-emerald-500/20">
          <div className="text-[10px] text-emerald-300/70 font-bold uppercase">Active Targets</div>
          <div className="text-base font-black text-white">{goals.length} Goals</div>
        </div>
      </div>

      {/* Quick Add Form */}
      {showAdd && (
        <form onSubmit={handleAddGoal} className="glass-card p-4 rounded-2xl border border-lime-400/40 space-y-3">
          <h3 className="text-xs font-black text-lime-300 uppercase tracking-wider">Create Financial Milestone</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
            <div>
              <label className="block text-[10px] font-bold text-emerald-300/70 uppercase mb-1">Goal Title</label>
              <input
                type="text"
                placeholder="e.g. Car Upgrade, Hajj, Home"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-[#061f12] border border-emerald-500/30 rounded-lg text-white font-bold outline-none focus:border-lime-400"
                required
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-emerald-300/70 uppercase mb-1">Target (₹)</label>
              <input
                type="number"
                value={targetAmount}
                onChange={(e) => setTargetAmount(Number(e.target.value))}
                className="w-full px-2.5 py-1.5 bg-[#061f12] border border-emerald-500/30 rounded-lg text-white font-bold outline-none focus:border-lime-400"
                required
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-emerald-300/70 uppercase mb-1">Current Saved (₹)</label>
              <input
                type="number"
                value={currentAmount}
                onChange={(e) => setCurrentAmount(Number(e.target.value))}
                className="w-full px-2.5 py-1.5 bg-[#061f12] border border-emerald-500/30 rounded-lg text-white font-bold outline-none focus:border-lime-400"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-emerald-300/70 uppercase mb-1">Monthly Contribution (₹)</label>
              <input
                type="number"
                value={monthlyContribution}
                onChange={(e) => setMonthlyContribution(Number(e.target.value))}
                className="w-full px-2.5 py-1.5 bg-[#061f12] border border-emerald-500/30 rounded-lg text-white font-bold outline-none focus:border-lime-400"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-emerald-300/70 uppercase mb-1">Target Date</label>
              <input
                type="date"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-[#061f12] border border-emerald-500/30 rounded-lg text-white font-bold outline-none focus:border-lime-400"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-emerald-300/70 uppercase mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-[#061f12] border border-emerald-500/30 rounded-lg text-white font-bold outline-none focus:border-lime-400"
              >
                <option value="Security">Security & Emergency</option>
                <option value="Spiritual">Spiritual & Pilgrimage</option>
                <option value="Asset">Asset & Real Estate</option>
                <option value="Education">Education & Growth</option>
                <option value="Lifestyle">Lifestyle & Vehicle</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setShowAdd(false)}
              className="px-3 py-1 rounded-lg border border-emerald-500/30 text-emerald-300 text-xs font-bold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1 bg-lime-400 text-emerald-950 text-xs font-black rounded-lg hover:bg-lime-300 shadow-md"
            >
              Save Goal
            </button>
          </div>
        </form>
      )}

      {/* Goal Cards Grid */}
      {goals.length === 0 ? (
        <div className="glass-card p-8 rounded-2xl border border-emerald-500/20 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-950/80 border border-emerald-500/30 text-lime-400 flex items-center justify-center text-2xl mx-auto shadow-inner">
            🎯
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-black text-white">No Financial Goals Set Yet</h3>
            <p className="text-xs text-emerald-300/70 max-w-md mx-auto">
              Start building your wealth roadmap. Set targets for an Emergency Fund, Hajj / Umrah, Home Purchase, or Family Milestones.
            </p>
          </div>
          <button
            onClick={() => setShowAdd(true)}
            className="px-4 py-2 bg-lime-400 hover:bg-lime-300 text-emerald-950 text-xs font-black rounded-xl shadow-md glow-lime-sm transition-all"
          >
            + Create Your First Goal
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {goals.map((g) => {
            const pct = g.targetAmount > 0 ? Math.min(100, Math.round((g.currentAmount / g.targetAmount) * 100)) : 0;
            const remaining = Math.max(0, g.targetAmount - g.currentAmount);
            const monthsLeft = g.monthlyContribution > 0 ? Math.ceil(remaining / g.monthlyContribution) : 0;

            return (
              <div key={g.id} className="glass-card p-3.5 rounded-xl border border-emerald-500/20 space-y-2.5">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-white text-xs">{g.title}</h3>
                    <span className="text-[10px] text-emerald-300/60 font-semibold">{g.category} • Target: {g.targetDate}</span>
                  </div>
                  <span className="text-xs font-black text-lime-400">{pct}%</span>
                </div>

                {/* Progress Bar */}
                <div className="space-y-1">
                  <div className="w-full bg-emerald-950 rounded-full h-1.5 overflow-hidden border border-emerald-800">
                    <div className="h-full bg-lime-400 rounded-full transition-all duration-700" style={{ width: `${pct}%` }} />
                  </div>
                  <div className="flex justify-between text-[10px] text-emerald-300/70 font-bold">
                    <span>Saved: ₹{g.currentAmount.toLocaleString()}</span>
                    <span>Target: ₹{g.targetAmount.toLocaleString()}</span>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="flex items-center justify-between pt-1 border-t border-emerald-500/15 text-[10px]">
                  <span className="text-emerald-300/60">~{monthsLeft} months remaining</span>
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => handleQuickAddFunds(g.id, 1000)}
                      className="px-2 py-0.5 rounded bg-emerald-900/60 hover:bg-lime-400 hover:text-emerald-950 font-bold text-emerald-300 transition-colors"
                    >
                      +₹1K
                    </button>
                    <button
                      onClick={() => handleQuickAddFunds(g.id, 5000)}
                      className="px-2 py-0.5 rounded bg-emerald-900/60 hover:bg-lime-400 hover:text-emerald-950 font-bold text-emerald-300 transition-colors"
                    >
                      +₹5K
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
