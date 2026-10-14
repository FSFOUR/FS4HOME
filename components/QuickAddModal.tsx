import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Transaction, 
  WealthType, 
  KakeiboCategory, 
  TransactionType, 
  AppState, 
  RecurringFrequency, 
  RecurringExpenseItem, 
  AutofillMemoryItem 
} from '../types';
import { 
  DEFAULT_BUDGET_CATEGORIES, 
  DEFAULT_AUTOFILL_ITEMS, 
  COMMON_ACCOUNTS, 
  COMMON_PAYMENT_METHODS, 
  INCOME_CATEGORIES 
} from '../services/budgetService';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  state?: AppState;
  onAddTransaction: (t: Omit<Transaction, 'id'>) => void;
  onAddRecurringExpense?: (item: Omit<RecurringExpenseItem, 'id'>) => void;
  onSaveAutofillMemory?: (item: Omit<AutofillMemoryItem, 'id'>) => void;
  onShowToast?: (msg: string) => void;
}

const TRANSACTION_TYPES: { type: TransactionType; label: string; icon: string; color: string }[] = [
  { type: 'Expense', label: 'Expense', icon: '💸', color: 'rose' },
  { type: 'Income', label: 'Income', icon: '💰', color: 'emerald' },
  { type: 'Transfer', label: 'Transfer', icon: '🔄', color: 'sky' },
  { type: 'Savings Contribution', label: 'Savings', icon: '🏦', color: 'amber' },
  { type: 'Debt Payment', label: 'Debt EMI', icon: '💳', color: 'purple' },
  { type: 'Investment Contribution', label: 'Invest', icon: '📈', color: 'teal' },
];

const RECURRING_FREQUENCIES: RecurringFrequency[] = [
  'Weekly',
  'Every 2 weeks',
  'Monthly',
  'Every 2 months',
  'Quarterly',
  'Every 6 months',
  'Yearly',
  'Custom',
];

