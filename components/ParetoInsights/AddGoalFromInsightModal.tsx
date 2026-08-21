import React, { useState } from 'react';
import { FinancialGoal } from '../../types';

interface Props {
  isOpen: boolean;
  defaultTitle?: string;
  defaultMonthlyImpact?: number;
  existingGoals?: FinancialGoal[];
  onClose: () => void;
  onSaveGoal: (goal: Omit<FinancialGoal, 'id'>) => void;
  onApplyToExistingGoal?: (goalId: string, extraMonthly: number) => void;
}

const AddGoalFromInsightModal: React.FC<Props> = ({
  isOpen,
  defaultTitle = '80/20 Emergency Reserve Pool',
  defaultMonthlyImpact = 3000,
  existingGoals = [],
  onClose,
  onSaveGoal,
  onApplyToExistingGoal
}) => {
  if (!isOpen) return null;

  const [mode, setMode] = useState<'NEW' | 'EXISTING'>(existingGoals.length > 0 ? 'EXISTING' : 'NEW');
  const [title, setTitle] = useState(defaultTitle);
  const [targetAmount, setTargetAmount] = useState(defaultMonthlyImpact * 12);
  const [currentAmount, setCurrentAmount] = useState(0);
  const [monthlyContribution, setMonthlyContribution] = useState(defaultMonthlyImpact);
  const [category, setCategory] = useState('Savings');
  const [icon, setIcon] = useState('🎯');
  const [selectedGoalId, setSelectedGoalId] = useState<string>(existingGoals[0]?.id || '');
  const [extraMonthlyContribution, setExtraMonthlyContribution] = useState(defaultMonthlyImpact);

  const handleSubmitNew = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || targetAmount <= 0) return;

    const targetDateObj = new Date();
    const monthsNeeded = monthlyContribution > 0 ? Math.ceil(targetAmount / monthlyContribution) : 12;
    targetDateObj.setMonth(targetDateObj.getMonth() + monthsNeeded);

    onSaveGoal({
      title,
      targetAmount,
      currentAmount,
      monthlyContribution,
      targetDate: targetDateObj.toISOString().split('T')[0],
      category,
      icon
    });
    onClose();
  };

  const handleApplyExisting = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGoalId || !onApplyToExistingGoal) return;
    onApplyToExistingGoal(selectedGoalId, extraMonthlyContribution);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[160] flex items-center justify-center p-4 bg-emerald-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-[#082b18] border border-lime-500/30 rounded-3xl p-6 md:p-8 shadow-2xl glow-lime text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-emerald-800/50 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-lime-400/20 border border-lime-400/40 flex items-center justify-center text-xl">
              🎯
            </div>
            <div>
              <h3 className="text-lg font-black text-white">Connect 80/20 Savings to Goal</h3>
              <p className="text-xs text-emerald-300/80">Turn freed up cashflow into real milestones</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-emerald-400 hover:text-white">✕</button>
        </div>

        {existingGoals.length > 0 && (
          <div className="flex gap-2 p-1 bg-emerald-950/80 rounded-2xl border border-emerald-800/40 mb-5">
            <button
              type="button"
              onClick={() => setMode('EXISTING')}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                mode === 'EXISTING' ? 'bg-lime-400 text-emerald-950 shadow-md' : 'text-emerald-300/70 hover:text-white'
              }`}
            >
              Accelerate Existing Goal ({existingGoals.length})
            </button>
            <button
              type="button"
              onClick={() => setMode('NEW')}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                mode === 'NEW' ? 'bg-lime-400 text-emerald-950 shadow-md' : 'text-emerald-300/70 hover:text-white'
              }`}
            >
              Create New Goal
            </button>
          </div>
        )}

        {mode === 'EXISTING' && existingGoals.length > 0 ? (
          <form onSubmit={handleApplyExisting} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-emerald-300 mb-1.5">Select Target Goal</label>
              <select
                value={selectedGoalId}
                onChange={e => setSelectedGoalId(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl bg-emerald-950/60 border border-emerald-700/50 text-white text-xs font-bold focus:outline-none focus:border-lime-400"
              >
                {existingGoals.map(g => (
                  <option key={g.id} value={g.id}>
                    {g.icon || '🎯'} {g.title} (Target: ₹{g.targetAmount.toLocaleString('en-IN')})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-emerald-300 mb-1.5">Add Extra Monthly 80/20 Surplus (₹/mo)</label>
              <input
                type="number"
                value={extraMonthlyContribution}
                onChange={e => setExtraMonthlyContribution(Number(e.target.value))}
                className="w-full px-4 py-3 rounded-2xl bg-emerald-950/60 border border-emerald-700/50 text-white text-sm font-black focus:outline-none focus:border-lime-400"
              />
            </div>

            <div className="p-3.5 rounded-2xl bg-emerald-900/30 border border-lime-400/20 text-xs text-lime-300">
              ⚡ Applying this ₹{extraMonthlyContribution.toLocaleString('en-IN')}/mo surplus will shorten your goal horizon and build wealth faster.
            </div>

            <div className="flex gap-3 pt-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3 rounded-2xl bg-emerald-900/40 hover:bg-emerald-900 text-emerald-300 text-xs font-bold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 py-3 rounded-2xl bg-lime-400 hover:bg-lime-300 text-emerald-950 text-xs font-black shadow-lg glow-lime-sm"
              >
                Apply Savings 🚀
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleSubmitNew} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-emerald-300 mb-1">Goal Title</label>
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="e.g. 6-Month Emergency Fund"
                className="w-full px-4 py-2.5 rounded-2xl bg-emerald-950/60 border border-emerald-700/50 text-white text-xs font-bold focus:outline-none focus:border-lime-400"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-emerald-300 mb-1">Target Amount (₹)</label>
                <input
                  type="number"
                  value={targetAmount}
                  onChange={e => setTargetAmount(Number(e.target.value))}
                  className="w-full px-4 py-2.5 rounded-2xl bg-emerald-950/60 border border-emerald-700/50 text-white text-xs font-black focus:outline-none focus:border-lime-400"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-emerald-300 mb-1">Current Saved (₹)</label>
                <input
                  type="number"
                  value={currentAmount}
                  onChange={e => setCurrentAmount(Number(e.target.value))}
                  className="w-full px-4 py-2.5 rounded-2xl bg-emerald-950/60 border border-emerald-700/50 text-white text-xs font-black focus:outline-none focus:border-lime-400"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-emerald-300 mb-1">Monthly Surplus (₹/mo)</label>
                <input
                  type="number"
                  value={monthlyContribution}
                  onChange={e => setMonthlyContribution(Number(e.target.value))}
                  className="w-full px-4 py-2.5 rounded-2xl bg-emerald-950/60 border border-emerald-700/50 text-lime-300 text-xs font-black focus:outline-none focus:border-lime-400"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-emerald-300 mb-1">Icon</label>
                <select
                  value={icon}
                  onChange={e => setIcon(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-2xl bg-emerald-950/60 border border-emerald-700/50 text-white text-xs font-bold focus:outline-none focus:border-lime-400"
                >
                  <option value="🛡️">🛡️ Emergency Reserve</option>
                  <option value="🏠">🏠 House & Property</option>
                  <option value="🚗">🚗 Vehicle Purchase</option>
                  <option value="🕋">🕋 Hajj / Umrah</option>
                  <option value="🎓">🎓 Education / Growth</option>
                  <option value="📈">📈 Investments / Wealth</option>
                  <option value="🌴">🌴 Vacation / Family</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3 pt-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3 rounded-2xl bg-emerald-900/40 hover:bg-emerald-900 text-emerald-300 text-xs font-bold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 py-3 rounded-2xl bg-lime-400 hover:bg-lime-300 text-emerald-950 text-xs font-black shadow-lg glow-lime-sm"
              >
                Save Goal 🚀
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default AddGoalFromInsightModal;
