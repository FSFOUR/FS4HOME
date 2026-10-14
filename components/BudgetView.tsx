import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { 
  AppState, 
  KakeiboCategory, 
  WealthType, 
  BudgetCategory, 
  BudgetSubcategory, 
  MonthlyBudgetPlan, 
  RecurringExpenseItem,
  AutofillMemoryItem
} from '../types';
import { 
  DEFAULT_MONTHLY_BUDGET, 
  DEFAULT_BUDGET_CATEGORIES, 
  getOrCreateMonthlyPlan, 
  calculateBudgetSummary, 
  calculateMonthlyEquivalent,
  DEFAULT_AUTOFILL_ITEMS
} from '../services/budgetService';
import MonthlySpendingChart from './MonthlySpendingChart';

interface BudgetViewProps {
  state: AppState;
  onUpdateTarget?: (val: number) => void;
  onUpdateMonthlyBudgetPlan?: (monthKey: string, plan: MonthlyBudgetPlan) => void;
  onUpdateMasterCategories?: (cats: BudgetCategory[]) => void;
  onAddTransaction?: (t: any) => void;
  onUpdateRecurringExpense?: (item: RecurringExpenseItem) => void;
  onDeleteRecurringExpense?: (id: string) => void;
  onAddRecurringExpense?: (item: Omit<RecurringExpenseItem, 'id'>) => void;
  onDeleteAutofillItem?: (id: string) => void;
  onShowToast?: (msg: string) => void;
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export const BudgetView: React.FC<BudgetViewProps> = ({ 
  state, 
  onUpdateTarget,
  onUpdateMonthlyBudgetPlan,
  onUpdateMasterCategories,
  onAddTransaction,
  onUpdateRecurringExpense,
  onDeleteRecurringExpense,
  onAddRecurringExpense,
  onDeleteAutofillItem,
  onShowToast
}) => {
  const now = new Date();
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth()); // 0-11
  const [activeTab, setActiveTab] = useState<'budget' | 'recurring' | 'memory' | 'kakeibo'>('budget');
  
  // Category management modals / state
  const [editingBudgetLimit, setEditingBudgetLimit] = useState(false);
  const [tempBudgetLimit, setTempBudgetLimit] = useState('20000');
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const [isCopyConfirmOpen, setIsCopyConfirmOpen] = useState(false);
  
  // New Category / Subcategory Inline Addition
  const [addingSubcatForCatId, setAddingSubcatForCatId] = useState<string | null>(null);
  const [newSubcatName, setNewSubcatName] = useState('');
  const [newSubcatAmount, setNewSubcatAmount] = useState('1000');

  const [isAddingNewCategory, setIsAddingNewCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryIcon, setNewCategoryIcon] = useState('🏷️');
  const [newCategoryIsSavings, setNewCategoryIsSavings] = useState(false);

  // Mark Recurring as Paid Modal
  const [payingRecurringItem, setPayingRecurringItem] = useState<RecurringExpenseItem | null>(null);
  const [payAmount, setPayAmount] = useState('');
  const [payDate, setPayDate] = useState(() => new Date().toISOString().split('T')[0]);

  // Current Month Key "YYYY-MM"
  const currentMonthKey = useMemo(() => {
    return `${selectedYear}-${(selectedMonth + 1).toString().padStart(2, '0')}`;
  }, [selectedYear, selectedMonth]);

  // Previous Month Key
  const prevMonthKey = useMemo(() => {
    let prevM = selectedMonth - 1;
    let prevY = selectedYear;
    if (prevM < 0) {
      prevM = 11;
      prevY -= 1;
    }
    return `${prevY}-${(prevM + 1).toString().padStart(2, '0')}`;
  }, [selectedYear, selectedMonth]);

  // Get current monthly plan
  const currentPlan = useMemo(() => {
    return getOrCreateMonthlyPlan(
      state.monthlyBudgetPlans, 
      state.customBudgetCategories, 
      currentMonthKey
    );
  }, [state.monthlyBudgetPlans, state.customBudgetCategories, currentMonthKey]);

  // Calculate detailed summary
  const summary = useMemo(() => {
    return calculateBudgetSummary(currentPlan, state.transactions || [], currentMonthKey);
  }, [currentPlan, state.transactions, currentMonthKey]);

  // Helper to persist plan updates
  const savePlan = (updatedPlan: MonthlyBudgetPlan) => {
    if (onUpdateMonthlyBudgetPlan) {
      onUpdateMonthlyBudgetPlan(currentMonthKey, updatedPlan);
    }
    // Also sync master categories structure
    if (onUpdateMasterCategories) {
      onUpdateMasterCategories(updatedPlan.categories);
    }
  };

