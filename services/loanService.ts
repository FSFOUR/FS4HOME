import { LoanRecord, LoanPayment, RepaymentInstallment, LoanTransactionType, LoanInterestType, RepaymentFrequency, InstallmentStatus, LoanStatus } from '../types';

/**
 * Format number as Indian Rupee (₹) currency with tabular standard
 */
export const formatINR = (amount: number, showDecimals: boolean = false): string => {
  if (isNaN(amount) || amount === null || amount === undefined) return '₹0';
  const isNegative = amount < 0;
  const absAmount = Math.abs(amount);
  
  const options: Intl.NumberFormatOptions = {
    maximumFractionDigits: showDecimals ? 2 : 0,
    minimumFractionDigits: showDecimals ? 2 : 0,
  };
  
  const formatted = new Intl.NumberFormat('en-IN', options).format(absAmount);
  return `${isNegative ? '-' : ''}₹${formatted}`;
};

/**
 * Helper to add intervals to a date string YYYY-MM-DD
 */
export const addIntervalToDate = (dateStr: string, frequency: RepaymentFrequency, step: number = 1): string => {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;

  switch (frequency) {
    case 'Weekly':
      d.setDate(d.getDate() + 7 * step);
      break;
    case 'Fortnightly':
      d.setDate(d.getDate() + 14 * step);
      break;
    case 'Quarterly':
      d.setMonth(d.getMonth() + 3 * step);
      break;
    case 'One-time settlement':
      // Keeps same target date
      break;
    case 'Monthly':
    case 'Custom dates':
    default:
      d.setMonth(d.getMonth() + step);
      break;
  }
  return d.toISOString().split('T')[0];
};

/**
 * Returns today's ISO date string (YYYY-MM-DD)
 */
export const getTodayDateStr = (): string => {
  return new Date().toISOString().split('T')[0];
};

/**
 * Calculate Monthly EMI for Reducing Balance
 * EMI = P * r * (1+r)^n / ((1+r)^n - 1)
 */
export const calculateReducingBalanceEMI = (
  principal: number,
  annualInterestRate: number,
  tenureMonths: number
): { emi: number; totalInterest: number; totalPayable: number } => {
  if (tenureMonths <= 0) return { emi: principal, totalInterest: 0, totalPayable: principal };
  if (annualInterestRate <= 0) {
    const emi = Math.round(principal / tenureMonths);
    return { emi, totalInterest: 0, totalPayable: principal };
  }

  const monthlyRate = annualInterestRate / (12 * 100);
  const factor = Math.pow(1 + monthlyRate, tenureMonths);
  const emi = Math.round((principal * monthlyRate * factor) / (factor - 1));
  const totalPayable = emi * tenureMonths;
  const totalInterest = Math.max(0, totalPayable - principal);

  return { emi, totalInterest, totalPayable };
};

/**
 * Generate standard repayment schedule based on loan configuration
 */
export interface GenerateScheduleParams {
  principalAmount: number;
  interestType: LoanInterestType;
  interestRate: number; // annual %
  processingFee?: number;
  firstPaymentDate: string;
  frequency: RepaymentFrequency;
  numberOfInstallments: number;
  totalTenureMonths?: number;
  plannedInstallmentAmount?: number;
}

