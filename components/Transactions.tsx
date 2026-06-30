
import React, { useState, useMemo } from 'react';
import { AppState, Transaction, WealthType, KakeiboCategory, CategoryTarget, Reflection } from '../types';
import { getMonthlyAdvisory } from '../services/geminiService';

interface Props {
  state: AppState;
  onAddTransaction: (t: Omit<Transaction, 'id'>) => void;
  onUpdateTransaction: (t: Transaction) => void;
  onDeleteTransaction: (id: string) => void;
  onUpdateTarget: (val: number) => void;
  onUpdateMonthlyCategoryTarget: (monthKey: string, cat: KakeiboCategory, target: CategoryTarget) => void;
  onUpdateReflection: (type: 'weekly' | 'monthly', key: string, reflection: Reflection) => void;
}

const CATEGORY_META = {
  [KakeiboCategory.NEEDS]: { color: 'amber', icon: '🟡', examples: 'groceries, transport, utilities' },
  [KakeiboCategory.WANTS]: { color: 'emerald', icon: '🟢', examples: 'shopping, eating out, entertainment' },
  [KakeiboCategory.CULTURE]: { color: 'blue', icon: '🔵', examples: 'books, courses, hobbies' },
  [KakeiboCategory.UNEXPECTED]: { color: 'rose', icon: '🔴', examples: 'repairs, medical, emergencies' }
};