  // Month Navigation Handlers
  const handlePrevMonth = () => {
    if (selectedMonth === 0) {
      setSelectedMonth(11);
      setSelectedYear(prev => prev - 1);
    } else {
      setSelectedMonth(prev => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonth === 11) {
      setSelectedMonth(0);
      setSelectedYear(prev => prev + 1);
    } else {
      setSelectedMonth(prev => prev + 1);
    }
  };

  const handleCurrentMonth = () => {
    setSelectedMonth(now.getMonth());
    setSelectedYear(now.getFullYear());
  };

  // Copy Previous Month's Budget
  const handleCopyPrevMonth = () => {
    const prevPlan = getOrCreateMonthlyPlan(
      state.monthlyBudgetPlans,
      state.customBudgetCategories,
      prevMonthKey
    );

    // Deep clone categories with their planned amounts only (no transactions copied!)
    const clonedCategories: BudgetCategory[] = JSON.parse(JSON.stringify(prevPlan.categories));
    const newPlan: MonthlyBudgetPlan = {
      monthKey: currentMonthKey,
      totalMonthlyBudget: prevPlan.totalMonthlyBudget,
      categories: clonedCategories,
    };

    savePlan(newPlan);
    setIsCopyConfirmOpen(false);
    if (onShowToast) onShowToast(`Budget allocations copied from ${MONTH_NAMES[parseInt(prevMonthKey.split('-')[1]) - 1]} ✓`);
  };

  // Reset Allocations
  const handleResetAllocations = () => {
    const defaultCloned: BudgetCategory[] = JSON.parse(JSON.stringify(DEFAULT_BUDGET_CATEGORIES));
    const newPlan: MonthlyBudgetPlan = {
      monthKey: currentMonthKey,
      totalMonthlyBudget: DEFAULT_MONTHLY_BUDGET,
      categories: defaultCloned,
    };
    savePlan(newPlan);
    setIsResetConfirmOpen(false);
    if (onShowToast) onShowToast('Budget allocations reset to default starter template ✓');
  };

  // Save Total Monthly Budget limit
  const handleSaveBudgetLimit = () => {
    const val = parseFloat(tempBudgetLimit);
    if (!isNaN(val) && val > 0) {
      const updated = { ...currentPlan, totalMonthlyBudget: val };
      savePlan(updated);
      setEditingBudgetLimit(false);
      if (onShowToast) onShowToast(`Monthly budget set to ₹${val.toLocaleString()} ✓`);
    }
  };

  // Inline Planned Amount Change
  const handleSubcategoryPlannedChange = (catId: string, subId: string, newAmount: number) => {
    const updatedCategories = currentPlan.categories.map(cat => {
      if (cat.id === catId) {
        return {
          ...cat,
          subcategories: cat.subcategories.map(sub => {
            if (sub.id === subId) {
              return { ...sub, plannedAmount: Math.max(0, newAmount) };
            }
            return sub;
          })
        };
      }
      return cat;
    });

    savePlan({ ...currentPlan, categories: updatedCategories });
  };

  // Add new subcategory to a category
  const handleAddSubcategory = (catId: string) => {
    if (!newSubcatName.trim()) return;
    const amountVal = parseFloat(newSubcatAmount) || 0;

    const updatedCategories = currentPlan.categories.map(cat => {
      if (cat.id === catId) {
        const newSub: BudgetSubcategory = {
          id: `sub-${crypto.randomUUID().slice(0, 8)}`,
          name: newSubcatName.trim(),
          plannedAmount: amountVal,
          order: cat.subcategories.length + 1,
        };
        return {
          ...cat,
          subcategories: [...cat.subcategories, newSub]
        };
      }
      return cat;
    });

    savePlan({ ...currentPlan, categories: updatedCategories });
    setNewSubcatName('');
    setNewSubcatAmount('1000');
    setAddingSubcatForCatId(null);
    if (onShowToast) onShowToast(`Added budget item "${newSubcatName.trim()}" ✓`);
  };

  // Add brand new category
  const handleAddCategory = () => {
    if (!newCategoryName.trim()) return;

    const newCat: BudgetCategory = {
      id: `cat-${crypto.randomUUID().slice(0, 8)}`,
      name: newCategoryName.trim(),
      icon: newCategoryIcon || '🏷️',
      isSavings: newCategoryIsSavings,
      order: currentPlan.categories.length + 1,
      subcategories: [
        { id: `sub-${crypto.randomUUID().slice(0, 8)}`, name: 'General', plannedAmount: 1000, order: 1 }
      ]
    };

    savePlan({ ...currentPlan, categories: [...currentPlan.categories, newCat] });
    setNewCategoryName('');
    setIsAddingNewCategory(false);
    if (onShowToast) onShowToast(`Added category "${newCategoryName.trim()}" ✓`);
  };

  // Archive / Delete category
  const handleToggleArchiveCategory = (catId: string) => {
    const updatedCategories = currentPlan.categories.map(c => 
      c.id === catId ? { ...c, archived: !c.archived } : c
    );
    savePlan({ ...currentPlan, categories: updatedCategories });
    if (onShowToast) onShowToast('Category updated ✓');
  };

  // Archive / Delete subcategory
  const handleDeleteSubcategory = (catId: string, subId: string) => {
    const updatedCategories = currentPlan.categories.map(c => {
      if (c.id === catId) {
        return {
          ...c,
          subcategories: c.subcategories.filter(s => s.id !== subId)
        };
      }
      return c;
    });
    savePlan({ ...currentPlan, categories: updatedCategories });
    if (onShowToast) onShowToast('Budget item removed ✓');
  };

  // Recurring stats
  const recurringItems = useMemo(() => {
    return state.recurringExpenses || [];
  }, [state.recurringExpenses]);

  const recurringSummary = useMemo(() => {
    let monthlyEquiv = 0;
    let overdueCount = 0;
    let upcomingCount = 0;
    const todayStr = new Date().toISOString().split('T')[0];

    recurringItems.forEach(item => {
      if (item.status === 'Active') {
        monthlyEquiv += calculateMonthlyEquivalent(item.expectedAmount, item.frequency);
        if (item.nextDueDate < todayStr) {
          overdueCount++;
        } else {
          upcomingCount++;
        }
      }
    });

    return {
      monthlyEquiv,
      annualEquiv: monthlyEquiv * 12,
      activeCount: recurringItems.filter(i => i.status === 'Active').length,
      overdueCount,
      upcomingCount
    };
  }, [recurringItems]);

  // Mark Recurring Item as Paid
  const handleConfirmPayRecurring = () => {
    if (!payingRecurringItem) return;
    const amt = parseFloat(payAmount) || payingRecurringItem.expectedAmount;

    // 1. Record transaction
    if (onAddTransaction) {
      onAddTransaction({
        amount: amt,
        description: payingRecurringItem.name,
        type: WealthType.EXPENSE,
        transactionType: 'Expense',
        category: payingRecurringItem.category,
        subcategory: payingRecurringItem.subcategory,
        date: payDate,
        account: payingRecurringItem.account || 'Bank Account (Primary)',
        paymentMethod: payingRecurringItem.paymentMethod || 'UPI',
        remarks: `Recurring bill payment (${payingRecurringItem.frequency})`,
        isRecurring: true,
        recurringScheduleId: payingRecurringItem.id
      });
    }

    // 2. Advance next due date based on frequency
    if (onUpdateRecurringExpense) {
      const nextDue = new Date(payingRecurringItem.nextDueDate);
      switch (payingRecurringItem.frequency) {
        case 'Weekly':
          nextDue.setDate(nextDue.getDate() + 7);
          break;
        case 'Every 2 weeks':
          nextDue.setDate(nextDue.getDate() + 14);
          break;
        case 'Monthly':
          nextDue.setMonth(nextDue.getMonth() + 1);
          break;
        case 'Every 2 months':
          nextDue.setMonth(nextDue.getMonth() + 2);
          break;
        case 'Quarterly':
          nextDue.setMonth(nextDue.getMonth() + 3);
          break;
        case 'Every 6 months':
          nextDue.setMonth(nextDue.getMonth() + 6);
          break;
        case 'Yearly':
          nextDue.setFullYear(nextDue.getFullYear() + 1);
          break;
        default:
          nextDue.setMonth(nextDue.getMonth() + 1);
      }

      onUpdateRecurringExpense({
        ...payingRecurringItem,
        lastPaidDate: payDate,
        nextDueDate: nextDue.toISOString().split('T')[0]
      });
    }

    setPayingRecurringItem(null);
    if (onShowToast) onShowToast(`Marked "${payingRecurringItem.name}" paid: ₹${amt.toLocaleString()} ✓`);
  };

  // Kakeibo legacy stats
  const kakeiboStats = useMemo(() => {
    const monthTx = (state.transactions || []).filter(t => {
      const d = new Date(t.date);
      return d.getMonth() === selectedMonth && d.getFullYear() === selectedYear;
    });

    const income = monthTx
      .filter(t => t.type === WealthType.INCOME || t.transactionType === 'Income')
      .reduce((acc, t) => acc + (t.amount || 0), 0);

    const expenses = monthTx
      .filter(t => (t.type === WealthType.EXPENSE || t.transactionType === 'Expense') && t.transactionType !== 'Transfer')
      .reduce((acc, t) => acc + (t.amount || 0), 0);

    return { income, expenses };
  }, [state.transactions, selectedMonth, selectedYear]);

  // Real monthly Kakeibo breakdown for selected month
  const kakeiboCategorySpending = useMemo(() => {
    const breakdown: Record<string, number> = {
      [KakeiboCategory.NEEDS]: 0,
      [KakeiboCategory.WANTS]: 0,
      [KakeiboCategory.CULTURE]: 0,
      [KakeiboCategory.UNEXPECTED]: 0,
    };
    (state.transactions || []).forEach(t => {
      const d = new Date(t.date);
      if (d.getMonth() === selectedMonth && d.getFullYear() === selectedYear) {
        if (t.type === WealthType.EXPENSE || t.transactionType === 'Expense') {
          if (t.kakeiboCategory && breakdown[t.kakeiboCategory] !== undefined) {
            breakdown[t.kakeiboCategory] += Number(t.amount || 0);
          } else {
            const cat = (t.category || '').toLowerCase();
            if (cat.includes('food') || cat.includes('util') || cat.includes('transport') || cat.includes('house') || cat.includes('edu') || cat.includes('scooter') || cat.includes('car')) {
              breakdown[KakeiboCategory.NEEDS] += Number(t.amount || 0);
            } else if (cat.includes('shop') || cat.includes('entertain') || cat.includes('lifestyle')) {
              breakdown[KakeiboCategory.WANTS] += Number(t.amount || 0);
            } else if (cat.includes('chitty') || cat.includes('saving') || cat.includes('culture') || cat.includes('book')) {
              breakdown[KakeiboCategory.CULTURE] += Number(t.amount || 0);
            } else {
              breakdown[KakeiboCategory.UNEXPECTED] += Number(t.amount || 0);
            }
          }
        }
      }
    });
    return breakdown;
  }, [state.transactions, selectedMonth, selectedYear]);

  return (
    <div className="space-y-4 max-w-6xl mx-auto text-slate-100 animate-in fade-in duration-200 pb-20">
      {/* TOP HEADER: Month & Year Selector & Quick Actions */}
      <div className="bg-[#0b2416] border border-lime-500/25 rounded-3xl p-4 sm:p-5 shadow-xl glow-lime-sm">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xl">📊</span>
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                Monthly Budget Allocation
              </h1>
            </div>
            <p className="text-xs text-emerald-300/70 font-medium mt-0.5">
              Live budget variance tracking, category controls & recurring payment schedules
            </p>
          </div>

          {/* Month / Year Selector Bar */}
          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            <div className="flex items-center bg-[#05170d] border border-emerald-500/30 rounded-2xl p-1 shadow-inner">
              <button
                onClick={handlePrevMonth}
                className="p-1.5 text-emerald-300 hover:text-white hover:bg-emerald-900/40 rounded-xl transition-all"
                title="Previous Month"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                </svg>
              </button>

              <div className="flex items-center px-2 gap-1.5">
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(parseInt(e.target.value, 10))}
                  className="bg-transparent text-lime-400 font-black text-xs sm:text-sm outline-none cursor-pointer"
                >
                  {MONTH_NAMES.map((m, idx) => (
                    <option key={m} value={idx} className="bg-[#0b2416] text-white">
                      {m}
                    </option>
                  ))}
                </select>

                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(parseInt(e.target.value, 10))}
                  className="bg-transparent text-emerald-200 font-bold text-xs sm:text-sm outline-none cursor-pointer"
                >
                  {[2024, 2025, 2026, 2027, 2028].map(y => (
                    <option key={y} value={y} className="bg-[#0b2416] text-white">
                      {y}
                    </option>
                  ))}
                </select>
              </div>

