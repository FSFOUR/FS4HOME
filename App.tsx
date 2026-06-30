
import React, { useState, useEffect, useMemo } from 'react';
import { HashRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { 
  AppState, 
  Transaction, 
  WealthType, 
  KakeiboCategory, 
  Priority, 
  Task, 
  VehicleRecord,
  WeeklyFoodPlan,
  CategoryTarget,
  Reflection,
  ScheduleItem,
  RoutinePhase,
  RoutineSubsection,
  DailyChecklistItem,
  PrayerTimes
} from './types';
import { ICONS, DAYS_OF_WEEK } from './constants';
import Dashboard from './components/Dashboard';
import Transactions from './components/Transactions';
import Lifestyle from './components/Lifestyle';
import Zakat from './components/Zakat';
import Schedule from './components/Schedule';
import { fetchPrayerTimes } from './services/geminiService';

const STORAGE_KEY = 'fs4home_data';

const DEFAULT_ROUTINE: RoutinePhase[] = [
  { id: 'r1', title: 'Sleep', startTime: '22:00', endTime: '04:30', icon: '🌙', category: 'Sleep' },
  { id: 'prayer-fajr', title: 'Fajr Prayer', startTime: '05:00', endTime: '05:30', icon: '🕌', category: 'Morning' },
  { id: 'r2', title: 'Wake up & Freshen up', startTime: '05:30', endTime: '05:50', icon: '🌅', category: 'Morning' },
  { id: 'r3', title: 'Exercise / Yoga', startTime: '05:50', endTime: '06:30', icon: '🧘', category: 'Morning' },
  { id: 'r4', title: 'Bathing & Grooming', startTime: '06:30', endTime: '06:50', icon: '🚿', category: 'Morning' },
  { id: 'r5', title: 'Personal Growth Reading', startTime: '06:50', endTime: '07:10', icon: '📚', category: 'Morning' },
  { id: 'r6', title: 'Breakfast', startTime: '07:10', endTime: '07:30', icon: '🍳', category: 'Morning' },
  { id: 'r9', title: 'Work Commute', startTime: '08:15', endTime: '09:00', icon: '🚗', category: 'Commute' },
  { 
    id: 'r10', title: 'Work Session 1', startTime: '09:00', endTime: '12:30', icon: '🏢', category: 'Work',
    subsections: [] 
  },
  { id: 'prayer-dhuhr', title: 'Dhuhr Prayer', startTime: '12:30', endTime: '12:40', icon: '🕌', category: 'Work' },
  { id: 'r11', title: 'Lunch Break', startTime: '12:40', endTime: '13:10', icon: '🍱', category: 'Work' },
  { id: 'r12', title: 'Work Session 2', startTime: '13:10', endTime: '16:15', icon: '💻', category: 'Work' },
  { id: 'prayer-asr', title: 'Asr Prayer', startTime: '16:15', endTime: '16:25', icon: '🕌', category: 'Work' },
  { id: 'r13', title: 'Evening Commute', startTime: '17:00', endTime: '18:00', icon: '🚗', category: 'Commute' },
  { id: 'prayer-maghrib', title: 'Maghrib Prayer', startTime: '18:30', endTime: '18:45', icon: '🕌', category: 'Evening' },
  { id: 'r14', title: 'Family Time & Relax', startTime: '18:45', endTime: '19:30', icon: '🛋️', category: 'Evening' },
  { id: 'prayer-isha', title: 'Isha Prayer', startTime: '19:45', endTime: '20:00', icon: '🕌', category: 'Evening' },
  { id: 'r15', title: 'Dinner', startTime: '20:00', endTime: '20:30', icon: '🍲', category: 'Evening' },
  { id: 'r18', title: 'Planning & Finances', startTime: '20:45', endTime: '21:15', icon: '📊', category: 'Evening' },
  { id: 'r20', title: 'Night Hygiene', startTime: '21:40', endTime: '22:00', icon: '🧼', category: 'Evening' },
];

const DEFAULT_CHECKLIST: DailyChecklistItem[] = [
  { id: 'c1', category: 'Work', label: 'Most important task today', completed: false },
  { id: 'c2', category: 'Work', label: 'Second priority', completed: false },
  { id: 'c3', category: 'Work', label: 'Meetings / deadlines', completed: false },
  { id: 'c4', category: 'Work', label: 'Follow-ups', completed: false },
  { id: 'c5', category: 'Health', label: 'Exercise completed', completed: false },
  { id: 'c6', category: 'Health', label: 'Healthy meals', completed: false },
  { id: 'c7', category: 'Health', label: 'Hydration', completed: false },
  { id: 'c8', category: 'Health', label: 'Hygiene routines done', completed: false },
  { id: 'c9', category: 'Family', label: 'Quality time with family', completed: false },
  { id: 'c10', category: 'Family', label: 'Connect with friend', completed: false },
  { id: 'c11', category: 'Growth', label: 'Reading / learning', completed: false },
  { id: 'c12', category: 'Growth', label: 'Skill improvement', completed: false },
  { id: 'c13', category: 'Home', label: 'Purchasing / errands', completed: false },
  { id: 'c14', category: 'Home', label: 'Financial tracking', completed: false },
  { id: 'c15', category: 'Home', label: 'Plan tomorrow', completed: false },
];

const DEFAULT_STATE: AppState = {
  transactions: [],
  tasks: [],
  schedule: [],
  foodPlan: DAYS_OF_WEEK.reduce((acc, day) => ({
    ...acc,
    [day]: { breakfast: '', lunch: '', dinner: '', snacks: '' }
  }), {} as WeeklyFoodPlan),
  vehicleRecords: [],
  zakatGiven: 0,
  monthlySavingsTarget: 5000,
  userName: 'User',
  monthlyTargets: {},
  weeklyReflections: {},
  monthlyReflections: {},
  routineBlueprint: DEFAULT_ROUTINE,
  dailyChecklist: DEFAULT_CHECKLIST,
  eveningReview: { well: '', improve: '', gratitude: '' },
  prayerTimes: null
};

const Navigation = () => {
  const location = useLocation();
  const navItems = [
    { path: '/', icon: ICONS.Dashboard, label: 'Overview' },
    { path: '/schedule', icon: ICONS.Schedule, label: 'Schedule' },
    { path: '/finance', icon: ICONS.Finance, label: 'Finance' },
    { path: '/lifestyle', icon: ICONS.Food, label: 'Lifestyle' },
    { path: '/zakat', icon: ICONS.Zakat, label: 'Donation' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-xl border-t border-slate-200 px-2 pb-6 pt-2 flex justify-around items-center md:relative md:flex-col md:h-screen md:w-64 md:border-t-0 md:border-r md:px-4 md:py-8 md:bg-white md:pb-8 z-[100] shadow-[0_-8px_30px_rgba(0,0,0,0.04)] md:shadow-none">
      <div className="hidden md:block mb-10 px-4 w-full">
        <h1 className="text-2xl font-black text-emerald-600 tracking-tighter">FS4HOME</h1>
        <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Wealth & Lifestyle</p>
      </div>
      <div className="flex w-full justify-around md:flex-col md:gap-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`relative flex flex-col items-center gap-1 py-2 px-3 md:flex-row md:gap-3 md:px-5 md:py-3.5 md:w-full md:rounded-2xl transition-all duration-300 group ${
                isActive 
                  ? 'text-emerald-600 md:bg-emerald-50' 
                  : 'text-slate-400 hover:text-emerald-500 md:text-gray-500 md:hover:bg-slate-50'
              }`}
            >
              <div className={`relative transition-transform duration-300 ${isActive ? 'scale-110 -translate-y-0.5 md:translate-y-0 md:scale-100' : 'group-active:scale-90'}`}>
                <Icon className={`w-6 h-6 ${isActive ? 'stroke-[2.5px]' : 'stroke-[1.8px]'}`} />
                {isActive && (
                  <span className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-1 h-1 bg-emerald-600 rounded-full md:hidden animate-in zoom-in duration-300" />
                )}
              </div>
              <span className={`text-[9px] font-black uppercase tracking-tight md:text-sm md:normal-case md:font-bold transition-all ${isActive ? 'opacity-100' : 'opacity-70 group-hover:opacity-100'}`}>
                {item.label}
              </span>
              {isActive && (
                <div className="hidden md:block absolute left-0 w-1.5 h-6 bg-emerald-600 rounded-r-full" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

const App: React.FC = () => {
  const [state, setState] = useState<AppState>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    const parsed = saved ? JSON.parse(saved) : DEFAULT_STATE;
    return { ...DEFAULT_STATE, ...parsed };
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const addMinutes = (time: string, minutes: number): string => {
    const [h, m] = time.split(':').map(Number);
    const date = new Date();
    date.setHours(h, m + minutes, 0);
    return date.getHours().toString().padStart(2, '0') + ':' + date.getMinutes().toString().padStart(2, '0');
  };

  const getDuration = (start: string, end: string): number => {
    const [sH, sM] = start.split(':').map(Number);
    const [eH, eM] = end.split(':').map(Number);
    let startMin = sH * 60 + sM;
    let endMin = eH * 60 + eM;
    if (endMin < startMin) endMin += 1440; // Over midnight
    return endMin - startMin;
  };

  const syncRoutineTimes = (phases: RoutinePhase[]): RoutinePhase[] => {
    if (phases.length === 0) return phases;
    const synced = [...phases];
    
    for (let i = 0; i < synced.length; i++) {
      const prev = synced[i-1];
      const curr = synced[i];
      
      if (prev) {
        const duration = getDuration(curr.startTime, curr.endTime);
        curr.startTime = prev.endTime;
        curr.endTime = addMinutes(prev.endTime, duration);
      }
      
      if (curr.subsections && curr.subsections.length > 0) {
        let subStartTime = curr.startTime;
        curr.subsections = curr.subsections.map((sub, sIdx) => {
          const subDuration = getDuration(sub.startTime, sub.endTime);
          const newSub = {
            ...sub,
            startTime: subStartTime,
            endTime: addMinutes(subStartTime, subDuration)
          };
          subStartTime = newSub.endTime;
          return newSub;
        });
        
        const lastSubEnd = curr.subsections[curr.subsections.length - 1].endTime;
        if (getDuration(curr.startTime, curr.endTime) < getDuration(curr.startTime, lastSubEnd)) {
          curr.endTime = lastSubEnd;
        }
      }
    }
    return synced;
  };

  useEffect(() => {
    const loadPrayers = async () => {
      const prayers = await fetchPrayerTimes();
      if (prayers) {
        setState(prev => {
          const updatedRoutine = prev.routineBlueprint.map(phase => {
            if (phase.id === 'prayer-fajr') return { ...phase, startTime: prayers.fajr, endTime: addMinutes(prayers.fajr, 30) };
            if (phase.id === 'prayer-dhuhr') return { ...phase, startTime: prayers.dhuhr, endTime: addMinutes(prayers.dhuhr, 10) };
            if (phase.id === 'prayer-asr') return { ...phase, startTime: prayers.asr, endTime: addMinutes(prayers.asr, 10) };
            if (phase.id === 'prayer-maghrib') return { ...phase, startTime: prayers.maghrib, endTime: addMinutes(prayers.maghrib, 15) };
            if (phase.id === 'prayer-isha') return { ...phase, startTime: prayers.isha, endTime: addMinutes(prayers.isha, 15) };
            return phase;
          });
          return { ...prev, prayerTimes: prayers, routineBlueprint: updatedRoutine };
        });
      }
    };
    loadPrayers();
  }, []);

  const addTransaction = (t: Omit<Transaction, 'id'>) => {
    const newT = { ...t, id: crypto.randomUUID() };
    setState(prev => ({ ...prev, transactions: [newT, ...prev.transactions] }));
  };

  const updateTransaction = (updatedT: Transaction) => {
    setState(prev => ({
      ...prev,
      transactions: prev.transactions.map(t => t.id === updatedT.id ? updatedT : t)
    }));
  };

  const deleteTransaction = (id: string) => {
    setState(prev => ({
      ...prev,
      transactions: prev.transactions.filter(t => t.id !== id)
    }));
  };

  const addTask = (task: Omit<Task, 'id'>) => {
    setState(prev => ({ ...prev, tasks: [...prev.tasks, { ...task, id: crypto.randomUUID() }] }));
  };

  const updateFoodPlan = (day: string, meal: string, value: string) => {
    setState(prev => ({
      ...prev,
      foodPlan: {
        ...prev.foodPlan,
        [day]: { ...prev.foodPlan[day], [meal]: value }
      }
    }));
  };

  const addVehicleRecord = (record: Omit<VehicleRecord, 'id'>) => {
    setState(prev => ({ ...prev, vehicleRecords: [...prev.vehicleRecords, { ...record, id: crypto.randomUUID() }] }));
  };

  const updateUserName = (name: string) => {
    setState(prev => ({ ...prev, userName: name }));
  };

  const updateMonthlyCategoryTarget = (monthKey: string, category: KakeiboCategory, target: CategoryTarget) => {
    setState(prev => {
      const existingMonthly = prev.monthlyTargets[monthKey] || {};
      return {
        ...prev,
        monthlyTargets: {
          ...prev.monthlyTargets,
          [monthKey]: {
            ...existingMonthly,
            [category]: target
          }
        }
      };
    });
  };

  const updateReflection = (type: 'weekly' | 'monthly', key: string, reflection: Reflection) => {
    setState(prev => ({
      ...prev,
      [type === 'weekly' ? 'weeklyReflections' : 'monthlyReflections']: {
        ...prev[type === 'weekly' ? 'weeklyReflections' : 'monthlyReflections'],
        [key]: reflection
      }
    }));
  };

  const addScheduleItem = (item: Omit<ScheduleItem, 'id'>) => {
    setState(prev => ({ ...prev, schedule: [...prev.schedule, { ...item, id: crypto.randomUUID() }] }));
  };

  const deleteScheduleItem = (id: string) => {
    setState(prev => ({ ...prev, schedule: prev.schedule.filter(s => s.id !== id) }));
  };

  const updateRoutinePhase = (id: string, updates: Partial<RoutinePhase>) => {
    setState(prev => {
      const newBlueprint = prev.routineBlueprint.map(r => r.id === id ? { ...r, ...updates } : r);
      return {
        ...prev,
        routineBlueprint: syncRoutineTimes(newBlueprint)
      };
    });
  };

  const addRoutineSubsection = (phaseId: string) => {
    setState(prev => {
      const newBlueprint = prev.routineBlueprint.map(phase => {
        if (phase.id === phaseId) {
          const subs = phase.subsections || [];
          const lastSub = subs[subs.length - 1];
          const startTime = lastSub ? lastSub.endTime : phase.startTime;
          const newSub: RoutineSubsection = {
            id: crypto.randomUUID(),
            title: 'New Sub-activity',
            icon: '📍',
            startTime: startTime,
            endTime: addMinutes(startTime, 15)
          };
          return { ...phase, subsections: [...subs, newSub] };
        }
        return phase;
      });
      return { ...prev, routineBlueprint: syncRoutineTimes(newBlueprint) };
    });
  };

  const deleteRoutineSubsection = (phaseId: string, subId: string) => {
    setState(prev => {
      const newBlueprint = prev.routineBlueprint.map(phase => {
        if (phase.id === phaseId) {
          return { ...phase, subsections: phase.subsections?.filter(s => s.id !== subId) };
        }
        return phase;
      });
      return { ...prev, routineBlueprint: syncRoutineTimes(newBlueprint) };
    });
  };

  const updateRoutineSubsection = (phaseId: string, subId: string, updates: Partial<RoutineSubsection>) => {
    setState(prev => {
      const newBlueprint = prev.routineBlueprint.map(phase => {
        if (phase.id === phaseId) {
          return {
            ...phase,
            subsections: phase.subsections?.map(s => s.id === subId ? { ...s, ...updates } : s)
          };
        }
        return phase;
      });
      return { ...prev, routineBlueprint: syncRoutineTimes(newBlueprint) };
    });
  };

  const addRoutinePhase = () => {
    setState(prev => {
      const lastPhase = prev.routineBlueprint[prev.routineBlueprint.length - 1];
      const newPhase: RoutinePhase = {
        id: crypto.randomUUID(),
        title: 'New Activity',
        startTime: lastPhase?.endTime || '09:00',
        endTime: addMinutes(lastPhase?.endTime || '09:00', 30),
        icon: '📋',
        category: 'Work',
        subsections: []
      };
      return { ...prev, routineBlueprint: [...prev.routineBlueprint, newPhase] };
    });
  };

  const deleteRoutinePhase = (id: string) => {
    setState(prev => {
      const filtered = prev.routineBlueprint.filter(r => r.id !== id);
      return { ...prev, routineBlueprint: syncRoutineTimes(filtered) };
    });
  };

  const reorderRoutine = (fromIndex: number, toIndex: number) => {
    setState(prev => {
      const newBlueprint = [...prev.routineBlueprint];
      const [movedItem] = newBlueprint.splice(fromIndex, 1);
      newBlueprint.splice(toIndex, 0, movedItem);
      return { ...prev, routineBlueprint: syncRoutineTimes(newBlueprint) };
    });
  };

  const toggleChecklistItem = (id: string) => {
    setState(prev => ({
      ...prev,
      dailyChecklist: prev.dailyChecklist.map(c => c.id === id ? { ...c, completed: !c.completed } : c)
    }));
  };

  const updateEveningReview = (key: keyof AppState['eveningReview'], val: string) => {
    setState(prev => ({
      ...prev,
      eveningReview: { ...prev.eveningReview, [key]: val }
    }));
  };

  return (
    <Router>
      <div className="flex flex-col md:flex-row min-h-screen bg-slate-50 text-slate-900 overflow-x-hidden">
        <Navigation />
        <main className="flex-1 pb-24 md:pb-0 p-4 md:p-8 lg:p-12 overflow-y-auto">
          <Routes>
            <Route path="/" element={<Dashboard state={state} onUpdateUser={updateUserName} />} />
            <Route path="/schedule" element={
              <Schedule 
                state={state} 
                onAddSchedule={addScheduleItem} 
                onDeleteSchedule={deleteScheduleItem} 
                onUpdateRoutine={updateRoutinePhase}
                onAddRoutinePhase={addRoutinePhase}
                onDeleteRoutinePhase={deleteRoutinePhase}
                onAddRoutineSubsection={addRoutineSubsection}
                onDeleteRoutineSubsection={deleteRoutineSubsection}
                onUpdateRoutineSubsection={updateRoutineSubsection}
                onReorderRoutine={reorderRoutine}
                onToggleChecklist={toggleChecklistItem}
                onUpdateReview={updateEveningReview}
              />
            } />
            <Route path="/finance" element={
              <Transactions 
                state={state} 
                onAddTransaction={addTransaction} 
                onUpdateTransaction={updateTransaction}
                onDeleteTransaction={deleteTransaction}
                onUpdateTarget={(val) => setState(prev => ({...prev, monthlySavingsTarget: val}))} 
                onUpdateMonthlyCategoryTarget={updateMonthlyCategoryTarget}
                onUpdateReflection={updateReflection}
              />
            } />
            <Route path="/lifestyle" element={<Lifestyle state={state} onAddTask={addTask} onUpdateFood={updateFoodPlan} onAddVehicle={addVehicleRecord} />} />
            <Route path="/zakat" element={<Zakat state={state} onUpdateGiven={(val) => setState(prev => ({...prev, zakatGiven: val}))} />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
};

export default App;
