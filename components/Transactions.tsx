import React, { useState, useMemo } from 'react';
import { AppState, Transaction, WealthType, KakeiboCategory, CategoryTarget, Reflection } from '../types';

interface Props {
  state: AppState;
  onAddTransaction: (t: Omit<Transaction, 'id'>) => void;
  onUpdateTransaction: (t: Transaction) => void;
  onDeleteTransaction: (id: string) => void;
  onUpdateTarget: (val: number) => void;
  onUpdateMonthlyCategoryTarget: (monthKey: string, cat: KakeiboCategory, target: CategoryTarget) => void;
  onUpdateReflection: (type: 'weekly' | 'monthly', key: string, reflection: Reflection) => void;
}

const CATEGORY_ICONS: Record<KakeiboCategory, string> = {
  [KakeiboCategory.NEEDS]: '🏠',
  [KakeiboCategory.WANTS]: '🛍️',
  [KakeiboCategory.CULTURE]: '📚',
  [KakeiboCategory.UNEXPECTED]: '⚡',
};

const Transactions: React.FC<Props> = ({ 
  state, 
  onAddTransaction, 
  onUpdateTransaction, 
  onDeleteTransaction 
}) => {
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState<number | 'ALL'>(now.getMonth());
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [filterCategory, setFilterCategory] = useState<string>('ALL');
  const [filterType, setFilterType] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);

  // Edit State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editBuffer, setEditBuffer] = useState<Transaction | null>(null);

  // Quick Add State
  const [newTx, setNewTx] = useState({
    description: '',
    amount: 0,
    type: WealthType.EXPENSE,
    kakeiboCategory: KakeiboCategory.NEEDS,
    date: new Date().toISOString().split('T')[0],
    isRecurring: false
  });

  const handleCreateTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTx.description || newTx.amount <= 0) return;
    onAddTransaction(newTx);
    setNewTx({
      description: '',
      amount: 0,
      type: WealthType.EXPENSE,
      kakeiboCategory: KakeiboCategory.NEEDS,
      date: new Date().toISOString().split('T')[0],
      isRecurring: false
    });
    setShowAddForm(false);
  };

  const handleStartEdit = (t: Transaction, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(t.id);
    setEditBuffer({ ...t });
  };

  const handleSaveEdit = () => {
    if (editBuffer) {
      onUpdateTransaction(editBuffer);
      setEditingId(null);
      setEditBuffer(null);
    }
  };

  // Filter Logic
  const filteredTransactions = useMemo(() => {
    return state.transactions.filter(t => {
      const d = new Date(t.date);
      if (selectedMonth !== 'ALL' && (d.getMonth() !== selectedMonth || d.getFullYear() !== selectedYear)) {
        return false;
      }
      if (filterCategory !== 'ALL' && t.kakeiboCategory !== filterCategory) {
        return false;
      }
      if (filterType !== 'ALL' && t.type !== filterType) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchDesc = t.description.toLowerCase().includes(q);
        const matchAmt = t.amount.toString().includes(q);
        const matchCat = t.kakeiboCategory?.toLowerCase().includes(q);
        if (!matchDesc && !matchAmt && !matchCat) return false;
      }
      return true;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [state.transactions, selectedMonth, selectedYear, filterCategory, filterType, searchQuery]);

  // Aggregate stats
  const totals = useMemo(() => {
    const income = filteredTransactions.filter(t => t.type === WealthType.INCOME).reduce((acc, t) => acc + t.amount, 0);
    const expense = filteredTransactions.filter(t => t.type === WealthType.EXPENSE).reduce((acc, t) => acc + t.amount, 0);
    return { income, expense, net: income - expense, count: filteredTransactions.length };
  }, [filteredTransactions]);

  const exportCSV = () => {
    const headers = ['Date', 'Description', 'Type', 'Category', 'Amount', 'Recurring'];
    const rows = filteredTransactions.map(t => [
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
    link.setAttribute('download', `fs4home_transactions_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  return (
    <div className="space-y-3.5 max-w-6xl mx-auto text-slate-100 animate-in fade-in duration-200 pb-16">
      
      {/* Header & Quick Action Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-emerald-500/20 pb-3">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-white tracking-tight">Transactions & Records</h1>
          <p className="text-xs text-emerald-300/70">Complete audit log, progressive filtering, and rapid reconciliation</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={exportCSV}
            className="px-2.5 py-1.5 rounded-lg bg-emerald-950/60 border border-emerald-500/20 hover:border-lime-400/40 text-emerald-300 text-xs font-bold transition-colors"
          >
            Export CSV
          </button>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="px-3 py-1.5 rounded-xl bg-lime-400 text-emerald-950 text-xs font-black hover:bg-lime-300 shadow-sm glow-lime-sm transition-all"
          >
            {showAddForm ? 'Close Form' : '+ New Entry'}
          </button>
        </div>
      </div>

      {/* Summary KPI Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div className="glass-card p-2.5 rounded-xl border border-emerald-500/20">
          <span className="text-[10px] text-emerald-300/70 font-bold uppercase block">Filtered Income</span>
          <span className="text-base font-black text-lime-400">₹{totals.income.toLocaleString()}</span>
        </div>
        <div className="glass-card p-2.5 rounded-xl border border-emerald-500/20">
          <span className="text-[10px] text-emerald-300/70 font-bold uppercase block">Filtered Expenses</span>
          <span className="text-base font-black text-rose-400">₹{totals.expense.toLocaleString()}</span>
        </div>
        <div className="glass-card p-2.5 rounded-xl border border-emerald-500/20">
          <span className="text-[10px] text-emerald-300/70 font-bold uppercase block">Net Cashflow</span>
          <span className="text-base font-black text-white">₹{totals.net.toLocaleString()}</span>
        </div>
        <div className="glass-card p-2.5 rounded-xl border border-emerald-500/20">
          <span className="text-[10px] text-emerald-300/70 font-bold uppercase block">Total Records</span>
          <span className="text-base font-black text-emerald-200">{totals.count} Entries</span>
        </div>
      </div>

      {/* Quick Add Collapsible Form */}
      {showAddForm && (
        <form onSubmit={handleCreateTransaction} className="glass-card p-3.5 md:p-4 rounded-2xl border border-lime-400/40 space-y-3">
          <div className="flex items-center justify-between border-b border-emerald-500/15 pb-2">
            <span className="text-xs font-black text-lime-300 uppercase">Fast Transaction Entry</span>
            <span className="text-[10px] text-emerald-400/60 font-mono">10-second fast entry</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5 text-xs">
            <div className="sm:col-span-2">
              <label className="block text-[10px] font-bold text-emerald-300/70 uppercase mb-1">Description</label>
              <input
                type="text"
                placeholder="e.g. Grocery Store, Client Payment"
                value={newTx.description}
                onChange={(e) => setNewTx({ ...newTx, description: e.target.value })}
                className="w-full px-2.5 py-1.5 bg-[#061f12] border border-emerald-500/30 rounded-lg text-white font-bold outline-none focus:border-lime-400"
                required
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-emerald-300/70 uppercase mb-1">Amount (₹)</label>
              <input
                type="number"
                placeholder="0"
                value={newTx.amount || ''}
                onChange={(e) => setNewTx({ ...newTx, amount: Number(e.target.value) })}
                className="w-full px-2.5 py-1.5 bg-[#061f12] border border-emerald-500/30 rounded-lg text-lime-400 font-black outline-none focus:border-lime-400"
                required
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-emerald-300/70 uppercase mb-1">Type</label>
              <select
                value={newTx.type}
                onChange={(e) => setNewTx({ ...newTx, type: e.target.value as WealthType })}
                className="w-full px-2.5 py-1.5 bg-[#061f12] border border-emerald-500/30 rounded-lg text-white font-bold outline-none focus:border-lime-400"
              >
                <option value={WealthType.EXPENSE}>Expense</option>
                <option value={WealthType.INCOME}>Income</option>
                <option value={WealthType.ASSET}>Asset / Investment</option>
                <option value={WealthType.LIABILITY}>Liability / Debt</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-emerald-300/70 uppercase mb-1">Category</label>
              <select
                value={newTx.kakeiboCategory}
                onChange={(e) => setNewTx({ ...newTx, kakeiboCategory: e.target.value as KakeiboCategory })}
                className="w-full px-2.5 py-1.5 bg-[#061f12] border border-emerald-500/30 rounded-lg text-white font-bold outline-none focus:border-lime-400"
              >
                <option value={KakeiboCategory.NEEDS}>Essential Needs</option>
                <option value={KakeiboCategory.WANTS}>Lifestyle Wants</option>
                <option value={KakeiboCategory.CULTURE}>Culture & Growth</option>
                <option value={KakeiboCategory.UNEXPECTED}>Unexpected</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-emerald-300/70 uppercase mb-1">Date</label>
              <input
                type="date"
                value={newTx.date}
                onChange={(e) => setNewTx({ ...newTx, date: e.target.value })}
                className="w-full px-2.5 py-1.5 bg-[#061f12] border border-emerald-500/30 rounded-lg text-white font-bold outline-none focus:border-lime-400"
              />
            </div>
            <div className="flex items-center gap-2 pt-4">
              <label className="flex items-center gap-1.5 text-xs text-emerald-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={newTx.isRecurring}
                  onChange={(e) => setNewTx({ ...newTx, isRecurring: e.target.checked })}
                  className="accent-lime-400 w-3.5 h-3.5"
                />
                <span>Recurring Monthly</span>
              </label>
            </div>
            <div className="flex justify-end items-end gap-2">
              <button
                type="submit"
                className="w-full py-1.5 bg-lime-400 text-emerald-950 text-xs font-black rounded-lg hover:bg-lime-300 shadow-md transition-colors"
              >
                Save Record
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Filter Toolbar */}
      <div className="glass-card p-3 rounded-xl border border-emerald-500/20 space-y-2">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 text-xs">
          {/* Search */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search description, amount..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-7 pr-3 py-1.5 bg-[#061f12] border border-emerald-500/30 rounded-lg text-white text-xs font-medium outline-none focus:border-lime-400"
            />
            <span className="absolute left-2.5 top-2 text-emerald-400/60 text-xs">🔍</span>
          </div>

          {/* Month Selector */}
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value === 'ALL' ? 'ALL' : Number(e.target.value))}
            className="w-full px-2.5 py-1.5 bg-[#061f12] border border-emerald-500/30 rounded-lg text-white text-xs font-bold outline-none focus:border-lime-400"
          >
            <option value="ALL">All Months</option>
            {['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].map((m, idx) => (
              <option key={m} value={idx}>{m} {selectedYear}</option>
            ))}
          </select>

          {/* Category Selector */}
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="w-full px-2.5 py-1.5 bg-[#061f12] border border-emerald-500/30 rounded-lg text-white text-xs font-bold outline-none focus:border-lime-400"
          >
            <option value="ALL">All Categories</option>
            <option value={KakeiboCategory.NEEDS}>Needs (Essential)</option>
            <option value={KakeiboCategory.WANTS}>Wants (Lifestyle)</option>
            <option value={KakeiboCategory.CULTURE}>Culture & Learning</option>
            <option value={KakeiboCategory.UNEXPECTED}>Unexpected</option>
          </select>

          {/* Type Selector */}
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="w-full px-2.5 py-1.5 bg-[#061f12] border border-emerald-500/30 rounded-lg text-white text-xs font-bold outline-none focus:border-lime-400"
          >
            <option value="ALL">All Types</option>
            <option value={WealthType.EXPENSE}>Expense Only</option>
            <option value={WealthType.INCOME}>Income Only</option>
            <option value={WealthType.ASSET}>Asset</option>
            <option value={WealthType.LIABILITY}>Liability</option>
          </select>
        </div>

        {/* Active Filter Chips */}
        {(filterCategory !== 'ALL' || filterType !== 'ALL' || selectedMonth !== 'ALL' || searchQuery) && (
          <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[10px]">
            <span className="text-emerald-300/60 font-semibold">Active:</span>
            {searchQuery && (
              <span className="px-2 py-0.5 rounded-md bg-lime-400/15 border border-lime-400/30 text-lime-300 flex items-center gap-1">
                "{searchQuery}" <button onClick={() => setSearchQuery('')}>×</button>
              </span>
            )}
            {filterCategory !== 'ALL' && (
              <span className="px-2 py-0.5 rounded-md bg-lime-400/15 border border-lime-400/30 text-lime-300 flex items-center gap-1">
                Cat: {filterCategory} <button onClick={() => setFilterCategory('ALL')}>×</button>
              </span>
            )}
            {filterType !== 'ALL' && (
              <span className="px-2 py-0.5 rounded-md bg-lime-400/15 border border-lime-400/30 text-lime-300 flex items-center gap-1">
                Type: {filterType} <button onClick={() => setFilterType('ALL')}>×</button>
              </span>
            )}
            {selectedMonth !== 'ALL' && (
              <span className="px-2 py-0.5 rounded-md bg-lime-400/15 border border-lime-400/30 text-lime-300 flex items-center gap-1">
                Month: {selectedMonth + 1}/{selectedYear} <button onClick={() => setSelectedMonth('ALL')}>×</button>
              </span>
            )}
            <button
              onClick={() => {
                setFilterCategory('ALL');
                setFilterType('ALL');
                setSelectedMonth('ALL');
                setSearchQuery('');
              }}
              className="text-emerald-400 underline hover:text-white ml-1 font-bold"
            >
              Clear all
            </button>
          </div>
        )}
      </div>

      {/* Desktop Transaction Table (md and above) */}
      <div className="hidden md:block glass-card rounded-2xl border border-emerald-500/20 overflow-hidden shadow-lg">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-emerald-500/20 bg-emerald-950/60 text-emerald-300/80 font-bold uppercase text-[10px] tracking-wider">
              <th className="px-4 py-2.5">Date</th>
              <th className="px-4 py-2.5">Description</th>
              <th className="px-4 py-2.5">Category</th>
              <th className="px-4 py-2.5">Type</th>
              <th className="px-4 py-2.5 text-right">Amount</th>
              <th className="px-4 py-2.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-emerald-500/10">
            {filteredTransactions.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-emerald-300/60">
                  No transactions match your filter criteria.
                </td>
              </tr>
            ) : (
              filteredTransactions.map((t) => {
                const isIncome = t.type === WealthType.INCOME;
                const isEditing = editingId === t.id;

                if (isEditing && editBuffer) {
                  return (
                    <tr key={t.id} className="bg-emerald-900/40">
                      <td className="px-3 py-2">
                        <input
                          type="date"
                          value={editBuffer.date}
                          onChange={(e) => setEditBuffer({ ...editBuffer, date: e.target.value })}
                          className="w-full bg-[#061f12] border border-lime-400 px-1.5 py-1 rounded text-white text-xs"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="text"
                          value={editBuffer.description}
                          onChange={(e) => setEditBuffer({ ...editBuffer, description: e.target.value })}
                          className="w-full bg-[#061f12] border border-lime-400 px-1.5 py-1 rounded text-white text-xs font-bold"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <select
                          value={editBuffer.kakeiboCategory}
                          onChange={(e) => setEditBuffer({ ...editBuffer, kakeiboCategory: e.target.value as KakeiboCategory })}
                          className="bg-[#061f12] border border-lime-400 px-1.5 py-1 rounded text-white text-xs"
                        >
                          <option value={KakeiboCategory.NEEDS}>Needs</option>
                          <option value={KakeiboCategory.WANTS}>Wants</option>
                          <option value={KakeiboCategory.CULTURE}>Culture</option>
                          <option value={KakeiboCategory.UNEXPECTED}>Unexpected</option>
                        </select>
                      </td>
                      <td className="px-3 py-2">
                        <select
                          value={editBuffer.type}
                          onChange={(e) => setEditBuffer({ ...editBuffer, type: e.target.value as WealthType })}
                          className="bg-[#061f12] border border-lime-400 px-1.5 py-1 rounded text-white text-xs"
                        >
                          <option value={WealthType.EXPENSE}>Expense</option>
                          <option value={WealthType.INCOME}>Income</option>
                        </select>
                      </td>
                      <td className="px-3 py-2 text-right">
                        <input
                          type="number"
                          value={editBuffer.amount}
                          onChange={(e) => setEditBuffer({ ...editBuffer, amount: Number(e.target.value) })}
                          className="w-24 bg-[#061f12] border border-lime-400 px-1.5 py-1 rounded text-lime-300 text-xs font-black text-right"
                        />
                      </td>
                      <td className="px-3 py-2 text-right space-x-1">
                        <button onClick={handleSaveEdit} className="text-lime-400 font-bold hover:underline">Save</button>
                        <button onClick={() => setEditingId(null)} className="text-emerald-400 hover:underline">Cancel</button>
                      </td>
                    </tr>
                  );
                }

                return (
                  <tr key={t.id} className="hover:bg-emerald-950/40 transition-colors">
                    <td className="px-4 py-2.5 text-emerald-300/70 font-mono whitespace-nowrap">
                      {new Date(t.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-4 py-2.5 font-bold text-white">
                      <div className="flex items-center gap-1.5">
                        <span>{t.description}</span>
                        {t.isRecurring && (
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-900 text-emerald-300 font-normal">
                            Recurring
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-2.5">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-500/20 text-[10px] font-bold text-emerald-200">
                        <span>{t.kakeiboCategory ? CATEGORY_ICONS[t.kakeiboCategory] : '🏷️'}</span>
                        <span>{t.kakeiboCategory || 'General'}</span>
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-emerald-300/80 font-medium">
                      {t.type}
                    </td>
                    <td className={`px-4 py-2.5 text-right font-black text-xs ${isIncome ? 'text-lime-400' : 'text-white'}`}>
                      {isIncome ? '+' : '-'}₹{t.amount.toLocaleString()}
                    </td>
                    <td className="px-4 py-2.5 text-right space-x-2 whitespace-nowrap">
                      <button
                        onClick={(e) => handleStartEdit(t, e)}
                        className="text-[11px] text-emerald-400 hover:text-white font-bold transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => onDeleteTransaction(t.id)}
                        className="text-[11px] text-rose-400/80 hover:text-rose-300 font-bold transition-colors"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile Transaction List (Expandable Rows for Progressive Disclosure) */}
      <div className="md:hidden space-y-2">
        {filteredTransactions.length === 0 ? (
          <div className="glass-card p-6 rounded-xl text-center text-emerald-300/60 text-xs">
            No transactions found.
          </div>
        ) : (
          filteredTransactions.map((t) => {
            const isIncome = t.type === WealthType.INCOME;
            const isExpanded = expandedRowId === t.id;
            const icon = t.kakeiboCategory ? CATEGORY_ICONS[t.kakeiboCategory] : '💳';

            return (
              <div
                key={t.id}
                onClick={() => setExpandedRowId(isExpanded ? null : t.id)}
                className="glass-card p-3 rounded-xl border border-emerald-500/20 space-y-2 cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="text-base">{icon}</span>
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-white truncate">{t.description}</div>
                      <div className="text-[10px] text-emerald-300/60">
                        {new Date(t.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} • {t.kakeiboCategory || t.type}
                      </div>
                    </div>
                  </div>
                  <div className={`text-xs font-black ${isIncome ? 'text-lime-400' : 'text-white'}`}>
                    {isIncome ? '+' : '-'}₹{t.amount.toLocaleString()}
                  </div>
                </div>

                {/* Progressive Disclosure Expansion */}
                {isExpanded && (
                  <div className="pt-2 border-t border-emerald-500/15 flex items-center justify-between text-xs animate-in fade-in duration-150">
                    <span className="text-[10px] text-emerald-300/70 font-semibold">
                      {t.isRecurring ? '🔁 Recurring Payment' : 'One-time Payment'}
                    </span>
                    <div className="flex gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          const newDesc = prompt('Edit description:', t.description);
                          if (newDesc) onUpdateTransaction({ ...t, description: newDesc });
                        }}
                        className="px-2 py-1 rounded bg-emerald-900 text-emerald-300 text-[10px] font-bold"
                      >
                        Edit
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteTransaction(t.id);
                        }}
                        className="px-2 py-1 rounded bg-rose-950 text-rose-300 text-[10px] font-bold"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

    </div>
  );
};

export default Transactions;