              <button
                onClick={handleNextMonth}
                className="p-1.5 text-emerald-300 hover:text-white hover:bg-emerald-900/40 rounded-xl transition-all"
                title="Next Month"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>

            <button
              onClick={handleCurrentMonth}
              className="px-2.5 py-2 bg-emerald-950/80 hover:bg-emerald-900 text-lime-300 border border-lime-400/30 rounded-2xl text-xs font-bold transition-all"
            >
              Current Month
            </button>
          </div>
        </div>

        {/* COMPACT SUMMARY CARDS (SECTION 2: Monthly Budget Totals) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2.5 mt-4 pt-4 border-t border-emerald-500/20">
          {/* Card 1: Monthly Budget */}
          <div className="bg-[#05170d] p-3 rounded-2xl border border-emerald-500/25 relative group">
            <div className="text-[10px] font-black uppercase text-emerald-300/70 tracking-wider flex items-center justify-between">
              <span>Monthly Budget</span>
              <button
                onClick={() => {
                  setTempBudgetLimit(summary.totalMonthlyBudget.toString());
                  setEditingBudgetLimit(true);
                }}
                className="text-[9px] text-lime-400 hover:underline"
              >
                Edit
              </button>
            </div>
            <div className="text-lg sm:text-xl font-black text-white mt-1">
              ₹{summary.totalMonthlyBudget.toLocaleString()}
            </div>
            <div className="text-[9px] text-emerald-400/70">User configurable</div>
          </div>

          {/* Card 2: Planned Allocation */}
          <div className={`bg-[#05170d] p-3 rounded-2xl border ${
            summary.isOverallocated ? 'border-amber-500/50 bg-amber-950/20' : 'border-emerald-500/25'
          }`}>
            <div className="text-[10px] font-black uppercase text-emerald-300/70 tracking-wider">
              Planned Allocation
            </div>
            <div className="text-lg sm:text-xl font-black text-lime-300 mt-1">
              ₹{summary.totalPlannedAllocation.toLocaleString()}
            </div>
            <div className="text-[9px] text-emerald-400/70">
              {summary.isOverallocated ? '⚠️ Exceeds budget' : 'Within budget target'}
            </div>
          </div>

          {/* Card 3: Actual Expenses */}
          <div className="bg-[#05170d] p-3 rounded-2xl border border-emerald-500/25">
            <div className="text-[10px] font-black uppercase text-emerald-300/70 tracking-wider">
              Actual Expenses
            </div>
            <div className="text-lg sm:text-xl font-black text-rose-300 mt-1">
              ₹{summary.actualExpenses.toLocaleString()}
            </div>
            <div className="text-[9px] text-emerald-400/70">Eligible spending</div>
          </div>

          {/* Card 4: Remaining Allocation */}
          <div className="bg-[#05170d] p-3 rounded-2xl border border-emerald-500/25">
            <div className="text-[10px] font-black uppercase text-emerald-300/70 tracking-wider">
              Remaining Allocation
            </div>
            <div className={`text-lg sm:text-xl font-black mt-1 ${
              summary.remainingAllocation >= 0 ? 'text-emerald-300' : 'text-rose-400'
            }`}>
              ₹{summary.remainingAllocation.toLocaleString()}
            </div>
            <div className="text-[9px] text-emerald-400/70">Planned - actual spent</div>
          </div>

          {/* Card 5: Unallocated Budget */}
          <div className="bg-[#05170d] p-3 rounded-2xl border border-emerald-500/25">
            <div className="text-[10px] font-black uppercase text-emerald-300/70 tracking-wider">
              Unallocated Budget
            </div>
            <div className={`text-lg sm:text-xl font-black mt-1 ${
              summary.unallocatedBudget >= 0 ? 'text-sky-300' : 'text-amber-400'
            }`}>
              ₹{summary.unallocatedBudget.toLocaleString()}
            </div>
            <div className="text-[9px] text-emerald-400/70">Buffer available</div>
          </div>