export const generateLoanSchedule = (params: GenerateScheduleParams): RepaymentInstallment[] => {
  const {
    principalAmount,
    interestType,
    interestRate = 0,
    processingFee = 0,
    firstPaymentDate,
    frequency,
    numberOfInstallments = 12,
    totalTenureMonths = numberOfInstallments,
    plannedInstallmentAmount,
  } = params;

  const count = Math.max(1, numberOfInstallments);
  const schedule: RepaymentInstallment[] = [];
  const today = getTodayDateStr();

  if (interestType === 'No Interest') {
    // Zero Interest
    const installmentPrincipal = Math.floor(principalAmount / count);
    let remainingPrincipal = principalAmount;

    for (let i = 1; i <= count; i++) {
      const isLast = i === count;
      const principalComp = isLast ? remainingPrincipal : installmentPrincipal;
      const dueDate = addIntervalToDate(firstPaymentDate, frequency, i - 1);
      const isOverdue = dueDate < today;

      schedule.push({
        id: `inst-${i}-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        installmentNumber: i,
        dueDate,
        scheduledAmount: principalComp,
        principalComponent: principalComp,
        interestComponent: 0,
        feesComponent: i === 1 ? processingFee : 0,
        amountPaid: 0,
        remainingAmount: principalComp + (i === 1 ? processingFee : 0),
        status: isOverdue ? 'Overdue' : dueDate === today ? 'Pending' : 'Upcoming',
      });

      remainingPrincipal -= principalComp;
    }
  } else if (interestType === 'Reducing Balance / EMI') {
    const tenureMonths = totalTenureMonths || count;
    const { emi } = calculateReducingBalanceEMI(principalAmount, interestRate, tenureMonths);
    const monthlyRate = interestRate / (12 * 100);

    let currentBalance = principalAmount;

    for (let i = 1; i <= count; i++) {
      const isLast = i === count;
      const dueDate = addIntervalToDate(firstPaymentDate, frequency, i - 1);
      const isOverdue = dueDate < today;

      const interestComp = monthlyRate > 0 ? Math.round(currentBalance * monthlyRate) : 0;
      let principalComp = emi - interestComp;

      if (isLast || principalComp > currentBalance) {
        principalComp = Math.max(0, currentBalance);
      }

      const scheduledAmount = principalComp + interestComp;
      const feeComp = i === 1 ? processingFee : 0;

      schedule.push({
        id: `inst-${i}-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        installmentNumber: i,
        dueDate,
        scheduledAmount,
        principalComponent: principalComp,
        interestComponent: interestComp,
        feesComponent: feeComp,
        amountPaid: 0,
        remainingAmount: scheduledAmount + feeComp,
        status: isOverdue ? 'Overdue' : dueDate === today ? 'Pending' : 'Upcoming',
      });

      currentBalance = Math.max(0, currentBalance - principalComp);
    }
  } else if (interestType === 'Simple Interest' || interestType === 'Flat Interest') {
    // Interest = P * (R/100) * (tenureMonths / 12)
    const tenureYears = (totalTenureMonths || count) / 12;
    const totalInterest = Math.round(principalAmount * (interestRate / 100) * tenureYears);
    const totalAmount = principalAmount + totalInterest;

    const principalPerInst = Math.floor(principalAmount / count);
    const interestPerInst = Math.floor(totalInterest / count);

    let remainingP = principalAmount;
    let remainingI = totalInterest;

    for (let i = 1; i <= count; i++) {
      const isLast = i === count;
      const dueDate = addIntervalToDate(firstPaymentDate, frequency, i - 1);
      const isOverdue = dueDate < today;

      const pComp = isLast ? remainingP : principalPerInst;
      const iComp = isLast ? remainingI : interestPerInst;
      const scheduled = pComp + iComp;
      const feeComp = i === 1 ? processingFee : 0;

      schedule.push({
        id: `inst-${i}-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        installmentNumber: i,
        dueDate,
        scheduledAmount: scheduled,
        principalComponent: pComp,
        interestComponent: iComp,
        feesComponent: feeComp,
        amountPaid: 0,
        remainingAmount: scheduled + feeComp,
        status: isOverdue ? 'Overdue' : dueDate === today ? 'Pending' : 'Upcoming',
      });

      remainingP -= pComp;
      remainingI -= iComp;
    }
  } else {
    // Custom Repayment Plan
    const defaultInstallment = plannedInstallmentAmount || Math.round(principalAmount / count);
    let remainingPrincipal = principalAmount;

    for (let i = 1; i <= count; i++) {
      const isLast = i === count;
      const dueDate = addIntervalToDate(firstPaymentDate, frequency, i - 1);
      const isOverdue = dueDate < today;

      const pComp = isLast ? remainingPrincipal : Math.min(remainingPrincipal, defaultInstallment);
      const feeComp = i === 1 ? processingFee : 0;

      schedule.push({
        id: `inst-${i}-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        installmentNumber: i,
        dueDate,
        scheduledAmount: pComp,
        principalComponent: pComp,
        interestComponent: 0,
        feesComponent: feeComp,
        amountPaid: 0,
        remainingAmount: pComp + feeComp,
        status: isOverdue ? 'Overdue' : dueDate === today ? 'Pending' : 'Upcoming',
      });

      remainingPrincipal = Math.max(0, remainingPrincipal - pComp);
    }
  }

  return schedule;
};

