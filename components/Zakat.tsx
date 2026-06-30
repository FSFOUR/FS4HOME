
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
    const totalDue = totalWealth * zakatRate;
    const remaining = Math.max(0, totalDue - state.zakatGiven);

    return { totalWealth, totalDue, remaining };
  }, [state]);

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header className="text-center px-4">
        <h2 className="text-2xl md:text-4xl font-black text-emerald-800 tracking-tight">Charity & Donation</h2>
        <p className="text-sm md:text-base text-slate-500 mt-2 font-medium max-w-lg mx-auto italic">"And establish prayer and give charity and whatever good you put forward for yourselves - you will find it with Allah."</p>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6 px-2">
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-emerald-50 text-center relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-full h-1.5 bg-emerald-500" />
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Eligible Wealth</p>
          <p className="text-2xl font-black text-emerald-900">₹{calculations.totalWealth.toLocaleString()}</p>
        </div>
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-blue-50 text-center relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-full h-1.5 bg-blue-500" />
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Donation Due (2.5%)</p>
          <p className="text-2xl font-black text-blue-900">₹{calculations.totalDue.toLocaleString()}</p>
        </div>
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-rose-50 text-center relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-full h-1.5 bg-rose-500" />
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Balance Due</p>
          <p className="text-2xl font-black text-rose-900">₹{calculations.remaining.toLocaleString()}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
        <div className="bg-white p-6 md:p-10 rounded-3xl shadow-sm border border-emerald-50 space-y-8">
          <div>
            <h3 className="text-xl font-black text-slate-800 mb-2">Donation Progress</h3>
            <p className="text-xs text-slate-400 font-medium">Record your contributions toward fulfilling your annual donation.</p>
          </div>
          
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="block text-xs font-black text-slate-400 uppercase">Paid Contributions</label>
              <div className="relative group">
                <span className="absolute left-6 top-1/2 -translate-y-1/2 text-emerald-600 font-black text-xl group-focus-within:scale-125 transition-transform">₹</span>
                <input 
                  type="number" 
                  className="w-full pl-12 pr-6 py-5 bg-emerald-50/20 rounded-2xl border-2 border-emerald-100 focus:border-emerald-500 focus:bg-white text-emerald-900 font-black text-2xl outline-none transition-all shadow-inner"
                  value={state.zakatGiven}
                  onChange={(e) => onUpdateGiven(Number(e.target.value))}
                />
              </div>
            </div>

            <div className="w-full bg-slate-100 h-4 rounded-full overflow-hidden p-1 shadow-inner">
               <div 
                  className="h-full bg-emerald-500 rounded-full transition-all duration-1000 shadow-md"
                  style={{ width: `${Math.min(100, (state.zakatGiven / (calculations.totalDue || 1)) * 100)}%` }}
               />
            </div>
          </div>

          <div className="bg-amber-50 p-6 rounded-2xl border border-amber-100 flex gap-4">
            <div className="text-2xl">⚖️</div>
            <div className="space-y-1">
              <h4 className="font-black text-amber-800 text-xs uppercase tracking-tighter">Nishab Check</h4>
              <p className="text-[11px] text-amber-700 leading-relaxed font-medium">
                Ensure your wealth exceeds the gold/silver threshold (Nishab) held for one full lunar year before calculating.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
            <h3 className="font-black text-slate-800 mb-6 uppercase tracking-tight text-sm">Asset Analysis</h3>
            <div className="space-y-6">
              <div className="flex justify-between items-end">
                <div className="space-y-0.5">
                   <p className="text-[10px] font-black text-slate-400 uppercase">Liquid Cash & Savings</p>
                   <p className="font-black text-emerald-600 text-lg">₹{state.transactions.filter(t => t.type === WealthType.ASSET && t.description.toLowerCase().includes('cash')).reduce((a, b) => a + b.amount, 0).toLocaleString()}</p>
                </div>
                <div className="h-10 w-1 bg-emerald-100 rounded-full" />
              </div>
              <div className="flex justify-between items-end">
                <div className="space-y-0.5">
                   <p className="text-[10px] font-black text-slate-400 uppercase">Investments & Gold</p>
                   <p className="font-black text-emerald-600 text-lg">₹{state.transactions.filter(t => t.type === WealthType.ASSET && !t.description.toLowerCase().includes('cash')).reduce((a, b) => a + b.amount, 0).toLocaleString()}</p>
                </div>
                <div className="h-10 w-1 bg-emerald-100 rounded-full" />
              </div>
              <div className="pt-4 border-t border-slate-50">
                 <p className="text-[10px] text-slate-300 italic font-medium leading-tight">
                   Note: Personal-use items like your primary home, car, and tools are exempt from donation calculations.
                 </p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-emerald-800 to-emerald-950 text-white p-8 rounded-3xl shadow-2xl relative overflow-hidden">
            <div className="absolute bottom-0 right-0 w-32 h-32 bg-white/5 rounded-full -mb-16 -mr-16 blur-2xl" />
            <div className="relative z-10">
              <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center mb-6 text-xl">✨</div>
              <h4 className="font-black text-lg mb-2 uppercase tracking-tighter">Barakah in Wealth</h4>
              <p className="text-xs md:text-sm opacity-80 italic font-medium leading-relaxed">
                "Take from their wealth a charity by which you purify them and cause them increase..."
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Zakat;