          {/* Card 6: Savings Allocation */}
          <div className="bg-[#05170d] p-3 rounded-2xl border border-emerald-500/25">
            <div className="text-[10px] font-black uppercase text-emerald-300/70 tracking-wider">
              Savings Allocation
            </div>
            <div className="text-lg sm:text-xl font-black text-amber-300 mt-1">
              ₹{summary.savingsPlanned.toLocaleString()}
            </div>
            <div className="text-[9px] text-emerald-400/70">Chitty & Savings</div>
          </div>
        </div>

        {/* Warning if Planned Allocation exceeds Monthly Budget */}
        {summary.isOverallocated && (
          <div className="mt-3 px-3.5 py-2.5 bg-amber-950/80 border border-amber-500/50 rounded-2xl flex items-center justify-between text-amber-200 text-xs font-bold">
            <div className="flex items-center gap-2">
              <span className="text-base">⚠️</span>
              <span>
                Planned allocations (₹{summary.totalPlannedAllocation.toLocaleString()}) exceed your monthly budget (₹{summary.totalMonthlyBudget.toLocaleString()}) by ₹{summary.overallocatedAmount.toLocaleString()}.
              </span>
            </div>
            <span className="text-[10px] text-amber-300 bg-amber-900/60 px-2 py-0.5 rounded-lg border border-amber-400/30">
              Adjust Planned
            </span>
          </div>
        )}
      </div>

      {/* MODULE TABS: Budget Table | Recurring Schedules | Memory Manager | Kakeibo Framework */}
      <div className="flex items-center gap-1.5 p-1 bg-[#0b2416] rounded-2xl border border-emerald-500/20 overflow-x-auto no-scrollbar">
        <button
          onClick={() => setActiveTab('budget')}
          className={`flex-1 min-w-[120px] py-2 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'budget'
              ? 'bg-lime-400 text-emerald-950 shadow-md glow-lime-sm'
              : 'text-emerald-300/70 hover:text-white hover:bg-emerald-900/30'
          }`}
        >
          <span>📑</span>
          <span>Budget Table</span>
        </button>

