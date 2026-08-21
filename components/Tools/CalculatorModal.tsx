import React, { useState } from 'react';

export const CalculatorModal: React.FC<{ isOpen?: boolean; onClose?: () => void; isPage?: boolean }> = ({ 
  isOpen = true, 
  onClose,
  isPage = false 
}) => {
  const [calcType, setCalcType] = useState<'emi' | 'compound' | 'zakat'>('emi');
  
  // EMI State
  const [loanAmount, setLoanAmount] = useState(500000);
  const [interestRate, setInterestRate] = useState(9.5);
  const [tenureYears, setTenureYears] = useState(5);

  // Compound Interest State
  const [initialInv, setInitialInv] = useState(50000);
  const [monthlyInv, setMonthlyInv] = useState(5000);
  const [invReturnRate, setInvReturnRate] = useState(12);
  const [invYears, setInvYears] = useState(10);

  if (!isOpen && !isPage) return null;

  // EMI Calculation
  const monthlyRate = interestRate / (12 * 100);
  const totalMonths = tenureYears * 12;
  const emi = monthlyRate > 0
    ? Math.round((loanAmount * monthlyRate * Math.pow(1 + monthlyRate, totalMonths)) / (Math.pow(1 + monthlyRate, totalMonths) - 1))
    : Math.round(loanAmount / totalMonths);
  const totalPayment = emi * totalMonths;
  const totalInterest = Math.max(0, totalPayment - loanAmount);

  // Compound Growth Calculation
  const r = invReturnRate / 100 / 12;
  const n = invYears * 12;
  const futureValueInitial = initialInv * Math.pow(1 + r, n);
  const futureValueMonthly = monthlyInv * ((Math.pow(1 + r, n) - 1) / r);
  const totalCorpus = Math.round(futureValueInitial + futureValueMonthly);
  const totalInvested = initialInv + (monthlyInv * n);
  const wealthGained = Math.max(0, totalCorpus - totalInvested);

  const content = (
    <div className={`space-y-4 text-slate-100 ${isPage ? 'max-w-2xl mx-auto' : ''}`}>
      <div className="flex items-center justify-between border-b border-emerald-500/20 pb-3">
        <div>
          <h2 className="text-lg font-black text-white">Financial Calculator</h2>
          <p className="text-xs text-emerald-300/70">Fast mathematical projections for EMI, compounding, and wealth</p>
        </div>
        {onClose && (
          <button 
            onClick={onClose} 
            className="p-1 rounded-lg text-emerald-400 hover:text-white hover:bg-emerald-900/50 text-xs font-bold"
          >
            ✕
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        <button
          onClick={() => setCalcType('emi')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
            calcType === 'emi' ? 'bg-lime-400 text-emerald-950 font-black' : 'bg-emerald-950/60 text-emerald-300/80 hover:bg-emerald-900'
          }`}
        >
          Loan & EMI
        </button>
        <button
          onClick={() => setCalcType('compound')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
            calcType === 'compound' ? 'bg-lime-400 text-emerald-950 font-black' : 'bg-emerald-950/60 text-emerald-300/80 hover:bg-emerald-900'
          }`}
        >
          Compound Growth
        </button>
      </div>

      {/* Calculator 1: Loan EMI */}
      {calcType === 'emi' && (
        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <div>
              <label className="block text-[10px] font-bold uppercase text-emerald-300/80 mb-1">Loan Amount (₹)</label>
              <input
                type="number"
                value={loanAmount}
                onChange={(e) => setLoanAmount(Number(e.target.value))}
                className="w-full px-2.5 py-1.5 bg-[#061f12] border border-emerald-500/30 rounded-lg text-white font-bold text-xs outline-none focus:border-lime-400"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase text-emerald-300/80 mb-1">Interest Rate (% p.a.)</label>
              <input
                type="number"
                step="0.1"
                value={interestRate}
                onChange={(e) => setInterestRate(Number(e.target.value))}
                className="w-full px-2.5 py-1.5 bg-[#061f12] border border-emerald-500/30 rounded-lg text-white font-bold text-xs outline-none focus:border-lime-400"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase text-emerald-300/80 mb-1">Tenure (Years)</label>
              <input
                type="number"
                value={tenureYears}
                onChange={(e) => setTenureYears(Number(e.target.value))}
                className="w-full px-2.5 py-1.5 bg-[#061f12] border border-emerald-500/30 rounded-lg text-white font-bold text-xs outline-none focus:border-lime-400"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 p-3 rounded-xl bg-emerald-950/60 border border-emerald-500/20 text-center">
            <div>
              <div className="text-[10px] text-emerald-300/70 font-semibold uppercase">Monthly EMI</div>
              <div className="text-base font-black text-lime-400">₹{emi.toLocaleString()}</div>
            </div>
            <div>
              <div className="text-[10px] text-emerald-300/70 font-semibold uppercase">Total Interest</div>
              <div className="text-base font-black text-rose-400">₹{totalInterest.toLocaleString()}</div>
            </div>
            <div>
              <div className="text-[10px] text-emerald-300/70 font-semibold uppercase">Total Repayment</div>
              <div className="text-base font-black text-white">₹{totalPayment.toLocaleString()}</div>
            </div>
          </div>
        </div>
      )}

      {/* Calculator 2: Compound Growth */}
      {calcType === 'compound' && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div>
              <label className="block text-[10px] font-bold uppercase text-emerald-300/80 mb-1">Initial (₹)</label>
              <input
                type="number"
                value={initialInv}
                onChange={(e) => setInitialInv(Number(e.target.value))}
                className="w-full px-2.5 py-1.5 bg-[#061f12] border border-emerald-500/30 rounded-lg text-white font-bold text-xs outline-none focus:border-lime-400"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase text-emerald-300/80 mb-1">Monthly SIP (₹)</label>
              <input
                type="number"
                value={monthlyInv}
                onChange={(e) => setMonthlyInv(Number(e.target.value))}
                className="w-full px-2.5 py-1.5 bg-[#061f12] border border-emerald-500/30 rounded-lg text-white font-bold text-xs outline-none focus:border-lime-400"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase text-emerald-300/80 mb-1">Exp. Return (%)</label>
              <input
                type="number"
                step="0.5"
                value={invReturnRate}
                onChange={(e) => setInvReturnRate(Number(e.target.value))}
                className="w-full px-2.5 py-1.5 bg-[#061f12] border border-emerald-500/30 rounded-lg text-white font-bold text-xs outline-none focus:border-lime-400"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase text-emerald-300/80 mb-1">Period (Years)</label>
              <input
                type="number"
                value={invYears}
                onChange={(e) => setInvYears(Number(e.target.value))}
                className="w-full px-2.5 py-1.5 bg-[#061f12] border border-emerald-500/30 rounded-lg text-white font-bold text-xs outline-none focus:border-lime-400"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 p-3 rounded-xl bg-emerald-950/60 border border-emerald-500/20 text-center">
            <div>
              <div className="text-[10px] text-emerald-300/70 font-semibold uppercase">Total Invested</div>
              <div className="text-base font-black text-white">₹{totalInvested.toLocaleString()}</div>
            </div>
            <div>
              <div className="text-[10px] text-emerald-300/70 font-semibold uppercase">Est. Returns</div>
              <div className="text-base font-black text-lime-400">+₹{wealthGained.toLocaleString()}</div>
            </div>
            <div>
              <div className="text-[10px] text-emerald-300/70 font-semibold uppercase">Total Future Value</div>
              <div className="text-base font-black text-lime-300">₹{totalCorpus.toLocaleString()}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  if (isPage) {
    return <div className="glass-card p-4 md:p-6 rounded-2xl border border-emerald-500/20">{content}</div>;
  }

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-[220] flex items-center justify-center p-3">
      <div className="w-full max-w-lg bg-[#0a2618] border border-lime-500/30 rounded-2xl p-4 md:p-5 shadow-2xl">
        {content}
      </div>
    </div>
  );
};