/**
 * Reconciles and recalculates a loan's installments against confirmed payments
 */
export const recalculateLoanSchedule = (
  loan: LoanRecord,
  allPayments: LoanPayment[]
): RepaymentInstallment[] => {
  const loanPayments = allPayments
    .filter((p) => p.loanId === loan.id)
    .sort((a, b) => new Date(a.paymentDate).getTime() - new Date(b.paymentDate).getTime());

  const today = getTodayDateStr();

  // Clone schedule and reset payment tracking
  const updatedSchedule: RepaymentInstallment[] = loan.schedule.map((inst) => {
    const totalScheduled = inst.scheduledAmount + (inst.feesComponent || 0);
    const isPast = inst.dueDate < today;
    const isToday = inst.dueDate === today;

    return {
      ...inst,
      amountPaid: 0,
      remainingAmount: totalScheduled,
      paidDate: undefined,
      paymentMethod: undefined,
      account: undefined,
      status: isPast ? 'Overdue' : isToday ? 'Pending' : 'Upcoming',
    };
  });

  // Track payments allocated by installment number or sequential waterfall
  const unassignedPayments: LoanPayment[] = [];

  // Pass 1: explicit installment payments
  for (const payment of loanPayments) {
    if (payment.installmentNumber) {
      const targetInst = updatedSchedule.find((inst) => inst.installmentNumber === payment.installmentNumber);
      if (targetInst) {
        targetInst.amountPaid += payment.amount;
        targetInst.remainingAmount = Math.max(0, targetInst.scheduledAmount + (targetInst.feesComponent || 0) - targetInst.amountPaid);
        targetInst.paidDate = payment.paymentDate;
        targetInst.paymentMethod = payment.paymentMethod;
        targetInst.account = payment.account;
        continue;
      }
    }
    unassignedPayments.push(payment);
  }

  // Pass 2: Waterfall unassigned payments across unpaid installments in order
  for (const payment of unassignedPayments) {
    let unallocatedAmount = payment.amount;

    for (const inst of updatedSchedule) {
      if (unallocatedAmount <= 0) break;
      if (inst.remainingAmount <= 0) continue;

      const allocation = Math.min(unallocatedAmount, inst.remainingAmount);
      inst.amountPaid += allocation;
      inst.remainingAmount = Math.max(0, inst.remainingAmount - allocation);
      inst.paidDate = payment.paymentDate;
      inst.paymentMethod = payment.paymentMethod;
      inst.account = payment.account;
      unallocatedAmount -= allocation;
    }
  }

  // Pass 3: Update final statuses based on remaining balance and dates
  return updatedSchedule.map((inst) => {
    const totalDue = inst.scheduledAmount + (inst.feesComponent || 0);
    const isPast = inst.dueDate < today;

    let finalStatus: InstallmentStatus = inst.status;

    if (inst.amountPaid >= totalDue) {
      finalStatus = 'Paid';
    } else if (inst.amountPaid > 0) {
      finalStatus = isPast ? 'Overdue' : 'Partially Paid';
    } else if (inst.status === 'Skipped' || inst.status === 'Rescheduled') {
      finalStatus = inst.status;
    } else if (isPast) {
      finalStatus = 'Overdue';
    } else if (inst.dueDate === today) {
      finalStatus = 'Pending';
    } else {
      finalStatus = 'Upcoming';
    }

    return {
      ...inst,
      status: finalStatus,
    };
  });
};

