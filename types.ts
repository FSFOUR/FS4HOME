
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

export interface Transaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  type: WealthType;
  kakeiboCategory?: KakeiboCategory;
  isRecurring: boolean;
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
}