export const QuickAddModal: React.FC<Props> = ({ 
  isOpen, 
  onClose, 
  state,
  onAddTransaction,
  onAddRecurringExpense,
  onSaveAutofillMemory,
  onShowToast
}) => {
  const [txType, setTxType] = useState<TransactionType>('Expense');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [subcategory, setSubcategory] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [account, setAccount] = useState('Bank Account (Primary)');
  const [toAccount, setToAccount] = useState('Cash in Hand');
  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [remarks, setRemarks] = useState('');
  
  // Recurring state
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurringFrequency, setRecurringFrequency] = useState<RecurringFrequency>('Monthly');
  const [recurringStartDate, setRecurringStartDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [recurringDueDate, setRecurringDueDate] = useState(() => {
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    return nextMonth.toISOString().split('T')[0];
  });
  const [recurringEndDate, setRecurringEndDate] = useState('');
  const [recurringMode, setRecurringMode] = useState<'both' | 'tx_only' | 'schedule_only'>('both');
  const [reminderPref, setReminderPref] = useState<'None' | 'On Due Date' | '1 day before' | '3 days before'>('On Due Date');

  // Autofill suggestions state
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [saveToMemory, setSaveToMemory] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const descInputRef = useRef<HTMLInputElement>(null);

  // Available categories based on state
  const budgetCategories = useMemo(() => {
    if (state?.customBudgetCategories && state.customBudgetCategories.length > 0) {
      return state.customBudgetCategories;
    }
    return DEFAULT_BUDGET_CATEGORIES;
  }, [state?.customBudgetCategories]);

  // Autofill memory list
  const autofillMemory = useMemo(() => {
    return state?.autofillMemory || DEFAULT_AUTOFILL_ITEMS;
  }, [state?.autofillMemory]);

  // Set default category when transaction type changes
  useEffect(() => {
    if (txType === 'Expense') {
      const firstCat = budgetCategories[0];
      setCategory(firstCat ? firstCat.name : 'Food & Groceries');
      setSubcategory(firstCat?.subcategories[0]?.name || 'Vegetables');
    } else if (txType === 'Income') {
      setCategory('Income');
      setSubcategory(INCOME_CATEGORIES[0] || 'Salary');
    } else if (txType === 'Savings Contribution') {
      setCategory('Chitty / Savings');
      setSubcategory('Savings');
    } else if (txType === 'Debt Payment') {
      setCategory('Debt');
      setSubcategory('Credit Card EMI');
    } else if (txType === 'Investment Contribution') {
      setCategory('Investment');
      setSubcategory('Mutual Funds / Stocks');
    } else if (txType === 'Transfer') {
      setCategory('Internal Transfer');
      setSubcategory('Account to Account');
    }
  }, [txType, budgetCategories]);

  // Subcategories available for current selected category
  const availableSubcategories = useMemo(() => {
    if (txType === 'Income') {
      return INCOME_CATEGORIES;
    }
    const found = budgetCategories.find(c => c.name.toLowerCase() === category.toLowerCase());
    if (found) {
      return found.subcategories.filter(s => !s.archived).map(s => s.name);
    }
    return [];
  }, [category, budgetCategories, txType]);

  // Autofill matching suggestions based on description/merchant input
  const suggestions = useMemo(() => {
    const q = description.trim().toLowerCase();
    if (!q) {
      // Return top 4 most frequent items for current txType
      return autofillMemory
        .filter(m => m.type.toLowerCase() === txType.toLowerCase())
        .sort((a, b) => b.frequencyCount - a.frequencyCount)
        .slice(0, 4);
    }

    return autofillMemory
      .filter(item => {
        const matchType = item.type.toLowerCase() === txType.toLowerCase();
        const matchDesc = item.description.toLowerCase().includes(q);
        const matchSub = (item.subcategory || '').toLowerCase().includes(q);
        const matchCat = (item.category || '').toLowerCase().includes(q);
        const matchRemarks = (item.remarks || '').toLowerCase().includes(q);
        return matchType && (matchDesc || matchSub || matchCat || matchRemarks);
      })
      .sort((a, b) => {
        // Prioritize exact match or prefix match
        const aExact = a.description.toLowerCase() === q ? 2 : a.description.toLowerCase().startsWith(q) ? 1 : 0;
        const bExact = b.description.toLowerCase() === q ? 2 : b.description.toLowerCase().startsWith(q) ? 1 : 0;
        if (bExact !== aExact) return bExact - aExact;
        return b.frequencyCount - a.frequencyCount;
      })
      .slice(0, 6);
  }, [description, txType, autofillMemory]);

  // Apply autofill suggestion
  const applySuggestion = (item: AutofillMemoryItem) => {
    setDescription(item.description);
    if (item.category) setCategory(item.category);
    if (item.subcategory) setSubcategory(item.subcategory);
    if (item.account) setAccount(item.account);
    if (item.paymentMethod) setPaymentMethod(item.paymentMethod);
    if (item.remarks) setRemarks(item.remarks);
    setShowSuggestions(false);
  };

  // Add quick amount increments
  const handleAddAmount = (addVal: number) => {
    const current = parseFloat(amount) || 0;
    setAmount((current + addVal).toString());
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    const parsedAmount = parseFloat(amount);
    if (recurringMode !== 'schedule_only' && (!amount || isNaN(parsedAmount) || parsedAmount <= 0)) {
      setValidationError('Please enter a valid amount greater than ₹0');
      return;
    }

    if (!description.trim()) {
      setValidationError('Please enter a description or merchant name');
      return;
    }

    setIsSubmitting(true);

    try {
      // Map TransactionType to legacy WealthType for full backward compatibility
      let legacyType = WealthType.EXPENSE;
      if (txType === 'Income') legacyType = WealthType.INCOME;
      else if (txType === 'Transfer') legacyType = WealthType.ASSET;
      else if (txType === 'Savings Contribution') legacyType = WealthType.ASSET;
      else if (txType === 'Debt Payment') legacyType = WealthType.LIABILITY;
      else if (txType === 'Investment Contribution') legacyType = WealthType.ASSET;

      // Map to Kakeibo category if applicable
      let kakeiboCat = KakeiboCategory.NEEDS;
      const catLower = category.toLowerCase();
      if (catLower.includes('food') || catLower.includes('util') || catLower.includes('rent') || catLower.includes('grocer')) {
        kakeiboCat = KakeiboCategory.NEEDS;
      } else if (catLower.includes('shop') || catLower.includes('entert') || catLower.includes('dine') || catLower.includes('want')) {
        kakeiboCat = KakeiboCategory.WANTS;
      } else if (catLower.includes('edu') || catLower.includes('book') || catLower.includes('culture') || catLower.includes('learn')) {
        kakeiboCat = KakeiboCategory.CULTURE;
      } else if (catLower.includes('emerg') || catLower.includes('repair') || catLower.includes('unexpect')) {
        kakeiboCat = KakeiboCategory.UNEXPECTED;
      }

      const scheduleId = isRecurring ? crypto.randomUUID() : undefined;

      // 1. Record the actual transaction if mode is 'both' or 'tx_only'
      if (recurringMode !== 'schedule_only') {
        const newTransaction: Omit<Transaction, 'id'> = {
          amount: parsedAmount,
          description: description.trim(),
          type: legacyType,
          transactionType: txType,
          category: category || 'General',
          subcategory: subcategory || undefined,
          kakeiboCategory: kakeiboCat,
          account,
          paymentMethod,
          remarks: remarks.trim() || undefined,
          date: date || new Date().toISOString(),
          isRecurring,
          recurringScheduleId: scheduleId,
        };

        onAddTransaction(newTransaction);
      }

      // 2. Record recurring schedule if recurring is checked and mode is 'both' or 'schedule_only'
      if (isRecurring && recurringMode !== 'tx_only' && onAddRecurringExpense) {
        const recurringItem: Omit<RecurringExpenseItem, 'id'> = {
          name: description.trim(),
          expectedAmount: parsedAmount > 0 ? parsedAmount : (parseFloat(amount) || 0),
          frequency: recurringFrequency,
          startDate: recurringStartDate,
          nextDueDate: recurringDueDate,
          endDate: recurringEndDate || undefined,
          category: category || 'General',
          subcategory: subcategory || undefined,
          merchant: description.trim(),
          account,
          paymentMethod,
          remarks: remarks.trim() || undefined,
          reminderPreference: reminderPref,
          status: 'Active',
          lastPaidDate: recurringMode === 'both' ? date : undefined,
        };

        onAddRecurringExpense(recurringItem);
      }

      // 3. Save to Autofill Memory if enabled
      if (saveToMemory && onSaveAutofillMemory && description.trim()) {
        onSaveAutofillMemory({
          type: txType,
          description: description.trim(),
          category: category || 'General',
          subcategory: subcategory || undefined,
          account,
          paymentMethod,
          remarks: remarks.trim() || undefined,
          frequencyCount: 1,
          lastUsed: new Date().toISOString(),
          isShared: false,
        });
      }

      // Small success toast and reset
      if (onShowToast) {
        if (recurringMode === 'schedule_only') {
          onShowToast(`Recurring schedule for "${description.trim()}" created ✓`);
        } else {
          onShowToast(`Saved ${txType}: ₹${parsedAmount.toLocaleString()} (${category}) ✓`);
        }
      }

      // Keep user on the current page, close modal smoothly
      onClose();
      // Reset fields
      setAmount('');
      setDescription('');
      setRemarks('');
      setIsRecurring(false);
    } catch (err: any) {
      setValidationError(err?.message || 'Failed to save transaction. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[200] flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-[#0b2416] border border-lime-500/30 rounded-3xl p-4 sm:p-6 md:p-7 w-full max-w-lg shadow-2xl text-slate-100 glow-lime-sm relative max-h-[92vh] flex flex-col my-auto">
        {/* Close Button */}
        <button 
          onClick={onClose}
          type="button"
          className="absolute top-4 right-4 text-emerald-400 hover:text-white p-2 rounded-full hover:bg-emerald-900/50 transition-colors z-10"
          aria-label="Close modal"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-3 shrink-0">
          <div className="w-9 h-9 rounded-2xl bg-lime-400 text-emerald-950 font-black flex items-center justify-center text-lg shadow-md glow-lime-sm">
            +
          </div>
          <div>
            <h3 className="text-lg sm:text-xl font-black text-white tracking-tight">Add Transaction</h3>
            <p className="text-[11px] text-emerald-300/70 font-medium">Fast entry with category autofill & recurring schedules</p>
          </div>
        </div>

        {/* Transaction Type Segmented Control */}
        <div className="flex items-center gap-1 p-1 bg-[#05170d] rounded-2xl border border-emerald-500/20 mb-3 overflow-x-auto no-scrollbar shrink-0">
          {TRANSACTION_TYPES.map(t => {
            const isSelected = txType === t.type;
            return (
              <button
                key={t.type}
                type="button"
                onClick={() => {
                  setTxType(t.type);
                  setValidationError(null);
                }}
                className={`flex-1 min-w-[70px] py-1.5 px-2 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1 whitespace-nowrap ${
                  isSelected 
                    ? 'bg-lime-400 text-emerald-950 shadow-md glow-lime-sm' 
                    : 'text-emerald-300/70 hover:text-white hover:bg-emerald-900/30'
                }`}
              >
                <span>{t.icon}</span>
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>

        {/* Error Alert if temporary validation fails */}
        {validationError && (
          <div className="mb-3 px-3 py-2 bg-rose-950/80 border border-rose-500/50 rounded-xl text-rose-300 text-xs font-bold flex items-center gap-2">
            <span>⚠️</span>
            <span>{validationError}</span>
          </div>
        )}

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="space-y-3.5 overflow-y-auto pr-1 flex-1">
          {/* Amount Field with Quick Increments */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[10px] font-black uppercase text-emerald-300/80 tracking-widest">
                Amount <span className="text-lime-400">*</span>
              </label>
              <div className="flex items-center gap-1">
                {[100, 500, 1000, 2000].map(val => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => handleAddAmount(val)}
                    className="text-[10px] bg-emerald-900/60 hover:bg-emerald-800 text-lime-300 px-1.5 py-0.5 rounded-lg border border-lime-400/20 font-bold transition-all"
                  >
                    +{val}
                  </button>
                ))}
              </div>
            </div>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-lime-400 text-2xl font-black">₹</span>
              <input 
                type="number" 
                step="any"
                placeholder="0.00" 
                value={amount} 
                onChange={(e) => setAmount(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-[#05170d] border border-emerald-500/30 rounded-2xl text-lime-400 font-black text-2xl placeholder-emerald-900 outline-none focus:border-lime-400 focus:ring-1 focus:ring-lime-400 transition-all"
                required={recurringMode !== 'schedule_only'}
                autoFocus
              />
            </div>
          </div>

          {/* Description / Merchant with Autofill Suggestions Dropdown */}
          <div className="relative">
            <div className="flex items-center justify-between mb-1">
              <label className="text-[10px] font-black uppercase text-emerald-300/80 tracking-widest">
                Description / Merchant <span className="text-lime-400">*</span>
              </label>
              {suggestions.length > 0 && !showSuggestions && (
                <button
                  type="button"
                  onClick={() => setShowSuggestions(true)}
                  className="text-[10px] text-lime-400 hover:underline font-bold"
                >
                  ⚡ Suggested ({suggestions.length})
                </button>
              )}
            </div>
            <input 
              ref={descInputRef}
              type="text" 
              placeholder={txType === 'Income' ? 'e.g. Salary, Client payment, Bonus' : 'e.g. Petrol, Ration Shop, Electricity Bill'} 
              value={description} 
              onFocus={() => setShowSuggestions(true)}
              onChange={(e) => {
                setDescription(e.target.value);
                setShowSuggestions(true);
              }}
              className="w-full px-3.5 py-2.5 bg-[#05170d] border border-emerald-500/30 rounded-2xl text-white font-bold text-sm placeholder-emerald-800 outline-none focus:border-lime-400 focus:ring-1 focus:ring-lime-400 transition-all"
              required
            />

            {/* Suggestions Dropdown */}
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-[#061e12] border border-lime-400/40 rounded-2xl p-2 shadow-2xl z-50 backdrop-blur-xl animate-in zoom-in-95 duration-150">
                <div className="flex items-center justify-between px-2 py-1 border-b border-emerald-500/15 mb-1">
                  <span className="text-[9px] font-black uppercase text-lime-400/70 tracking-widest">
                    ⚡ Intelligent Autofill Suggestions
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowSuggestions(false)}
                    className="text-[10px] text-emerald-400 hover:text-white"
                  >
                    ✕ Close
                  </button>
                </div>
                <div className="max-h-48 overflow-y-auto space-y-1">
                  {suggestions.map(s => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => applySuggestion(s)}
                      className="w-full text-left p-2 rounded-xl hover:bg-emerald-900/60 transition-colors flex items-center justify-between group"
                    >
                      <div>
                        <div className="text-xs font-black text-white group-hover:text-lime-300">
                          {s.description}
                        </div>
                        <div className="text-[10px] text-emerald-400/70 flex items-center gap-1.5">
                          <span className="bg-emerald-950 px-1.5 py-0.2 rounded border border-emerald-500/20 font-semibold">{s.category}</span>
                          {s.subcategory && <span>› {s.subcategory}</span>}
                          {s.account && <span className="opacity-70">via {s.account}</span>}
                        </div>
                      </div>
                      <span className="text-[10px] text-lime-400 font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                        Apply ↵
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Category & Subcategory Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div>
              <label className="block text-[10px] font-black uppercase text-emerald-300/80 tracking-widest mb-1">
                Category
              </label>
              {txType === 'Expense' ? (
                <select 
                  value={category} 
                  onChange={(e) => {
                    const newCat = e.target.value;
                    setCategory(newCat);
                    const found = budgetCategories.find(c => c.name === newCat);
                    if (found && found.subcategories.length > 0) {
                      setSubcategory(found.subcategories[0].name);
                    }
                  }} 
                  className="w-full px-3 py-2 bg-[#05170d] border border-emerald-500/30 rounded-xl text-white font-bold text-xs outline-none focus:border-lime-400 transition-all"
                >
                  {budgetCategories.map(c => (
                    <option key={c.id} value={c.name} className="bg-[#0b2416]">
                      {c.icon || '🏷️'} {c.name} {c.isSavings ? '(Savings)' : ''}
                    </option>
                  ))}
                </select>
              ) : txType === 'Income' ? (
                <select 
                  value={category} 
                  onChange={(e) => setCategory(e.target.value)} 
                  className="w-full px-3 py-2 bg-[#05170d] border border-emerald-500/30 rounded-xl text-white font-bold text-xs outline-none focus:border-lime-400 transition-all"
                >
                  <option value="Income" className="bg-[#0b2416]">💰 Income</option>
                  <option value="Business Income" className="bg-[#0b2416]">🏢 Business Income</option>
                  <option value="Investments" className="bg-[#0b2416]">📈 Investments</option>
                </select>
              ) : (
                <input
                  type="text"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="Category"
                  className="w-full px-3 py-2 bg-[#05170d] border border-emerald-500/30 rounded-xl text-white font-bold text-xs outline-none focus:border-lime-400 transition-all"
                />
              )}
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase text-emerald-300/80 tracking-widest mb-1">
                Budget Item / Subcategory
              </label>
              {availableSubcategories.length > 0 ? (
                <select 
                  value={subcategory} 
                  onChange={(e) => setSubcategory(e.target.value)} 
                  className="w-full px-3 py-2 bg-[#05170d] border border-emerald-500/30 rounded-xl text-white font-bold text-xs outline-none focus:border-lime-400 transition-all"
                >
                  {availableSubcategories.map(sub => (
                    <option key={sub} value={sub} className="bg-[#0b2416]">
                      {sub}
                    </option>
                  ))}
                  <option value="Custom" className="bg-[#0b2416]">+ Other / Custom</option>
                </select>
              ) : (
                <input
                  type="text"
                  value={subcategory}
                  onChange={(e) => setSubcategory(e.target.value)}
                  placeholder="e.g. Scooter, Vegetables"
                  className="w-full px-3 py-2 bg-[#05170d] border border-emerald-500/30 rounded-xl text-white font-bold text-xs outline-none focus:border-lime-400 transition-all"
                />
              )}
            </div>
          </div>

          {/* Date & Account */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[10px] font-black uppercase text-emerald-300/80 tracking-widest">
                  Date
                </label>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setDate(new Date().toISOString().split('T')[0])}
                    className="text-[9px] text-lime-400 hover:underline font-bold"
                  >
                    Today
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const d = new Date();
                      d.setDate(d.getDate() - 1);
                      setDate(d.toISOString().split('T')[0]);
                    }}
                    className="text-[9px] text-emerald-400/80 hover:underline font-bold"
                  >
                    Yesterday
                  </button>
                </div>
              </div>
              <input 
                type="date" 
                value={date} 
                onChange={(e) => setDate(e.target.value)} 
                className="w-full px-3 py-2 bg-[#05170d] border border-emerald-500/30 rounded-xl text-white font-bold text-xs outline-none focus:border-lime-400 transition-all"
              />
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase text-emerald-300/80 tracking-widest mb-1">
                Account
              </label>
              <select 
                value={account} 
                onChange={(e) => setAccount(e.target.value)} 
                className="w-full px-3 py-2 bg-[#05170d] border border-emerald-500/30 rounded-xl text-white font-bold text-xs outline-none focus:border-lime-400 transition-all"
              >
                {COMMON_ACCOUNTS.map(acc => (
                  <option key={acc} value={acc} className="bg-[#0b2416]">{acc}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Payment Method & Remarks */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div>
              <label className="block text-[10px] font-black uppercase text-emerald-300/80 tracking-widest mb-1">
                Payment Method
              </label>
              <select 
                value={paymentMethod} 
                onChange={(e) => setPaymentMethod(e.target.value)} 
                className="w-full px-3 py-2 bg-[#05170d] border border-emerald-500/30 rounded-xl text-white font-bold text-xs outline-none focus:border-lime-400 transition-all"
              >
                {COMMON_PAYMENT_METHODS.map(pm => (
                  <option key={pm} value={pm} className="bg-[#0b2416]">{pm}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase text-emerald-300/80 tracking-widest mb-1">
                Remarks (Optional)
              </label>
              <input 
                type="text" 
                placeholder="e.g. Monthly scooter fuel" 
                value={remarks} 
                onChange={(e) => setRemarks(e.target.value)} 
                className="w-full px-3 py-2 bg-[#05170d] border border-emerald-500/30 rounded-xl text-white font-bold text-xs placeholder-emerald-800 outline-none focus:border-lime-400 transition-all"
              />
            </div>
          </div>

          {/* RECURRING EXPENSE SECTION */}
          <div className="pt-1">
            <div className="flex items-center justify-between p-2.5 bg-[#05170d] rounded-2xl border border-emerald-500/25">
              <label className="flex items-center gap-2.5 cursor-pointer select-none">
                <input 
                  type="checkbox" 
                  checked={isRecurring} 
                  onChange={(e) => setIsRecurring(e.target.checked)}
                  className="w-4 h-4 rounded text-lime-400 bg-emerald-950 border-emerald-500/40 focus:ring-0 focus:ring-offset-0 cursor-pointer accent-lime-400"
                />
                <span className="text-xs font-black text-white flex items-center gap-1.5">
                  <span>🔄</span>
                  <span>Recurring Expense / Schedule</span>
                </span>
              </label>
              <span className="text-[10px] text-emerald-400/80 font-medium">
                {isRecurring ? 'Schedule active' : 'Click to schedule repeats'}
              </span>
            </div>

            {/* Expanded Recurring Settings */}
            {isRecurring && (
              <div className="mt-2 p-3 bg-[#05170d]/90 border border-lime-400/30 rounded-2xl space-y-2.5 animate-in fade-in duration-200">
                {/* Recurring Options Selector */}
                <div className="flex flex-col gap-1 text-xs">
                  <span className="text-[10px] font-black uppercase text-lime-400/80 tracking-wider">
                    Scheduling Action:
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-1">
                    <button
                      type="button"
                      onClick={() => setRecurringMode('both')}
                      className={`px-2 py-1.5 rounded-xl text-[10px] font-bold text-left border transition-all ${
                        recurringMode === 'both' 
                          ? 'bg-lime-400 text-emerald-950 border-lime-400 font-black' 
                          : 'bg-emerald-950/40 text-emerald-300 border-emerald-500/20 hover:bg-emerald-900/40'
                      }`}
                    >
                      1. Record & schedule repeats
                    </button>
                    <button
                      type="button"
                      onClick={() => setRecurringMode('tx_only')}
                      className={`px-2 py-1.5 rounded-xl text-[10px] font-bold text-left border transition-all ${
                        recurringMode === 'tx_only' 
                          ? 'bg-lime-400 text-emerald-950 border-lime-400 font-black' 
                          : 'bg-emerald-950/40 text-emerald-300 border-emerald-500/20 hover:bg-emerald-900/40'
                      }`}
                    >
                      2. Record once only
                    </button>
                    <button
                      type="button"
                      onClick={() => setRecurringMode('schedule_only')}
                      className={`px-2 py-1.5 rounded-xl text-[10px] font-bold text-left border transition-all ${
                        recurringMode === 'schedule_only' 
                          ? 'bg-lime-400 text-emerald-950 border-lime-400 font-black' 
                          : 'bg-emerald-950/40 text-emerald-300 border-emerald-500/20 hover:bg-emerald-900/40'
                      }`}
                    >
                      3. Schedule only (no payment now)
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[9px] font-black uppercase text-emerald-300/70 tracking-widest mb-1">
                      Frequency
                    </label>
                    <select
                      value={recurringFrequency}
                      onChange={(e) => setRecurringFrequency(e.target.value as RecurringFrequency)}
                      className="w-full px-2.5 py-1.5 bg-[#0b2416] border border-emerald-500/30 rounded-xl text-white font-bold text-xs outline-none focus:border-lime-400"
                    >
                      {RECURRING_FREQUENCIES.map(f => (
                        <option key={f} value={f} className="bg-[#0b2416]">{f}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[9px] font-black uppercase text-emerald-300/70 tracking-widest mb-1">
                      Next Due Date
                    </label>
                    <input 
                      type="date"
                      value={recurringDueDate}
                      onChange={(e) => setRecurringDueDate(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-[#0b2416] border border-emerald-500/30 rounded-xl text-white font-bold text-xs outline-none focus:border-lime-400"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[9px] font-black uppercase text-emerald-300/70 tracking-widest mb-1">
                      Reminder
                    </label>
                    <select
                      value={reminderPref}
                      onChange={(e) => setReminderPref(e.target.value as any)}
                      className="w-full px-2.5 py-1.5 bg-[#0b2416] border border-emerald-500/30 rounded-xl text-white font-bold text-xs outline-none focus:border-lime-400"
                    >
                      <option value="None">No reminder</option>
                      <option value="On Due Date">On due date</option>
                      <option value="1 day before">1 day before</option>
                      <option value="3 days before">3 days before</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[9px] font-black uppercase text-emerald-300/70 tracking-widest mb-1">
                      End Date (Optional)
                    </label>
                    <input 
                      type="date"
                      value={recurringEndDate}
                      onChange={(e) => setRecurringEndDate(e.target.value)}
                      placeholder="Forever"
                      className="w-full px-2.5 py-1.5 bg-[#0b2416] border border-emerald-500/30 rounded-xl text-white font-bold text-xs outline-none focus:border-lime-400"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Persistent Autofill Memory Toggle */}
          <div className="flex items-center justify-between text-xs pt-1 border-t border-emerald-500/15">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input 
                type="checkbox"
                checked={saveToMemory}
                onChange={(e) => setSaveToMemory(e.target.checked)}
                className="w-3.5 h-3.5 rounded text-lime-400 bg-emerald-950 border-emerald-500/40 accent-lime-400"
              />
              <span className="text-[11px] text-emerald-300/80 font-medium">
                Save category & remarks to autofill memory
              </span>
            </label>
          </div>

          {/* Submit and Action Buttons */}
          <div className="pt-2 flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2.5 rounded-2xl border border-emerald-500/30 text-emerald-300 hover:text-white hover:bg-emerald-900/40 font-bold text-xs transition-all disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-2.5 rounded-2xl bg-lime-400 hover:bg-lime-300 text-emerald-950 font-black text-sm shadow-md glow-lime-sm transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-emerald-950" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                  </svg>
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <span>✓</span>
                  <span>
                    {recurringMode === 'schedule_only' 
                      ? 'Save Recurring Schedule' 
                      : `Save ${txType} (₹${amount || '0'})`}
                  </span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default QuickAddModal;