/**
 * Calculates complete summary figures for a single loan
 */
export interface LoanSummaryMetrics {
  totalPrincipal: number;
  totalInterest: number;
  totalFees: number;
  totalPayable: number;
  totalPaid: number;
  principalPaid: number;
  interestPaid: number;
  feesPaid: number;
  outstandingBalance: number;
  principalOutstanding: number;
  progressPercentage: number;
  nextPayment?: RepaymentInstallment;
  overdueInstallmentsCount: number;
  overdueAmount: number;
  isFullyPaid: boolean;
  activeInstallmentsCount: number;
}

export const calculateLoanSummary = (
  loan: LoanRecord,
  allPayments: LoanPayment[]
): LoanSummaryMetrics => {
  const currentSchedule = recalculateLoanSchedule(loan, allPayments);
  const loanPayments = allPayments.filter((p) => p.loanId === loan.id);

  let totalPrincipal = 0;
  let totalInterest = 0;
  let totalFees = 0;
  let totalPaid = 0;
  let overdueAmount = 0;
  let overdueInstallmentsCount = 0;

  let nextPayment: RepaymentInstallment | undefined = undefined;

  for (const inst of currentSchedule) {
    totalPrincipal += inst.principalComponent;
    totalInterest += inst.interestComponent;
    totalFees += inst.feesComponent || 0;
    totalPaid += inst.amountPaid;

    if (inst.status === 'Overdue') {
      overdueInstallmentsCount += 1;
      overdueAmount += inst.remainingAmount;
    }

    // Identify next unpaid payment
    if (!nextPayment && (inst.status === 'Overdue' || inst.status === 'Pending' || inst.status === 'Upcoming' || inst.status === 'Partially Paid')) {
      nextPayment = inst;
    }
  }

  // Derive split from payments
  let principalPaid = 0;
  let interestPaid = 0;
  let feesPaid = 0;

  for (const p of loanPayments) {
    principalPaid += p.principalComponent || 0;
    interestPaid += p.interestComponent || 0;
    feesPaid += p.feesComponent || 0;
  }

  // Fallback if payment splits were not explicitly broken down
  if (principalPaid === 0 && interestPaid === 0 && totalPaid > 0) {
    principalPaid = Math.min(totalPrincipal, totalPaid);
    interestPaid = Math.max(0, totalPaid - principalPaid);
  }

  const totalPayable = totalPrincipal + totalInterest + totalFees;
  const outstandingBalance = Math.max(0, totalPayable - totalPaid);
  const principalOutstanding = Math.max(0, totalPrincipal - principalPaid);
  const progressPercentage = totalPayable > 0 ? Math.min(100, Math.round((totalPaid / totalPayable) * 1000) / 10) : 0;
  const isFullyPaid = outstandingBalance <= 0;

  return {
    totalPrincipal,
    totalInterest,
    totalFees,
    totalPayable,
    totalPaid,
    principalPaid,
    interestPaid,
    feesPaid,
    outstandingBalance,
    principalOutstanding,
    progressPercentage,
    nextPayment,
    overdueInstallmentsCount,
    overdueAmount,
    isFullyPaid,
    activeInstallmentsCount: currentSchedule.filter((i) => i.status !== 'Paid').length,
  };
};

/**
 * Top level aggregate summary across all loans
 */
export interface OverallLoanMetrics {
  totalBorrowedPrincipal: number;
  totalBorrowedOutstanding: number;
  totalBorrowedPaid: number;
  totalLentPrincipal: number;
  totalLentOutstanding: number;
  totalLentRecovered: number;
  netOutstanding: number; // Lent Outstanding - Borrowed Outstanding
  dueThisMonth: number;
  totalPaidOrRecovered: number;
  overduePaymentsCount: number;
  overdueAmount: number;
  activeLoansCount: number;
  totalLoansCount: number;
}

