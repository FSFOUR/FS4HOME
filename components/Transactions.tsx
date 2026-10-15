import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { AppState, Transaction, WealthType, KakeiboCategory, CategoryTarget, Reflection } from '../types';
import QuickAddModal from './QuickAddModal';

interface Props {
  state: AppState;
  onAddTransaction: (t: Omit<Transaction, 'id'>) => void;
  onUpdateTransaction: (t: Transaction) => void;
  onDeleteTransaction: (id: string) => void;
  onUpdateTarget: (val: number) => void;
  onUpdateMonthlyCategoryTarget: (monthKey: string, cat: KakeiboCategory, target: CategoryTarget) => void;
  onUpdateReflection: (type: 'weekly' | 'monthly', key: string, reflection: Reflection) => void;
}

const CATEGORY_ICONS: Record<string, string> = {
  [KakeiboCategory.NEEDS]: '🏠',
  [KakeiboCategory.WANTS]: '🛍️',
  [KakeiboCategory.CULTURE]: '📚',
  [KakeiboCategory.UNEXPECTED]: '⚡',
  'Food & Groceries': '🛒',
  'Education & Schooling': '🎓',
  'Utilities & House Rent': '💡',
  'Transport & Travel': '🚗',
  'Chitty / Savings': '💰',
  'Income': '💵',
  'Healthcare': '🏥',
  'Shopping': '🛍️',
};

type DatePreset = 'ALL' | 'TODAY' | 'LAST_7_DAYS' | 'THIS_MONTH' | 'LAST_MONTH' | 'LAST_30_DAYS' | 'THIS_YEAR' | 'CUSTOM';
type AmountPreset = 'ALL' | 'UNDER_500' | '500_TO_2000' | '2000_TO_5000' | '5000_TO_20000' | 'OVER_20000' | 'CUSTOM';
type SortOption = 'DATE_DESC' | 'DATE_ASC' | 'AMOUNT_DESC' | 'AMOUNT_ASC' | 'DESC_AZ';

