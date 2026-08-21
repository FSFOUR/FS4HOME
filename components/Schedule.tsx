import React, { useState, useMemo, useEffect } from 'react';
import { AppState, ScheduleItem, RoutinePhase, RoutineSubsection, DailyChecklistItem } from '../types';

interface Props {
  state: AppState;
  onAddSchedule: (item: Omit<ScheduleItem, 'id'>) => void;
  onDeleteSchedule: (id: string) => void;
  onUpdateRoutine: (id: string, updates: Partial<RoutinePhase>) => void;
  onAddRoutinePhase: () => void;
  onDeleteRoutinePhase: (id: string) => void;
  onAddRoutineSubsection: (phaseId: string) => void;
  onDeleteRoutineSubsection: (phaseId: string, subId: string) => void;
  onUpdateRoutineSubsection: (phaseId: string, subId: string, updates: Partial<RoutineSubsection>) => void;
  onReorderRoutine: (fromIndex: number, toIndex: number) => void;
  onToggleChecklist: (id: string) => void;
  onUpdateReview: (key: keyof AppState['eveningReview'], val: string) => void;
}

const CATEGORY_COLORS: Record<string, string> = {
  Routine: 'bg-emerald-950/80 border-emerald-500/30 text-emerald-300',
  'Deep Work': 'bg-blue-950/80 border-blue-500/30 text-blue-300',
  Family: 'bg-rose-950/80 border-rose-500/30 text-rose-300',
  House: 'bg-amber-950/80 border-amber-500/30 text-amber-300',
  Personal: 'bg-slate-900/80 border-slate-600/30 text-slate-300',
};

const PHASE_THEMES: Record<string, string> = {
  Sleep: 'border-indigo-500/30 bg-indigo-950/40 text-indigo-200',
  Morning: 'border-amber-500/30 bg-amber-950/40 text-amber-200',
  Work: 'border-blue-500/30 bg-blue-950/40 text-blue-200',
  Commute: 'border-slate-500/30 bg-slate-900/40 text-slate-200',
  Evening: 'border-emerald-500/30 bg-emerald-950/40 text-emerald-200',
};