export const calculateOverallLoanMetrics = (
  loans: LoanRecord[] = [],
  payments: LoanPayment[] = [],
  filterType: 'All' | 'Borrowed' | 'Lent' = 'All'
): OverallLoanMetrics => {
  const currentMonth = getTodayDateStr().slice(0, 7); // YYYY-MM

  let totalBorrowedPrincipal = 0;
  let totalBorrowedOutstanding = 0;
  let totalBorrowedPaid = 0;

  let totalLentPrincipal = 0;
  let totalLentOutstanding = 0;
  let totalLentRecovered = 0;

  let dueThisMonth = 0;
  let overduePaymentsCount = 0;
  let overdueAmount = 0;
  let activeLoansCount = 0;

  for (const loan of loans) {
    if (loan.status === 'Archived') continue;

    const summary = calculateLoanSummary(loan, payments);
    const schedule = recalculateLoanSchedule(loan, payments);

    if (loan.status === 'Active' && !summary.isFullyPaid) {
      activeLoansCount += 1;
    }

    if (loan.type === 'Borrowed') {
      totalBorrowedPrincipal += summary.totalPrincipal;
      totalBorrowedOutstanding += summary.outstandingBalance;
      totalBorrowedPaid += summary.totalPaid;
    } else {
      totalLentPrincipal += summary.totalPrincipal;
      totalLentOutstanding += summary.outstandingBalance;
      totalLentRecovered += summary.totalPaid;
    }

    // Installments check for this month and overdue
    for (const inst of schedule) {
      const matchesFilter =
        filterType === 'All' ||
        (filterType === 'Borrowed' && loan.type === 'Borrowed') ||
        (filterType === 'Lent' && loan.type === 'Lent');

      if (matchesFilter && inst.status !== 'Paid') {
        if (inst.dueDate.startsWith(currentMonth)) {
          dueThisMonth += inst.remainingAmount;
        }
        if (inst.status === 'Overdue') {
          overduePaymentsCount += 1;
          overdueAmount += inst.remainingAmount;
        }
      }
    }
  }

  const netOutstanding = totalLentOutstanding - totalBorrowedOutstanding;
  const totalPaidOrRecovered =
    filterType === 'Borrowed'
      ? totalBorrowedPaid
      : filterType === 'Lent'
      ? totalLentRecovered
      : totalBorrowedPaid + totalLentRecovered;

  return {
    totalBorrowedPrincipal,
    totalBorrowedOutstanding,
    totalBorrowedPaid,
    totalLentPrincipal,
    totalLentOutstanding,
    totalLentRecovered,
    netOutstanding,
    dueThisMonth,
    totalPaidOrRecovered,
    overduePaymentsCount,
    overdueAmount,
    activeLoansCount,
    totalLoansCount: loans.filter((l) => l.status !== 'Archived').length,
  };
};

/**
 * DEFAULT SEED LOANS & BORROWINGS
 * Exactly as specified in prompt section 4 table:
 * Live production ready state starts with an empty loan portfolio.
 * Sample records are preserved in SAMPLE_LOAN_RECORDS for user demonstration on demand.
 */
export const DEFAULT_LOAN_RECORDS: LoanRecord[] = [];
export const DEFAULT_LOAN_PAYMENTS: LoanPayment[] = [];