const Transactions: React.FC<Props> = ({ 
  state, 
  onAddTransaction, 
  onUpdateTransaction, 
  onDeleteTransaction 
}) => {
  const now = new Date();
  
  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('ALL');
  const [filterSubcategory, setFilterSubcategory] = useState<string>('ALL');
  const [filterType, setFilterType] = useState<string>('ALL');
  const [filterAccount, setFilterAccount] = useState<string>('ALL');
  const [filterRecurring, setFilterRecurring] = useState<'ALL' | 'RECURRING' | 'ONETIME'>('ALL');

  // Date Range Filtering
  const [dateFilterMode, setDateFilterMode] = useState<'PRESET' | 'MONTH' | 'RANGE'>('MONTH');
  const [datePreset, setDatePreset] = useState<DatePreset>('THIS_MONTH');
  const [selectedMonth, setSelectedMonth] = useState<number>(now.getMonth());
  const [selectedYear, setSelectedYear] = useState<number>(now.getFullYear());
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  // Amount Filtering
  const [amountPreset, setAmountPreset] = useState<AmountPreset>('ALL');
  const [minAmount, setMinAmount] = useState<string>('');
  const [maxAmount, setMaxAmount] = useState<string>('');

  // Sorting & UI
  const [sortBy, setSortBy] = useState<SortOption>('DATE_DESC');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState<boolean>(false);
  const [showAddForm, setShowAddForm] = useState<boolean>(false);
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);

  // Quick Inline Edit State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editBuffer, setEditBuffer] = useState<Transaction | null>(null);

  // Extract unique categories and accounts from state & transactions
  const availableCategories = useMemo(() => {
    const cats = new Set<string>();
    
    // Add custom budget categories
    if (state.customBudgetCategories) {
      state.customBudgetCategories.forEach(c => cats.add(c.name));
    }
    
    // Add categories from existing transactions
    state.transactions.forEach(t => {
      if (t.category) cats.add(t.category);
    });

    // Add Kakeibo categories as well
    Object.values(KakeiboCategory).forEach(k => cats.add(k));

    return Array.from(cats).sort();
  }, [state.customBudgetCategories, state.transactions]);

  // Extract available subcategories for selected category
  const availableSubcategories = useMemo(() => {
    if (filterCategory === 'ALL') return [];
    
    const subcats = new Set<string>();
    
    // Check custom budget categories
    const foundCat = state.customBudgetCategories?.find(c => c.name === filterCategory);
    if (foundCat && foundCat.subcategories) {
      foundCat.subcategories.forEach(s => subcats.add(s.name));
    }

    // Check transactions
    state.transactions.forEach(t => {
      if ((t.category === filterCategory || t.kakeiboCategory === filterCategory) && t.subcategory) {
        subcats.add(t.subcategory);
      }
    });

    return Array.from(subcats).sort();
  }, [filterCategory, state.customBudgetCategories, state.transactions]);

  // Extract available accounts
  const availableAccounts = useMemo(() => {
    const accounts = new Set<string>();
    if (state.accountBalances) {
      Object.keys(state.accountBalances).forEach(a => accounts.add(a));
    }
    state.transactions.forEach(t => {
      if (t.account) accounts.add(t.account);
    });
    return Array.from(accounts).sort();
  }, [state.accountBalances, state.transactions]);

  // Handle Amount Preset change
  const handleAmountPresetSelect = (preset: AmountPreset) => {
    setAmountPreset(preset);
    switch (preset) {
      case 'UNDER_500':
        setMinAmount('');
        setMaxAmount('500');
        break;
      case '500_TO_2000':
        setMinAmount('500');
        setMaxAmount('2000');
        break;
      case '2000_TO_5000':
        setMinAmount('2000');
        setMaxAmount('5000');
        break;
      case '5000_TO_20000':
        setMinAmount('5000');
        setMaxAmount('20000');
        break;
      case 'OVER_20000':
        setMinAmount('20000');
        setMaxAmount('');
        break;
      case 'ALL':
        setMinAmount('');
        setMaxAmount('');
        break;
      case 'CUSTOM':
        break;
    }
  };

  // Handle Date Preset change
  const handleDatePresetSelect = (preset: DatePreset) => {
    setDatePreset(preset);
    const today = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    const toDateStr = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

    if (preset === 'TODAY') {
      setDateFilterMode('RANGE');
      const todayStr = toDateStr(today);
      setStartDate(todayStr);
      setEndDate(todayStr);
    } else if (preset === 'LAST_7_DAYS') {
      setDateFilterMode('RANGE');
      const start = new Date(today.getTime() - 6 * 24 * 60 * 60 * 1000);
      setStartDate(toDateStr(start));
      setEndDate(toDateStr(today));
    } else if (preset === 'LAST_30_DAYS') {
      setDateFilterMode('RANGE');
      const start = new Date(today.getTime() - 29 * 24 * 60 * 60 * 1000);
      setStartDate(toDateStr(start));
      setEndDate(toDateStr(today));
    } else if (preset === 'THIS_MONTH') {
      setDateFilterMode('MONTH');
      setSelectedMonth(today.getMonth());
      setSelectedYear(today.getFullYear());
    } else if (preset === 'LAST_MONTH') {
      setDateFilterMode('MONTH');
      const lm = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      setSelectedMonth(lm.getMonth());
      setSelectedYear(lm.getFullYear());
    } else if (preset === 'THIS_YEAR') {
      setDateFilterMode('RANGE');
      setStartDate(`${today.getFullYear()}-01-01`);
      setEndDate(`${today.getFullYear()}-12-31`);
    } else if (preset === 'ALL') {
      setDateFilterMode('PRESET');
      setStartDate('');
      setEndDate('');
    }
  };

  // Inline Edit Handlers
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

  // Main Filter & Search Pipeline
  const filteredTransactions = useMemo(() => {
    return state.transactions.filter(t => {
      const txDate = new Date(t.date);
      const txDateStr = t.date ? t.date.slice(0, 10) : '';

      // 1. Date Filtering
      if (dateFilterMode === 'MONTH') {
        if (txDate.getMonth() !== selectedMonth || txDate.getFullYear() !== selectedYear) {
          return false;
        }
      } else if (dateFilterMode === 'RANGE') {
        if (startDate && txDateStr < startDate) return false;
        if (endDate && txDateStr > endDate) return false;
      }

      // 2. Category Filtering (matches category or kakeiboCategory)
      if (filterCategory !== 'ALL') {
        const matchesMain = t.category === filterCategory || t.kakeiboCategory === filterCategory;
        if (!matchesMain) return false;

        // Subcategory check
        if (filterSubcategory !== 'ALL' && t.subcategory !== filterSubcategory) {
          return false;
        }
      }

      // 3. Type Filtering
      if (filterType !== 'ALL') {
        const matchesType = t.type === filterType || t.transactionType === filterType;
        if (!matchesType) return false;
      }

      // 4. Account Filtering
      if (filterAccount !== 'ALL') {
        if (t.account !== filterAccount) return false;
      }

      // 5. Recurring Filtering
      if (filterRecurring === 'RECURRING' && !t.isRecurring) return false;
      if (filterRecurring === 'ONETIME' && t.isRecurring) return false;

      // 6. Amount Filtering (Min & Max)
      const min = minAmount !== '' ? Number(minAmount) : null;
      const max = maxAmount !== '' ? Number(maxAmount) : null;
      if (min !== null && !isNaN(min) && t.amount < min) return false;
      if (max !== null && !isNaN(max) && t.amount > max) return false;

      // 7. Comprehensive Text Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const descMatch = (t.description || '').toLowerCase().includes(q);
        const remarksMatch = (t.remarks || '').toLowerCase().includes(q);
        const catMatch = (t.category || '').toLowerCase().includes(q) || (t.kakeiboCategory || '').toLowerCase().includes(q);
        const subcatMatch = (t.subcategory || '').toLowerCase().includes(q);
        const accountMatch = (t.account || '').toLowerCase().includes(q);
        const payMethodMatch = (t.paymentMethod || '').toLowerCase().includes(q);
        const typeMatch = (t.transactionType || t.type || '').toLowerCase().includes(q);
        const amtStr = t.amount.toString();
        const amtFormatted = t.amount.toLocaleString('en-IN');
        const amtMatch = amtStr.includes(q) || amtFormatted.includes(q);
        const dateMatch = t.date.includes(q);

        if (!descMatch && !remarksMatch && !catMatch && !subcatMatch && !accountMatch && !payMethodMatch && !typeMatch && !amtMatch && !dateMatch) {
          return false;
        }
      }

      return true;
    }).sort((a, b) => {
      switch (sortBy) {
        case 'DATE_ASC':
          return new Date(a.date).getTime() - new Date(b.date).getTime();
        case 'AMOUNT_DESC':
          return b.amount - a.amount;
        case 'AMOUNT_ASC':
          return a.amount - b.amount;
        case 'DESC_AZ':
          return (a.description || '').localeCompare(b.description || '');
        case 'DATE_DESC':
        default:
          return new Date(b.date).getTime() - new Date(a.date).getTime();
      }
    });
  }, [
    state.transactions,
    dateFilterMode,
    selectedMonth,
    selectedYear,
    startDate,
    endDate,
    filterCategory,
    filterSubcategory,
    filterType,
    filterAccount,
    filterRecurring,
    minAmount,
    maxAmount,
    searchQuery,
    sortBy
  ]);

  // Aggregate stats
  const totals = useMemo(() => {
    const income = filteredTransactions
      .filter(t => t.type === WealthType.INCOME || t.transactionType === 'Income')
      .reduce((acc, t) => acc + t.amount, 0);
    const expense = filteredTransactions
      .filter(t => t.type === WealthType.EXPENSE || t.transactionType === 'Expense')
      .reduce((acc, t) => acc + t.amount, 0);
    const count = filteredTransactions.length;
    const avg = count > 0 ? (income + expense) / count : 0;
    return { income, expense, net: income - expense, count, avg };
  }, [filteredTransactions]);

  // Count active filters
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (searchQuery.trim()) count++;
    if (filterCategory !== 'ALL') count++;
    if (filterSubcategory !== 'ALL') count++;
    if (filterType !== 'ALL') count++;
    if (filterAccount !== 'ALL') count++;
    if (filterRecurring !== 'ALL') count++;
    if (dateFilterMode === 'RANGE' && (startDate || endDate)) count++;
    if (minAmount !== '' || maxAmount !== '') count++;
    return count;
  }, [searchQuery, filterCategory, filterSubcategory, filterType, filterAccount, filterRecurring, dateFilterMode, startDate, endDate, minAmount, maxAmount]);

  const resetAllFilters = () => {
    setSearchQuery('');
    setFilterCategory('ALL');
    setFilterSubcategory('ALL');
    setFilterType('ALL');
    setFilterAccount('ALL');
    setFilterRecurring('ALL');
    setDateFilterMode('MONTH');
    setDatePreset('THIS_MONTH');
    setSelectedMonth(now.getMonth());
    setSelectedYear(now.getFullYear());
    setStartDate('');
    setEndDate('');
    setAmountPreset('ALL');
    setMinAmount('');
    setMaxAmount('');
    setSortBy('DATE_DESC');
  };


  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  return (
    <div className="space-y-3.5 max-w-6xl mx-auto text-[#24342B] animate-in fade-in duration-200 pb-16">
      
      {/* Header & Quick Action Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-[#E1E5DC] pb-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-[#24342B] tracking-tight flex items-center gap-2">
            <span>Transactions & Records</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-[#EAF1E6] border border-[#CBD5C8] text-[#244A38] font-bold">
              {totals.count} {totals.count === 1 ? 'entry' : 'entries'}
            </span>
          </h1>
          <p className="text-xs text-[#68756C]">
            Search, filter by category, date range, or amount with instant ledger reconciliation
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Link
            to="/report"
            className="px-2.5 py-1.5 rounded-xl bg-[#F0F1E9] border border-[#CBD5C8] hover:bg-[#E9EEE5] text-[#244A38] text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs"
          >
            <span>📊</span>
            <span>Monthly Report</span>
          </Link>
          <button
            onClick={() => setShowAddForm(true)}
            className="px-3 py-1.5 rounded-xl bg-[#244A38] text-white text-xs font-bold hover:bg-[#1a382a] shadow-xs transition-all flex items-center gap-1 active:scale-95"
          >
            <span className="text-sm font-bold leading-none">+</span>
            <span>Add Transaction</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div className="bg-white p-3.5 rounded-2xl border border-[#E1E5DC] shadow-xs">
          <span className="text-[10px] text-[#68756C] font-semibold uppercase block">Filtered Income</span>
          <span className="text-base sm:text-lg font-bold text-[#287548]">₹{totals.income.toLocaleString('en-IN')}</span>
        </div>
        <div className="bg-white p-3.5 rounded-2xl border border-[#E1E5DC] shadow-xs">
          <span className="text-[10px] text-[#68756C] font-semibold uppercase block">Filtered Expenses</span>
          <span className="text-base sm:text-lg font-bold text-[#B85D4B]">₹{totals.expense.toLocaleString('en-IN')}</span>
        </div>
        <div className="bg-white p-3.5 rounded-2xl border border-[#E1E5DC] shadow-xs">
          <span className="text-[10px] text-[#68756C] font-semibold uppercase block">Net Cashflow</span>
          <span className={`text-base sm:text-lg font-bold ${totals.net >= 0 ? 'text-[#287548]' : 'text-[#B85D4B]'}`}>
            {totals.net >= 0 ? '+' : ''}₹{totals.net.toLocaleString('en-IN')}
          </span>
        </div>
        <div className="bg-white p-3.5 rounded-2xl border border-[#E1E5DC] shadow-xs">
          <span className="text-[10px] text-[#68756C] font-semibold uppercase block">Avg Entry</span>
          <span className="text-base sm:text-lg font-bold text-[#24342B]">₹{Math.round(totals.avg).toLocaleString('en-IN')}</span>
        </div>
      </div>

      {/* Quick Add Modal */}
      <QuickAddModal 
        isOpen={showAddForm} 
        onClose={() => setShowAddForm(false)} 
        state={state}
        onAddTransaction={onAddTransaction} 
      />

      {/* Primary Search & Filter Toolbar */}
      <div className="glass-card p-3 rounded-2xl border border-emerald-500/20 space-y-3 shadow-md">
        
        {/* Row 1: Search Bar & Primary Selectors */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 text-xs">
          
          {/* Universal Search Bar */}
          <div className="sm:col-span-5 relative">
            <input
              type="text"
              placeholder="Search description, merchant, remarks, amount (e.g. ₹500)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-8 py-2 bg-[#061f12] border border-emerald-500/30 rounded-xl text-white text-xs font-medium outline-none focus:border-lime-400 transition-colors shadow-inner"
            />
            <span className="absolute left-2.5 top-2.5 text-emerald-400/70 text-xs">🔍</span>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2 text-emerald-400/80 hover:text-white text-sm font-bold"
                title="Clear search"
              >
                ✕
              </button>
            )}
          </div>

          {/* Category Selector */}
          <div className="sm:col-span-3">
            <select
              value={filterCategory}
              onChange={(e) => {
                setFilterCategory(e.target.value);
                setFilterSubcategory('ALL');
              }}
              className="w-full px-2.5 py-2 bg-[#061f12] border border-emerald-500/30 rounded-xl text-white text-xs font-bold outline-none focus:border-lime-400"
            >
              <option value="ALL">📁 All Categories</option>
              <optgroup label="Budget Categories">
                {availableCategories.map(cat => (
                  <option key={cat} value={cat}>
                    {CATEGORY_ICONS[cat] || '🏷️'} {cat}
                  </option>
                ))}
              </optgroup>
            </select>
          </div>

          {/* Type Selector */}
          <div className="sm:col-span-2">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full px-2.5 py-2 bg-[#061f12] border border-emerald-500/30 rounded-xl text-white text-xs font-bold outline-none focus:border-lime-400"
            >
              <option value="ALL">All Types</option>
              <option value="Expense">Expense</option>
              <option value="Income">Income</option>
              <option value="Transfer">Transfer</option>
              <option value="Savings Contribution">Savings</option>
              <option value="Debt Payment">Debt</option>
              <option value="Investment Contribution">Investment</option>
            </select>
          </div>

          {/* Sort By Selector */}
          <div className="sm:col-span-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="w-full px-2 py-2 bg-[#061f12] border border-emerald-500/30 rounded-xl text-emerald-200 text-xs font-bold outline-none focus:border-lime-400"
            >
              <option value="DATE_DESC">Date (Newest)</option>
              <option value="DATE_ASC">Date (Oldest)</option>
              <option value="AMOUNT_DESC">Amount (High → Low)</option>
              <option value="AMOUNT_ASC">Amount (Low → High)</option>
              <option value="DESC_AZ">Name (A → Z)</option>
            </select>
          </div>
        </div>

        {/* Row 2: Date Filtering Bar (Month vs Custom Range) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1 border-t border-emerald-500/10">
          
          {/* Date Filter Mode Buttons */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[10px] text-emerald-400/80 font-bold uppercase mr-1">Period:</span>
            
            <button
              onClick={() => handleDatePresetSelect('THIS_MONTH')}
              className={`px-2 py-1 rounded-lg text-[11px] font-bold transition-all ${
                dateFilterMode === 'MONTH' && selectedMonth === now.getMonth() && selectedYear === now.getFullYear()
                  ? 'bg-lime-400 text-emerald-950 font-black'
                  : 'bg-emerald-950/60 text-emerald-300 border border-emerald-500/20 hover:border-lime-400/40'
              }`}
            >
              This Month
            </button>
            
            <button
              onClick={() => handleDatePresetSelect('LAST_MONTH')}
              className={`px-2 py-1 rounded-lg text-[11px] font-bold transition-all ${
                dateFilterMode === 'MONTH' && selectedMonth === (now.getMonth() === 0 ? 11 : now.getMonth() - 1)
                  ? 'bg-lime-400 text-emerald-950 font-black'
                  : 'bg-emerald-950/60 text-emerald-300 border border-emerald-500/20 hover:border-lime-400/40'
              }`}
            >
              Last Month
            </button>

            <button
              onClick={() => handleDatePresetSelect('LAST_7_DAYS')}
              className={`px-2 py-1 rounded-lg text-[11px] font-bold transition-all ${
                datePreset === 'LAST_7_DAYS' && dateFilterMode === 'RANGE'
                  ? 'bg-lime-400 text-emerald-950 font-black'
                  : 'bg-emerald-950/60 text-emerald-300 border border-emerald-500/20 hover:border-lime-400/40'
              }`}
            >
              Last 7 Days
            </button>

            <button
              onClick={() => handleDatePresetSelect('THIS_YEAR')}
              className={`px-2 py-1 rounded-lg text-[11px] font-bold transition-all ${
                datePreset === 'THIS_YEAR' && dateFilterMode === 'RANGE'
                  ? 'bg-lime-400 text-emerald-950 font-black'
                  : 'bg-emerald-950/60 text-emerald-300 border border-emerald-500/20 hover:border-lime-400/40'
              }`}
            >
              This Year
            </button>

            <button
              onClick={() => handleDatePresetSelect('ALL')}
              className={`px-2 py-1 rounded-lg text-[11px] font-bold transition-all ${
                dateFilterMode === 'PRESET' && datePreset === 'ALL'
                  ? 'bg-lime-400 text-emerald-950 font-black'
                  : 'bg-emerald-950/60 text-emerald-300 border border-emerald-500/20 hover:border-lime-400/40'
              }`}
            >
              All Time
            </button>

            <button
              onClick={() => setDateFilterMode('RANGE')}
              className={`px-2 py-1 rounded-lg text-[11px] font-bold transition-all ${
                dateFilterMode === 'RANGE' && datePreset === 'CUSTOM'
                  ? 'bg-lime-400 text-emerald-950 font-black'
                  : 'bg-emerald-950/60 text-emerald-300 border border-emerald-500/20 hover:border-lime-400/40'
              }`}
            >
              Custom Range 📅
            </button>
          </div>

          {/* Month Navigator OR Date Range Inputs */}
          <div className="flex items-center gap-1.5">
            {dateFilterMode === 'MONTH' ? (
              <div className="flex items-center gap-1 bg-[#061f12] px-2 py-1 rounded-xl border border-emerald-500/30">
                <button
                  onClick={() => {
                    if (selectedMonth === 0) {
                      setSelectedMonth(11);
                      setSelectedYear(prev => prev - 1);
                    } else {
                      setSelectedMonth(prev => prev - 1);
                    }
                  }}
                  className="p-1 hover:text-lime-300 text-emerald-400 text-xs font-bold"
                  title="Previous month"
                >
                  ◀
                </button>
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(Number(e.target.value))}
                  className="bg-transparent text-white text-xs font-bold outline-none cursor-pointer"
                >
                  {monthNames.map((m, idx) => (
                    <option key={m} value={idx} className="bg-[#061f12] text-white">{m}</option>
                  ))}
                </select>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(Number(e.target.value))}
                  className="bg-transparent text-emerald-300 text-xs font-bold outline-none cursor-pointer"
                >
                  {[2024, 2025, 2026, 2027].map(yr => (
                    <option key={yr} value={yr} className="bg-[#061f12] text-white">{yr}</option>
                  ))}
                </select>
                <button
                  onClick={() => {
                    if (selectedMonth === 11) {
                      setSelectedMonth(0);
                      setSelectedYear(prev => prev + 1);
                    } else {
                      setSelectedMonth(prev => prev + 1);
                    }
                  }}
                  className="p-1 hover:text-lime-300 text-emerald-400 text-xs font-bold"
                  title="Next month"
                >
                  ▶
                </button>
              </div>
            ) : dateFilterMode === 'RANGE' ? (
              <div className="flex items-center gap-1.5 bg-[#061f12] px-2 py-1 rounded-xl border border-emerald-500/30">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value);
                    setDatePreset('CUSTOM');
                  }}
                  className="bg-transparent text-white text-[11px] font-medium outline-none"
                  title="Start date"
                />
                <span className="text-emerald-500 text-xs">to</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => {
                    setEndDate(e.target.value);
                    setDatePreset('CUSTOM');
                  }}
                  className="bg-transparent text-white text-[11px] font-medium outline-none"
                  title="End date"
                />
              </div>
            ) : (
              <span className="text-[11px] text-emerald-300/70 font-semibold px-2 py-1">All dates included</span>
            )}

            {/* Toggle Advanced / Amount Filters */}
            <button
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className={`px-2 py-1 rounded-lg text-[11px] font-bold border transition-colors flex items-center gap-1 ${
                showAdvancedFilters || minAmount !== '' || maxAmount !== '' || filterAccount !== 'ALL' || filterRecurring !== 'ALL'
                  ? 'bg-lime-400/20 text-lime-300 border-lime-400/40'
                  : 'bg-emerald-950/40 text-emerald-400 border-emerald-500/20 hover:text-white'
              }`}
            >
              <span>{showAdvancedFilters ? '▲ Hide' : '▼ More'} Filters</span>
              {(minAmount !== '' || maxAmount !== '' || filterAccount !== 'ALL' || filterRecurring !== 'ALL') && (
                <span className="w-1.5 h-1.5 rounded-full bg-lime-400 inline-block animate-pulse" />
              )}
            </button>
          </div>
        </div>

        {/* Row 3: Advanced Amount & Subcategory Filters (Collapsible) */}
        {showAdvancedFilters && (
          <div className="p-3 bg-[#04190e] rounded-xl border border-emerald-500/20 space-y-2.5 animate-in fade-in duration-150">
            
            {/* Amount Range Filter */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] text-emerald-400 font-bold uppercase mr-1">Amount:</span>
                {(['ALL', 'UNDER_500', '500_TO_2000', '2000_TO_5000', '5000_TO_20000', 'OVER_20000'] as AmountPreset[]).map(preset => {
                  const labelMap: Record<AmountPreset, string> = {
                    ALL: 'Any',
                    UNDER_500: '< ₹500',
                    '500_TO_2000': '₹500 - ₹2k',
                    '2000_TO_5000': '₹2k - ₹5k',
                    '5000_TO_20000': '₹5k - ₹20k',
                    OVER_20000: '> ₹20k',
                    CUSTOM: 'Custom'
                  };
                  return (
                    <button
                      key={preset}
                      onClick={() => handleAmountPresetSelect(preset)}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all ${
                        amountPreset === preset
                          ? 'bg-lime-400 text-emerald-950'
                          : 'bg-emerald-950/60 text-emerald-300 border border-emerald-500/20 hover:border-lime-400/30'
                      }`}
                    >
                      {labelMap[preset]}
                    </button>
                  );
                })}
              </div>

              {/* Exact Min & Max Amount Inputs */}
              <div className="flex items-center gap-1.5 text-xs">
                <span className="text-[10px] text-emerald-300/70 font-semibold">Min ₹</span>
                <input
                  type="number"
                  placeholder="0"
                  value={minAmount}
                  onChange={(e) => {
                    setMinAmount(e.target.value);
                    setAmountPreset('CUSTOM');
                  }}
                  className="w-20 px-2 py-1 bg-[#061f12] border border-emerald-500/30 rounded-lg text-white text-xs outline-none focus:border-lime-400"
                />
                <span className="text-[10px] text-emerald-300/70 font-semibold">Max ₹</span>
                <input
                  type="number"
                  placeholder="∞"
                  value={maxAmount}
                  onChange={(e) => {
                    setMaxAmount(e.target.value);
                    setAmountPreset('CUSTOM');
                  }}
                  className="w-20 px-2 py-1 bg-[#061f12] border border-emerald-500/30 rounded-lg text-white text-xs outline-none focus:border-lime-400"
                />
              </div>
            </div>

            {/* Subcategory, Account & Recurring Filters */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs pt-1 border-t border-emerald-500/10">
              
              {/* Subcategory filter */}
              <div>
                <label className="text-[10px] text-emerald-400/80 font-bold block mb-0.5">Subcategory</label>
                <select
                  value={filterSubcategory}
                  onChange={(e) => setFilterSubcategory(e.target.value)}
                  disabled={filterCategory === 'ALL' || availableSubcategories.length === 0}
                  className="w-full px-2 py-1 bg-[#061f12] border border-emerald-500/30 rounded-lg text-white text-xs outline-none disabled:opacity-40"
                >
                  <option value="ALL">All Subcategories</option>
                  {availableSubcategories.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              {/* Account filter */}
              <div>
                <label className="text-[10px] text-emerald-400/80 font-bold block mb-0.5">Account / Source</label>
                <select
                  value={filterAccount}
                  onChange={(e) => setFilterAccount(e.target.value)}
                  className="w-full px-2 py-1 bg-[#061f12] border border-emerald-500/30 rounded-lg text-white text-xs outline-none"
                >
                  <option value="ALL">All Accounts</option>
                  {availableAccounts.map(a => (
                    <option key={a} value={a}>{a}</option>
                  ))}
                </select>
              </div>

              {/* Recurring filter */}
              <div>
                <label className="text-[10px] text-emerald-400/80 font-bold block mb-0.5">Payment Frequency</label>
                <select
                  value={filterRecurring}
                  onChange={(e) => setFilterRecurring(e.target.value as any)}
                  className="w-full px-2 py-1 bg-[#061f12] border border-emerald-500/30 rounded-lg text-white text-xs outline-none"
                >
                  <option value="ALL">All Records</option>
                  <option value="RECURRING">Recurring Only 🔁</option>
                  <option value="ONETIME">One-time Only ⚡</option>
                </select>
              </div>

            </div>

          </div>
        )}

        {/* Active Filter Badges Strip */}
        {activeFiltersCount > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[11px] border-t border-emerald-500/10">
            <span className="text-emerald-400/70 font-bold">Active ({activeFiltersCount}):</span>
            
            {searchQuery && (
              <span className="px-2 py-0.5 rounded-lg bg-lime-400/15 border border-lime-400/30 text-lime-300 flex items-center gap-1">
                <span>Search: "{searchQuery}"</span>
                <button onClick={() => setSearchQuery('')} className="hover:text-white font-bold">✕</button>
              </span>
            )}

            {filterCategory !== 'ALL' && (
              <span className="px-2 py-0.5 rounded-lg bg-lime-400/15 border border-lime-400/30 text-lime-300 flex items-center gap-1">
                <span>Category: {filterCategory}</span>
                <button onClick={() => { setFilterCategory('ALL'); setFilterSubcategory('ALL'); }} className="hover:text-white font-bold">✕</button>
              </span>
            )}

            {filterSubcategory !== 'ALL' && (
              <span className="px-2 py-0.5 rounded-lg bg-lime-400/15 border border-lime-400/30 text-lime-300 flex items-center gap-1">
                <span>Sub: {filterSubcategory}</span>
                <button onClick={() => setFilterSubcategory('ALL')} className="hover:text-white font-bold">✕</button>
              </span>
            )}

            {filterType !== 'ALL' && (
              <span className="px-2 py-0.5 rounded-lg bg-lime-400/15 border border-lime-400/30 text-lime-300 flex items-center gap-1">
                <span>Type: {filterType}</span>
                <button onClick={() => setFilterType('ALL')} className="hover:text-white font-bold">✕</button>
              </span>
            )}

            {dateFilterMode === 'RANGE' && (startDate || endDate) && (
              <span className="px-2 py-0.5 rounded-lg bg-lime-400/15 border border-lime-400/30 text-lime-300 flex items-center gap-1">
                <span>Dates: {startDate || 'Start'} → {endDate || 'End'}</span>
                <button onClick={() => { setStartDate(''); setEndDate(''); setDatePreset('ALL'); }} className="hover:text-white font-bold">✕</button>
              </span>
            )}

            {(minAmount !== '' || maxAmount !== '') && (
              <span className="px-2 py-0.5 rounded-lg bg-lime-400/15 border border-lime-400/30 text-lime-300 flex items-center gap-1">
                <span>Amount: {minAmount ? `₹${minAmount}` : '₹0'} - {maxAmount ? `₹${maxAmount}` : 'Any'}</span>
                <button onClick={() => { setMinAmount(''); setMaxAmount(''); setAmountPreset('ALL'); }} className="hover:text-white font-bold">✕</button>
              </span>
            )}

            {filterAccount !== 'ALL' && (
              <span className="px-2 py-0.5 rounded-lg bg-lime-400/15 border border-lime-400/30 text-lime-300 flex items-center gap-1">
                <span>Account: {filterAccount}</span>
                <button onClick={() => setFilterAccount('ALL')} className="hover:text-white font-bold">✕</button>
              </span>
            )}

            {filterRecurring !== 'ALL' && (
              <span className="px-2 py-0.5 rounded-lg bg-lime-400/15 border border-lime-400/30 text-lime-300 flex items-center gap-1">
                <span>{filterRecurring === 'RECURRING' ? 'Recurring' : 'One-time'}</span>
                <button onClick={() => setFilterRecurring('ALL')} className="hover:text-white font-bold">✕</button>
              </span>
            )}

            <button
              onClick={resetAllFilters}
              className="text-emerald-400 underline hover:text-white ml-auto font-bold cursor-pointer"
            >
              Reset all filters
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
              <th className="px-4 py-2.5">Description & Remarks</th>
              <th className="px-4 py-2.5">Category & Subcategory</th>
              <th className="px-4 py-2.5">Type & Account</th>
              <th className="px-4 py-2.5 text-right">Amount</th>
              <th className="px-4 py-2.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-emerald-500/10">
            {filteredTransactions.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-emerald-300/60">
                  <div className="text-3xl mb-2">🔍</div>
                  <div className="text-sm font-bold text-white mb-1">No transactions match your search & filter criteria</div>
                  <div className="text-xs text-emerald-400/70 mb-3">Try adjusting your search terms, date range, or amount filters.</div>
                  <button
                    onClick={resetAllFilters}
                    className="px-3 py-1.5 rounded-lg bg-lime-400/20 text-lime-300 font-bold border border-lime-400/30 hover:bg-lime-400/30 text-xs"
                  >
                    Reset All Filters
                  </button>
                </td>
              </tr>
            ) : (
              filteredTransactions.map((t) => {
                const isIncome = t.type === WealthType.INCOME || t.transactionType === 'Income';
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
                      <td className="px-3 py-2 space-y-1">
                        <input
                          type="text"
                          value={editBuffer.description}
                          onChange={(e) => setEditBuffer({ ...editBuffer, description: e.target.value })}
                          className="w-full bg-[#061f12] border border-lime-400 px-1.5 py-1 rounded text-white text-xs font-bold"
                          placeholder="Description"
                        />
                        <input
                          type="text"
                          value={editBuffer.remarks || ''}
                          onChange={(e) => setEditBuffer({ ...editBuffer, remarks: e.target.value })}
                          className="w-full bg-[#061f12] border border-emerald-500/40 px-1.5 py-0.5 rounded text-emerald-300 text-[11px]"
                          placeholder="Remarks (optional)"
                        />
                      </td>
                      <td className="px-3 py-2 space-y-1">
                        <select
                          value={editBuffer.category || editBuffer.kakeiboCategory || ''}
                          onChange={(e) => setEditBuffer({ ...editBuffer, category: e.target.value })}
                          className="w-full bg-[#061f12] border border-lime-400 px-1.5 py-1 rounded text-white text-xs"
                        >
                          {availableCategories.map(c => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                        </select>
                        <input
                          type="text"
                          value={editBuffer.subcategory || ''}
                          onChange={(e) => setEditBuffer({ ...editBuffer, subcategory: e.target.value })}
                          className="w-full bg-[#061f12] border border-emerald-500/40 px-1.5 py-0.5 rounded text-white text-[11px]"
                          placeholder="Subcategory (optional)"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <select
                          value={editBuffer.transactionType || editBuffer.type}
                          onChange={(e) => setEditBuffer({ ...editBuffer, type: e.target.value as any, transactionType: e.target.value as any })}
                          className="w-full bg-[#061f12] border border-lime-400 px-1.5 py-1 rounded text-white text-xs"
                        >
                          <option value="Expense">Expense</option>
                          <option value="Income">Income</option>
                          <option value="Transfer">Transfer</option>
                          <option value="Savings Contribution">Savings</option>
                          <option value="Debt Payment">Debt</option>
                          <option value="Investment Contribution">Investment</option>
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
                    <td className="px-4 py-2.5 text-emerald-300/70 font-mono whitespace-nowrap text-[11px]">
                      {new Date(t.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-white text-xs">{t.description}</span>
                        {t.isRecurring && (
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-900 border border-emerald-500/30 text-lime-300 font-medium">
                            🔁 Recurring
                          </span>
                        )}
                      </div>
                      {t.remarks && (
                        <div className="text-[10px] text-emerald-400/70 italic mt-0.5 truncate max-w-xs">
                          "{t.remarks}"
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="flex flex-col">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-500/20 text-[10px] font-bold text-emerald-200 w-fit">
                          <span>{CATEGORY_ICONS[t.category || t.kakeiboCategory || ''] || '🏷️'}</span>
                          <span>{t.category || t.kakeiboCategory || 'General'}</span>
                        </span>
                        {t.subcategory && (
                          <span className="text-[10px] text-emerald-400/80 pl-1">› {t.subcategory}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-2.5 text-emerald-300/80 font-medium">
                      <div className="text-[11px] font-semibold">{t.transactionType || t.type}</div>
                      {t.account && (
                        <div className="text-[10px] text-emerald-400/60 flex items-center gap-1">
                          <span>💳</span>
                          <span>{t.account}</span>
                        </div>
                      )}
                    </td>
                    <td className={`px-4 py-2.5 text-right font-black text-xs ${isIncome ? 'text-lime-400' : 'text-white'}`}>
                      {isIncome ? '+' : '-'}₹{t.amount.toLocaleString('en-IN')}
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

      {/* Mobile Transaction List (Expandable Cards) */}
      <div className="md:hidden space-y-2">
        {filteredTransactions.length === 0 ? (
          <div className="glass-card p-8 rounded-xl text-center text-emerald-300/60 text-xs">
            <div className="text-2xl mb-1">🔍</div>
            <div className="font-bold text-white mb-1">No matching transactions</div>
            <div className="text-emerald-400/70 mb-3">Adjust your filters to see results.</div>
            <button
              onClick={resetAllFilters}
              className="px-3 py-1 rounded bg-lime-400/20 text-lime-300 text-xs font-bold"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          filteredTransactions.map((t) => {
            const isIncome = t.type === WealthType.INCOME || t.transactionType === 'Income';
            const isExpanded = expandedRowId === t.id;
            const icon = CATEGORY_ICONS[t.category || t.kakeiboCategory || ''] || '💳';

            return (
              <div
                key={t.id}
                onClick={() => setExpandedRowId(isExpanded ? null : t.id)}
                className="glass-card p-3 rounded-xl border border-emerald-500/20 space-y-2 cursor-pointer transition-all active:scale-[0.99]"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="text-base">{icon}</span>
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-white truncate flex items-center gap-1.5">
                        <span>{t.description}</span>
                        {t.isRecurring && <span className="text-[9px] text-lime-400">🔁</span>}
                      </div>
                      <div className="text-[10px] text-emerald-300/60">
                        {new Date(t.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} • {t.category || t.kakeiboCategory || t.type}
                        {t.subcategory && ` › ${t.subcategory}`}
                      </div>
                    </div>
                  </div>
                  <div className={`text-xs font-black ${isIncome ? 'text-lime-400' : 'text-white'}`}>
                    {isIncome ? '+' : '-'}₹{t.amount.toLocaleString('en-IN')}
                  </div>
                </div>

                {/* Progressive Disclosure Expansion */}
                {isExpanded && (
                  <div className="pt-2 border-t border-emerald-500/15 text-xs animate-in fade-in duration-150 space-y-2">
                    <div className="grid grid-cols-2 gap-1 text-[10px] text-emerald-300/80">
                      <div><span className="text-emerald-400/60 font-semibold">Type:</span> {t.transactionType || t.type}</div>
                      <div><span className="text-emerald-400/60 font-semibold">Account:</span> {t.account || 'Primary'}</div>
                      {t.paymentMethod && <div><span className="text-emerald-400/60 font-semibold">Method:</span> {t.paymentMethod}</div>}
                      <div><span className="text-emerald-400/60 font-semibold">Schedule:</span> {t.isRecurring ? 'Recurring' : 'One-time'}</div>
                    </div>
                    {t.remarks && (
                      <div className="text-[10px] text-emerald-200/90 italic bg-emerald-950/60 p-1.5 rounded-lg border border-emerald-500/20">
                        "{t.remarks}"
                      </div>
                    )}
                    <div className="flex items-center justify-end gap-2 pt-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          const newDesc = prompt('Edit description:', t.description);
                          if (newDesc) onUpdateTransaction({ ...t, description: newDesc });
                        }}
                        className="px-2.5 py-1 rounded-lg bg-emerald-900 border border-emerald-500/30 text-emerald-300 text-[10px] font-bold"
                      >
                        Edit Name
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          const newAmt = prompt('Edit amount (₹):', String(t.amount));
                          if (newAmt && !isNaN(Number(newAmt))) onUpdateTransaction({ ...t, amount: Number(newAmt) });
                        }}
                        className="px-2.5 py-1 rounded-lg bg-emerald-900 border border-emerald-500/30 text-emerald-300 text-[10px] font-bold"
                      >
                        Edit Amount
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm(`Delete transaction "${t.description}"?`)) {
                            onDeleteTransaction(t.id);
                          }
                        }}
                        className="px-2.5 py-1 rounded-lg bg-rose-950 border border-rose-500/30 text-rose-300 text-[10px] font-bold"
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
