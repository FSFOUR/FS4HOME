
import React, { useMemo, useState, useEffect } from 'react';
import { AppState, WealthType, KakeiboCategory } from '../types';
import { getFinancialAdvice } from '../services/geminiService';

const Dashboard: React.FC<{ state: AppState; onUpdateUser: (name: string) => void }> = ({ state, onUpdateUser }) => {
  const [advice, setAdvice] = useState<string>('Seeking financial wisdom...');
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

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
    fetchAdvice();
  }, [state]);

  const handleEditName = () => {
    const newName = prompt('Enter your name:', state.userName);
    if (newName && newName.trim()) {
      onUpdateUser(newName.trim());
    }
  };

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in duration-500 max-w-7xl mx-auto px-1 md:px-0">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 px-2 md:px-0">
        <div className="flex items-center gap-3 md:gap-4">
          <div className="flex-shrink-0">
            <div className="w-12 h-12 md:w-16 md:h-16 rounded-2xl bg-gradient-to-br from-emerald-600 to-emerald-800 shadow-lg shadow-emerald-200 flex items-center justify-center transform hover:rotate-2 transition-transform border border-emerald-500/30">
              <svg className="w-6 h-6 md:w-10 md:h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2 group cursor-pointer" onClick={handleEditName}>
              <h2 className="text-xl md:text-3xl font-bold text-slate-800 tracking-tight">Welcome, {state.userName}</h2>
              <svg className="w-4 h-4 text-slate-400 md:opacity-0 group-hover:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </div>
            <p className="text-[10px] md:text-base text-emerald-700 font-semibold uppercase tracking-tighter">Your Ethical Wealth Guide</p>
          </div>
        </div>
        
        <div className="hidden sm:flex items-center gap-4">
          <div className="text-xs md:text-sm font-bold bg-white px-5 py-2.5 rounded-full border border-slate-200 text-slate-500 shadow-sm">
            {new Date().toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
          </div>
        </div>
      </header>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 px-2 md:px-0">
        <div className="bg-white p-5 md:p-8 rounded-3xl shadow-sm border border-emerald-100/50 flex flex-col items-center text-center transition-all hover:shadow-md">
          <span className="text-emerald-500 text-[9px] md:text-xs font-black uppercase tracking-[0.2em] mb-2 md:mb-3">Total Income</span>
          <span className="text-2xl md:text-4xl font-black text-emerald-800">₹{stats.income.toLocaleString()}</span>
        </div>
        <div className="bg-white p-5 md:p-8 rounded-3xl shadow-sm border border-rose-100/50 flex flex-col items-center text-center transition-all hover:shadow-md">
          <span className="text-rose-500 text-[9px] md:text-xs font-black uppercase tracking-[0.2em] mb-2 md:mb-3">Total Expenses</span>
          <span className="text-2xl md:text-4xl font-black text-rose-800">₹{stats.expenses.toLocaleString()}</span>
        </div>
        <div className="bg-white p-5 md:p-8 rounded-3xl shadow-sm border border-blue-100/50 flex flex-col items-center text-center sm:col-span-2 lg:col-span-1 transition-all hover:shadow-md">
          <span className="text-blue-500 text-[9px] md:text-xs font-black uppercase tracking-[0.2em] mb-2 md:mb-3">Net Savings</span>
          <span className={`text-2xl md:text-4xl font-black ${stats.savings >= 0 ? 'text-blue-800' : 'text-rose-800'}`}>
            ₹{stats.savings.toLocaleString()}
          </span>
          <div className="flex items-center gap-3 mt-3 md:mt-4">
             <div className="w-20 md:w-32 bg-slate-100 h-1.5 md:h-2 rounded-full overflow-hidden shadow-inner">
                <div 
                  className="h-full bg-blue-500 transition-all duration-1000" 
                  style={{ width: `${Math.min(100, (stats.savings / (state.monthlySavingsTarget || 1)) * 100)}%` }}
                />
             </div>
             <p className="text-[9px] md:text-xs text-slate-400 font-bold">Goal: ₹{state.monthlySavingsTarget}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8 px-2 md:px-0">
        {/* Kakeibo Analysis */}
        <div className="bg-white p-5 md:p-8 rounded-3xl shadow-sm border border-slate-100">
          <h3 className="text-base md:text-xl font-bold text-slate-800 mb-6 md:mb-8 border-b border-slate-50 pb-3 md:pb-4">Kakeibo Analysis</h3>
          <div className="space-y-5 md:space-y-6">
            {Object.entries(stats.kakeiboBreakdown).map(([cat, amount]) => (
              <div key={cat} className="group">
                <div className="flex justify-between text-[11px] md:text-sm mb-2 md:mb-2.5">
                  <span className="text-slate-500 font-semibold group-hover:text-slate-800 transition-colors">{cat}</span>
                  <span className="font-bold text-slate-800">₹{amount.toLocaleString()}</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 md:h-2.5 shadow-inner p-0.5">
                  <div 
                    className={`h-1 md:h-1.5 rounded-full transition-all duration-1000 ${
                      cat === KakeiboCategory.NEEDS ? 'bg-amber-400' : 
                      cat === KakeiboCategory.WANTS ? 'bg-emerald-400' :
                      cat === KakeiboCategory.CULTURE ? 'bg-blue-400' : 'bg-rose-400'
                    }`}
                    style={{ width: `${stats.expenses > 0 ? (Number(amount) / stats.expenses) * 100 : 0}%` }}
                  ></div>
                </div>
              </div>
            ))}
            {stats.expenses === 0 && <p className="text-center text-slate-300 text-xs md:text-sm font-medium py-6 md:py-8 italic">No records found for this month.</p>}
          </div>
        </div>

        {/* Sharia-Compliant Wisdom Section */}
        <div className="flex flex-col gap-4 md:gap-8">
          <div className="grid grid-cols-2 gap-3 md:gap-4">
            <div className="bg-white p-4 md:p-5 rounded-3xl border border-emerald-100/30 shadow-sm transition-all hover:scale-[1.02]">
              <span className="text-[9px] md:text-xs text-emerald-600 font-black uppercase tracking-widest block mb-1.5">Eligible Assets</span>
              <p className="text-lg md:text-3xl font-black text-emerald-800">₹{stats.assets.toLocaleString()}</p>
            </div>
            <div className="bg-white p-4 md:p-5 rounded-3xl border border-rose-100/30 shadow-sm transition-all hover:scale-[1.02]">
              <span className="text-[9px] md:text-xs text-rose-600 font-black uppercase tracking-widest block mb-1.5">Liabilities</span>
              <p className="text-lg md:text-3xl font-black text-rose-800">₹{stats.liabilities.toLocaleString()}</p>
            </div>
          </div>
          
          <div className="bg-white p-5 md:p-8 rounded-3xl border border-emerald-100 shadow-sm relative overflow-hidden flex-1 flex flex-col">
            <div className="absolute top-0 right-0 p-3 md:p-4">
              <span className="bg-emerald-100 text-emerald-700 text-[9px] md:text-[10px] font-black px-2 md:px-3 py-1 rounded-full uppercase tracking-tighter shadow-sm border border-emerald-200">Daily Tip</span>
            </div>
            
            <div className="flex items-center gap-2 md:gap-3 mb-4 md:mb-6">
              <div className="p-1.5 md:p-2 bg-emerald-600 text-white rounded-xl shadow-md transform -rotate-3">
                <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
              </div>
              <h4 className="font-black text-slate-800 text-sm md:text-lg tracking-tight">Islamic Financial Wisdom</h4>
            </div>

            <div className="prose prose-sm text-slate-600 leading-relaxed text-[11px] md:text-sm prose-emerald flex-1">
              <div className="space-y-3 md:space-y-4">
                {advice.split('\n\n').map((block, i) => {
                  if (block.startsWith('###')) {
                    return <h5 key={i} className="text-emerald-800 font-black text-base md:text-xl mb-1 md:mb-2 tracking-tight">{block.replace('### ', '')}</h5>;
                  }
                  if (block.startsWith('>')) {
                    return (
                      <div key={i} className="mt-4 md:mt-6 pt-4 md:pt-6 border-t border-slate-100">
                        <blockquote className="italic text-slate-500 font-medium border-l-4 border-emerald-500 pl-3 md:pl-4 py-0.5 md:py-1">
                          {block.replace('> ', '')}
                        </blockquote>
                      </div>
                    );
                  }
                  return <p key={i} className="text-slate-600 font-medium leading-relaxed">{block}</p>;
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
