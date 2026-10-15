
export enum KakeiboCategory {
  NEEDS = 'Needs',
  WANTS = 'Wants',
  CULTURE = 'Culture & Self-Improvement',
  UNEXPECTED = 'Unexpected / Emergency'
}

export enum WealthType {
  ASSET = 'Asset',
  LIABILITY = 'Liability',
  INCOME = 'Income',
  EXPENSE = 'Expense'
}

export enum Priority {
  HIGH = 'High',
  MEDIUM = 'Medium',
  LOW = 'Low'
}

export type TransactionType =
  | 'Income'
  | 'Expense'
  | 'Transfer'
  | 'Savings Contribution'
  | 'Debt Payment'
  | 'Investment Contribution'
  | 'Asset'
  | 'Liability';

export interface Transaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  type: WealthType;
  transactionType?: TransactionType;
  category?: string;
  subcategory?: string;
  kakeiboCategory?: KakeiboCategory;
  account?: string;
  paymentMethod?: string;
  remarks?: string;
  merchant?: string;
  isRecurring: boolean;
  recurringScheduleId?: string;
}

export interface ZakatEntry {
  id: string;
  assetName: string;
  value: number;
  isEligible: boolean;
}

export interface Task {
  id: string;
  title: string;
  priority: Priority;
  completed: boolean;
  dueDate: string;
  isFinancial: boolean;
}

export interface Meal {
  breakfast: string;
  lunch: string;
  dinner: string;
  snacks: string;
}

export interface WeeklyFoodPlan {
  [day: string]: Meal;
}

export interface VehicleRecord {
  id: string;
  date: string;
  kilometers: number;
  cost: number;
  description: string;
  type: 'Fuel' | 'Service' | 'Repair';
}

export interface CategoryTarget {
  amount: number;
  targetDate: string;
}

export interface Reflection {
  q1: string;
  q2: string;
  q3: string;
  q4: string;
  advisory?: string;
}

export interface ScheduleItem {
  id: string;
  title: string;
  startTime: string; // HH:mm
  endTime: string;   // HH:mm
  category: 'Routine' | 'Deep Work' | 'Family' | 'House' | 'Personal';
}

export interface RoutineSubsection {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  icon: string;
}

export interface RoutinePhase {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  icon: string;
  category: 'Sleep' | 'Morning' | 'Work' | 'Evening' | 'Commute';
  subsections?: RoutineSubsection[];
}

export interface DailyChecklistItem {
  id: string;
  category: 'Work' | 'Health' | 'Family' | 'Growth' | 'Home';
  label: string;
  completed: boolean;
}

export interface PrayerTimes {
  fajr: string;
  sunrise: string;
  dhuhr: string;
  asr: string;
  maghrib: string;
  isha: string;
}

export type UserStrategy =
  | 'SAVE_MORE'
  | 'DEBT_FREE'
  | 'EMERGENCY_FUND'
  | 'LIFESTYLE_CONTROL'
  | 'INCREASE_INVESTMENT'
  | 'MAJOR_PURCHASE';

export interface FinancialGoal {
  id: string;
  title: string;
  targetAmount: number;
  currentAmount: number;
  monthlyContribution: number;
  targetDate: string;
  category: string;
  icon?: string;
}

export interface FinancialDebt {
  id: string;
  name: string;
  balance: number;
  interestRate: number; // annual percentage, e.g. 36% for credit card, 9% for home loan
  monthlyEMI: number;
  tenureMonthsRemaining?: number;
  category: 'Credit Card' | 'Personal Loan' | 'Car Loan' | 'Home Loan' | 'Education' | 'Other';
}

export type DisplayDensity = 'comfortable' | 'compact' | 'extra-compact';
export type AppTheme = 'calm-wealth';

export type LoanTransactionType = 'Borrowed' | 'Lent';

export type LoanInterestType =
  | 'No Interest'
  | 'Simple Interest'
  | 'Reducing Balance / EMI'
  | 'Flat Interest'
  | 'Custom Repayment Plan';

export type RepaymentFrequency =
  | 'Weekly'
  | 'Fortnightly'
  | 'Monthly'
  | 'Quarterly'
  | 'Custom dates'
  | 'One-time settlement';

export type InstallmentStatus =
  | 'Upcoming'
  | 'Pending'
  | 'Partially Paid'
  | 'Paid'
  | 'Overdue'
  | 'Skipped'
  | 'Rescheduled';

export type LoanStatus = 'Active' | 'Closed' | 'Archived';

