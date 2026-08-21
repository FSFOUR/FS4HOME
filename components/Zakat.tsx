import React, { useMemo } from 'react';
import { AppState, WealthType } from '../types';

interface Props {
  state: AppState;
  onUpdateGiven: (val: number) => void;
}

const Zakat: React.FC<Props> = ({ state, onUpdateGiven }) => {
  const calculations = useMemo(() => {
    const eligibleAssets = state.transactions
      .filter(t => t.type === WealthType.ASSET)
      .reduce((acc, t) => acc + t.amount, 0);

    const totalWealth = eligibleAssets;
    const zakatRate = 0.025; // 2.5%
    const totalDue = Math.round(totalWealth * zakatRate);
    const paid = state.zakatGiven || 0;
    const remaining = Math.max(0, totalDue - paid);
    const progressPct = totalDue > 0 ? Math.min(100, Math.round((paid / totalDue) * 100)) : 100;

    // Breakdown
    const cashAssets = state.transactions
      .filter(t => t.type === WealthType.ASSET && t.description.toLowerCase().includes('cash'))
      .reduce((a, b) => a + b.amount, 0);
    
    const bankAssets = state.transactions
      .filter(t => t.type === WealthType.ASSET && (t.description.toLowerCase().includes('bank') || t.description.toLowerCase().includes('savings')))
      .reduce((a, b) => a + b.amount, 0);

    const otherAssets = Math.max(0, totalWealth - cashAssets - bankAssets);

    return { totalWealth, totalDue, paid, remaining, progressPct, cashAssets, bankAssets, otherAssets };
  }, [state]);

  // Nisab Reference: ~85g Gold or 595g Silver (~₹6,50,000 / ~₹65,000 approx)
  const isAboveNisab = calculations.totalWealth >= 65000;

  return (
    <div className="space-y-3.5 max-w-5xl mx-auto text-slate-100 animate-in fade-in duration-200 pb-16">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-emerald-500/20 pb-3">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-white tracking-tight">Zakat & Charity</h1>
          <p className="text-xs text-emerald-300/70">2.5% annual wealth purification, Nisab verification, and donation progress</p>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-950/60 border border-emerald-500/20 text-xs">
          <span className="text-lime-400">⚖️ Nisab Status:</span>
          <span className={`font-black ${isAboveNisab ? 'text-lime-400' : 'text-amber-400'}`}>
            {isAboveNisab ? 'Threshold Met' : 'Below Nisab'}
          </span>
        </div>
      </div>

      {/* 3 Compact KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
        <div className="glass-card p-3 rounded-xl border border-emerald-500/20">
          <div className="flex items-center justify-between text-[10px] font-bold text-emerald-300/70 uppercase">
            <span>Eligible Wealth</span>
            <span>💰</span>
          </div>
          <p className="text-lg md:text-xl font-black text-white mt-1">₹{calculations.totalWealth.toLocaleString()}</p>
          <span className="text-[10px] text-emerald-400/60">Calculated from your Assets</span>
        </div>

        <div className="glass-card p-3 rounded-xl border border-emerald-500/20">
          <div className="flex items-center justify-between text-[10px] font-bold text-emerald-300/70 uppercase">
            <span>Zakat Due (2.5%)</span>
            <span>🤲</span>
          </div>
          <p className="text-lg md:text-xl font-black text-lime-400 mt-1">₹{calculations.totalDue.toLocaleString()}</p>
          <span className="text-[10px] text-lime-400/70">Purification obligation</span>
        </div>

        <div className="glass-card p-3 rounded-xl border border-emerald-500/20">
          <div className="flex items-center justify-between text-[10px] font-bold text-emerald-300/70 uppercase">
            <span>Remaining Due</span>
            <span>⏳</span>
          </div>
          <p className="text-lg md:text-xl font-black text-rose-400 mt-1">₹{calculations.remaining.toLocaleString()}</p>
          <span className="text-[10px] text-emerald-300/60">₹{calculations.paid.toLocaleString()} paid so far</span>
        </div>
      </div>

      {/* Main 2-Column Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        
        {/* Left Column: Donation Progress & Record Payment */}
        <div className="glass-card p-3.5 rounded-2xl border border-emerald-500/20 space-y-3">
          <div className="flex items-center justify-between border-b border-emerald-500/15 pb-2">
            <h3 className="text-xs font-black text-white uppercase">Donation Fulfillment</h3>
            <span className="text-xs font-black text-lime-400">{calculations.progressPct}% Fulfilled</span>
          </div>

          {/* Progress Bar */}
          <div className="space-y-1">
            <div className="w-full bg-emerald-950/80 h-2.5 rounded-full overflow-hidden border border-emerald-500/20 p-0.5">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-lime-400 rounded-full transition-all duration-500 shadow-sm"
                style={{ width: `${calculations.progressPct}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] font-bold text-emerald-300/70">
              <span>Paid: ₹{calculations.paid.toLocaleString()}</span>
              <span>Target: ₹{calculations.totalDue.toLocaleString()}</span>
            </div>
          </div>

          {/* Paid Amount Input */}
          <div className="space-y-1.5 pt-1">
            <label className="block text-[10px] font-bold text-emerald-300/70 uppercase">
              Update Paid Contributions (₹)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-black text-lime-400">₹</span>
              <input
                type="number"
                min="0"
                value={state.zakatGiven || 0}
                onChange={(e) => onUpdateGiven(Math.max(0, Number(e.target.value)))}
                className="w-full pl-7 pr-3 py-2 bg-[#061f12] border border-emerald-500/30 rounded-xl text-base font-black text-white outline-none focus:border-lime-400"
              />
            </div>
            <p className="text-[10px] text-emerald-300/60">
              Enter total donations given this lunar year towards zakat/charity.
            </p>
          </div>

          {/* Nisab Guidance Box */}
          <div className="p-2.5 rounded-xl bg-emerald-950/50 border border-emerald-500/15 flex items-start gap-2 text-xs">
            <span className="text-base shrink-0">📜</span>
            <div className="space-y-0.5 text-emerald-200/90 text-[11px]">
              <span className="font-bold text-white block">Nisab Criteria:</span>
              Zakat is obligatory when net wealth held for one lunar year exceeds the value of 85g gold or 595g silver.
            </div>
          </div>
        </div>

        {/* Right Column: Asset Breakdown & Quick Rules */}
        <div className="glass-card p-3.5 rounded-2xl border border-emerald-500/20 space-y-3">
          <div className="flex items-center justify-between border-b border-emerald-500/15 pb-2">
            <h3 className="text-xs font-black text-white uppercase">Wealth Asset Breakdown</h3>
            <span className="text-[10px] text-emerald-300/60 font-mono">From Balance Sheet</span>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between p-2 rounded-lg bg-emerald-950/40 border border-emerald-500/10">
              <span className="text-emerald-200">Cash & Liquid Holdings</span>
              <span className="font-mono font-bold text-white">₹{calculations.cashAssets.toLocaleString()}</span>
            </div>

            <div className="flex items-center justify-between p-2 rounded-lg bg-emerald-950/40 border border-emerald-500/10">
              <span className="text-emerald-200">Bank Accounts & Deposits</span>
              <span className="font-mono font-bold text-white">₹{calculations.bankAssets.toLocaleString()}</span>
            </div>

            <div className="flex items-center justify-between p-2 rounded-lg bg-emerald-950/40 border border-emerald-500/10">
              <span className="text-emerald-200">Investments & Gold Equiv.</span>
              <span className="font-mono font-bold text-white">₹{calculations.otherAssets.toLocaleString()}</span>
            </div>
          </div>

          <div className="border-t border-emerald-500/15 pt-2 space-y-1 text-[11px] text-emerald-300/80">
            <div className="font-bold text-white text-xs mb-1">Eligible Recipients (Asnaf):</div>
            <div className="grid grid-cols-2 gap-1 text-[10px]">
              <span className="p-1 rounded bg-emerald-950/60 border border-emerald-500/10 text-emerald-200">• The Poor (Fuqara)</span>
              <span className="p-1 rounded bg-emerald-950/60 border border-emerald-500/10 text-emerald-200">• The Needy (Masakin)</span>
              <span className="p-1 rounded bg-emerald-950/60 border border-emerald-500/10 text-emerald-200">• Debtors (Gharimin)</span>
              <span className="p-1 rounded bg-emerald-950/60 border border-emerald-500/10 text-emerald-200">• Travelers in Need</span>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};

export default Zakat;