const Transactions: React.FC<Props> = ({ state, onAddTransaction, onUpdateTransaction, onDeleteTransaction, onUpdateTarget, onUpdateMonthlyCategoryTarget, onUpdateReflection }) => {
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth());
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [selectedWeek, setSelectedWeek] = useState(1);
  const [isGeneratingAdvisory, setIsGeneratingAdvisory] = useState(false);
  const [showQuickAdd, setShowQuickAdd] = useState(false);

  // Rapid Entry State
  const [quickEntry, setQuickEntry] = useState({
    description: '',
    amount: 0,
    type: WealthType.EXPENSE,
    kakeiboCategory: KakeiboCategory.NEEDS,
    date: new Date().toISOString().split('T')[0],
    isRecurring: false
  });

  const [filterCategory, setFilterCategory] = useState<KakeiboCategory | 'ALL'>('ALL');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editBuffer, setEditBuffer] = useState<Transaction | null>(null);

  const monthKey = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}`;
  const weekKey = `${monthKey}-W${selectedWeek}`;

  const handleQuickAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickEntry.description || quickEntry.amount <= 0) return;
    onAddTransaction(quickEntry);
    setQuickEntry({ ...quickEntry, description: '', amount: 0, isRecurring: false });
    setShowQuickAdd(false);
  };

  const handleStartEdit = (t: Transaction) => {
    setEditingId(t.id);
    setEditBuffer({ ...t });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditBuffer(null);
  };

  const handleSaveEdit = () => {
    if (editBuffer) {
      onUpdateTransaction(editBuffer);
      setEditingId(null);
      setEditBuffer(null);
    }
  };

  const changeMonth = (offset: number) => {
    let nextMonth = selectedMonth + offset;
    let nextYear = selectedYear;
    if (nextMonth > 11) { nextMonth = 0; nextYear++; } 
    else if (nextMonth < 0) { nextMonth = 11; nextYear--; }
    setSelectedMonth(nextMonth);
    setSelectedYear(nextYear);
  };

  const selectedMonthData = useMemo(() => {
    const transactions = state.transactions.filter(t => {
      const d = new Date(t.date);
      return d.getMonth() === selectedMonth && d.getFullYear() === selectedYear;
    });

    const monthDate = new Date(selectedYear, selectedMonth, 1);
    const monthName = monthDate.toLocaleDateString('en-IN', { month: 'long' });

    const income = transactions.filter(t => t.type === WealthType.INCOME).reduce((acc, t) => acc + t.amount, 0);
    const expenses = transactions.filter(t => t.type === WealthType.EXPENSE).reduce((acc, t) => acc + t.amount, 0);
    const savings = income - expenses;

    const spending: Record<string, number> = {
      [KakeiboCategory.NEEDS]: 0,
      [KakeiboCategory.WANTS]: 0,
      [KakeiboCategory.CULTURE]: 0,
      [KakeiboCategory.UNEXPECTED]: 0,
    };

    transactions.forEach(t => {
      if (t.type === WealthType.EXPENSE && t.kakeiboCategory) {
        spending[t.kakeiboCategory] += t.amount;
      }
    });

    return { transactions, spending, monthName, income, expenses, savings };
  }, [state.transactions, selectedMonth, selectedYear]);

  const filteredMonthTransactions = useMemo(() => {
    const sorted = [...selectedMonthData.transactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    if (filterCategory === 'ALL') return sorted;
    return sorted.filter(t => t.kakeiboCategory === filterCategory);
  }, [selectedMonthData.transactions, filterCategory]);

  const targets = state.monthlyTargets[monthKey] || {};
  const weeklyRef = state.weeklyReflections[weekKey] || { q1: '', q2: '', q3: '', q4: '' };
  const monthlyRef = state.monthlyReflections[monthKey] || { q1: '', q2: '', q3: '', q4: '', advisory: '' };

  const handleWeeklyRefChange = (q: keyof Reflection, val: string) => {
    onUpdateReflection('weekly', weekKey, { ...weeklyRef, [q]: val });
  };

  const handleMonthlyRefChange = (q: keyof Reflection, val: string) => {
    onUpdateReflection('monthly', monthKey, { ...monthlyRef, [q]: val });
  };

  const generateAdvisory = async () => {
    setIsGeneratingAdvisory(true);
    const advisory = await getMonthlyAdvisory(monthKey, monthlyRef, selectedMonthData);
    onUpdateReflection('monthly', monthKey, { ...monthlyRef, advisory });
    setIsGeneratingAdvisory(false);
  };

  return (
    <div className="space-y-6 md:space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-7xl mx-auto pb-24 px-2 md:px-0">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl md:text-4xl font-black text-slate-800 tracking-tight">Finance Portal</h2>
          <p className="text-[10px] md:text-sm text-slate-400 font-bold uppercase tracking-widest mt-1">Ethical Budgeting & Planning</p>
        </div>
        <div className="w-full md:w-auto flex items-center justify-between gap-4 bg-white p-3 md:p-4 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex flex-col">
            <span className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest">Savings Goal</span>
            <div className="flex items-center gap-1">
              <span className="text-emerald-600 font-black text-base md:text-lg">₹</span>
              <input 
                type="number" 
                value={state.monthlySavingsTarget}
                onChange={(e) => onUpdateTarget(Number(e.target.value))}
                className="w-20 md:w-24 font-black text-slate-800 focus:outline-none bg-transparent text-base md:text-lg"
              />
            </div>
          </div>
          <div className="h-8 w-px bg-slate-100" />
          <div className="bg-emerald-50 px-2 md:px-3 py-1 rounded-full shrink-0">
            <span className="text-[9px] md:text-[10px] font-black text-emerald-600 uppercase tracking-tight">Active Plan</span>
          </div>
        </div>
      </div>

      {/* MONTHLY BUDGET PLANNER MAIN VIEW */}
      <section className="bg-[#0F172A] text-white p-5 md:p-10 rounded-[2rem] md:rounded-[3rem] shadow-2xl relative overflow-hidden ring-1 ring-white/10">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full -mr-48 -mt-48 blur-[100px] pointer-events-none" />
        
        <div className="relative z-10 space-y-6 md:space-y-10">
          <div className="flex flex-col gap-6 md:gap-8 border-b border-white/10 pb-6 md:pb-8">
            <div className="flex justify-between items-center w-full">
              <button onClick={() => changeMonth(-1)} className="p-1.5 md:p-2 hover:bg-white/10 rounded-full transition-colors">
                <svg className="w-5 h-5 md:w-6 md:h-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" /></svg>
              </button>
              <div className="text-center">
                <h3 className="text-xl md:text-5xl font-black tracking-tighter">{selectedMonthData.monthName} <span className="text-emerald-500">{selectedYear}</span></h3>
                <p className="text-[8px] md:text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em] mt-1">Monthly Ledger Overview</p>
              </div>
              <button onClick={() => changeMonth(1)} className="p-1.5 md:p-2 hover:bg-white/10 rounded-full transition-colors">
                <svg className="w-5 h-5 md:w-6 md:h-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" /></svg>
              </button>
            </div>
            
            <div className="flex overflow-x-auto no-scrollbar gap-2 bg-white/5 p-1.5 md:p-2 rounded-[1.25rem] md:rounded-[1.5rem] border border-white/5 backdrop-blur-md">
              <button onClick={() => setFilterCategory('ALL')} className={`px-4 md:px-5 py-2 rounded-xl text-[9px] md:text-[10px] font-black transition-all whitespace-nowrap ${filterCategory === 'ALL' ? 'bg-white text-slate-900 shadow-xl' : 'text-slate-400 hover:text-white'}`}>
                ALL ENTRIES
              </button>
              {[KakeiboCategory.NEEDS, KakeiboCategory.WANTS, KakeiboCategory.CULTURE, KakeiboCategory.UNEXPECTED].map((cat) => {
                const meta = CATEGORY_META[cat];
                return (
                  <button key={cat} onClick={() => setFilterCategory(cat)} className={`px-4 md:px-5 py-2 rounded-xl text-[9px] md:text-[10px] font-black transition-all flex items-center gap-1.5 md:gap-2 whitespace-nowrap ${filterCategory === cat ? `bg-${meta.color}-500 text-white shadow-lg` : `text-slate-500 hover:text-white`}`}>
                    <span>{meta.icon}</span>{cat.split(' ')[0]}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {[KakeiboCategory.NEEDS, KakeiboCategory.WANTS, KakeiboCategory.CULTURE, KakeiboCategory.UNEXPECTED].map((cat) => {
              const target = targets[cat] || { amount: 0, targetDate: '' };
              const spent = selectedMonthData.spending[cat] || 0;
              const percentage = target.amount > 0 ? Math.min(100, (spent / target.amount) * 100) : 0;
              const meta = CATEGORY_META[cat];
              const colorClasses = {
                amber: { text: 'text-amber-400', progress: 'bg-amber-500', shadow: 'shadow-amber-500/10' },
                emerald: { text: 'text-emerald-400', progress: 'bg-emerald-500', shadow: 'shadow-emerald-500/10' },
                blue: { text: 'text-blue-400', progress: 'bg-blue-500', shadow: 'shadow-blue-500/10' },
                rose: { text: 'text-rose-400', progress: 'bg-rose-500', shadow: 'shadow-rose-500/10' },
              }[meta.color];
              return (
                <div key={cat} className={`bg-white/5 border-2 p-5 md:p-7 rounded-[1.5rem] md:rounded-[2.5rem] transition-all border-white/5 hover:bg-white/[0.08] ${filterCategory === cat ? `border-${meta.color}-500/50 ${colorClasses.shadow}` : ''}`}>
                  <div className="flex justify-between items-start mb-4 md:mb-6">
                    <div className="flex items-center gap-2">
                      <span className="text-xs md:text-sm">{meta.icon}</span>
                      <h4 className={`font-black text-[10px] md:text-xs ${colorClasses.text} uppercase tracking-widest`}>{cat}</h4>
                    </div>
                  </div>
                  <div className="space-y-4 md:space-y-6">
                    <div className="space-y-1">
                       <label className="text-[8px] md:text-[9px] font-black text-slate-500 uppercase tracking-widest">Plan Limit</label>
                       <div className="flex items-center gap-2 border-b border-white/10 pb-1">
                          <span className="text-slate-500 font-black text-lg md:text-xl">₹</span>
                          <input type="number" className="bg-transparent outline-none w-full font-black text-xl md:text-2xl text-white" value={target.amount || ''} placeholder="0" onChange={(e) => onUpdateMonthlyCategoryTarget(monthKey, cat, { ...target, amount: Number(e.target.value) })} />
                       </div>
                    </div>
                    <div className="w-full bg-white/5 h-1.5 md:h-2 rounded-full overflow-hidden">
                       <div className={`h-full transition-all duration-1000 ${percentage > 90 ? 'bg-rose-500' : colorClasses.progress}`} style={{ width: `${percentage}%` }} />
                    </div>
                    <div className="flex justify-between items-end pt-1 md:pt-2">
                      <div className="space-y-0.5"><span className="text-[8px] md:text-[9px] font-bold text-slate-500">Actual</span><p className="font-black text-white text-sm md:text-lg">₹{spent.toLocaleString()}</p></div>
                      <div className="text-right space-y-0.5"><span className="text-[8px] md:text-[9px] font-bold text-slate-500">Remaining</span><p className={`font-black text-sm md:text-lg ${target.amount - spent < 0 ? 'text-rose-400' : colorClasses.text}`}>₹{Math.max(0, target.amount - spent).toLocaleString()}</p></div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* SPREADSHEET LEDGER - Mobile Optimized */}
          <div className="bg-white/5 border border-white/10 rounded-[1.5rem] md:rounded-[3rem] overflow-hidden backdrop-blur-sm shadow-2xl">
            <div className="px-5 md:px-10 py-5 md:py-8 border-b border-white/5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-white/[0.03]">
              <div>
                <h4 className="font-black text-sm md:text-lg text-white tracking-tight uppercase">Monthly Ledger</h4>
                <p className="text-[8px] md:text-[10px] text-slate-500 font-bold tracking-widest uppercase mt-0.5">Spreadsheet View</p>
              </div>
              <div className="flex gap-2 w-full md:w-auto">
                <div className="flex-1 md:flex-none px-3 md:px-5 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl md:rounded-2xl flex flex-col items-end">
                   <span className="text-[8px] md:text-[9px] font-black text-emerald-500 uppercase">Income</span>
                   <span className="font-black text-sm md:text-lg">₹{selectedMonthData.income.toLocaleString()}</span>
                </div>
                <div className="flex-1 md:flex-none px-3 md:px-5 py-2 bg-rose-500/10 border border-rose-500/20 rounded-xl md:rounded-2xl flex flex-col items-end">
                   <span className="text-[8px] md:text-[9px] font-black text-rose-500 uppercase">Expense</span>
                   <span className="font-black text-sm md:text-lg">₹{selectedMonthData.expenses.toLocaleString()}</span>
                </div>
              </div>
            </div>
            
            {/* Desktop Table */}
            <div className="hidden md:block max-h-[700px] overflow-y-auto no-scrollbar">
              <table className="w-full text-left border-collapse">
                <thead className="sticky top-0 bg-[#161d2f] z-20 shadow-xl">
                  <tr className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-white/10">
                    <th className="px-10 py-6 border-r border-white/5">Date</th>
                    <th className="px-10 py-6 border-r border-white/5">Description</th>
                    <th className="px-10 py-6 border-r border-white/5">Category</th>
                    <th className="px-10 py-6 border-r border-white/5 text-right">Amount (₹)</th>
                    <th className="px-10 py-6 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  <tr className="bg-emerald-500/[0.03] group">
                    <td className="px-8 py-4 border-r border-white/5">
                      <input type="date" className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-xs text-white outline-none w-full font-bold" value={quickEntry.date} onChange={e => setQuickEntry({...quickEntry, date: e.target.value})} />
                    </td>
                    <td className="px-8 py-4 border-r border-white/5">
                      <input type="text" placeholder="Description..." className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white outline-none w-full font-bold" value={quickEntry.description} onChange={e => setQuickEntry({...quickEntry, description: e.target.value})} />
                    </td>
                    <td className="px-8 py-4 border-r border-white/5">
                      <div className="flex flex-col gap-2">
                        <div className="flex gap-2">
                          <select className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-[10px] text-white outline-none font-black uppercase flex-1" value={quickEntry.type} onChange={e => setQuickEntry({...quickEntry, type: e.target.value as WealthType})}>
                            {Object.values(WealthType).map(t => <option key={t} value={t} className="bg-[#0F172A]">{t}</option>)}
                          </select>
                          <select className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-[10px] text-white outline-none font-black uppercase flex-1" value={quickEntry.kakeiboCategory} onChange={e => setQuickEntry({...quickEntry, kakeiboCategory: e.target.value as KakeiboCategory})}>
                            {Object.values(KakeiboCategory).map(c => <option key={c} value={c} className="bg-[#0F172A]">{c}</option>)}
                          </select>
                        </div>
                        <label className="flex items-center gap-2 cursor-pointer group/recur">
                          <input 
                            type="checkbox" 
                            checked={quickEntry.isRecurring} 
                            onChange={e => setQuickEntry({...quickEntry, isRecurring: e.target.checked})}
                            className="w-4 h-4 rounded border-white/10 bg-white/5 text-emerald-500 focus:ring-0 focus:ring-offset-0"
                          />
                          <span className="text-[9px] font-black text-slate-400 group-hover/recur:text-emerald-400 uppercase tracking-widest transition-colors">Recurring Transaction</span>
                        </label>
                      </div>
                    </td>
                    <td className="px-8 py-4 border-r border-white/5">
                      <input type="number" placeholder="0" className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white outline-none w-full text-right font-black" value={quickEntry.amount || ''} onChange={e => setQuickEntry({...quickEntry, amount: Number(e.target.value)})} />
                    </td>
                    <td className="px-8 py-4 text-center">
                      <button onClick={handleQuickAdd} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg active:scale-95">Add</button>
                    </td>
                  </tr>
                  {filteredMonthTransactions.map(t => {
                    const isEditing = editingId === t.id;
                    const meta = t.kakeiboCategory ? CATEGORY_META[t.kakeiboCategory] : null;
                    const isPositive = t.type === WealthType.INCOME || t.type === WealthType.ASSET;
                    return (
                      <tr key={t.id} className={`transition-all group ${isEditing ? 'bg-white/10' : 'hover:bg-white/[0.03]'}`}>
                        <td className="px-10 py-6 border-r border-white/5">
                          {isEditing ? <input type="date" className="bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-xs text-white outline-none w-full font-bold" value={editBuffer?.date} onChange={e => setEditBuffer(prev => prev ? {...prev, date: e.target.value} : null)} /> : <span className="font-black text-slate-300 text-sm">{new Date(t.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</span>}
                        </td>
                        <td className="px-10 py-6 border-r border-white/5">
                          {isEditing ? <input type="text" className="bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-sm text-white outline-none w-full font-bold" value={editBuffer?.description} onChange={e => setEditBuffer(prev => prev ? {...prev, description: e.target.value} : null)} /> : <div className="flex items-center gap-3"><span className="text-lg">{meta?.icon || '📑'}</span><span className="font-bold text-sm text-slate-100">{t.description}</span></div>}
                        </td>
                        <td className="px-10 py-6 border-r border-white/5">
                          {isEditing ? (
                            <div className="flex flex-col gap-2">
                              <select className="bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-[10px] text-white outline-none w-full font-black uppercase" value={editBuffer?.kakeiboCategory} onChange={e => setEditBuffer(prev => prev ? {...prev, kakeiboCategory: e.target.value as KakeiboCategory} : null)}>{Object.values(KakeiboCategory).map(c => <option key={c} value={c} className="bg-[#0F172A]">{c}</option>)}</select>
                              <label className="flex items-center gap-2 cursor-pointer">
                                <input 
                                  type="checkbox" 
                                  checked={editBuffer?.isRecurring} 
                                  onChange={e => setEditBuffer(prev => prev ? {...prev, isRecurring: e.target.checked} : null)}
                                  className="w-3 h-3 rounded border-white/20 bg-white/10 text-emerald-500 focus:ring-0"
                                />
                                <span className="text-[8px] font-black text-slate-400 uppercase">Recurring</span>
                              </label>
                            </div>
                          ) : (
                            <div className="flex flex-col gap-1">
                              <span className={`text-[9px] font-black uppercase px-2 py-1 rounded-lg border w-fit ${t.kakeiboCategory === KakeiboCategory.NEEDS ? 'border-amber-500/30 text-amber-400' : t.kakeiboCategory === KakeiboCategory.WANTS ? 'border-emerald-500/30 text-emerald-400' : t.kakeiboCategory === KakeiboCategory.CULTURE ? 'border-blue-500/30 text-blue-400' : 'border-rose-500/30 text-rose-400'}`}>{t.kakeiboCategory}</span>
                              {t.isRecurring && <span className="text-[8px] font-black text-emerald-500/70 uppercase flex items-center gap-1">🔄 Recurring</span>}
                            </div>
                          )}
                        </td>
                        <td className={`px-10 py-6 border-r border-white/5 text-right font-black text-xl ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {isEditing ? <input type="number" className="bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-right text-lg text-white outline-none w-28 font-black" value={editBuffer?.amount} onChange={e => setEditBuffer(prev => prev ? {...prev, amount: Number(e.target.value)} : null)} /> : <span>{isPositive ? '+' : '-'}₹{t.amount.toLocaleString()}</span>}
                        </td>
                        <td className="px-10 py-6">
                          <div className="flex items-center justify-center gap-2">
                            {isEditing ? <button onClick={handleSaveEdit} className="p-2 bg-emerald-500/20 text-emerald-400 rounded-lg hover:bg-emerald-500/40">✓</button> : <button onClick={() => handleStartEdit(t)} className="p-2 text-slate-500 hover:text-white">✎</button>}
                            <button onClick={() => onDeleteTransaction(t.id)} className="p-2 text-rose-500/50 hover:text-rose-400">✕</button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden">
               <div className="p-4 border-b border-white/10 bg-emerald-500/5">
                  <button 
                    onClick={() => setShowQuickAdd(!showQuickAdd)}
                    className="w-full bg-emerald-600 text-white font-black py-3 rounded-xl uppercase tracking-widest text-[10px] flex items-center justify-center gap-2"
                  >
                    {showQuickAdd ? '✕ Cancel Entry' : '＋ Add New Entry'}
                  </button>
                  {showQuickAdd && (
                    <form onSubmit={handleQuickAdd} className="mt-4 space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
                      <input type="text" placeholder="What did you spend on?" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:ring-2 focus:ring-emerald-500 font-bold" value={quickEntry.description} onChange={e => setQuickEntry({...quickEntry, description: e.target.value})} />
                      <div className="grid grid-cols-2 gap-3">
                         <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-black text-xs">₹</span>
                            <input type="number" placeholder="Amount" className="w-full bg-white/5 border border-white/10 rounded-xl pl-8 pr-4 py-3 text-sm text-white outline-none focus:ring-2 focus:ring-emerald-500 font-black" value={quickEntry.amount || ''} onChange={e => setQuickEntry({...quickEntry, amount: Number(e.target.value)})} />
                         </div>
                         <input type="date" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs text-white outline-none focus:ring-2 focus:ring-emerald-500 font-bold" value={quickEntry.date} onChange={e => setQuickEntry({...quickEntry, date: e.target.value})} />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <select className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-[10px] text-white outline-none font-black uppercase" value={quickEntry.type} onChange={e => setQuickEntry({...quickEntry, type: e.target.value as WealthType})}>
                           {Object.values(WealthType).map(t => <option key={t} value={t} className="bg-[#0F172A]">{t}</option>)}
                        </select>
                        <select className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-[10px] text-white outline-none font-black uppercase" value={quickEntry.kakeiboCategory} onChange={e => setQuickEntry({...quickEntry, kakeiboCategory: e.target.value as KakeiboCategory})}>
                           {Object.values(KakeiboCategory).map(c => <option key={c} value={c} className="bg-[#0F172A]">{c}</option>)}
                        </select>
                      </div>
                      <label className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl px-4 py-3 cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={quickEntry.isRecurring} 
                          onChange={e => setQuickEntry({...quickEntry, isRecurring: e.target.checked})}
                          className="w-5 h-5 rounded border-white/10 bg-white/5 text-emerald-500 focus:ring-0"
                        />
                        <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Recurring Transaction</span>
                      </label>
                      <button type="submit" className="w-full bg-white text-slate-900 font-black py-4 rounded-xl uppercase tracking-widest text-xs shadow-xl active:scale-95">Record Transaction</button>
                    </form>
                  )}
               </div>
               <div className="divide-y divide-white/5">
                  {filteredMonthTransactions.map(t => {
                    const meta = t.kakeiboCategory ? CATEGORY_META[t.kakeiboCategory] : null;
                    const isPositive = t.type === WealthType.INCOME || t.type === WealthType.ASSET;
                    return (
                      <div key={t.id} className="p-4 flex items-center justify-between group active:bg-white/5 transition-colors">
                        <div className="flex items-center gap-3">
                           <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg ${isPositive ? 'bg-emerald-500/20' : 'bg-rose-500/20'}`}>
                             {meta?.icon || '📑'}
                           </div>
                           <div>
                              <p className="font-bold text-slate-100 text-sm">{t.description}</p>
                              <div className="flex items-center gap-2 mt-0.5">
                                 <span className="text-[9px] font-black text-slate-500 uppercase">{new Date(t.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</span>
                                 <span className="w-1 h-1 rounded-full bg-slate-700" />
                                 <span className="text-[9px] font-black text-slate-500 uppercase">{t.kakeiboCategory || 'Misc'}</span>
                                 {t.isRecurring && (
                                   <>
                                     <span className="w-1 h-1 rounded-full bg-slate-700" />
                                     <span className="text-[9px] font-black text-emerald-500/70 uppercase">🔄 Recurring</span>
                                   </>
                                 )}
                              </div>
                           </div>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                           <span className={`font-black text-base ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
                             {isPositive ? '+' : '-'}₹{t.amount.toLocaleString()}
                           </span>
                           <div className="flex gap-2">
                              <button onClick={() => onDeleteTransaction(t.id)} className="p-1.5 text-rose-500/40 active:text-rose-500 transition-colors">✕</button>
                           </div>
                        </div>
                      </div>
                    );
                  })}
                  {filteredMonthTransactions.length === 0 && (
                    <div className="p-12 text-center text-slate-500 font-bold uppercase text-[10px] tracking-widest opacity-50">No records found</div>
                  )}
               </div>
            </div>
          </div>
        </div>
      </section>

      {/* Reflections Zone - Stacked on Mobile */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
        <div className="bg-white rounded-[1.5rem] md:rounded-[2.5rem] p-6 md:p-8 shadow-sm border border-slate-100 flex flex-col">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 md:mb-8">
            <div>
              <h3 className="text-xl md:text-2xl font-black text-slate-800 tracking-tight">Weekly Audit</h3>
              <p className="text-[9px] md:text-xs text-slate-400 font-bold uppercase tracking-widest mt-0.5 md:mt-1">Self-correction habits</p>
            </div>
            <div className="flex overflow-x-auto no-scrollbar gap-1 bg-slate-50 p-1 rounded-xl border border-slate-100 w-full sm:w-auto">
              {[1, 2, 3, 4, 5].map(w => (
                <button key={w} onClick={() => setSelectedWeek(w)} className={`flex-1 sm:flex-none px-3 md:px-4 py-1.5 md:py-2 rounded-lg md:rounded-xl text-[9px] md:text-[10px] font-black transition-all ${selectedWeek === w ? 'bg-[#0F172A] text-white shadow-lg' : 'text-slate-400'}`}>W{w}</button>
              ))}
            </div>
          </div>
          <div className="space-y-5 md:space-y-6 flex-1">
            {[
              { id: 'q1', label: 'Spending this week?', icon: '💰' },
              { id: 'q2', label: 'Where did it go?', icon: '📉' },
              { id: 'q3', label: 'Unnecessary buys?', icon: '🛒' },
              { id: 'q4', label: 'Next week goal?', icon: '🚀' }
            ].map((q) => (
              <div key={q.id} className="space-y-1.5">
                <label className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <span className="text-sm md:text-base">{q.icon}</span> {q.label}
                </label>
                <textarea 
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl md:rounded-3xl p-4 md:p-5 text-xs md:text-sm font-medium focus:bg-white focus:ring-4 focus:ring-emerald-500/5 outline-none transition-all resize-none h-20 md:h-24 placeholder-slate-300" 
                  placeholder="Journal your weekly summary..."
                  value={(weeklyRef as any)[q.id]}
                  onChange={(e) => handleWeeklyRefChange(q.id as any, e.target.value)}
                />
              </div>
            ))}
          </div>
        </div>

        <div className="bg-[#0F172A] text-white rounded-[1.5rem] md:rounded-[2.5rem] p-6 md:p-8 shadow-2xl relative overflow-hidden ring-1 ring-white/10 flex flex-col">
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full -mr-32 -mt-32 blur-[100px] pointer-events-none" />
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 md:mb-8 relative z-10">
            <div>
              <h3 className="text-xl md:text-2xl font-black tracking-tight text-white uppercase">Monthly Audit</h3>
              <p className="text-[9px] md:text-xs text-slate-500 font-bold uppercase tracking-widest mt-0.5 md:mt-1">Philosophy</p>
            </div>
            <button 
              onClick={generateAdvisory}
              disabled={isGeneratingAdvisory}
              className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white px-5 py-3 rounded-xl md:rounded-2xl text-[9px] md:text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-xl active:scale-95 transition-all"
            >
              {isGeneratingAdvisory ? 'Analyzing...' : '✨ Optimize'}
            </button>
          </div>
          
          <div className="space-y-5 md:space-y-6 flex-1 relative z-10">
            {[
              { id: 'q1', label: 'Starting balance?', icon: '🏦' },
              { id: 'q2', label: 'Total spent?', icon: '💸' },
              { id: 'q3', label: 'Target saved?', icon: '🌱' },
              { id: 'q4', label: 'Improvement plan?', icon: '🧗' }
            ].map((q) => (
              <div key={q.id} className="space-y-1.5">
                <label className="text-[9px] md:text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                  <span className="text-sm md:text-base">{q.icon}</span> {q.label}
                </label>
                <textarea 
                  className="w-full bg-white/5 border border-white/10 rounded-2xl md:rounded-3xl p-4 md:p-5 text-xs md:text-sm font-medium focus:bg-white/10 outline-none transition-all resize-none h-20 md:h-24 placeholder-slate-700 text-slate-200" 
                  placeholder="Analyze your month..."
                  value={(monthlyRef as any)[q.id]}
                  onChange={(e) => handleMonthlyRefChange(q.id as any, e.target.value)}
                />
              </div>
            ))}

            <div className="mt-6 md:mt-8 p-6 md:p-8 bg-emerald-500/10 border border-emerald-500/20 rounded-[1.5rem] md:rounded-[2.5rem] relative">
              <span className="absolute -top-3 left-4 md:left-8 bg-emerald-600 text-white text-[8px] md:text-[9px] font-black px-3 md:px-4 py-1 rounded-full uppercase tracking-widest">Kakeibo Strategy</span>
              <p className="text-[11px] md:text-sm text-emerald-100 leading-relaxed italic font-medium opacity-90">
                {monthlyRef.advisory || "Complete the audit to receive AI-powered financial strategy for next month."}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Transactions;