        <button
          onClick={() => setActiveTab('recurring')}
          className={`flex-1 min-w-[140px] py-2 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'recurring'
              ? 'bg-lime-400 text-emerald-950 shadow-md glow-lime-sm'
              : 'text-emerald-300/70 hover:text-white hover:bg-emerald-900/30'
          }`}
        >
          <span>🔄</span>
          <span>Recurring & Bills</span>
          {recurringSummary.overdueCount > 0 && (
            <span className="bg-rose-500 text-white text-[9px] px-1.5 py-0.2 rounded-full font-bold">
              {recurringSummary.overdueCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('memory')}
          className={`flex-1 min-w-[130px] py-2 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'memory'
              ? 'bg-lime-400 text-emerald-950 shadow-md glow-lime-sm'
              : 'text-emerald-300/70 hover:text-white hover:bg-emerald-900/30'
          }`}
        >
          <span>⚡</span>
          <span>Autofill Memory</span>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'kakeibo'}
          onClick={() => setActiveTab('kakeibo')}
          className={`flex-1 min-w-[130px] py-2 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 ${
            activeTab === 'kakeibo'
              ? 'bg-lime-400 text-emerald-950 shadow-md glow-lime-sm ring-1 ring-lime-300'
              : 'text-emerald-300/70 hover:text-white hover:bg-emerald-900/40 border border-transparent hover:border-emerald-500/20'
          }`}
          title="Switch to 50/30/20 Kakeibo framework and historical spending trends"
        >
          <span className="text-sm">🧭</span>
          <span>50/30/20 Insights</span>
        </button>

        <Link
          to="/report"
          className="py-2 px-3 bg-emerald-950 hover:bg-emerald-900 text-lime-400 rounded-xl text-xs font-black border border-lime-400/30 transition-all flex items-center gap-1 shrink-0"
        >
          <span>📊</span>
          <span>Full Report →</span>
        </Link>
      </div>

      {/* TAB 1: BUDGET TABLE LAYOUT (SECTION 1) */}
      {activeTab === 'budget' && (
        <div className="bg-[#0b2416] border border-lime-500/25 rounded-3xl p-4 sm:p-5 shadow-xl glow-lime-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-emerald-500/20">
            <div>
              <h2 className="text-base sm:text-lg font-black text-white tracking-tight">
                {MONTH_NAMES[selectedMonth]} {selectedYear} Allocation Breakdown
              </h2>
              <p className="text-xs text-emerald-300/70">
                Tap any planned amount to adjust allocations. Changes update live across all reports.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsAddingNewCategory(true)}
                className="px-3 py-1.5 bg-emerald-900/60 hover:bg-emerald-800 text-lime-300 border border-lime-400/30 rounded-xl text-xs font-black transition-all flex items-center gap-1"
              >
                <span>+</span>
                <span>Add Category</span>
              </button>
            </div>
          </div>

          {/* Budget Table */}
          <div className="overflow-x-auto no-scrollbar rounded-2xl border border-emerald-500/20 bg-[#05170d]">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-emerald-500/20 bg-[#061e12] text-emerald-300/80 font-black uppercase text-[10px] tracking-wider">
                  <th className="py-3 px-3 sm:px-4">Category</th>
                  <th className="py-3 px-3 sm:px-4">Budget Item</th>
                  <th className="py-3 px-3 sm:px-4 text-right">Planned Amount</th>
                  <th className="py-3 px-3 sm:px-4 text-right">Actual Spent</th>
                  <th className="py-3 px-3 sm:px-4 text-right">Remaining</th>
                  <th className="py-3 px-3 sm:px-4 text-center">Status</th>
                  <th className="py-3 px-2 text-center w-12">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-emerald-500/10">
                {currentPlan.categories.map((cat) => {
                  if (cat.archived) return null;

                  return (
                    <React.Fragment key={cat.id}>
                      {/* Category Header Row */}
                      <tr className="bg-emerald-950/40 hover:bg-emerald-900/30 transition-colors">
                        <td colSpan={7} className="py-2.5 px-3 sm:px-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="text-base">{cat.icon || '🏷️'}</span>
                              <span className="font-black text-white text-xs sm:text-sm">
                                {cat.name}
                              </span>
                              {cat.isSavings && (
                                <span className="text-[9px] bg-amber-400/20 text-amber-300 border border-amber-400/30 px-1.5 py-0.2 rounded font-bold">
                                  Savings & Transfers (Separated)
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() => setAddingSubcatForCatId(cat.id)}
                                className="text-[10px] bg-emerald-900/50 hover:bg-emerald-800 text-lime-300 px-2 py-0.5 rounded-lg border border-lime-400/20 font-bold transition-all"
                              >
                                + Add Item
                              </button>
                              <button
                                onClick={() => handleToggleArchiveCategory(cat.id)}
                                className="text-[10px] text-emerald-400/70 hover:text-rose-300 px-1.5 py-0.5"
                                title="Archive category"
                              >
                                ✕
                              </button>
                            </div>
                          </div>
                        </td>
                      </tr>

                      {/* Subcategory Rows */}
                      {cat.subcategories.map((sub) => {
                        if (sub.archived) return null;

                        // Find corresponding item summary
                        const row = summary.items.find(
                          i => i.categoryId === cat.id && i.subcategoryId === sub.id
                        );
                        const spent = row ? row.actualSpent : 0;
                        const remaining = sub.plannedAmount - spent;
                        const percent = sub.plannedAmount > 0 
                          ? Math.min(100, Math.round((spent / sub.plannedAmount) * 100))
                          : spent > 0 ? 100 : 0;

                        return (
                          <tr key={sub.id} className="hover:bg-[#082214] transition-colors group">
                            <td className="py-2.5 px-3 sm:px-4 text-emerald-300/70 pl-6 sm:pl-8 text-[11px]">
                              {cat.name}
                            </td>
                            <td className="py-2.5 px-3 sm:px-4 font-bold text-white flex items-center gap-1.5">
                              <span>{sub.name}</span>
                            </td>
                            <td className="py-2.5 px-3 sm:px-4 text-right">
                              <div className="inline-flex items-center gap-1">
                                <span className="text-emerald-400/60 text-[10px]">₹</span>
                                <input
                                  type="number"
                                  value={sub.plannedAmount}
                                  onChange={(e) => {
                                    const val = parseFloat(e.target.value) || 0;
                                    handleSubcategoryPlannedChange(cat.id, sub.id, val);
                                  }}
                                  className="w-20 px-1.5 py-0.5 bg-[#0b2416] border border-emerald-500/30 rounded text-right text-lime-400 font-black text-xs outline-none focus:border-lime-400"
                                />
                              </div>
                            </td>
                            <td className="py-2.5 px-3 sm:px-4 text-right font-black text-slate-100">
                              ₹{spent.toLocaleString()}
                            </td>
                            <td className={`py-2.5 px-3 sm:px-4 text-right font-black ${
                              remaining >= 0 ? 'text-emerald-300' : 'text-rose-400'
                            }`}>
                              ₹{remaining.toLocaleString()}
                            </td>
                            <td className="py-2.5 px-3 sm:px-4 text-center">
                              <div className="flex flex-col items-center">
                                <span className={`text-[10px] font-black px-1.5 py-0.2 rounded-full border ${
                                  remaining < 0 
                                    ? 'bg-rose-950 text-rose-300 border-rose-500/40' 
                                    : percent >= 80 
                                    ? 'bg-amber-950 text-amber-300 border-amber-500/40' 
                                    : 'bg-emerald-950 text-emerald-300 border-emerald-500/30'
                                }`}>
                                  {remaining < 0 ? 'Overspent' : `${percent}%`}
                                </span>
                              </div>
                            </td>
                            <td className="py-2.5 px-2 text-center">
                              <button
                                onClick={() => handleDeleteSubcategory(cat.id, sub.id)}
                                className="text-emerald-500/50 hover:text-rose-400 text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                                title="Remove budget item"
                              >
                                ✕
                              </button>
                            </td>
                          </tr>
                        );
                      })}

                      {/* Inline Add Item Form for this Category */}
                      {addingSubcatForCatId === cat.id && (
                        <tr className="bg-[#0b2416]/90 border-t border-b border-lime-400/30">
                          <td colSpan={7} className="py-3 px-4">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-xs font-black text-lime-400">
                                Add Item to {cat.name}:
                              </span>
                              <input
                                type="text"
                                placeholder="Item name (e.g. Vegetables, Scooter)"
                                value={newSubcatName}
                                onChange={(e) => setNewSubcatName(e.target.value)}
                                className="px-2.5 py-1 bg-[#05170d] border border-emerald-500/40 rounded-xl text-xs text-white outline-none focus:border-lime-400 font-bold"
                                autoFocus
                              />
                              <div className="flex items-center gap-1">
                                <span className="text-xs text-lime-400 font-bold">₹</span>
                                <input
                                  type="number"
                                  placeholder="Planned amount"
                                  value={newSubcatAmount}
                                  onChange={(e) => setNewSubcatAmount(e.target.value)}
                                  className="w-24 px-2 py-1 bg-[#05170d] border border-emerald-500/40 rounded-xl text-xs text-lime-300 outline-none focus:border-lime-400 font-black"
                                />
                              </div>
                              <button
                                onClick={() => handleAddSubcategory(cat.id)}
                                className="px-3 py-1 bg-lime-400 hover:bg-lime-300 text-emerald-950 text-xs font-black rounded-xl shadow transition-all"
                              >
                                Save Item
                              </button>
                              <button
                                onClick={() => setAddingSubcatForCatId(null)}
                                className="px-2 py-1 text-emerald-400 hover:text-white text-xs font-bold"
                              >
                                Cancel
                              </button>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Add Category Modal / Inline Box */}
          {isAddingNewCategory && (
            <div className="p-4 bg-[#05170d] border border-lime-400/40 rounded-2xl space-y-3 animate-in fade-in duration-150">
              <div className="text-sm font-black text-white flex items-center justify-between">
                <span>Add Custom Budget Category</span>
                <button 
                  onClick={() => setIsAddingNewCategory(false)}
                  className="text-xs text-emerald-400 hover:text-white"
                >
                  ✕
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div>
                  <label className="block text-[10px] font-black uppercase text-emerald-300/70 tracking-widest mb-1">
                    Category Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Healthcare, Pets, Hobbies"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    className="w-full px-3 py-1.5 bg-[#0b2416] border border-emerald-500/30 rounded-xl text-white font-bold text-xs outline-none focus:border-lime-400"
                    autoFocus
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase text-emerald-300/70 tracking-widest mb-1">
                    Icon Emoji
                  </label>
                  <input
                    type="text"
                    value={newCategoryIcon}
                    onChange={(e) => setNewCategoryIcon(e.target.value)}
                    className="w-full px-3 py-1.5 bg-[#0b2416] border border-emerald-500/30 rounded-xl text-white font-bold text-xs outline-none focus:border-lime-400"
                  />
                </div>

                <div className="flex items-center pt-5">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={newCategoryIsSavings}
                      onChange={(e) => setNewCategoryIsSavings(e.target.checked)}
                      className="w-4 h-4 rounded text-lime-400 bg-emerald-950 border-emerald-500/40 accent-lime-400"
                    />
                    <span className="text-xs font-bold text-emerald-300">
                      Savings / Transfers category
                    </span>
                  </label>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <button
                  onClick={handleAddCategory}
                  className="px-4 py-1.5 bg-lime-400 hover:bg-lime-300 text-emerald-950 font-black text-xs rounded-xl shadow transition-all"
                >
                  Create Category
                </button>
                <button
                  onClick={() => setIsAddingNewCategory(false)}
                  className="px-3 py-1.5 text-emerald-400 hover:text-white font-bold text-xs"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: RECURRING EXPENSES & BILLS (SECTION 5) */}
      {activeTab === 'recurring' && (
        <div className="bg-[#0b2416] border border-lime-500/25 rounded-3xl p-4 sm:p-5 shadow-xl glow-lime-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-emerald-500/20">
            <div>
              <h2 className="text-base sm:text-lg font-black text-white tracking-tight flex items-center gap-2">
                <span>🔄</span>
                <span>Recurring Expenses & Bills Manager</span>
              </h2>
              <p className="text-xs text-emerald-300/70 font-medium">
                Tracks predictable scheduled payments with due dates, reminder preferences, and idempotency protection
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  if (onAddRecurringExpense) {
                    onAddRecurringExpense({
                      name: 'Monthly Scooter Fuel',
                      expectedAmount: 2500,
                      frequency: 'Monthly',
                      startDate: new Date().toISOString().split('T')[0],
                      nextDueDate: new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0],
                      category: 'Transport & Travel',
                      subcategory: 'Scooter',
                      account: 'UPI / GPay',
                      paymentMethod: 'UPI',
                      status: 'Active',
                    });
                    if (onShowToast) onShowToast('Added sample recurring bill ✓');
                  }
                }}
                className="px-3 py-1.5 bg-lime-400 hover:bg-lime-300 text-emerald-950 font-black text-xs rounded-xl shadow transition-all flex items-center gap-1"
              >
                <span>+</span>
                <span>New Schedule</span>
              </button>
            </div>
          </div>

          {/* Recurring Summary KPIs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="bg-[#05170d] p-3 rounded-2xl border border-emerald-500/20">
              <div className="text-[10px] font-black uppercase text-emerald-300/70 tracking-wider">
                Monthly Equivalent
              </div>
              <div className="text-lg font-black text-lime-300 mt-1">
                ₹{recurringSummary.monthlyEquiv.toLocaleString()}
              </div>
              <div className="text-[9px] text-emerald-400/70">Normalized recurring burn</div>
            </div>

            <div className="bg-[#05170d] p-3 rounded-2xl border border-emerald-500/20">
              <div className="text-[10px] font-black uppercase text-emerald-300/70 tracking-wider">
                Annual Expected
              </div>
              <div className="text-lg font-black text-white mt-1">
                ₹{recurringSummary.annualEquiv.toLocaleString()}
              </div>
              <div className="text-[9px] text-emerald-400/70">12-month projection</div>
            </div>

            <div className="bg-[#05170d] p-3 rounded-2xl border border-emerald-500/20">
              <div className="text-[10px] font-black uppercase text-emerald-300/70 tracking-wider">
                Overdue Payments
              </div>
              <div className={`text-lg font-black mt-1 ${
                recurringSummary.overdueCount > 0 ? 'text-rose-400' : 'text-emerald-300'
              }`}>
                {recurringSummary.overdueCount}
              </div>
              <div className="text-[9px] text-emerald-400/70">Past due date</div>
            </div>

            <div className="bg-[#05170d] p-3 rounded-2xl border border-emerald-500/20">
              <div className="text-[10px] font-black uppercase text-emerald-300/70 tracking-wider">
                Active Schedules
              </div>
              <div className="text-lg font-black text-sky-300 mt-1">
                {recurringSummary.activeCount}
              </div>
              <div className="text-[9px] text-emerald-400/70">Tracking schedules</div>
            </div>
          </div>

          {/* Recurring Items List */}
          {recurringItems.length === 0 ? (
            <div className="p-8 text-center bg-[#05170d] rounded-2xl border border-emerald-500/20 space-y-2">
              <div className="text-3xl">🔄</div>
              <div className="text-sm font-black text-white">No recurring schedules created yet</div>
              <p className="text-xs text-emerald-300/70 max-w-md mx-auto">
                Check the "☐ Recurring Expense" box when recording a transaction to automatically schedule repeats for petrol, electricity bills, school fees, or house rent.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto no-scrollbar rounded-2xl border border-emerald-500/20 bg-[#05170d]">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-emerald-500/20 bg-[#061e12] text-emerald-300/80 font-black uppercase text-[10px] tracking-wider">
                    <th className="py-2.5 px-3">Name / Merchant</th>
                    <th className="py-2.5 px-3">Category</th>
                    <th className="py-2.5 px-3">Frequency</th>
                    <th className="py-2.5 px-3">Expected Amount</th>
                    <th className="py-2.5 px-3">Next Due Date</th>
                    <th className="py-2.5 px-3 text-center">Status</th>
                    <th className="py-2.5 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-emerald-500/10">
                  {recurringItems.map(item => {
                    const isPast = item.nextDueDate < new Date().toISOString().split('T')[0];

                    return (
                      <tr key={item.id} className="hover:bg-[#082214] transition-colors">
                        <td className="py-3 px-3 font-black text-white">
                          <div>{item.name}</div>
                          {item.remarks && (
                            <div className="text-[10px] text-emerald-400/60 font-normal">{item.remarks}</div>
                          )}
                        </td>
                        <td className="py-3 px-3 text-emerald-300">
                          <span className="bg-emerald-950 px-2 py-0.5 rounded border border-emerald-500/20">
                            {item.category} {item.subcategory ? `› ${item.subcategory}` : ''}
                          </span>
                        </td>
                        <td className="py-3 px-3 font-bold text-white">
                          {item.frequency}
                        </td>
                        <td className="py-3 px-3 font-black text-lime-400">
                          ₹{item.expectedAmount.toLocaleString()}
                        </td>
                        <td className={`py-3 px-3 font-bold ${
                          isPast ? 'text-rose-400 font-black' : 'text-slate-200'
                        }`}>
                          {item.nextDueDate}
                          {isPast && <span className="ml-1 text-[9px] text-rose-400">(Overdue)</span>}
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                            item.status === 'Active' 
                              ? 'bg-emerald-950 text-emerald-300 border-emerald-500/30' 
                              : 'bg-slate-800 text-slate-300 border-slate-600'
                          }`}>
                            {item.status}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right space-x-1.5 whitespace-nowrap">
                          {item.status === 'Active' && (
                            <button
                              onClick={() => {
                                setPayingRecurringItem(item);
                                setPayAmount(item.expectedAmount.toString());
                              }}
                              className="px-2.5 py-1 bg-lime-400 hover:bg-lime-300 text-emerald-950 font-black text-[10px] rounded-lg transition-all"
                            >
                              ✓ Pay Now
                            </button>
                          )}
                          <button
                            onClick={() => {
                              if (onUpdateRecurringExpense) {
                                onUpdateRecurringExpense({
                                  ...item,
                                  status: item.status === 'Active' ? 'Paused' : 'Active'
                                });
                              }
                            }}
                            className="px-2 py-1 bg-emerald-900/60 hover:bg-emerald-800 text-emerald-200 text-[10px] rounded-lg border border-emerald-500/30 font-bold transition-all"
                          >
                            {item.status === 'Active' ? 'Pause' : 'Resume'}
                          </button>
                          <button
                            onClick={() => {
                              if (onDeleteRecurringExpense) onDeleteRecurringExpense(item.id);
                            }}
                            className="px-1.5 py-1 text-emerald-400/60 hover:text-rose-400 text-[10px] transition-colors"
                            title="Delete schedule"
                          >
                            ✕
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: AUTOFILL & REMARKS MEMORY (SECTION 4) */}
      {activeTab === 'memory' && (
        <div className="bg-[#0b2416] border border-lime-500/25 rounded-3xl p-4 sm:p-5 shadow-xl glow-lime-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-emerald-500/20">
            <div>
              <h2 className="text-base sm:text-lg font-black text-white tracking-tight flex items-center gap-2">
                <span>⚡</span>
                <span>Persistent Category & Remarks Memory</span>
              </h2>
              <p className="text-xs text-emerald-300/70 font-medium">
                Learns and auto-completes categories, subcategories, accounts, and remarks based on your usage frequency
              </p>
            </div>
          </div>

          <div className="overflow-x-auto no-scrollbar rounded-2xl border border-emerald-500/20 bg-[#05170d]">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-emerald-500/20 bg-[#061e12] text-emerald-300/80 font-black uppercase text-[10px] tracking-wider">
                  <th className="py-2.5 px-3">Description / Trigger</th>
                  <th className="py-2.5 px-3">Type</th>
                  <th className="py-2.5 px-3">Category & Subcategory</th>
                  <th className="py-2.5 px-3">Preferred Account</th>
                  <th className="py-2.5 px-3">Default Remarks</th>
                  <th className="py-2.5 px-3 text-center">Frequency</th>
                  <th className="py-2.5 px-2 text-center w-12">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-emerald-500/10">
                {(state.autofillMemory || DEFAULT_AUTOFILL_ITEMS).map(af => (
                  <tr key={af.id} className="hover:bg-[#082214] transition-colors">
                    <td className="py-2.5 px-3 font-black text-white">
                      {af.description}
                    </td>
                    <td className="py-2.5 px-3 text-emerald-300 font-bold">
                      {af.type}
                    </td>
                    <td className="py-2.5 px-3 text-slate-200">
                      <span className="bg-emerald-950 px-2 py-0.5 rounded border border-emerald-500/20">
                        {af.category} {af.subcategory ? `› ${af.subcategory}` : ''}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-emerald-300/80">
                      {af.account || '—'}
                    </td>
                    <td className="py-2.5 px-3 text-emerald-300/70 text-[11px]">
                      {af.remarks || '—'}
                    </td>
                    <td className="py-2.5 px-3 text-center font-bold text-lime-400">
                      {af.frequencyCount || 1}x
                    </td>
                    <td className="py-2.5 px-2 text-center">
                      <button
                        onClick={() => {
                          if (onDeleteAutofillItem) onDeleteAutofillItem(af.id);
                        }}
                        className="text-emerald-500/50 hover:text-rose-400 text-xs transition-colors"
                        title="Delete saved suggestion"
                      >
                        ✕
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: KAKEIBO 50/30/20 & TRENDS (Preserving all previous features!) */}
      {activeTab === 'kakeibo' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="bg-[#0b2416] border border-lime-500/25 rounded-3xl p-4 sm:p-5 shadow-xl glow-lime-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
              <div>
                <h2 className="text-base sm:text-lg font-black text-white tracking-tight flex items-center gap-2">
                  <span>🧭</span>
                  <span>Kakeibo 50/30/20 Strategic Framework</span>
                </h2>
                <p className="text-xs text-emerald-300/70 font-medium">
                  Traditional Japanese methodology categorizing cash flow into Needs (50%), Wants (30%), Culture (10%), and Emergency buffer (10%).
                </p>
              </div>
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-300/80 bg-[#05170d] px-3 py-1.5 rounded-xl border border-emerald-500/20 self-start sm:self-auto">
                <span>Month:</span>
                <span className="text-lime-300 font-black">{MONTH_NAMES[selectedMonth]} {selectedYear}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {[
                { 
                  category: KakeiboCategory.NEEDS,
                  label: 'Essential Needs', 
                  targetPct: 50, 
                  icon: '🏠', 
                  desc: 'Groceries, utilities, fuel, schooling, rent',
                  spent: kakeiboCategorySpending[KakeiboCategory.NEEDS] || 0,
                  targetAmount: Math.round(currentPlan.totalMonthlyBudget * 0.50),
                  color: 'text-sky-300',
                  bg: 'bg-sky-500/10 border-sky-500/25'
                },
                { 
                  category: KakeiboCategory.WANTS,
                  label: 'Lifestyle Wants', 
                  targetPct: 30, 
                  icon: '🛍️', 
                  desc: 'Dining out, shopping, leisure, entertainment',
                  spent: kakeiboCategorySpending[KakeiboCategory.WANTS] || 0,
                  targetAmount: Math.round(currentPlan.totalMonthlyBudget * 0.30),
                  color: 'text-amber-300',
                  bg: 'bg-amber-500/10 border-amber-500/25'
                },
                { 
                  category: KakeiboCategory.CULTURE,
                  label: 'Culture & Growth', 
                  targetPct: 10, 
                  icon: '📚', 
                  desc: 'Learning, books, charity, donations, personal growth',
                  spent: kakeiboCategorySpending[KakeiboCategory.CULTURE] || 0,
                  targetAmount: Math.round(currentPlan.totalMonthlyBudget * 0.10),
                  color: 'text-purple-300',
                  bg: 'bg-purple-500/10 border-purple-500/25'
                },
                { 
                  category: KakeiboCategory.UNEXPECTED,
                  label: 'Unexpected & Reserve', 
                  targetPct: 10, 
                  icon: '⚡', 
                  desc: 'Repairs, emergency buffer, unplanned expenses',
                  spent: kakeiboCategorySpending[KakeiboCategory.UNEXPECTED] || 0,
                  targetAmount: Math.round(currentPlan.totalMonthlyBudget * 0.10),
                  color: 'text-rose-300',
                  bg: 'bg-rose-500/10 border-rose-500/25'
                },
              ].map(k => {
                const totalSpent = summary.actualExpenses > 0 ? summary.actualExpenses : 1;
                const actualPct = Math.round((k.spent / totalSpent) * 100);
                const isOver = k.spent > k.targetAmount;

                return (
                  <div key={k.label} className={`p-3.5 rounded-2xl border ${k.bg} flex flex-col justify-between space-y-2`}>
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xl">{k.icon}</span>
                          <span className="text-xs font-black text-white">{k.label}</span>
                        </div>
                        <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-md ${
                          isOver ? 'bg-rose-950/80 text-rose-300 border border-rose-500/40' : 'bg-emerald-950/80 text-lime-300 border border-lime-400/30'
                        }`}>
                          {k.targetPct}%
                        </span>
                      </div>
                      <p className="text-[10px] text-emerald-400/70 line-clamp-1">{k.desc}</p>
                    </div>

                    <div className="pt-2 border-t border-emerald-500/15">
                      <div className="flex items-baseline justify-between">
                        <span className="text-[10px] text-emerald-300/70 font-semibold">Spent:</span>
                        <span className="text-sm font-black text-white">₹{k.spent.toLocaleString()}</span>
                      </div>
                      <div className="flex items-baseline justify-between text-[10px]">
                        <span className="text-emerald-400/60 font-semibold">Benchmark:</span>
                        <span className="text-emerald-300 font-bold">₹{k.targetAmount.toLocaleString()}</span>
                      </div>
                      
                      {/* Progress Bar */}
                      <div className="w-full bg-emerald-950/80 rounded-full h-1.5 mt-2 overflow-hidden border border-emerald-800/40">
                        <div 
                          className={`h-full rounded-full transition-all ${isOver ? 'bg-rose-400' : 'bg-lime-400'}`}
                          style={{ width: `${Math.min(100, Math.round((k.spent / (k.targetAmount || 1)) * 100))}%` }}
                        />
                      </div>
                      <div className="flex justify-between items-center text-[9px] mt-1">
                        <span className="text-emerald-400/70 font-medium">{actualPct}% of actual expenses</span>
                        <span className={isOver ? 'text-rose-400 font-bold' : 'text-lime-400 font-bold'}>
                          {isOver ? `+₹${(k.spent - k.targetAmount).toLocaleString()} over` : `₹${(k.targetAmount - k.spent).toLocaleString()} left`}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-[#0b2416] border border-lime-500/25 rounded-3xl p-4 sm:p-5 shadow-xl glow-lime-sm">
            <h3 className="text-sm font-black text-white mb-2 flex items-center gap-2">
              <span>📈</span>
              <span>Interactive Spending Trends & Benchmarks</span>
            </h3>
            <MonthlySpendingChart 
              transactions={state.transactions || []} 
              spending={kakeiboCategorySpending}
              targets={(state.monthlyTargets && (state.monthlyTargets[currentMonthKey] || state.monthlyTargets['current'])) || {}}
              monthlySavingsTarget={state.monthlySavingsTarget || 5000}
            />
          </div>
        </div>
      )}

      {/* MODAL: Edit Total Monthly Budget Limit */}
      {editingBudgetLimit && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[250] flex items-center justify-center p-4">
          <div className="bg-[#0b2416] border border-lime-400/40 rounded-3xl p-6 w-full max-w-sm shadow-2xl space-y-4">
            <h3 className="text-lg font-black text-white tracking-tight">Configure Monthly Budget</h3>
            <p className="text-xs text-emerald-300/70">
              Set your target monthly spending budget (default ₹20,000).
            </p>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-lime-400 text-xl font-black">₹</span>
              <input
                type="number"
                value={tempBudgetLimit}
                onChange={(e) => setTempBudgetLimit(e.target.value)}
                className="w-full pl-8 pr-4 py-2.5 bg-[#05170d] border border-emerald-500/40 rounded-2xl text-lime-400 font-black text-xl outline-none focus:border-lime-400"
                autoFocus
              />
            </div>
            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={handleSaveBudgetLimit}
                className="flex-1 py-2 bg-lime-400 hover:bg-lime-300 text-emerald-950 font-black text-xs rounded-xl shadow transition-all"
              >
                Save Budget Target
              </button>
              <button
                onClick={() => setEditingBudgetLimit(false)}
                className="px-3 py-2 text-emerald-400 hover:text-white font-bold text-xs"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Confirm Copy Previous Month Budget */}
      {isCopyConfirmOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[250] flex items-center justify-center p-4">
          <div className="bg-[#0b2416] border border-lime-400/40 rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-4">
            <h3 className="text-lg font-black text-white tracking-tight flex items-center gap-2">
              <span>📋</span>
              <span>Copy Previous Month's Budget?</span>
            </h3>
            <p className="text-xs text-emerald-200/80 leading-relaxed">
              This will copy the planned category amounts from <strong>{prevMonthKey}</strong> into <strong>{currentMonthKey}</strong>.
              <br /><br />
              <span className="text-lime-300 font-bold">Important note:</span> This copies planned allocations only. It will <strong>never duplicate past transactions</strong>.
            </p>
            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={handleCopyPrevMonth}
                className="flex-1 py-2.5 bg-lime-400 hover:bg-lime-300 text-emerald-950 font-black text-xs rounded-xl shadow transition-all"
              >
                Yes, Copy Allocations
              </button>
              <button
                onClick={() => setIsCopyConfirmOpen(false)}
                className="px-4 py-2.5 border border-emerald-500/30 text-emerald-300 hover:text-white font-bold text-xs rounded-xl"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Confirm Reset Allocations */}
      {isResetConfirmOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[250] flex items-center justify-center p-4">
          <div className="bg-[#0b2416] border border-rose-500/40 rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-4">
            <h3 className="text-lg font-black text-rose-300 tracking-tight flex items-center gap-2">
              <span>⚠️</span>
              <span>Reset Budget Allocations?</span>
            </h3>
            <p className="text-xs text-emerald-200/80 leading-relaxed">
              Are you sure you want to reset all planned category allocations for <strong>{MONTH_NAMES[selectedMonth]} {selectedYear}</strong> to the default ₹20,000 starter template?
              <br /><br />
              Your actual recorded transaction history will NOT be deleted.
            </p>
            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={handleResetAllocations}
                className="flex-1 py-2.5 bg-rose-500 hover:bg-rose-400 text-white font-black text-xs rounded-xl shadow transition-all"
              >
                Reset Allocation
              </button>
              <button
                onClick={() => setIsResetConfirmOpen(false)}
                className="px-4 py-2.5 border border-emerald-500/30 text-emerald-300 hover:text-white font-bold text-xs rounded-xl"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Mark Recurring Payment Paid */}
      {payingRecurringItem && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[250] flex items-center justify-center p-4">
          <div className="bg-[#0b2416] border border-lime-400/40 rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-4">
            <h3 className="text-lg font-black text-white tracking-tight flex items-center gap-2">
              <span>✓</span>
              <span>Record Recurring Payment</span>
            </h3>
            <p className="text-xs text-emerald-300/80">
              Confirm payment for <strong>{payingRecurringItem.name}</strong>. This records the transaction and automatically advances the next due date.
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-[10px] font-black uppercase text-emerald-300/70 tracking-widest mb-1">
                  Amount Paid (₹)
                </label>
                <input
                  type="number"
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  className="w-full px-3 py-2 bg-[#05170d] border border-emerald-500/30 rounded-xl text-lime-400 font-black text-lg outline-none focus:border-lime-400"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-emerald-300/70 tracking-widest mb-1">
                  Payment Date
                </label>
                <input
                  type="date"
                  value={payDate}
                  onChange={(e) => setPayDate(e.target.value)}
                  className="w-full px-3 py-2 bg-[#05170d] border border-emerald-500/30 rounded-xl text-white font-bold text-xs outline-none focus:border-lime-400"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={handleConfirmPayRecurring}
                className="flex-1 py-2.5 bg-lime-400 hover:bg-lime-300 text-emerald-950 font-black text-xs rounded-xl shadow transition-all"
              >
                Confirm Payment & Advance Due Date
              </button>
              <button
                onClick={() => setPayingRecurringItem(null)}
                className="px-4 py-2.5 border border-emerald-500/30 text-emerald-300 hover:text-white font-bold text-xs rounded-xl"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BudgetView;