export const SAMPLE_LOAN_RECORDS: LoanRecord[] = [
  {
    id: 'LN001',
    name: 'Personal Borrowing',
    type: 'Borrowed',
    partyName: 'Ahmed',
    principalAmount: 30000,
    interestType: 'No Interest',
    interestRate: 0,
    processingFee: 0,
    startDate: '2026-08-01',
    firstPaymentDate: '2026-09-05',
    frequency: 'Monthly',
    totalTenureMonths: 6,
    numberOfInstallments: 6,
    plannedInstallmentAmount: 5000,
    account: 'Bank Account (Primary)',
    paymentMethod: 'UPI / GPay',
    remarks: 'Friendly borrowing for house renovation advance. No interest agreed.',
    status: 'Active',
    schedule: [
      {
        id: 'LN001-1',
        installmentNumber: 1,
        dueDate: '2026-09-05',
        scheduledAmount: 5000,
        principalComponent: 5000,
        interestComponent: 0,
        amountPaid: 5000,
        remainingAmount: 0,
        paidDate: '2026-09-05',
        paymentMethod: 'UPI / GPay',
        status: 'Paid',
      },
      {
        id: 'LN001-2',
        installmentNumber: 2,
        dueDate: '2026-10-05',
        scheduledAmount: 5000,
        principalComponent: 5000,
        interestComponent: 0,
        amountPaid: 5000,
        remainingAmount: 0,
        paidDate: '2026-10-05',
        paymentMethod: 'UPI / GPay',
        status: 'Paid',
      },
      {
        id: 'LN001-3',
        installmentNumber: 3,
        dueDate: '2026-11-05',
        scheduledAmount: 5000,
        principalComponent: 5000,
        interestComponent: 0,
        amountPaid: 0,
        remainingAmount: 5000,
        status: 'Upcoming',
      },
      {
        id: 'LN001-4',
        installmentNumber: 4,
        dueDate: '2026-12-05',
        scheduledAmount: 5000,
        principalComponent: 5000,
        interestComponent: 0,
        amountPaid: 0,
        remainingAmount: 5000,
        status: 'Upcoming',
      },
      {
        id: 'LN001-5',
        installmentNumber: 5,
        dueDate: '2027-01-05',
        scheduledAmount: 5000,
        principalComponent: 5000,
        interestComponent: 0,
        amountPaid: 0,
        remainingAmount: 5000,
        status: 'Upcoming',
      },
      {
        id: 'LN001-6',
        installmentNumber: 6,
        dueDate: '2027-02-05',
        scheduledAmount: 5000,
        principalComponent: 5000,
        interestComponent: 0,
        amountPaid: 0,
        remainingAmount: 5000,
        status: 'Upcoming',
      },
    ],
    createdAt: '2026-08-01T10:00:00Z',
    updatedAt: '2026-10-05T12:00:00Z',
  },
  {
    id: 'LN002',
    name: 'Home Renovation EMI Loan',
    type: 'Borrowed',
    partyName: 'Bank A',
    principalAmount: 200000,
    interestType: 'Reducing Balance / EMI',
    interestRate: 9.5,
    processingFee: 1500,
    startDate: '2026-07-15',
    firstPaymentDate: '2026-08-15',
    frequency: 'Monthly',
    totalTenureMonths: 24,
    numberOfInstallments: 24,
    plannedInstallmentAmount: 9183,
    account: 'Bank Account (Primary)',
    paymentMethod: 'Auto Debit / ECS',
    remarks: 'Approved collateral-free consumer loan for home upgrade.',
    status: 'Active',
    schedule: generateLoanSchedule({
      principalAmount: 200000,
      interestType: 'Reducing Balance / EMI',
      interestRate: 9.5,
      processingFee: 1500,
      firstPaymentDate: '2026-08-15',
      frequency: 'Monthly',
      numberOfInstallments: 24,
      totalTenureMonths: 24,
    }),
    createdAt: '2026-07-15T09:30:00Z',
    updatedAt: '2026-09-15T10:00:00Z',
  },
  {
    id: 'LN003',
    name: 'Emergency Medical Loan',
    type: 'Borrowed',
    partyName: 'Friend B',
    principalAmount: 15000,
    interestType: 'No Interest',
    interestRate: 0,
    processingFee: 0,
    startDate: '2026-09-01',
    firstPaymentDate: '2026-10-01',
    frequency: 'Monthly',
    totalTenureMonths: 5,
    numberOfInstallments: 5,
    plannedInstallmentAmount: 3000,
    account: 'Cash in Hand',
    paymentMethod: 'Cash',
    remarks: 'Borrowed cash for clinic expenses. Repaying ₹3,000 monthly.',
    status: 'Active',
    schedule: generateLoanSchedule({
      principalAmount: 15000,
      interestType: 'No Interest',
      interestRate: 0,
      processingFee: 0,
      firstPaymentDate: '2026-10-01',
      frequency: 'Monthly',
      numberOfInstallments: 5,
    }),
    createdAt: '2026-09-01T14:00:00Z',
    updatedAt: '2026-10-01T15:00:00Z',
  },
  {
    id: 'LN004',
    name: 'Retail Stock Assistance',
    type: 'Lent',
    partyName: 'Person C',
    principalAmount: 20000,
    interestType: 'Simple Interest',
    interestRate: 5.0,
    processingFee: 0,
    startDate: '2026-08-10',
    firstPaymentDate: '2026-09-10',
    frequency: 'Monthly',
    totalTenureMonths: 4,
    numberOfInstallments: 4,
    plannedInstallmentAmount: 5250,
    account: 'UPI / GPay',
    paymentMethod: 'UPI / GPay',
    remarks: 'Lent money to Person C for grocery inventory. 5% simple annual interest agreed.',
    status: 'Active',
    schedule: generateLoanSchedule({
      principalAmount: 20000,
      interestType: 'Simple Interest',
      interestRate: 5.0,
      processingFee: 0,
      firstPaymentDate: '2026-09-10',
      frequency: 'Monthly',
      numberOfInstallments: 4,
      totalTenureMonths: 4,
    }),
    createdAt: '2026-08-10T11:00:00Z',
    updatedAt: '2026-09-10T16:00:00Z',
  },
  {
    id: 'LN005',
    name: 'Workstation Finance EMI',
    type: 'Borrowed',
    partyName: 'Finance Company D',
    principalAmount: 75000,
    interestType: 'Flat Interest',
    interestRate: 8.0,
    processingFee: 1000,
    startDate: '2026-06-20',
    firstPaymentDate: '2026-07-20',
    frequency: 'Monthly',
    totalTenureMonths: 12,
    numberOfInstallments: 12,
    plannedInstallmentAmount: 6750,
    account: 'Bank Account (Primary)',
    paymentMethod: 'Net Banking',
    remarks: 'Computer & equipment purchase loan on flat 8% p.a. interest.',
    status: 'Active',
    schedule: generateLoanSchedule({
      principalAmount: 75000,
      interestType: 'Flat Interest',
      interestRate: 8.0,
      processingFee: 1000,
      firstPaymentDate: '2026-07-20',
      frequency: 'Monthly',
      numberOfInstallments: 12,
      totalTenureMonths: 12,
    }),
    createdAt: '2026-06-20T08:00:00Z',
    updatedAt: '2026-09-20T10:00:00Z',
  },
];