const Schedule: React.FC<Props> = ({ 
  state, 
  onAddSchedule, 
  onDeleteSchedule, 
  onUpdateRoutine, 
  onAddRoutinePhase,
  onDeleteRoutinePhase,
  onAddRoutineSubsection,
  onDeleteRoutineSubsection,
  onUpdateRoutineSubsection,
  onReorderRoutine,
  onToggleChecklist, 
  onUpdateReview 
}) => {
  const [activeTab, setActiveTab] = useState<'timeline' | 'blueprint' | 'checklist'>('timeline');
  const [formData, setFormData] = useState<Omit<ScheduleItem, 'id'>>({
    title: '',
    startTime: '08:00',
    endTime: '09:00',
    category: 'Routine'
  });

  const [currentTime, setCurrentTime] = useState(new Date());
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [expandedPhases, setExpandedPhases] = useState<Set<string>>(new Set());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000); 
    return () => clearInterval(timer);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title) return;
    onAddSchedule(formData);
    setFormData({ ...formData, title: '' });
  };

  const checklistGroups = useMemo<Record<string, DailyChecklistItem[]>>(() => {
    const groups: Record<string, DailyChecklistItem[]> = {};
    if (state.dailyChecklist) {
      state.dailyChecklist.forEach(item => {
        if (!groups[item.category]) groups[item.category] = [];
        groups[item.category].push(item);
      });
    }
    return groups;
  }, [state.dailyChecklist]);

  const nextPrayer = useMemo(() => {
    if (!state.prayerTimes || !state.prayerTimes.fajr || !state.prayerTimes.dhuhr) return null;
    const nowStr = currentTime.getHours().toString().padStart(2, '0') + ":" + currentTime.getMinutes().toString().padStart(2, '0');
    const times = [
      { name: 'Fajr', time: state.prayerTimes.fajr, icon: '🌘' },
      { name: 'Sunrise', time: state.prayerTimes.sunrise, icon: '🌅' },
      { name: 'Dhuhr', time: state.prayerTimes.dhuhr, icon: '☀️' },
      { name: 'Asr', time: state.prayerTimes.asr, icon: '⛅' },
      { name: 'Maghrib', time: state.prayerTimes.maghrib, icon: '🌇' },
      { name: 'Isha', time: state.prayerTimes.isha, icon: '🌃' },
    ];
    
    let next = times.find(p => p.time > nowStr);
    if (!next) next = times[0]; 
    return next;
  }, [state.prayerTimes, currentTime]);

  const togglePhaseExpansion = (id: string) => {
    setExpandedPhases(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSyncPrayer = (name: string, time: string) => {
    const [h, m] = time.split(':').map(Number);
    const endH = m + 15 >= 60 ? h + 1 : h;
    const endM = (m + 15) % 60;
    const endTime = `${endH.toString().padStart(2, '0')}:${endM.toString().padStart(2, '0')}`;
    onAddSchedule({
      title: `${name} Prayer`,
      startTime: time,
      endTime: endTime,
      category: 'Routine'
    });
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;
    onReorderRoutine(draggedIndex, index);
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  // Sort schedule items by start time
  const sortedSchedule = useMemo(() => {
    return [...state.schedule].sort((a, b) => a.startTime.localeCompare(b.startTime));
  }, [state.schedule]);

  return (
    <div className="space-y-3.5 max-w-6xl mx-auto text-slate-100 animate-in fade-in duration-200 pb-16">
      
      {/* Header & Live Clock / Next Salah Mini-Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-emerald-500/20 pb-3">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-white tracking-tight">Schedule & Routine</h1>
          <p className="text-xs text-emerald-300/70">Time-blocking, daily prayer synchronization, and routine blueprint</p>
        </div>
        
        <div className="flex items-center gap-2">
          {nextPrayer && (
            <div className="px-2.5 py-1 rounded-lg bg-emerald-950/70 border border-emerald-500/30 flex items-center gap-1.5 text-xs">
              <span className="text-lime-400">🕌</span>
              <span className="text-[11px] text-emerald-300/80">Next:</span>
              <span className="font-black text-white">{nextPrayer.name} {nextPrayer.time}</span>
            </div>
          )}
          <div className="px-2.5 py-1 rounded-lg bg-emerald-950/70 border border-emerald-500/30 flex items-center gap-1.5 text-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-lime-400 animate-pulse" />
            <span className="font-mono font-bold text-lime-300">
              {currentTime.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}
            </span>
          </div>
        </div>
      </div>

      {/* Prayer Times Ribbon (Compact 6-column grid) */}
      {state.prayerTimes && (
        <div className="glass-card p-2.5 rounded-xl border border-emerald-500/20">
          <div className="flex items-center justify-between text-[11px] font-bold text-emerald-300/80 mb-1.5 px-1">
            <span className="flex items-center gap-1"><span>🕌</span> Daily Prayer Times (IST)</span>
            <span className="text-[10px] text-emerald-400/60 font-mono">Click to sync with timeline</span>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
            {[
              { name: 'Fajr', time: state.prayerTimes.fajr, icon: '🌘' },
              { name: 'Sunrise', time: state.prayerTimes.sunrise, icon: '🌅' },
              { name: 'Dhuhr', time: state.prayerTimes.dhuhr, icon: '☀️' },
              { name: 'Asr', time: state.prayerTimes.asr, icon: '⛅' },
              { name: 'Maghrib', time: state.prayerTimes.maghrib, icon: '🌇' },
              { name: 'Isha', time: state.prayerTimes.isha, icon: '🌃' },
            ].map(p => {
              const isNext = nextPrayer?.name === p.name;
              return (
                <button
                  key={p.name}
                  onClick={() => handleSyncPrayer(p.name, p.time)}
                  className={`p-1.5 rounded-lg border text-center transition-all flex flex-col items-center ${
                    isNext 
                      ? 'bg-lime-400/15 border-lime-400/50 text-white ring-1 ring-lime-400/40' 
                      : 'bg-emerald-950/40 border-emerald-500/15 hover:border-lime-400/30 text-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-300/80">
                    <span>{p.icon}</span>
                    <span>{p.name}</span>
                  </div>
                  <span className="text-xs font-black text-white font-mono mt-0.5">{p.time}</span>
                  <span className="text-[8px] text-lime-400 font-bold opacity-70 mt-0.5">+ Sync</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Sub-Navigation Tabs */}
      <div className="flex gap-1.5 p-1 rounded-xl bg-emerald-950/60 border border-emerald-500/20 text-xs">
        {[
          { id: 'timeline', label: 'Timeline & Time-Blocking', icon: '⏱️' },
          { id: 'blueprint', label: 'Routine Blueprint', icon: '📋' },
          { id: 'checklist', label: 'Checklist & Review', icon: '✅' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex-1 py-1.5 px-2 rounded-lg font-black text-xs flex items-center justify-center gap-1.5 transition-all ${
              activeTab === tab.id
                ? 'bg-lime-400 text-emerald-950 shadow-sm font-black'
                : 'text-emerald-300/70 hover:text-white'
            }`}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* TAB 1: TIMELINE & QUICK BLOCK TIME */}
      {activeTab === 'timeline' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          
          {/* Quick Block Time Form (1 col) */}
          <div className="glass-card p-3.5 rounded-2xl border border-emerald-500/20 space-y-3">
            <div className="flex items-center justify-between border-b border-emerald-500/15 pb-2">
              <h3 className="text-xs font-black text-white uppercase">Block Activity</h3>
              <span className="text-[10px] text-lime-400 font-bold">Fast entry</span>
            </div>

            <form onSubmit={handleSubmit} className="space-y-2.5 text-xs">
              <div>
                <label className="block text-[10px] font-bold text-emerald-300/70 uppercase mb-1">Activity Name</label>
                <input
                  type="text"
                  placeholder="e.g. Deep Work, Gym, Qur'an"
                  value={formData.title}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-2.5 py-1.5 bg-[#061f12] border border-emerald-500/30 rounded-lg text-white font-bold outline-none focus:border-lime-400 text-xs"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-bold text-emerald-300/70 uppercase mb-1">Start Time</label>
                  <input
                    type="time"
                    value={formData.startTime}
                    onChange={e => setFormData({ ...formData, startTime: e.target.value })}
                    className="w-full px-2 py-1.5 bg-[#061f12] border border-emerald-500/30 rounded-lg text-white font-bold outline-none focus:border-lime-400 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-emerald-300/70 uppercase mb-1">End Time</label>
                  <input
                    type="time"
                    value={formData.endTime}
                    onChange={e => setFormData({ ...formData, endTime: e.target.value })}
                    className="w-full px-2 py-1.5 bg-[#061f12] border border-emerald-500/30 rounded-lg text-white font-bold outline-none focus:border-lime-400 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-emerald-300/70 uppercase mb-1">Category</label>
                <select
                  value={formData.category}
                  onChange={e => setFormData({ ...formData, category: e.target.value as any })}
                  className="w-full px-2.5 py-1.5 bg-[#061f12] border border-emerald-500/30 rounded-lg text-white font-bold outline-none focus:border-lime-400 text-xs"
                >
                  <option>Routine</option>
                  <option>Deep Work</option>
                  <option>Family</option>
                  <option>House</option>
                  <option>Personal</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full py-2 rounded-xl bg-lime-400 text-emerald-950 text-xs font-black hover:bg-lime-300 shadow-sm glow-lime-sm transition-all"
              >
                + Add to Timeline
              </button>
            </form>
          </div>

          {/* Active Schedule List (2 cols) */}
          <div className="lg:col-span-2 glass-card p-3.5 rounded-2xl border border-emerald-500/20 space-y-2.5">
            <div className="flex items-center justify-between border-b border-emerald-500/15 pb-2">
              <div className="flex items-center gap-2">
                <h3 className="text-xs font-black text-white uppercase">Today's Schedule</h3>
                <span className="text-[10px] text-emerald-400/70">({sortedSchedule.length} blocks)</span>
              </div>
              <span className="text-[10px] text-emerald-300/60 font-mono">Sorted chronologically</span>
            </div>

            {sortedSchedule.length === 0 ? (
              <div className="text-center py-10 text-emerald-300/60 text-xs">
                No time blocks added for today. Use the form or click a prayer above to sync.
              </div>
            ) : (
              <div className="space-y-1.5 max-h-[460px] overflow-y-auto pr-1">
                {sortedSchedule.map(item => {
                  const catStyle = CATEGORY_COLORS[item.category] || CATEGORY_COLORS.Routine;
                  return (
                    <div
                      key={item.id}
                      className={`p-2.5 rounded-xl border flex items-center justify-between transition-colors ${catStyle}`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="px-2 py-1 rounded-md bg-black/40 border border-white/10 font-mono text-[11px] font-black text-white shrink-0">
                          {item.startTime} - {item.endTime}
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-xs font-bold text-white truncate">{item.title}</h4>
                          <span className="text-[9px] uppercase font-bold opacity-70">{item.category}</span>
                        </div>
                      </div>

                      <button
                        onClick={() => onDeleteSchedule(item.id)}
                        className="text-xs text-rose-400/80 hover:text-rose-300 font-bold p-1 shrink-0"
                        title="Delete block"
                      >
                        ✕
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: ROUTINE BLUEPRINT */}
      {activeTab === 'blueprint' && (
        <div className="glass-card p-3.5 md:p-4 rounded-2xl border border-emerald-500/20 space-y-3">
          <div className="flex items-center justify-between border-b border-emerald-500/15 pb-2">
            <div>
              <h3 className="text-xs md:text-sm font-black text-white">Ideal Routine Blueprint</h3>
              <p className="text-[10px] text-emerald-300/70">Drag to reorder • Click items to expand and manage subsections</p>
            </div>
            <button
              onClick={onAddRoutinePhase}
              className="px-2.5 py-1 rounded-lg bg-lime-400 text-emerald-950 text-xs font-black hover:bg-lime-300 transition-colors"
            >
              + Add Phase
            </button>
          </div>

          <div className="space-y-2">
            {state.routineBlueprint.map((phase, index) => {
              const isExpanded = expandedPhases.has(phase.id);
              const theme = PHASE_THEMES[phase.category] || PHASE_THEMES.Evening;

              return (
                <div key={phase.id} className="space-y-1.5">
                  <div
                    draggable={true}
                    onDragStart={() => handleDragStart(index)}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDragEnd={handleDragEnd}
                    onClick={() => togglePhaseExpansion(phase.id)}
                    className={`flex items-center justify-between p-2.5 rounded-xl border cursor-pointer transition-all ${
                      draggedIndex === index ? 'opacity-40 border-lime-400 border-dashed' : theme
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <span className="text-base shrink-0">{phase.icon}</span>
                      <div className="flex-1 min-w-0">
                        <input
                          className="bg-transparent font-bold text-xs text-white outline-none focus:bg-emerald-950/60 rounded px-1 w-full"
                          value={phase.title}
                          onClick={(e) => e.stopPropagation()}
                          onChange={e => onUpdateRoutine(phase.id, { title: e.target.value })}
                        />
                        <div className="flex items-center gap-2 text-[10px] text-emerald-300/70">
                          <span>{phase.category}</span>
                          {phase.subsections && phase.subsections.length > 0 && (
                            <span className="px-1.5 py-0.2 rounded bg-emerald-900/60 text-[9px] font-bold text-lime-400">
                              {phase.subsections.length} sub-tasks
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <div className="px-2 py-0.5 rounded bg-black/40 border border-white/10 text-[10px] font-mono font-black text-white">
                        {phase.startTime} → {phase.endTime}
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onAddRoutineSubsection(phase.id);
                          if (!isExpanded) togglePhaseExpansion(phase.id);
                        }}
                        className="px-1.5 py-0.5 rounded bg-emerald-900/60 hover:bg-emerald-800 text-lime-400 text-[10px] font-bold"
                        title="Add Subsection"
                      >
                        + Sub
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteRoutinePhase(phase.id);
                        }}
                        className="text-rose-400 hover:text-rose-300 text-xs p-0.5 font-bold"
                      >
                        ✕
                      </button>
                    </div>
                  </div>

                  {/* Subsections */}
                  {isExpanded && phase.subsections && (
                    <div className="ml-6 space-y-1.5 border-l-2 border-emerald-500/20 pl-3">
                      {phase.subsections.map(sub => (
                        <div
                          key={sub.id}
                          className="flex items-center justify-between p-2 rounded-lg bg-emerald-950/40 border border-emerald-500/10 text-xs"
                        >
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <span>{sub.icon}</span>
                            <input
                              className="bg-transparent font-medium text-xs text-white outline-none focus:bg-emerald-900/50 rounded px-1 flex-1"
                              value={sub.title}
                              onChange={e => onUpdateRoutineSubsection(phase.id, sub.id, { title: e.target.value })}
                            />
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-mono text-emerald-300/80">
                              {sub.startTime} - {sub.endTime}
                            </span>
                            <button
                              onClick={() => onDeleteRoutineSubsection(phase.id, sub.id)}
                              className="text-[10px] text-rose-400 hover:text-rose-300 font-bold"
                            >
                              ✕
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: CHECKLIST & EVENING REVIEW */}
      {activeTab === 'checklist' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {/* Priorities Checklist */}
          <div className="glass-card p-3.5 rounded-2xl border border-emerald-500/20 space-y-2.5">
            <div className="flex items-center justify-between border-b border-emerald-500/15 pb-2">
              <h3 className="text-xs font-black text-white uppercase">Daily Priorities Checklist</h3>
              <span className="text-[10px] text-lime-400 font-bold">Focus & Habit</span>
            </div>

            <div className="space-y-3">
              {(Object.entries(checklistGroups) as [string, DailyChecklistItem[]][]).map(([cat, items]) => (
                <div key={cat} className="space-y-1.5">
                  <span className="text-[10px] font-black uppercase text-emerald-400/80 tracking-wider block">
                    {cat}
                  </span>
                  <div className="space-y-1">
                    {items.map(item => (
                      <div
                        key={item.id}
                        onClick={() => onToggleChecklist(item.id)}
                        className="flex items-center gap-2 p-2 rounded-lg bg-emerald-950/40 border border-emerald-500/10 hover:border-lime-400/30 cursor-pointer transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={item.completed}
                          onChange={() => {}}
                          className="accent-lime-400 w-3.5 h-3.5 cursor-pointer"
                        />
                        <span className={`text-xs font-medium flex-1 ${item.completed ? 'line-through text-emerald-300/40' : 'text-white'}`}>
                          {item.label}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Evening Reflection */}
          <div className="glass-card p-3.5 rounded-2xl border border-emerald-500/20 space-y-2.5">
            <div className="flex items-center justify-between border-b border-emerald-500/15 pb-2">
              <h3 className="text-xs font-black text-white uppercase">Evening Reflection</h3>
              <span className="text-[10px] text-lime-400 font-bold">Muhasabah & Barakah</span>
            </div>

            <div className="space-y-2.5 text-xs">
              <div>
                <label className="block text-[10px] font-bold text-emerald-300/70 uppercase mb-1">What went well today?</label>
                <textarea
                  className="w-full bg-[#061f12] border border-emerald-500/30 rounded-lg p-2 text-xs font-medium text-white outline-none focus:border-lime-400 resize-none h-16"
                  placeholder="Wins, progress, completed tasks..."
                  value={state.eveningReview.well}
                  onChange={e => onUpdateReview('well', e.target.value)}
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-emerald-300/70 uppercase mb-1">What to improve tomorrow?</label>
                <textarea
                  className="w-full bg-[#061f12] border border-emerald-500/30 rounded-lg p-2 text-xs font-medium text-white outline-none focus:border-lime-400 resize-none h-16"
                  placeholder="Continuous incremental improvements..."
                  value={state.eveningReview.improve}
                  onChange={e => onUpdateReview('improve', e.target.value)}
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-emerald-300/70 uppercase mb-1">Gratitude & Barakah Note</label>
                <textarea
                  className="w-full bg-[#061f12] border border-emerald-500/30 rounded-lg p-2 text-xs font-medium text-white outline-none focus:border-lime-400 resize-none h-16"
                  placeholder="Alhamdulillah for..."
                  value={state.eveningReview.gratitude}
                  onChange={e => onUpdateReview('gratitude', e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Schedule;
