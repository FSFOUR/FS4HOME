
import React, { useState, useMemo, useEffect } from 'react';
import { AppState, ScheduleItem, Priority, RoutinePhase, RoutineSubsection, DailyChecklistItem, PrayerTimes } from '../types';

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

const CATEGORY_COLORS = {
  Routine: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-700',
  'Deep Work': 'bg-blue-500/10 border-blue-500/20 text-blue-700',
  Family: 'bg-rose-500/10 border-rose-500/20 text-rose-700',
  House: 'bg-amber-500/10 border-amber-500/20 text-amber-700',
  Personal: 'bg-slate-500/10 border-slate-500/20 text-slate-700',
};

const PHASE_THEMES = {
  Sleep: 'border-indigo-500/20 bg-indigo-50/30 text-indigo-900',
  Morning: 'border-amber-500/20 bg-amber-50/30 text-amber-900',
  Work: 'border-blue-500/20 bg-blue-50/30 text-blue-900',
  Commute: 'border-slate-500/20 bg-slate-50/30 text-slate-900',
  Evening: 'border-emerald-500/20 bg-emerald-50/30 text-emerald-900',
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

  const hours = Array.from({ length: 24 }, (_, i) => i);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title) return;
    onAddSchedule(formData);
    setFormData({ ...formData, title: '' });
  };

  const getPositionForTime = (timeStr: string) => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 64 + (minutes / 60) * 64;
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
      { name: 'Fajr', time: state.prayerTimes.fajr },
      { name: 'Dhuhr', time: state.prayerTimes.dhuhr },
      { name: 'Asr', time: state.prayerTimes.asr },
      { name: 'Maghrib', time: state.prayerTimes.maghrib },
      { name: 'Isha', time: state.prayerTimes.isha },
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

  return (
    <div className="max-w-7xl mx-auto space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-24">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl md:text-4xl font-black text-slate-800 tracking-tight">Daily Schedule</h2>
          <p className="text-xs md:text-sm text-slate-400 font-bold uppercase tracking-widest mt-1">Master Your Time • Rule Your Day</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-4">
          {nextPrayer && (
            <div className="bg-emerald-50 border border-emerald-100 px-4 py-2 rounded-2xl flex items-center gap-3">
              <div className="bg-emerald-600 text-white p-1.5 rounded-lg shadow-sm">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </div>
              <div>
                <p className="text-[10px] font-black text-emerald-600 uppercase tracking-tighter">Next Salah</p>
                <p className="text-sm font-black text-slate-800">{nextPrayer.name} at {nextPrayer.time}</p>
              </div>
            </div>
          )}
          <div className="bg-white px-6 py-3 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-lg font-black text-slate-800">
              {currentTime.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}
            </span>
          </div>
        </div>
      </header>

      {state.prayerTimes && (
        <section className="bg-gradient-to-br from-emerald-900 to-emerald-950 text-white rounded-[2.5rem] p-8 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32 blur-[80px]" />
          <div className="relative z-10">
            <div className="flex justify-between items-center mb-8">
               <div>
                 <h3 className="text-xl font-black uppercase tracking-widest text-emerald-400">Prayer Times</h3>
                 <p className="text-[10px] font-bold text-emerald-500/60 uppercase tracking-widest mt-1">Kerala, India (IST)</p>
               </div>
               <div className="bg-emerald-500/10 border border-emerald-500/20 px-4 py-2 rounded-xl text-center">
                 <p className="text-[9px] font-black uppercase text-emerald-400">Current Date</p>
                 <p className="text-sm font-black">{new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</p>
               </div>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
              {[
                { name: 'Fajr', time: state.prayerTimes.fajr, icon: '🌘' },
                { name: 'Sunrise', time: state.prayerTimes.sunrise, icon: '🌅' },
                { name: 'Dhuhr', time: state.prayerTimes.dhuhr, icon: '☀️' },
                { name: 'Asr', time: state.prayerTimes.asr, icon: '⛅' },
                { name: 'Maghrib', time: state.prayerTimes.maghrib, icon: '🌇' },
                { name: 'Isha', time: state.prayerTimes.isha, icon: '🌃' },
              ].map(p => (
                <div key={p.name} className={`bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col items-center group hover:bg-white/10 transition-all cursor-pointer ${nextPrayer?.name === p.name ? 'ring-2 ring-emerald-500 bg-white/10 shadow-lg' : ''}`} onClick={() => handleSyncPrayer(p.name, p.time)}>
                  <span className="text-xl mb-2">{p.icon}</span>
                  <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">{p.name}</p>
                  <p className="text-lg font-black mt-1">{p.time}</p>
                  <button className="mt-3 opacity-0 group-hover:opacity-100 text-[8px] font-black bg-emerald-500 text-white px-2 py-1 rounded transition-all">SYNC TO DAY</button>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="space-y-6">
          <section className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
            <h3 className="font-black text-slate-800 uppercase tracking-tight mb-6">Block Time</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Activity Name</label>
                <input 
                  type="text" 
                  className="w-full px-4 py-3 rounded-xl border border-slate-100 bg-slate-50 focus:bg-white focus:ring-4 focus:ring-emerald-500/5 outline-none font-bold text-sm"
                  placeholder="e.g., Morning Run, Work Block"
                  value={formData.title}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Start</label>
                  <input type="time" className="w-full px-4 py-3 rounded-xl border border-slate-100 bg-slate-50 focus:bg-white outline-none font-bold text-sm" value={formData.startTime} onChange={e => setFormData({ ...formData, startTime: e.target.value })} />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">End</label>
                  <input type="time" className="w-full px-4 py-3 rounded-xl border border-slate-100 bg-slate-50 focus:bg-white outline-none font-bold text-sm" value={formData.endTime} onChange={e => setFormData({ ...formData, endTime: e.target.value })} />
                </div>
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Category</label>
                <select className="w-full px-4 py-3 rounded-xl border border-slate-100 bg-white outline-none font-bold text-sm cursor-pointer" value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value as any })}>
                  <option>Routine</option>
                  <option>Deep Work</option>
                  <option>Family</option>
                  <option>House</option>
                  <option>Personal</option>
                </select>
              </div>
              <button type="submit" className="w-full bg-emerald-600 text-white font-black py-4 rounded-xl hover:bg-emerald-700 transition-all shadow-lg active:scale-95 uppercase tracking-widest text-xs">Add to Timeline</button>
            </form>
          </section>
        </div>

        <div className="lg:col-span-2">
          <div className="bg-white rounded-[3rem] border border-slate-100 shadow-sm overflow-hidden flex flex-col h-[700px]">
             <div className="p-6 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
                <h3 className="font-black text-slate-800 uppercase tracking-tight">Active Timeline</h3>
             </div>
             <div className="flex-1 overflow-y-auto no-scrollbar relative p-8">
                <div className="absolute top-8 left-8 bottom-8 w-16 pointer-events-none">
                  {hours.map(hour => (
                    <div key={hour} className="h-16 flex items-start border-t border-slate-50 pt-2">
                      <span className="text-[10px] font-black text-slate-300 uppercase">{hour === 0 ? '12 AM' : hour > 12 ? `${hour - 12} PM` : hour === 12 ? '12 PM' : `${hour} AM`}</span>
                    </div>
                  ))}
                </div>
                <div className="ml-20 relative h-[1536px]">
                   {hours.map(hour => <div key={hour} className="absolute w-full h-px bg-slate-50" style={{ top: `${hour * 64}px` }} />)}
                   <div className="absolute left-0 right-0 h-0.5 bg-rose-500 z-20 flex items-center" style={{ top: `${getPositionForTime(`${currentTime.getHours()}:${currentTime.getMinutes()}`)}px` }}>
                     <div className="w-2 h-2 rounded-full bg-rose-500 -ml-1 shadow-lg" />
                   </div>
                   {state.schedule.map(item => {
                     const top = getPositionForTime(item.startTime);
                     const bottom = getPositionForTime(item.endTime);
                     const height = Math.max(bottom - top, 40);
                     return (
                       <div key={item.id} className={`absolute left-4 right-4 p-4 rounded-2xl border-l-4 shadow-sm transition-all hover:scale-[1.01] flex justify-between items-start ${CATEGORY_COLORS[item.category]}`} style={{ top: `${top}px`, height: `${height}px` }}>
                         <div><h4 className="font-black text-sm">{item.title}</h4><p className="text-[10px] opacity-70 font-bold">{item.startTime} — {item.endTime}</p></div>
                         <button onClick={() => onDeleteSchedule(item.id)} className="p-1 hover:bg-black/5 rounded-lg transition-all"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg></button>
                       </div>
                     );
                   })}
                </div>
             </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-12 pt-8 border-t border-slate-200">
        
        <div className="space-y-8">
           <div className="flex justify-between items-end">
             <div>
               <h3 className="text-3xl font-black text-slate-800 tracking-tight">Ideal Routine Blueprint</h3>
               <p className="text-sm text-slate-400 font-bold uppercase tracking-widest mt-2">Adjust your rhythms • Click items to manage subsections</p>
             </div>
             <button 
               onClick={onAddRoutinePhase}
               className="bg-emerald-600 text-white p-3 rounded-2xl hover:bg-emerald-700 transition-all shadow-lg active:scale-95"
               title="Add New Phase"
             >
               <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" /></svg>
             </button>
           </div>
           
           <div className="space-y-4">
              {state.routineBlueprint.map((phase, index) => {
                const isExpanded = expandedPhases.has(phase.id);
                return (
                  <div key={phase.id} className="space-y-3">
                    <div 
                      draggable={true}
                      onDragStart={() => handleDragStart(index)}
                      onDragOver={(e) => handleDragOver(e, index)}
                      onDragEnd={handleDragEnd}
                      onClick={() => togglePhaseExpansion(phase.id)}
                      className={`group flex items-center gap-4 p-5 rounded-[1.75rem] border-2 transition-all hover:shadow-md cursor-pointer relative ${draggedIndex === index ? 'opacity-40 scale-95 border-emerald-400 border-dashed' : PHASE_THEMES[phase.category]}`}
                    >
                      <div className="w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center text-2xl shrink-0 transition-transform group-hover:scale-105">
                        {phase.icon}
                      </div>
                      
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <input 
                            className="bg-transparent font-black text-sm md:text-base tracking-tight outline-none focus:bg-white/20 rounded px-1 w-full"
                            value={phase.title}
                            onClick={(e) => e.stopPropagation()}
                            onChange={e => onUpdateRoutine(phase.id, { title: e.target.value })}
                          />
                          {phase.subsections && phase.subsections.length > 0 && (
                            <span className="bg-white/40 text-[9px] font-black px-1.5 py-0.5 rounded-full uppercase">
                              {phase.subsections.length} Sub
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] font-bold uppercase opacity-60">{phase.category}</p>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="bg-slate-200/40 px-4 py-2 rounded-2xl flex items-center gap-2 border border-black/5 shadow-inner">
                          <span className="text-[11px] font-black tabular-nums">{phase.startTime}</span>
                          <span className="text-slate-400 text-xs">→</span>
                          <span className="text-[11px] font-black tabular-nums">{phase.endTime}</span>
                        </div>
                        
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                           <button 
                             onClick={(e) => { e.stopPropagation(); onAddRoutineSubsection(phase.id); if(!isExpanded) togglePhaseExpansion(phase.id); }} 
                             className="p-2 bg-white rounded-xl shadow-sm hover:text-emerald-600 border border-slate-100"
                             title="Add Subsection"
                           >
                             <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" /></svg>
                           </button>
                           <button onClick={(e) => { e.stopPropagation(); onDeleteRoutinePhase(phase.id); }} className="p-2 bg-white rounded-xl shadow-sm hover:text-rose-600 border border-slate-100">
                             <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                           </button>
                        </div>
                      </div>
                    </div>

                    {/* Subsections List - Conditional Render based on expanded state */}
                    {isExpanded && phase.subsections && (
                      <div className="ml-16 space-y-2 animate-in slide-in-from-top-2 fade-in duration-300">
                        {phase.subsections.map(sub => (
                          <div key={sub.id} className="flex items-center gap-4 p-4 bg-white/60 border border-slate-200/50 rounded-2xl group/sub shadow-sm transition-all hover:bg-white">
                            <div className="w-9 h-9 rounded-xl bg-white shadow-xs flex items-center justify-center text-lg shrink-0">
                               {sub.icon}
                            </div>
                            <div className="flex-1 flex items-center justify-between">
                               <div>
                                 <input 
                                   className="bg-transparent font-bold text-sm outline-none focus:bg-slate-100 rounded px-1 w-full"
                                   value={sub.title}
                                   onChange={e => onUpdateRoutineSubsection(phase.id, sub.id, { title: e.target.value })}
                                 />
                                 <p className="text-[9px] font-black text-slate-400 uppercase">{phase.category}</p>
                               </div>
                               <div className="flex items-center gap-3">
                                  <div className="bg-slate-100/80 px-3 py-1.5 rounded-xl border border-slate-200/50 text-[10px] font-black tabular-nums flex items-center gap-1.5 shadow-xs">
                                    {sub.startTime} <span className="opacity-30">→</span> {sub.endTime}
                                  </div>
                                  <button onClick={() => onDeleteRoutineSubsection(phase.id, sub.id)} className="opacity-0 group-hover/sub:opacity-100 p-1.5 hover:text-rose-500 transition-all">
                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
                                  </button>
                               </div>
                            </div>
                          </div>
                        ))}
                        {phase.subsections.length === 0 && (
                          <div className="text-center py-4 border border-dashed border-slate-200 rounded-2xl">
                             <p className="text-[10px] font-black text-slate-400 uppercase">No subsections yet.</p>
                             <button 
                               onClick={() => onAddRoutineSubsection(phase.id)}
                               className="mt-1 text-emerald-600 font-black text-[10px] uppercase hover:underline"
                             >
                               + Add First Subsection
                             </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
              <button 
                onClick={onAddRoutinePhase}
                className="w-full border-2 border-dashed border-slate-200 py-8 rounded-[2rem] text-slate-400 font-black uppercase text-xs hover:border-emerald-300 hover:text-emerald-500 transition-all flex items-center justify-center gap-2 group"
              >
                <svg className="w-4 h-4 group-hover:scale-125 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" /></svg>
                Append New Phase
              </button>
           </div>
        </div>

        <div className="space-y-10">
          <div>
            <h3 className="text-3xl font-black text-slate-800 tracking-tight">Daily To-Do Checklist</h3>
            <p className="text-sm text-slate-400 font-bold uppercase tracking-widest mt-2">Balanced living requires deliberate action</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             {(Object.entries(checklistGroups) as [string, DailyChecklistItem[]][]).map(([cat, items]) => (
               <div key={cat} className="bg-slate-50/50 p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col space-y-6">
                  <div className="flex items-center gap-3 border-b border-slate-200/50 pb-4">
                    <div className="w-8 h-8 rounded-xl bg-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-900/10">
                       <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                    </div>
                    <h4 className="font-black text-slate-800 uppercase tracking-widest text-xs">{cat} Priorities</h4>
                  </div>
                  <div className="space-y-4 flex-1">
                    {items.map(item => (
                      <div key={item.id} className="flex items-start gap-3 group cursor-pointer" onClick={() => onToggleChecklist(item.id)}>
                        <div className={`mt-1 w-5 h-5 rounded-lg border-2 flex items-center justify-center transition-all ${item.completed ? 'bg-emerald-500 border-emerald-500' : 'bg-white border-slate-200 group-hover:border-emerald-300'}`}>
                          {item.completed && <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 13l4 4L19 7" /></svg>}
                        </div>
                        <p className={`text-sm font-bold leading-tight transition-all ${item.completed ? 'text-slate-300 line-through decoration-emerald-500/50' : 'text-slate-700'}`}>{item.label}</p>
                      </div>
                    ))}
                  </div>
               </div>
             ))}
          </div>

          <div className="bg-[#0F172A] text-white p-10 rounded-[3rem] shadow-2xl relative overflow-hidden">
             <div className="absolute top-0 right-0 p-8 opacity-10"><svg className="w-24 h-24" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1.1 16.01L7 13.11l1.41-1.41 4.7 4.71 7.3-7.31L21.82 10.5l-8.72 8.51z"/></svg></div>
             <div className="relative z-10 space-y-8">
                <h4 className="text-xl font-black uppercase tracking-widest border-b border-white/10 pb-4">Evening Reflection</h4>
                <div className="grid grid-cols-1 gap-6">
                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">What went well today?</label>
                      <textarea className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm font-medium outline-none focus:bg-white/10 transition-all resize-none h-20" placeholder="Capture your wins..." value={state.eveningReview.well} onChange={e => onUpdateReview('well', e.target.value)} />
                   </div>
                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">What to improve tomorrow?</label>
                      <textarea className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm font-medium outline-none focus:bg-white/10 transition-all resize-none h-20" placeholder="Continuous improvement mindset..." value={state.eveningReview.improve} onChange={e => onUpdateReview('improve', e.target.value)} />
                   </div>
                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Gratitude Note</label>
                      <textarea className="w-full bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4 text-sm font-medium outline-none focus:bg-emerald-500/20 transition-all resize-none h-20 placeholder-emerald-800" placeholder="Focus on the Barakah..." value={state.eveningReview.gratitude} onChange={e => onUpdateReview('gratitude', e.target.value)} />
                   </div>
                </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Schedule;