export interface RepaymentInstallment {
  id: string;
  installmentNumber: number;
  dueDate: string; // YYYY-MM-DD
  scheduledAmount: number;
  principalComponent: number;
  interestComponent: number;
  feesComponent?: number;
  amountPaid: number;
  remainingAmount: number;
  paidDate?: string;
  paymentMethod?: string;
  account?: string;
  remarks?: string;
  status: InstallmentStatus;
}

export interface LoanPayment {
  id: string;
  loanId: string;
  paymentDate: string; // YYYY-MM-DD
  amount: number;
  partyName: string;
  type: LoanTransactionType;
  principalComponent: number;
  interestComponent: number;
  feesComponent: number;
  paymentMethod: string;
  account: string;
  installmentNumber?: number;
  remarks?: string;
  receiptReference?: string;
  syncToTransactions?: boolean;
  createdAt: string;
}

export interface LoanRecord {
  id: string;
  name: string;
  type: LoanTransactionType; // 'Borrowed' | 'Lent'
  partyName: string;
  principalAmount: number;
  interestType: LoanInterestType;
  interestRate: number; // % p.a.
  processingFee: number;
  startDate: string; // YYYY-MM-DD
  firstPaymentDate: string; // YYYY-MM-DD
  frequency: RepaymentFrequency;
  totalTenureMonths: number;
  numberOfInstallments: number;
  plannedInstallmentAmount?: number;
  account?: string;
  paymentMethod?: string;
  remarks?: string;
  status: LoanStatus;
  schedule: RepaymentInstallment[];
  createdAt: string;
  updatedAt: string;
}

export interface AppState {
  transactions: Transaction[];
  tasks: Task[];
  schedule: ScheduleItem[];
  foodPlan: WeeklyFoodPlan;
  vehicleRecords: VehicleRecord[];
  zakatGiven: number;
  monthlySavingsTarget: number;
  userName: string;
  monthlyTargets: Record<string, Partial<Record<KakeiboCategory, CategoryTarget>>>;
  weeklyReflections: Record<string, Reflection>;
  monthlyReflections: Record<string, Reflection>;
  // New Schedule Extensions
  routineBlueprint: RoutinePhase[];
  dailyChecklist: DailyChecklistItem[];
  eveningReview: {
    well: string;
    improve: string;
    gratitude: string;
  };
  prayerTimes: PrayerTimes | null;
  // 80/20 Financial Extensions
  financialGoals?: FinancialGoal[];
  financialDebts?: FinancialDebt[];
  userStrategy?: UserStrategy;
  displayDensity?: DisplayDensity;
  // Monthly Budget Allocation & Persistent Custom Categories
  monthlyBudgetPlans?: Record<string, MonthlyBudgetPlan>;
  customBudgetCategories?: BudgetCategory[];
  recurringExpenses?: RecurringExpenseItem[];
  autofillMemory?: AutofillMemoryItem[];
  accountBalances?: Record<string, number>;
  // Loans & Borrowings Management
  loanRecords?: LoanRecord[];
  loanPayments?: LoanPayment[];
  // Appearance Theme
  theme?: AppTheme;
}

export interface BudgetSubcategory {
  id: string;
  name: string;
  plannedAmount: number;
  archived?: boolean;
  order?: number;
}

export interface BudgetCategory {
  id: string;
  name: string;
  icon?: string;
  isSavings?: boolean; // Separates spending from transfers/savings contributions
  archived?: boolean;
  order?: number;
  subcategories: BudgetSubcategory[];
}

export interface MonthlyBudgetPlan {
  monthKey: string; // "YYYY-MM"
  totalMonthlyBudget: number; // default ₹20,000, user-configurable
  categories: BudgetCategory[];
}

export type RecurringFrequency = 
  | 'Weekly'
  | 'Every 2 weeks'
  | 'Monthly'
  | 'Every 2 months'
  | 'Quarterly'
  | 'Every 6 months'
  | 'Yearly'
  | 'Custom';

export interface RecurringExpenseItem {
  id: string;
  name: string;
  expectedAmount: number;
  frequency: RecurringFrequency;
  customIntervalDays?: number;
  startDate: string;
  nextDueDate: string;
  endDate?: string;
  category: string;
  subcategory?: string;
  merchant?: string;
  account?: string;
  paymentMethod?: string;
  remarks?: string;
  reminderPreference?: 'None' | 'On Due Date' | '1 day before' | '3 days before';
  status: 'Active' | 'Paused' | 'Cancelled';
  lastPaidDate?: string;
}

export interface AutofillMemoryItem {
  id: string;
  type: string;
  description: string;
  category: string;
  subcategory?: string;
  account?: string;
  paymentMethod?: string;
  remarks?: string;
  frequencyCount: number;
  lastUsed: string;
  isShared?: boolean;
}
