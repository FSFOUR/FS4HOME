import React, { useState, useMemo } from 'react';
import { LoanRecord, LoanPayment, AppState, WealthType, Transaction } from '../../types';
import {
  calculateLoanSummary,
  calculateOverallLoanMetrics,
  recalculateLoanSchedule,
  formatINR,
  DEFAULT_LOAN_RECORDS,
  DEFAULT_LOAN_PAYMENTS,
  getTodayDateStr,
} from '../../services/loanService';
import { AddLoanModal } from './AddLoanModal';
import { RecordPaymentModal } from './RecordPaymentModal';
import { LoanDetailModal } from './LoanDetailModal';
import { DebtRepaymentTrajectoryChart } from './DebtRepaymentTrajectoryChart';
import { InstantAmortizationModal } from './InstantAmortizationModal';

interface LoanBorrowingManagerProps {
  state?: AppState;
  onUpdateState?: React.Dispatch<React.SetStateAction<AppState>>;
  onShowToast?: (msg: string) => void;
  onAddTransaction?: (tx: Omit<Transaction, 'id'>) => void;
  isPage?: boolean;
}

export const LoanBorrowingManager: React.FC<LoanBorrowingManagerProps> = ({
  state,
  onUpdateState,
  onShowToast,
  onAddTransaction,
  isPage = true,
}) => {
  // Safe extraction with default seed fallback
  const loans: LoanRecord[] = useMemo(() => {
    if (state?.loanRecords && state.loanRecords.length > 0) {
      return state.loanRecords;
    }
    return DEFAULT_LOAN_RECORDS;
  }, [state?.loanRecords]);

  const payments: LoanPayment[] = useMemo(() => {
    if (state?.loanPayments && state.loanPayments.length > 0) {
      return state.loanPayments;
    }
    return DEFAULT_LOAN_PAYMENTS;
  }, [state?.loanPayments]);

  // Tab State: 1. Calculator, 2. My Borrowings, 3. Money Lent, 4. EMI Schedule, 5. Repayment History
  const [activeTab, setActiveTab] = useState<'calculator' | 'borrowings' | 'lent' | 'schedule' | 'history'>('borrowings');

  // View Filter: All, Borrowed, Lent
  const [viewFilter, setViewFilter] = useState<'All' | 'Borrowed' | 'Lent'>('All');
  const [statusFilter, setStatusFilter] = useState<'Active' | 'Closed' | 'Archived' | 'All'>('Active');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<'outstanding' | 'dueDate' | 'party' | 'principal'>('outstanding');

  // Modals state
  const [isAddLoanOpen, setIsAddLoanOpen] = useState<boolean>(false);
  const [editingLoan, setEditingLoan] = useState<LoanRecord | null>(null);

  const [isRecordPaymentOpen, setIsRecordPaymentOpen] = useState<boolean>(false);
  const [preselectedLoanId, setPreselectedLoanId] = useState<string | undefined>(undefined);

  const [selectedDetailLoan, setSelectedDetailLoan] = useState<LoanRecord | null>(null);
  const [isAmortizationOpen, setIsAmortizationOpen] = useState<boolean>(false);

  // Existing Calculator State (Preserving original Loan EMI & Compound Growth calculators!)
  const [calcType, setCalcType] = useState<'emi' | 'compound'>('emi');
  const [calcLoanAmount, setCalcLoanAmount] = useState(500000);
  const [calcInterestRate, setCalcInterestRate] = useState(9.5);
  const [calcTenureYears, setCalcTenureYears] = useState(5);
  const [calcInitialInv, setCalcInitialInv] = useState(50000);
  const [calcMonthlyInv, setCalcMonthlyInv] = useState(5000);
  const [calcReturnRate, setCalcReturnRate] = useState(12);
  const [calcInvYears, setCalcInvYears] = useState(10);

  // EMI math
  const monthlyRate = calcInterestRate / (12 * 100);
  const totalMonths = calcTenureYears * 12;
  const calcEMI =
    monthlyRate > 0
      ? Math.round(
          (calcLoanAmount * monthlyRate * Math.pow(1 + monthlyRate, totalMonths)) /
            (Math.pow(1 + monthlyRate, totalMonths) - 1)
        )
      : Math.round(calcLoanAmount / totalMonths);
  const calcTotalPayment = calcEMI * totalMonths;
  const calcTotalInterest = Math.max(0, calcTotalPayment - calcLoanAmount);

  // Compound Math
  const r = calcReturnRate / 100 / 12;
  const n = calcInvYears * 12;
  const futureValueInitial = calcInitialInv * Math.pow(1 + r, n);
  const futureValueMonthly = calcMonthlyInv * ((Math.pow(1 + r, n) - 1) / r);
  const totalCorpus = Math.round(futureValueInitial + futureValueMonthly);
  const totalInvested = calcInitialInv + calcMonthlyInv * n;
  const wealthGained = Math.max(0, totalCorpus - totalInvested);

  // Calculate Overall top metrics
  const metrics = useMemo(() => {
    return calculateOverallLoanMetrics(loans, payments, viewFilter);
  }, [loans, payments, viewFilter]);

  // Filtered Loans for views
  const filteredLoans = useMemo(() => {
    return loans
      .filter((loan) => {
        // Tab-specific constraints
        if (activeTab === 'borrowings' && loan.type !== 'Borrowed') return false;
        if (activeTab === 'lent' && loan.type !== 'Lent') return false;

        // View filter
        if (viewFilter === 'Borrowed' && loan.type !== 'Borrowed') return false;
        if (viewFilter === 'Lent' && loan.type !== 'Lent') return false;

        // Status filter
        if (statusFilter !== 'All' && loan.status !== statusFilter) return false;

        // Search
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchParty = loan.partyName.toLowerCase().includes(q);
          const matchName = loan.name.toLowerCase().includes(q);
          const matchAccount = (loan.account || '').toLowerCase().includes(q);
          if (!matchParty && !matchName && !matchAccount) return false;
        }

        return true;
      })
      .sort((a, b) => {
        const sumA = calculateLoanSummary(a, payments);
        const sumB = calculateLoanSummary(b, payments);

        if (sortBy === 'outstanding') {
          return sumB.outstandingBalance - sumA.outstandingBalance;
        }
        if (sortBy === 'principal') {
          return b.principalAmount - a.principalAmount;
        }
        if (sortBy === 'party') {
          return a.partyName.localeCompare(b.partyName);
        }
        if (sortBy === 'dueDate') {
          const dueA = sumA.nextPayment?.dueDate || '9999-12-31';
          const dueB = sumB.nextPayment?.dueDate || '9999-12-31';
          return dueA.localeCompare(dueB);
        }
        return 0;
      });
  }, [loans, payments, activeTab, viewFilter, statusFilter, searchQuery, sortBy]);

  // Handlers for state updates
  const handleSaveLoan = (savedLoan: LoanRecord) => {
    if (onUpdateState) {
      onUpdateState((prev) => {
        const currentList = prev.loanRecords || DEFAULT_LOAN_RECORDS;
        const index = currentList.findIndex((l) => l.id === savedLoan.id);
        const updatedList =
          index >= 0
            ? currentList.map((l, i) => (i === index ? savedLoan : l))
            : [savedLoan, ...currentList];
        return {
          ...prev,
          loanRecords: updatedList,
          loanPayments: prev.loanPayments || DEFAULT_LOAN_PAYMENTS,
        };
      });
    }

    if (onShowToast) {
      onShowToast(`Loan record "${savedLoan.name}" saved successfully`);
    }

    if (selectedDetailLoan && selectedDetailLoan.id === savedLoan.id) {
      setSelectedDetailLoan(savedLoan);
    }
  };

  const handleSavePayment = (payment: LoanPayment, syncToLedger?: boolean) => {
    if (onUpdateState) {
      onUpdateState((prev) => {
        const currentPayments = prev.loanPayments || DEFAULT_LOAN_PAYMENTS;
        const updatedPayments = [payment, ...currentPayments];

        // Also update account balance if linked
        let updatedBalances = prev.accountBalances;
        if (payment.account && updatedBalances && updatedBalances[payment.account] !== undefined) {
          const delta = payment.type === 'Borrowed' ? -payment.amount : payment.amount;
          updatedBalances = {
            ...updatedBalances,
            [payment.account]: (updatedBalances[payment.account] || 0) + delta,
          };
        }

        return {
          ...prev,
          loanPayments: updatedPayments,
          loanRecords: prev.loanRecords || DEFAULT_LOAN_RECORDS,
          accountBalances: updatedBalances,
        };
      });
    }

    // Optional Ledger transaction sync
    if (syncToLedger && onAddTransaction) {
      onAddTransaction({
        date: payment.paymentDate,
        description: `Loan Payment: ${payment.partyName} (${payment.remarks || 'Installment'})`,
        amount: payment.amount,
        type: payment.type === 'Borrowed' ? WealthType.EXPENSE : WealthType.INCOME,
        transactionType: payment.type === 'Borrowed' ? 'Debt Payment' : 'Income',
        category: payment.type === 'Borrowed' ? 'Loan Repayment' : 'Loan Recovery',
        account: payment.account,
        paymentMethod: payment.paymentMethod,
        remarks: payment.receiptReference ? `Ref: ${payment.receiptReference}` : undefined,
        isRecurring: false,
      });
    }

    if (onShowToast) {
      onShowToast(`Recorded payment of ${formatINR(payment.amount)} to ${payment.partyName}`);
    }
  };

  const handleDeleteLoan = (loanId: string) => {
    if (onUpdateState) {
      onUpdateState((prev) => {
        const currentList = prev.loanRecords || DEFAULT_LOAN_RECORDS;
        return {
          ...prev,
          loanRecords: currentList.filter((l) => l.id !== loanId),
        };
      });
    }
    if (onShowToast) {
      onShowToast('Loan record deleted');
    }
  };

  const handleDeletePayment = (paymentId: string) => {
    if (onUpdateState) {
      onUpdateState((prev) => {
        const currentPayments = prev.loanPayments || DEFAULT_LOAN_PAYMENTS;
        return {
          ...prev,
          loanPayments: currentPayments.filter((p) => p.id !== paymentId),
        };
      });
    }
    if (onShowToast) {
      onShowToast('Payment deleted and balances adjusted');
    }
  };

  const handleToggleLoanStatus = (loanId: string, newStatus: 'Active' | 'Closed' | 'Archived') => {
    if (onUpdateState) {
      onUpdateState((prev) => {
        const currentList = prev.loanRecords || DEFAULT_LOAN_RECORDS;
        return {
          ...prev,
          loanRecords: currentList.map((l) => (l.id === loanId ? { ...l, status: newStatus } : l)),
        };
      });
    }
    if (onShowToast) {
      onShowToast(`Loan status updated to ${newStatus}`);
    }
    if (selectedDetailLoan && selectedDetailLoan.id === loanId) {
      setSelectedDetailLoan({ ...selectedDetailLoan, status: newStatus });
    }
  };

  // Convert current Calculator values to a new Loan record
  const handleConvertCalculatorToLoan = () => {
    const newDraftLoan: LoanRecord = {
      id: `LN-${Date.now().toString().slice(-4)}`,
      name: calcType === 'emi' ? 'Personal / Bank EMI Loan' : 'Target Growth Fund',
      type: 'Borrowed',
      partyName: 'Bank Loan',
      principalAmount: calcLoanAmount,
      interestType: 'Reducing Balance / EMI',
      interestRate: calcInterestRate,
      processingFee: 0,
      startDate: getTodayDateStr(),
      firstPaymentDate: getTodayDateStr(),
      frequency: 'Monthly',
      totalTenureMonths: calcTenureYears * 12,
      numberOfInstallments: calcTenureYears * 12,
      plannedInstallmentAmount: calcEMI,
      account: 'Bank Account (Primary)',
      paymentMethod: 'Auto Debit / ECS',
      remarks: 'Configured from Loan EMI Calculator',
      status: 'Active',
      schedule: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setEditingLoan(newDraftLoan);
    setIsAddLoanOpen(true);
  };

  // Global Schedule install list for Tab 4
  const allSchedules = useMemo(() => {
    const list: Array<{ loan: LoanRecord; installment: any }> = [];
    for (const loan of loans) {
      if (loan.status === 'Archived') continue;
      const sched = recalculateLoanSchedule(loan, payments);
      for (const inst of sched) {
        list.push({ loan, installment: inst });
      }
    }
    return list.sort((a, b) => a.installment.dueDate.localeCompare(b.installment.dueDate));
  }, [loans, payments]);

  const [scheduleStatusFilter, setScheduleStatusFilter] = useState<'All' | 'Overdue' | 'Pending' | 'Upcoming' | 'Paid'>('All');
  const [scheduleLoanIdFilter, setScheduleLoanIdFilter] = useState<string>('All');

  const filteredScheduleList = useMemo(() => {
    return allSchedules.filter(({ loan, installment }) => {
      if (scheduleLoanIdFilter !== 'All' && loan.id !== scheduleLoanIdFilter) return false;
      if (scheduleStatusFilter !== 'All' && installment.status !== scheduleStatusFilter) return false;
      return true;
    });
  }, [allSchedules, scheduleStatusFilter, scheduleLoanIdFilter]);

  return (
    <div className={`space-y-5 text-slate-100 ${isPage ? 'max-w-7xl mx-auto px-2 sm:px-4 py-2' : ''}`}>
      
      {/* Top Banner & Main Action Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-emerald-500/20 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-lime-400 glow-lime-sm" />
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Loan & Borrowing Manager
            </h1>
          </div>
          <p className="text-xs text-emerald-300/80 mt-0.5">
            Manage multiple independent borrowings, money lent, EMI repayments, and outstanding balances
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={() => {
              setEditingLoan(null);
              setIsAddLoanOpen(true);
            }}
            className="px-4 py-2 text-xs font-black text-emerald-950 bg-lime-400 hover:bg-lime-300 rounded-xl shadow-lg transition-colors flex items-center gap-1.5 active:scale-95"
          >
            <span>+ Add Loan / Borrowing</span>
          </button>

          <button
            onClick={() => {
              setPreselectedLoanId(undefined);
              setIsRecordPaymentOpen(true);
            }}
            className="px-3.5 py-2 text-xs font-bold text-slate-200 hover:text-white bg-emerald-950/70 hover:bg-emerald-900 border border-emerald-500/30 rounded-xl transition-colors active:scale-95"
          >
            <span>+ Record Payment</span>
          </button>

          <button
            onClick={() => setIsAmortizationOpen(true)}
            className="px-3.5 py-2 text-xs font-bold text-[#244A38] bg-[#F0F1E9] hover:bg-[#E9EEE5] border border-[#E1E5DC] rounded-xl transition-colors flex items-center gap-1.5 active:scale-95 shadow-xs"
            title="Instant Amortization Preview"
          >
            <span>⚡ Amortization</span>
          </button>
        </div>
      </div>

      {/* Perspective Switcher & 5 Compact Summary Cards */}
      <div className="space-y-3">
        {/* Switcher bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-[#061f12]/80 p-1.5 rounded-xl border border-emerald-500/20">
          <div className="flex items-center gap-1">
            <button
              onClick={() => setViewFilter('All')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
                viewFilter === 'All' ? 'bg-lime-400 text-emerald-950 font-black' : 'text-emerald-300/80 hover:text-white'
              }`}
            >
              All Loans ({loans.filter((l) => l.status !== 'Archived').length})
            </button>
            <button
              onClick={() => setViewFilter('Borrowed')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
                viewFilter === 'Borrowed' ? 'bg-rose-500 text-white font-black' : 'text-rose-300/80 hover:text-white'
              }`}
            >
              My Borrowings (I Owe)
            </button>
            <button
              onClick={() => setViewFilter('Lent')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
                viewFilter === 'Lent' ? 'bg-emerald-500 text-white font-black' : 'text-emerald-300/80 hover:text-white'
              }`}
            >
              Money Lent (Owed to Me)
            </button>
          </div>

          <div className="text-[11px] text-slate-400 pr-2">
            Net Balance:{' '}
            <strong className={`font-mono ${metrics.netOutstanding >= 0 ? 'text-lime-400' : 'text-rose-400'}`}>
              {formatINR(metrics.netOutstanding)}
            </strong>
          </div>
        </div>

        {/* 5 Compact Top Summary KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
          {/* 1. Total Outstanding */}
          <div className="p-3.5 rounded-xl bg-[#061f12] border border-emerald-500/20">
            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">
              Total Outstanding
            </div>
            <div className="text-xl sm:text-2xl font-black text-lime-400 tabular-nums">
              {viewFilter === 'Lent'
                ? formatINR(metrics.totalLentOutstanding)
                : viewFilter === 'Borrowed'
                ? formatINR(metrics.totalBorrowedOutstanding)
                : formatINR(metrics.totalBorrowedOutstanding + metrics.totalLentOutstanding)}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5 truncate">
              {viewFilter === 'All'
                ? `Owed: ${formatINR(metrics.totalBorrowedOutstanding)} · Lent: ${formatINR(metrics.totalLentOutstanding)}`
                : viewFilter === 'Borrowed'
                ? 'Total active liabilities'
                : 'Total active receivables'}
            </div>
          </div>

          {/* 2. Due This Month */}
          <div className="p-3.5 rounded-xl bg-[#061f12] border border-emerald-500/20">
            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">
              Due This Month
            </div>
            <div className="text-xl sm:text-2xl font-black text-white tabular-nums">
              {formatINR(metrics.dueThisMonth)}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">
              Scheduled this calendar month
            </div>
          </div>

          {/* 3. Total Paid / Recovered */}
          <div className="p-3.5 rounded-xl bg-[#061f12] border border-emerald-500/20">
            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">
              {viewFilter === 'Lent' ? 'Total Recovered' : 'Total Paid'}
            </div>
            <div className="text-xl sm:text-2xl font-black text-emerald-300 tabular-nums">
              {formatINR(metrics.totalPaidOrRecovered)}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">
              Confirmed settlement payments
            </div>
          </div>

          {/* 4. Overdue Payments */}
          <div className={`p-3.5 rounded-xl border ${
            metrics.overduePaymentsCount > 0 ? 'bg-rose-950/30 border-rose-500/40' : 'bg-[#061f12] border-emerald-500/20'
          }`}>
            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1 flex items-center justify-between">
              <span>Overdue Payments</span>
              {metrics.overduePaymentsCount > 0 && (
                <span className="w-2 h-2 rounded-full bg-rose-400 animate-pulse" />
              )}
            </div>
            <div className={`text-xl sm:text-2xl font-black tabular-nums ${
              metrics.overduePaymentsCount > 0 ? 'text-rose-400' : 'text-white'
            }`}>
              {metrics.overduePaymentsCount} {metrics.overduePaymentsCount === 1 ? 'Inst.' : 'Insts.'}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">
              {metrics.overdueAmount > 0 ? formatINR(metrics.overdueAmount) : 'No overdue payments'}
            </div>
          </div>

          {/* 5. Active Loans */}
          <div className="p-3.5 rounded-xl bg-[#061f12] border border-emerald-500/20 col-span-2 sm:col-span-1">
            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">
              Active Loans
            </div>
            <div className="text-xl sm:text-2xl font-black text-lime-300 tabular-nums">
              {metrics.activeLoansCount} of {metrics.totalLoansCount}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">
              Open accounts with remaining balance
            </div>
          </div>
        </div>
      </div>

      {/* Recharts Bar Chart: Outstanding Debt vs. Repayment Progress (Next 6 Months) */}
      <DebtRepaymentTrajectoryChart
        loans={loans}
        payments={payments}
        onAddLoanClick={() => {
          setEditingLoan(null);
          setIsAddLoanOpen(true);
        }}
      />

      {/* Main Compact Tabs (Matching Prompt Section 2 exactly) */}
      <div className="border-b border-emerald-500/20 flex flex-wrap gap-1 sm:gap-2 pt-2">
        <button
          onClick={() => setActiveTab('borrowings')}
          className={`px-3.5 py-2 rounded-t-xl text-xs font-bold transition-all border-b-2 flex items-center gap-1.5 ${
            activeTab === 'borrowings'
              ? 'border-lime-400 text-lime-400 bg-emerald-950/60 font-black'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <span>My Borrowings</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-rose-500/20 text-rose-300 font-mono">
            {loans.filter((l) => l.type === 'Borrowed' && l.status !== 'Archived').length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('lent')}
          className={`px-3.5 py-2 rounded-t-xl text-xs font-bold transition-all border-b-2 flex items-center gap-1.5 ${
            activeTab === 'lent'
              ? 'border-lime-400 text-lime-400 bg-emerald-950/60 font-black'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <span>Money Lent</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-lime-500/20 text-lime-300 font-mono">
            {loans.filter((l) => l.type === 'Lent' && l.status !== 'Archived').length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('schedule')}
          className={`px-3.5 py-2 rounded-t-xl text-xs font-bold transition-all border-b-2 ${
            activeTab === 'schedule'
              ? 'border-lime-400 text-lime-400 bg-emerald-950/60 font-black'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          EMI Schedule
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`px-3.5 py-2 rounded-t-xl text-xs font-bold transition-all border-b-2 flex items-center gap-1.5 ${
            activeTab === 'history'
              ? 'border-lime-400 text-lime-400 bg-emerald-950/60 font-black'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <span>Repayment History</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300 font-mono">
            {payments.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('calculator')}
          className={`px-3.5 py-2 rounded-t-xl text-xs font-bold transition-all border-b-2 flex items-center gap-1.5 ${
            activeTab === 'calculator'
              ? 'border-lime-400 text-lime-400 bg-emerald-950/60 font-black'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <span>Loan Calculator</span>
          <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-900/40 text-emerald-300">Tool</span>
        </button>
      </div>

      {/* Tab 1 & Tab 2: My Borrowings and Money Lent Views */}
      {(activeTab === 'borrowings' || activeTab === 'lent') && (
        <div className="space-y-4">
          
          {/* Search, Filter & Sort Controls */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#061f12]/60 p-3 rounded-xl border border-emerald-500/20">
            {/* Search Input */}
            <div className="relative flex-1 min-w-[200px]">
              <input
                type="text"
                placeholder="Search by party, loan name or account..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-[#04160c] border border-emerald-500/30 rounded-lg text-white text-xs outline-none focus:border-lime-400"
              />
              <span className="absolute left-2.5 top-2 text-slate-400 text-xs">🔍</span>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-2 text-xs text-slate-400 hover:text-white"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Filter & Sort Dropdowns */}
            <div className="flex items-center gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="px-2.5 py-1.5 bg-[#04160c] border border-emerald-500/30 rounded-lg text-white text-xs outline-none focus:border-lime-400"
              >
                <option value="Active">Active Loans</option>
                <option value="Closed">Closed Loans</option>
                <option value="Archived">Archived</option>
                <option value="All">All Statuses</option>
              </select>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-2.5 py-1.5 bg-[#04160c] border border-emerald-500/30 rounded-lg text-white text-xs outline-none focus:border-lime-400"
              >
                <option value="outstanding">Sort: Outstanding</option>
                <option value="dueDate">Sort: Next Due Date</option>
                <option value="party">Sort: Party (A-Z)</option>
                <option value="principal">Sort: Principal</option>
              </select>
            </div>
          </div>

          {/* Loans Grid / Cards */}
          {filteredLoans.length === 0 ? (
            <div className="p-12 text-center bg-[#061f12]/60 rounded-2xl border border-emerald-500/20 space-y-3">
              <div className="text-3xl">📋</div>
              <h3 className="text-base font-bold text-white">No loan records found</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                {searchQuery || statusFilter !== 'All'
                  ? 'No records match your search or filter criteria. Try resetting filters.'
                  : `You don't have any ${activeTab === 'borrowings' ? 'borrowings' : 'lent'} records yet. Create one now to track payments.`}
              </p>
              <button
                onClick={() => {
                  setEditingLoan(null);
                  setIsAddLoanOpen(true);
                }}
                className="px-4 py-2 text-xs font-black text-emerald-950 bg-lime-400 hover:bg-lime-300 rounded-xl transition-colors inline-block"
              >
                + Add {activeTab === 'borrowings' ? 'Borrowing' : 'Loan'} Record
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {filteredLoans.map((loan) => {
                const summary = calculateLoanSummary(loan, payments);
                const isBorrowed = loan.type === 'Borrowed';

                return (
                  <div
                    key={loan.id}
                    className="p-4 rounded-2xl bg-[#061f12] border border-emerald-500/25 hover:border-lime-400/50 transition-all shadow-md flex flex-col justify-between group"
                  >
                    <div>
                      {/* Card Header */}
                      <div className="flex items-start justify-between gap-2 mb-2.5">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono text-[10px] text-slate-400 font-bold">{loan.id}</span>
                            <span className="text-slate-600">·</span>
                            <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded font-mono ${
                              isBorrowed ? 'bg-rose-500/20 text-rose-300' : 'bg-lime-500/20 text-lime-300'
                            }`}>
                              {isBorrowed ? 'Borrowed' : 'Lent'}
                            </span>
                            <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                              loan.status === 'Active'
                                ? 'bg-emerald-500/20 text-emerald-300'
                                : loan.status === 'Closed'
                                ? 'bg-slate-700/40 text-slate-400'
                                : 'bg-amber-500/20 text-amber-300'
                            }`}>
                              {loan.status}
                            </span>
                          </div>
                          <h3 className="text-base font-black text-white group-hover:text-lime-300 transition-colors mt-0.5">
                            {loan.partyName}
                          </h3>
                          <p className="text-xs text-slate-400 truncate">{loan.name}</p>
                        </div>

                        <div className="text-right">
                          <span className="text-[10px] text-slate-400 uppercase font-bold block">Outstanding</span>
                          <span className="text-base font-black text-lime-400 tabular-nums">
                            {formatINR(summary.outstandingBalance)}
                          </span>
                        </div>
                      </div>

                      {/* Repayment Progress Bar */}
                      <div className="space-y-1 my-3 bg-[#03130a]/70 p-2.5 rounded-xl border border-emerald-500/15">
                        <div className="flex items-center justify-between text-[11px] font-bold">
                          <span className="text-slate-400">Repayment Progress:</span>
                          <span className="text-lime-300 font-mono">{summary.progressPercentage}%</span>
                        </div>
                        <div className="w-full bg-[#051a0e] rounded-full h-2 overflow-hidden border border-emerald-500/25">
                          <div
                            className="h-full bg-gradient-to-r from-emerald-500 to-lime-400 rounded-full transition-all duration-300"
                            style={{ width: `${summary.progressPercentage}%` }}
                          />
                        </div>
                        <div className="flex items-center justify-between text-[10px] text-slate-400 tabular-nums pt-0.5">
                          <span>Paid: <strong className="text-white font-mono">{formatINR(summary.totalPaid)}</strong></span>
                          <span>Payable: <strong className="text-white font-mono">{formatINR(summary.totalPayable)}</strong></span>
                        </div>
                      </div>

                      {/* Figures List */}
                      <div className="grid grid-cols-2 gap-2 text-xs py-1">
                        <div>
                          <span className="text-[10px] text-slate-400 block font-bold">Original Principal</span>
                          <span className="font-mono text-white">{formatINR(loan.principalAmount)}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 block font-bold">Interest / Model</span>
                          <span className="font-mono text-amber-300">
                            {loan.interestType === 'No Interest'
                              ? '0% (No Int.)'
                              : `${loan.interestRate}% ${loan.interestType.split(' ')[0]}`}
                          </span>
                        </div>
                      </div>

                      {/* Next Payment Banner */}
                      {summary.nextPayment && (
                        <div className={`mt-2.5 p-2 rounded-lg text-xs flex items-center justify-between ${
                          summary.nextPayment.status === 'Overdue'
                            ? 'bg-rose-950/40 text-rose-300 border border-rose-500/30'
                            : 'bg-emerald-950/40 text-emerald-300 border border-emerald-500/20'
                        }`}>
                          <div className="truncate pr-1">
                            <span className="text-[10px] text-slate-400 block">Next Payment</span>
                            <span className="font-bold tabular-nums">
                              {formatINR(summary.nextPayment.remainingAmount)} ({summary.nextPayment.dueDate})
                            </span>
                          </div>
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded font-mono shrink-0">
                            {summary.nextPayment.status}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="mt-4 pt-3 border-t border-emerald-500/20 flex items-center justify-between gap-2">
                      <button
                        onClick={() => setSelectedDetailLoan(loan)}
                        className="text-xs font-bold text-slate-300 hover:text-white bg-emerald-950/60 hover:bg-emerald-900 border border-emerald-500/30 px-2.5 py-1.5 rounded-lg transition-colors"
                      >
                        View Schedule
                      </button>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => {
                            setEditingLoan(loan);
                            setIsAddLoanOpen(true);
                          }}
                          className="text-xs font-bold text-slate-400 hover:text-white px-2 py-1 rounded hover:bg-emerald-900/50"
                        >
                          Edit
                        </button>

                        <button
                          onClick={() => {
                            setPreselectedLoanId(loan.id);
                            setIsRecordPaymentOpen(true);
                          }}
                          className="px-3 py-1.5 text-xs font-black text-emerald-950 bg-lime-400 hover:bg-lime-300 rounded-lg shadow-sm transition-colors"
                        >
                          + Pay
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab 3: EMI Repayment Schedule (Interactive Master Schedule Viewer) */}
      {activeTab === 'schedule' && (
        <div className="space-y-4">
          
          {/* Controls */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#061f12]/60 p-3 rounded-xl border border-emerald-500/20">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-emerald-300">Filter Schedule:</span>
              <div className="flex items-center gap-1">
                {(['All', 'Overdue', 'Pending', 'Upcoming', 'Paid'] as const).map((status) => (
                  <button
                    key={status}
                    onClick={() => setScheduleStatusFilter(status)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors ${
                      scheduleStatusFilter === status
                        ? 'bg-lime-400 text-emerald-950 font-black'
                        : 'bg-[#04160c] text-slate-300 hover:text-white'
                    }`}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-xs text-slate-400">Loan:</label>
              <select
                value={scheduleLoanIdFilter}
                onChange={(e) => setScheduleLoanIdFilter(e.target.value)}
                className="px-2.5 py-1.5 bg-[#04160c] border border-emerald-500/30 rounded-lg text-white text-xs outline-none focus:border-lime-400"
              >
                <option value="All">All Active Loans</option>
                {loans
                  .filter((l) => l.status !== 'Archived')
                  .map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.partyName} ({l.name})
                    </option>
                  ))}
              </select>
            </div>
          </div>

          {/* Master Schedule Table / Mobile Cards */}
          <div>
            {/* Mobile Card View (Screens under 768px / md:hidden) */}
            <div className="grid grid-cols-1 gap-3 md:hidden">
              {filteredScheduleList.length === 0 ? (
                <div className="p-6 text-center bg-white rounded-xl border border-slate-200 text-slate-500 text-xs">
                  No installments match the selected filter.
                </div>
              ) : (
                filteredScheduleList.map(({ loan, installment }) => {
                  const isPaid = installment.status === 'Paid';
                  const isOverdue = installment.status === 'Overdue';

                  return (
                    <div
                      key={`mob-${loan.id}-${installment.id}`}
                      className={`bg-white rounded-xl border p-3.5 shadow-xs transition-all ${
                        isOverdue ? 'border-rose-300 bg-rose-50/20' : 'border-slate-200'
                      }`}
                    >
                      <div className="flex items-start justify-between pb-2.5 border-b border-slate-100 mb-2.5">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900 text-xs">{loan.partyName}</span>
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded font-mono ${
                              loan.type === 'Borrowed' ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-800'
                            }`}>
                              {loan.type}
                            </span>
                          </div>
                          <span className="text-[11px] text-slate-500">{loan.name}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] font-bold text-slate-400 block uppercase">Inst #{installment.installmentNumber}</span>
                          <span className="text-xs font-mono font-bold text-slate-700">{installment.dueDate}</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs py-1.5 border-b border-slate-100 mb-2.5">
                        <div>
                          <span className="text-[10px] text-slate-500 block uppercase">Scheduled</span>
                          <span className="font-bold text-slate-900 font-mono">
                            {formatINR(installment.scheduledAmount + (installment.feesComponent || 0))}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] text-slate-500 block uppercase">Remaining</span>
                          <span className="font-bold text-slate-800 font-mono">{formatINR(installment.remainingAmount)}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-500 block">Principal: <span className="font-mono text-slate-700 font-medium">{formatINR(installment.principalComponent)}</span></span>
                          <span className="text-[10px] text-slate-500 block">Interest: <span className="font-mono text-amber-700 font-medium">{formatINR(installment.interestComponent)}</span></span>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] text-slate-500 block">Paid: <span className="font-mono text-emerald-700 font-bold">{formatINR(installment.amountPaid)}</span></span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-1">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                            isPaid
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              : isOverdue
                              ? 'bg-rose-100 text-rose-800 border border-rose-200'
                              : installment.status === 'Partially Paid'
                              ? 'bg-amber-100 text-amber-800 border border-amber-200'
                              : 'bg-slate-100 text-slate-700 border border-slate-200'
                          }`}
                        >
                          {installment.status}
                        </span>

                        {!isPaid ? (
                          <button
                            onClick={() => {
                              setPreselectedLoanId(loan.id);
                              setIsRecordPaymentOpen(true);
                            }}
                            className="px-3 py-1.5 text-[11px] font-bold text-white bg-[#244A38] hover:bg-[#1a382a] rounded-lg transition-colors shadow-xs"
                          >
                            Pay Now
                          </button>
                        ) : (
                          <span className="text-[11px] text-emerald-700 font-bold">✓ Settled</span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Desktop Table View (Screens >= 768px / hidden md:block) */}
            <div className="hidden md:block overflow-x-auto rounded-2xl border border-emerald-500/25 bg-[#061f12]">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-emerald-500/20 bg-[#03130a] text-slate-400 font-bold uppercase text-[10px]">
                    <th className="py-3 px-3">Party & Loan</th>
                    <th className="py-3 px-3">Type</th>
                    <th className="py-3 px-2">#</th>
                    <th className="py-3 px-3">Due Date</th>
                    <th className="py-3 px-3 text-right">Scheduled</th>
                    <th className="py-3 px-3 text-right">Principal</th>
                    <th className="py-3 px-3 text-right">Interest</th>
                    <th className="py-3 px-3 text-right">Paid</th>
                    <th className="py-3 px-3 text-right">Remaining</th>
                    <th className="py-3 px-3 text-center">Status</th>
                    <th className="py-3 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-emerald-500/10 tabular-nums">
                  {filteredScheduleList.length === 0 ? (
                    <tr>
                      <td colSpan={11} className="py-8 text-center text-slate-400">
                        No installments match the selected filter.
                      </td>
                    </tr>
                  ) : (
                    filteredScheduleList.map(({ loan, installment }) => {
                      const isPaid = installment.status === 'Paid';
                      const isOverdue = installment.status === 'Overdue';

                      return (
                        <tr
                          key={`${loan.id}-${installment.id}`}
                          className={`hover:bg-emerald-950/30 transition-colors ${
                            isOverdue ? 'bg-rose-950/20' : ''
                          }`}
                        >
                          <td className="py-2.5 px-3">
                            <span className="font-bold text-white block">{loan.partyName}</span>
                            <span className="text-[11px] text-slate-400">{loan.name}</span>
                          </td>
                          <td className="py-2.5 px-3">
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded font-mono ${
                              loan.type === 'Borrowed' ? 'bg-rose-500/20 text-rose-300' : 'bg-lime-500/20 text-lime-300'
                            }`}>
                              {loan.type}
                            </span>
                          </td>
                          <td className="py-2.5 px-2 font-mono font-bold text-slate-400">
                            {installment.installmentNumber}
                          </td>
                          <td className="py-2.5 px-3 font-mono text-white">
                            {installment.dueDate}
                          </td>
                          <td className="py-2.5 px-3 text-right font-bold text-white">
                            {formatINR(installment.scheduledAmount + (installment.feesComponent || 0))}
                          </td>
                          <td className="py-2.5 px-3 text-right text-slate-300">
                            {formatINR(installment.principalComponent)}
                          </td>
                          <td className="py-2.5 px-3 text-right text-amber-300">
                            {formatINR(installment.interestComponent)}
                          </td>
                          <td className="py-2.5 px-3 text-right font-bold text-lime-400">
                            {formatINR(installment.amountPaid)}
                          </td>
                          <td className="py-2.5 px-3 text-right font-bold text-slate-200">
                            {formatINR(installment.remainingAmount)}
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <span
                              className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                                isPaid
                                  ? 'bg-lime-400/20 text-lime-300 border border-lime-400/30'
                                  : isOverdue
                                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                                  : installment.status === 'Partially Paid'
                                  ? 'bg-amber-400/20 text-amber-300 border border-amber-400/30'
                                  : 'bg-slate-700/30 text-slate-300 border border-slate-600/40'
                              }`}
                            >
                              {installment.status}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            {!isPaid ? (
                              <button
                                onClick={() => {
                                  setPreselectedLoanId(loan.id);
                                  setIsRecordPaymentOpen(true);
                                }}
                                className="px-2 py-1 text-[10px] font-bold text-emerald-950 bg-lime-400 hover:bg-lime-300 rounded transition-colors"
                              >
                                Pay Now
                              </button>
                            ) : (
                              <span className="text-[10px] text-emerald-400 font-medium">✓ Settled</span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Repayment History Ledger */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-[#061f12]/60 p-3 rounded-xl border border-emerald-500/20">
            <div>
              <h3 className="text-xs font-black text-white uppercase tracking-wider">
                Chronological Payment Ledger
              </h3>
              <p className="text-[11px] text-slate-400">
                All confirmed loan payments, installment allocations, and settlement receipts
              </p>
            </div>
            <button
              onClick={() => {
                const headers = ['ID', 'Date', 'Party', 'Type', 'Amount', 'Principal', 'Interest', 'Fees', 'Method', 'Account', 'Ref', 'Remarks'];
                const rows = payments.map((p) => [
                  p.id,
                  p.paymentDate,
                  p.partyName,
                  p.type,
                  p.amount,
                  p.principalComponent,
                  p.interestComponent,
                  p.feesComponent,
                  p.paymentMethod,
                  p.account,
                  p.receiptReference || '',
                  p.remarks || '',
                ]);
                const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
                const encodedUri = encodeURI(csvContent);
                const link = document.createElement('a');
                link.setAttribute('href', encodedUri);
                link.setAttribute('download', `Loan_Repayment_Ledger_${getTodayDateStr()}.csv`);
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
              }}
              className="px-3 py-1.5 text-xs font-bold text-slate-200 hover:text-white bg-emerald-950/60 hover:bg-emerald-900 border border-emerald-500/30 rounded-lg transition-colors flex items-center gap-1"
            >
              <span>📥 Export CSV</span>
            </button>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-emerald-500/25 bg-[#061f12]">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-emerald-500/20 bg-[#03130a] text-slate-400 font-bold uppercase text-[10px]">
                  <th className="py-3 px-3">Date</th>
                  <th className="py-3 px-3">Party / Loan</th>
                  <th className="py-3 px-3">Type</th>
                  <th className="py-3 px-3 text-right">Amount (₹)</th>
                  <th className="py-3 px-3 text-right">Principal</th>
                  <th className="py-3 px-3 text-right">Interest</th>
                  <th className="py-3 px-3">Method</th>
                  <th className="py-3 px-3">Account</th>
                  <th className="py-3 px-3">Reference</th>
                  <th className="py-3 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-emerald-500/10 tabular-nums">
                {payments.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-8 text-center text-slate-400">
                      No payments recorded yet. Click "+ Record Payment" to log a repayment.
                    </td>
                  </tr>
                ) : (
                  payments.map((p) => {
                    const matchedLoan = loans.find((l) => l.id === p.loanId);
                    return (
                      <tr key={p.id} className="hover:bg-emerald-950/30 transition-colors">
                        <td className="py-2.5 px-3 font-mono text-white">{p.paymentDate}</td>
                        <td className="py-2.5 px-3">
                          <span className="font-bold text-white block">{p.partyName}</span>
                          <span className="text-[11px] text-slate-400">{matchedLoan?.name || 'Loan'}</span>
                        </td>
                        <td className="py-2.5 px-3">
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded font-mono ${
                            p.type === 'Borrowed' ? 'bg-rose-500/20 text-rose-300' : 'bg-lime-500/20 text-lime-300'
                          }`}>
                            {p.type === 'Borrowed' ? 'Repayment' : 'Recovery'}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right font-black text-lime-400">
                          {formatINR(p.amount)}
                        </td>
                        <td className="py-2.5 px-3 text-right text-slate-300">
                          {formatINR(p.principalComponent)}
                        </td>
                        <td className="py-2.5 px-3 text-right text-amber-300">
                          {formatINR(p.interestComponent)}
                        </td>
                        <td className="py-2.5 px-3 text-slate-300">{p.paymentMethod}</td>
                        <td className="py-2.5 px-3 text-slate-400 truncate max-w-[130px]">{p.account}</td>
                        <td className="py-2.5 px-3 text-slate-400 font-mono text-[11px]">{p.receiptReference || '—'}</td>
                        <td className="py-2.5 px-3 text-right">
                          <button
                            onClick={() => {
                              if (confirm(`Delete payment of ${formatINR(p.amount)} made to ${p.partyName}? Outstanding loan balances will update automatically.`)) {
                                handleDeletePayment(p.id);
                              }
                            }}
                            className="text-rose-400 hover:text-rose-300 font-bold text-xs"
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
        </div>
      )}

      {/* Tab 5: Loan Calculator (Preserves original EMI & Compound calculators with conversion!) */}
      {activeTab === 'calculator' && (
        <div className="space-y-4 max-w-4xl mx-auto">
          {/* Sub-tabs */}
          <div className="flex gap-2 bg-[#061f12] p-1.5 rounded-xl border border-emerald-500/20 w-fit">
            <button
              onClick={() => setCalcType('emi')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                calcType === 'emi' ? 'bg-lime-400 text-emerald-950 font-black' : 'text-emerald-300/80 hover:bg-emerald-900/50'
              }`}
            >
              Loan & EMI Calculator
            </button>
            <button
              onClick={() => setCalcType('compound')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                calcType === 'compound' ? 'bg-lime-400 text-emerald-950 font-black' : 'text-emerald-300/80 hover:bg-emerald-900/50'
              }`}
            >
              Compound Growth / SIP
            </button>
          </div>

          {/* Calculator 1: Loan EMI */}
          {calcType === 'emi' && (
            <div className="p-5 rounded-2xl bg-[#061f12] border border-emerald-500/20 space-y-4 shadow-lg">
              <div className="flex items-center justify-between border-b border-emerald-500/20 pb-3">
                <div>
                  <h3 className="text-base font-black text-white">Loan EMI Projection</h3>
                  <p className="text-xs text-slate-400">Simulate monthly installments, interest burden, and total amortization</p>
                </div>
                <button
                  onClick={handleConvertCalculatorToLoan}
                  className="px-3.5 py-1.5 text-xs font-black text-emerald-950 bg-lime-400 hover:bg-lime-300 rounded-lg transition-colors flex items-center gap-1"
                >
                  <span>+ Convert to Managed Loan</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase text-emerald-300/80 mb-1">Loan Amount (₹)</label>
                  <input
                    type="number"
                    step="5000"
                    value={calcLoanAmount}
                    onChange={(e) => setCalcLoanAmount(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-[#04160c] border border-emerald-500/30 rounded-xl text-white font-bold text-xs outline-none focus:border-lime-400 tabular-nums"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-emerald-300/80 mb-1">Interest Rate (% p.a.)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={calcInterestRate}
                    onChange={(e) => setCalcInterestRate(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-[#04160c] border border-emerald-500/30 rounded-xl text-white font-bold text-xs outline-none focus:border-lime-400 tabular-nums"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-emerald-300/80 mb-1">Tenure (Years)</label>
                  <input
                    type="number"
                    value={calcTenureYears}
                    onChange={(e) => setCalcTenureYears(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-[#04160c] border border-emerald-500/30 rounded-xl text-white font-bold text-xs outline-none focus:border-lime-400 tabular-nums"
                  />
                </div>
              </div>

              {/* Calculated Results */}
              <div className="grid grid-cols-3 gap-3 p-4 rounded-xl bg-[#03130a] border border-emerald-500/20 text-center">
                <div>
                  <div className="text-[10px] text-slate-400 font-bold uppercase">Monthly EMI</div>
                  <div className="text-xl sm:text-2xl font-black text-lime-400 tabular-nums">
                    {formatINR(calcEMI)}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400 font-bold uppercase">Total Interest</div>
                  <div className="text-xl sm:text-2xl font-black text-rose-400 tabular-nums">
                    {formatINR(calcTotalInterest)}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400 font-bold uppercase">Total Repayment</div>
                  <div className="text-xl sm:text-2xl font-black text-white tabular-nums">
                    {formatINR(calcTotalPayment)}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Calculator 2: Compound Growth */}
          {calcType === 'compound' && (
            <div className="p-5 rounded-2xl bg-[#061f12] border border-emerald-500/20 space-y-4 shadow-lg">
              <div className="border-b border-emerald-500/20 pb-3">
                <h3 className="text-base font-black text-white">Compound Growth & Wealth SIP</h3>
                <p className="text-xs text-slate-400">Estimate long term capital accumulation from regular investments</p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase text-emerald-300/80 mb-1">Initial (₹)</label>
                  <input
                    type="number"
                    value={calcInitialInv}
                    onChange={(e) => setCalcInitialInv(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-[#04160c] border border-emerald-500/30 rounded-xl text-white font-bold text-xs outline-none focus:border-lime-400 tabular-nums"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-emerald-300/80 mb-1">Monthly SIP (₹)</label>
                  <input
                    type="number"
                    value={calcMonthlyInv}
                    onChange={(e) => setCalcMonthlyInv(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-[#04160c] border border-emerald-500/30 rounded-xl text-white font-bold text-xs outline-none focus:border-lime-400 tabular-nums"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-emerald-300/80 mb-1">Exp. Return (%)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={calcReturnRate}
                    onChange={(e) => setCalcReturnRate(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-[#04160c] border border-emerald-500/30 rounded-xl text-white font-bold text-xs outline-none focus:border-lime-400 tabular-nums"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-emerald-300/80 mb-1">Period (Years)</label>
                  <input
                    type="number"
                    value={calcInvYears}
                    onChange={(e) => setCalcInvYears(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-[#04160c] border border-emerald-500/30 rounded-xl text-white font-bold text-xs outline-none focus:border-lime-400 tabular-nums"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 p-4 rounded-xl bg-[#03130a] border border-emerald-500/20 text-center">
                <div>
                  <div className="text-[10px] text-slate-400 font-bold uppercase">Total Invested</div>
                  <div className="text-xl sm:text-2xl font-black text-white tabular-nums">
                    {formatINR(totalInvested)}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400 font-bold uppercase">Est. Returns</div>
                  <div className="text-xl sm:text-2xl font-black text-lime-400 tabular-nums">
                    +{formatINR(wealthGained)}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400 font-bold uppercase">Future Value</div>
                  <div className="text-xl sm:text-2xl font-black text-lime-300 tabular-nums">
                    {formatINR(totalCorpus)}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Add / Edit Loan Modal */}
      <AddLoanModal
        isOpen={isAddLoanOpen}
        onClose={() => {
          setIsAddLoanOpen(false);
          setEditingLoan(null);
        }}
        onSave={handleSaveLoan}
        initialLoan={editingLoan}
      />

      {/* Record Payment Modal */}
      <RecordPaymentModal
        isOpen={isRecordPaymentOpen}
        onClose={() => {
          setIsRecordPaymentOpen(false);
          setPreselectedLoanId(undefined);
        }}
        loans={loans}
        allPayments={payments}
        selectedLoanId={preselectedLoanId}
        onSavePayment={handleSavePayment}
      />

      {/* Loan Details Modal */}
      <LoanDetailModal
        isOpen={Boolean(selectedDetailLoan)}
        onClose={() => setSelectedDetailLoan(null)}
        loan={selectedDetailLoan}
        allPayments={payments}
        onRecordPayment={(loanId, installmentNumber) => {
          setSelectedDetailLoan(null);
          setPreselectedLoanId(loanId);
          setIsRecordPaymentOpen(true);
        }}
        onEditLoan={(loan) => {
          setSelectedDetailLoan(null);
          setEditingLoan(loan);
          setIsAddLoanOpen(true);
        }}
        onToggleStatus={handleToggleLoanStatus}
        onDeleteLoan={handleDeleteLoan}
        onDeletePayment={handleDeletePayment}
      />

      {/* Instant Amortization Modal */}
      <InstantAmortizationModal
        isOpen={isAmortizationOpen}
        onClose={() => setIsAmortizationOpen(false)}
      />
    </div>
  );
};