export const SAMPLE_LOAN_PAYMENTS: LoanPayment[] = [
  {
    id: 'pmt-001',
    loanId: 'LN001',
    paymentDate: '2026-09-05',
    amount: 5000,
    partyName: 'Ahmed',
    type: 'Borrowed',
    principalComponent: 5000,
    interestComponent: 0,
    feesComponent: 0,
    paymentMethod: 'UPI / GPay',
    account: 'Bank Account (Primary)',
    installmentNumber: 1,
    remarks: '1st installment paid via GPay',
    receiptReference: 'UPI-92847291',
    syncToTransactions: false,
    createdAt: '2026-09-05T10:30:00Z',
  },
  {
    id: 'pmt-002',
    loanId: 'LN001',
    paymentDate: '2026-10-05',
    amount: 5000,
    partyName: 'Ahmed',
    type: 'Borrowed',
    principalComponent: 5000,
    interestComponent: 0,
    feesComponent: 0,
    paymentMethod: 'UPI / GPay',
    account: 'Bank Account (Primary)',
    installmentNumber: 2,
    remarks: '2nd installment paid via GPay',
    receiptReference: 'UPI-93910482',
    syncToTransactions: false,
    createdAt: '2026-10-05T11:15:00Z',
  },
  {
    id: 'pmt-003',
    loanId: 'LN002',
    paymentDate: '2026-08-15',
    amount: 10683, // 9183 + 1500 fee
    partyName: 'Bank A',
    type: 'Borrowed',
    principalComponent: 7600,
    interestComponent: 1583,
    feesComponent: 1500,
    paymentMethod: 'Auto Debit / ECS',
    account: 'Bank Account (Primary)',
    installmentNumber: 1,
    remarks: '1st EMI + Processing fee debited',
    receiptReference: 'ECS-829104',
    syncToTransactions: false,
    createdAt: '2026-08-15T09:00:00Z',
  },
  {
    id: 'pmt-004',
    loanId: 'LN002',
    paymentDate: '2026-09-15',
    amount: 9183,
    partyName: 'Bank A',
    type: 'Borrowed',
    principalComponent: 7660,
    interestComponent: 1523,
    feesComponent: 0,
    paymentMethod: 'Auto Debit / ECS',
    account: 'Bank Account (Primary)',
    installmentNumber: 2,
    remarks: '2nd EMI debited',
    receiptReference: 'ECS-839201',
    syncToTransactions: false,
    createdAt: '2026-09-15T09:00:00Z',
  },
  {
    id: 'pmt-005',
    loanId: 'LN003',
    paymentDate: '2026-10-01',
    amount: 3000,
    partyName: 'Friend B',
    type: 'Borrowed',
    principalComponent: 3000,
    interestComponent: 0,
    feesComponent: 0,
    paymentMethod: 'Cash',
    account: 'Cash in Hand',
    installmentNumber: 1,
    remarks: 'Cash handed over in person',
    receiptReference: 'REC-01',
    syncToTransactions: false,
    createdAt: '2026-10-01T16:00:00Z',
  },
  {
    id: 'pmt-006',
    loanId: 'LN004',
    paymentDate: '2026-09-10',
    amount: 5250,
    partyName: 'Person C',
    type: 'Lent',
    principalComponent: 5000,
    interestComponent: 250,
    feesComponent: 0,
    paymentMethod: 'UPI / GPay',
    account: 'UPI / GPay',
    installmentNumber: 1,
    remarks: 'Person C returned 1st installment via UPI',
    receiptReference: 'UPI-REC-4829',
    syncToTransactions: false,
    createdAt: '2026-09-10T14:30:00Z',
  },
  {
    id: 'pmt-007',
    loanId: 'LN005',
    paymentDate: '2026-07-20',
    amount: 7750, // 6750 + 1000 fee
    partyName: 'Finance Company D',
    type: 'Borrowed',
    principalComponent: 6250,
    interestComponent: 500,
    feesComponent: 1000,
    paymentMethod: 'Net Banking',
    account: 'Bank Account (Primary)',
    installmentNumber: 1,
    remarks: '1st installment + doc charges',
    receiptReference: 'TXN-910294',
    syncToTransactions: false,
    createdAt: '2026-07-20T10:00:00Z',
  },
  {
    id: 'pmt-008',
    loanId: 'LN005',
    paymentDate: '2026-08-20',
    amount: 6750,
    partyName: 'Finance Company D',
    type: 'Borrowed',
    principalComponent: 6250,
    interestComponent: 500,
    feesComponent: 0,
    paymentMethod: 'Net Banking',
    account: 'Bank Account (Primary)',
    installmentNumber: 2,
    remarks: '2nd installment paid',
    receiptReference: 'TXN-920491',
    syncToTransactions: false,
    createdAt: '2026-08-20T10:00:00Z',
  },
  {
    id: 'pmt-009',
    loanId: 'LN005',
    paymentDate: '2026-09-20',
    amount: 6750,
    partyName: 'Finance Company D',
    type: 'Borrowed',
    principalComponent: 6250,
    interestComponent: 500,
    feesComponent: 0,
    paymentMethod: 'Net Banking',
    account: 'Bank Account (Primary)',
    installmentNumber: 3,
    remarks: '3rd installment paid',
    receiptReference: 'TXN-930512',
    syncToTransactions: false,
    createdAt: '2026-09-20T10:00:00Z',
  },
];
