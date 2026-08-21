import React, { useState } from 'react';
import { AppState, Priority, Task, VehicleRecord } from '../types';
import { DAYS_OF_WEEK } from '../constants';

interface Props {
  state: AppState;
  onAddTask: (task: Omit<Task, 'id'>) => void;
  onUpdateFood: (day: string, meal: string, value: string) => void;
  onAddVehicle: (record: Omit<VehicleRecord, 'id'>) => void;
}

const Lifestyle: React.FC<Props> = ({ state, onAddTask, onUpdateFood, onAddVehicle }) => {
  const [activeTab, setActiveTab] = useState<'food' | 'ramadan' | 'tasks' | 'vehicle'>('food');
  const [activeRamadanSubTab, setActiveRamadanSubTab] = useState<'iftar' | 'suhoor' | 'iftar-plan' | 'suhoor-plan'>('iftar');
  const [selectedRecipe, setSelectedRecipe] = useState<{name: string, recipe: string} | null>(null);
  
  // Quick Task State
  const [taskTitle, setTaskTitle] = useState('');
  const [taskPriority, setTaskPriority] = useState(Priority.MEDIUM);

  // Quick Vehicle State
  const [vehData, setVehData] = useState({
    date: new Date().toISOString().split('T')[0],
    kilometers: 0,
    cost: 0,
    description: '',
    type: 'Fuel' as 'Fuel' | 'Service' | 'Repair'
  });

  const IFTAR_RECIPES = [
    {
      title: 'Malabar Unnakkaya',
      type: 'SNACK',
      desc: 'Steamed plantains stuffed with sweet coconut, cardamom, and nuts.',
      recipe: 'Steam and mash ripe Kerala plantains. Sauté coconut, sugar, cardamom, and cashews. Shape into spindles, fill, and lightly fry.',
      tag: 'Iftar Special'
    },
    {
      title: 'Thari Kanji',
      type: 'DRINK',
      desc: 'Comforting semolina milk porridge garnished with shallots and cashews.',
      recipe: 'Roast semolina. Boil in milk with cardamom and a pinch of salt. Temper shallots and cashews in ghee and pour over porridge.',
      tag: 'Hydrating'
    },
    {
      title: 'Erachi Pathiri',
      type: 'MAIN',
      desc: 'Layers of rice pancakes with spiced savory meat filling.',
      recipe: 'Make soft rice dough. Cook spiced minced meat with onions and pepper. Layer in dough disks and steam/shallow fry.',
      tag: 'Traditional'
    }
  ];

  const SUHOOR_RECIPES = [
    {
      title: 'Malabar Banana Oats',
      type: 'BREAKFAST',
      desc: 'Slow-release oats cooked in coconut milk with steamed Kerala bananas.',
      recipe: 'Cook rolled oats in coconut milk. Slice steamed Nendran bananas on top. Drizzle with honey and crushed almonds.',
      tag: 'High Energy'
    },
    {
      title: 'Healthy Veg Stew',
      type: 'MAIN',
      desc: 'Gentle coconut vegetable stew paired with steamed appams.',
      recipe: 'Simmer potatoes, carrots, and beans with ginger, green chilies, and coconut milk. Gentle on the fasting stomach.',
      tag: 'Balanced'
    },
    {
      title: 'Date & Nut Power Smoothie',
      type: 'DRINK',
      desc: 'Dense blend of organic dates, almonds, and milk for all-day stamina.',
      recipe: 'Blend 4 Medjool dates, 8 soaked almonds, 1 glass milk, and a pinch of cinnamon until smooth.',
      tag: 'Quick Prep'
    }
  ];

  const IFTAR_PLAN = [
    { day: 'Day 1', meal: 'Dates, Watermelon, Soup, Grilled Fish', recipe: 'Grill fish with turmeric, pepper, lemon. Serve with fresh cucumber salad.' },
    { day: 'Day 2', meal: 'Banana, Pineapple Salad, Chickpea Sundal', recipe: 'Steamed chickpea sundal with minimal coconut + 1 chapati.' },
    { day: 'Day 3', meal: 'Papaya, Lentil Soup, Veg Stir Fry + Egg', recipe: 'Light lentil soup, mixed vegetable thoran, 1 boiled egg.' },
    { day: 'Day 4', meal: 'Watermelon Juice, Sprouted Salad, Red Rice', recipe: 'Fresh sugar-free watermelon juice, red rice, and ash gourd curry.' },
    { day: 'Day 5', meal: 'Dates, Tender Coconut, Mango Chaat, Paneer', recipe: 'Fruit chaat with lemon-pepper dressing and grilled paneer/chicken.' },
    { day: 'Day 6', meal: 'Banana, Almonds, Tomato Soup, Idiyappam', recipe: 'Tomato soup with soft Idiyappam and light vegetable stew.' },
    { day: 'Day 7', meal: 'Pineapple, Moong Soup, Puttu + Green Gram', recipe: 'Moong dal soup followed by traditional Puttu with cherupayaru.' }
  ];

  const SUHOOR_PLAN = [
    { day: 'Day 1', meal: 'Oats in coconut milk + dates + almonds', recipe: 'Slow cooked rolled oats topped with dates and soaked nuts.' },
    { day: 'Day 2', meal: 'Whole wheat chapati + scrambled egg & veggies', recipe: '2 soft chapatis with egg bhurji and plenty of greens.' },
    { day: 'Day 3', meal: 'Steamed Puttu + steamed Kadala curry', recipe: 'Kerala puttu with low-oil black chickpea curry.' },
    { day: 'Day 4', meal: 'Millet porridge + boiled egg + cucumber', recipe: 'Foxtail millet cooked in water/milk with a boiled egg.' },
    { day: 'Day 5', meal: 'Red rice kanji + cherupayaru thoran', recipe: 'Gentle red rice gruel with green gram coconut stir-fry.' },
    { day: 'Day 6', meal: 'Idli + light vegetable sambar', recipe: '3 steamed idlis with lentil and drumstick sambar.' },
    { day: 'Day 7', meal: 'Appam + light egg curry or veg stew', recipe: '2 appams with mild coconut milk egg curry.' }
  ];

  const handleTaskSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle) return;
    onAddTask({
      title: taskTitle,
      priority: taskPriority,
      completed: false,
      dueDate: new Date().toISOString().split('T')[0],
      isFinancial: false
    });
    setTaskTitle('');
  };

  const handleVehSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAddVehicle(vehData);
    setVehData({ ...vehData, kilometers: vehData.kilometers + 100, cost: 0, description: '' });
  };

  const totalFuel = state.vehicleRecords.filter(v => v.type === 'Fuel').reduce((a, b) => a + b.cost, 0);
  const totalMaintenance = state.vehicleRecords.filter(v => v.type !== 'Fuel').reduce((a, b) => a + b.cost, 0);

  return (
    <div className="space-y-3.5 max-w-6xl mx-auto text-slate-100 animate-in fade-in duration-200 pb-16">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-emerald-500/20 pb-3">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-white tracking-tight">Food & Lifestyle</h1>
          <p className="text-xs text-emerald-300/70">Weekly meal planning, Ramadan nutrition, household chores, and vehicle tracking</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 rounded-lg bg-emerald-950/60 border border-emerald-500/20 text-xs font-bold text-lime-400">
            {activeTab === 'food' && '🍽️ Meal Planner'}
            {activeTab === 'ramadan' && '🌙 Ramadan Guide'}
            {activeTab === 'tasks' && '✅ Tasks & Chores'}
            {activeTab === 'vehicle' && '🚗 Vehicle Logs'}
          </span>
        </div>
      </div>

      {/* Main Tabs */}
      <div className="flex gap-1.5 p-1 rounded-xl bg-emerald-950/60 border border-emerald-500/20 text-xs">
        {[
          { id: 'food', label: 'Weekly Food Plan', icon: '🍲' },
          { id: 'ramadan', label: 'Ramadan Guide', icon: '🌙' },
          { id: 'tasks', label: 'Tasks & Chores', icon: '✅' },
          { id: 'vehicle', label: 'Vehicle Logs', icon: '🚗' },
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

      {/* TAB 1: WEEKLY FOOD PLAN */}
      {activeTab === 'food' && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-3">
          
          {/* 7-Day Table (Spans 3 cols) */}
          <div className="lg:col-span-3 glass-card p-3.5 rounded-2xl border border-emerald-500/20 space-y-2.5">
            <div className="flex items-center justify-between border-b border-emerald-500/15 pb-2">
              <h3 className="text-xs font-black text-white uppercase">Weekly Meal Schedule</h3>
              <span className="text-[10px] text-emerald-300/60 font-mono">Editable inline</span>
            </div>

            {/* Desktop Meal Grid */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="border-b border-emerald-500/20 bg-emerald-950/60 text-emerald-300/80 font-bold uppercase text-[10px]">
                    <th className="px-3 py-2 w-24">Day</th>
                    <th className="px-3 py-2">Breakfast</th>
                    <th className="px-3 py-2">Lunch</th>
                    <th className="px-3 py-2">Dinner</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-emerald-500/10">
                  {DAYS_OF_WEEK.map(day => (
                    <tr key={day} className="hover:bg-emerald-950/30 transition-colors">
                      <td className="px-3 py-2 font-black text-white bg-emerald-950/30 text-[11px] whitespace-nowrap">
                        {day}
                      </td>
                      {['breakfast', 'lunch', 'dinner'].map(meal => (
                        <td key={meal} className="px-2 py-1.5">
                          <input
                            type="text"
                            placeholder="Add meal..."
                            className="w-full px-2 py-1 bg-[#061f12] border border-emerald-500/20 rounded text-xs text-emerald-100 font-medium outline-none focus:border-lime-400"
                            value={(state.foodPlan[day] as any)?.[meal] || ''}
                            onChange={(e) => onUpdateFood(day, meal, e.target.value)}
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Meal Cards */}
            <div className="sm:hidden space-y-2">
              {DAYS_OF_WEEK.map(day => (
                <div key={day} className="p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-500/15 space-y-1.5">
                  <span className="text-xs font-black text-lime-300">{day}</span>
                  <div className="grid grid-cols-3 gap-1.5 text-[10px]">
                    {['breakfast', 'lunch', 'dinner'].map(meal => (
                      <div key={meal} className="space-y-0.5">
                        <span className="text-[9px] uppercase font-bold text-emerald-400/70 block">{meal}</span>
                        <input
                          type="text"
                          placeholder="..."
                          className="w-full px-1.5 py-1 bg-[#061f12] border border-emerald-500/20 rounded text-[11px] text-white font-medium outline-none focus:border-lime-400"
                          value={(state.foodPlan[day] as any)?.[meal] || ''}
                          onChange={(e) => onUpdateFood(day, meal, e.target.value)}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Side Tips & Nutrition Notes (1 col) */}
          <div className="glass-card p-3.5 rounded-2xl border border-emerald-500/20 space-y-2.5 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-1.5 border-b border-emerald-500/15 pb-2 text-xs font-black text-lime-300 uppercase">
                <span>💡</span> Kerala Kitchen Tips
              </div>
              <ul className="text-xs space-y-2 text-emerald-200/90 mt-2 font-medium">
                <li className="p-2 rounded-lg bg-emerald-950/40 border border-emerald-500/10">
                  <span className="font-bold text-white block">Seasonal Mangoes:</span>
                  Use ripe mangoes for Pulissery and raw mangoes for Chammanthi.
                </li>
                <li className="p-2 rounded-lg bg-emerald-950/40 border border-emerald-500/10">
                  <span className="font-bold text-white block">Zero Waste Thoran:</span>
                  Sauté ash gourd and pumpkin skins with grated coconut and green chilies.
                </li>
                <li className="p-2 rounded-lg bg-emerald-950/40 border border-emerald-500/10">
                  <span className="font-bold text-white block">Smart Batching:</span>
                  Grate and freeze coconut in weekly portions for fast cooking.
                </li>
              </ul>
            </div>

            <div className="p-2 rounded-xl bg-lime-400/10 border border-lime-400/20 text-[10px] text-lime-300">
              ⚡ Healthy home cooking saves ₹4,500+ monthly compared to dining out.
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: RAMADAN GUIDE */}
      {activeTab === 'ramadan' && (
        <div className="space-y-3">
          {/* Sub-Tabs */}
          <div className="flex gap-1 border-b border-emerald-500/20 pb-1.5 text-xs">
            {[
              { id: 'iftar', label: 'Iftar Specials' },
              { id: 'suhoor', label: 'Suhoor Energy' },
              { id: 'iftar-plan', label: 'Iftar 7-Day Plan' },
              { id: 'suhoor-plan', label: 'Suhoor 7-Day Plan' },
            ].map(sub => (
              <button
                key={sub.id}
                onClick={() => setActiveRamadanSubTab(sub.id as any)}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  activeRamadanSubTab === sub.id
                    ? 'bg-lime-400 text-emerald-950 font-black'
                    : 'text-emerald-300/70 hover:text-white'
                }`}
              >
                {sub.label}
              </button>
            ))}
          </div>

          {/* Cards for Iftar/Suhoor Recipes */}
          {(activeRamadanSubTab === 'iftar' || activeRamadanSubTab === 'suhoor') && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {(activeRamadanSubTab === 'iftar' ? IFTAR_RECIPES : SUHOOR_RECIPES).map((r, i) => (
                <div
                  key={i}
                  className="glass-card p-3 rounded-xl border border-emerald-500/20 space-y-2 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between text-[10px] mb-1">
                      <span className="font-black text-lime-400 uppercase">{r.tag}</span>
                      <span className="px-1.5 py-0.2 rounded bg-emerald-900 text-emerald-200 font-bold">{r.type}</span>
                    </div>
                    <h4 className="text-xs font-black text-white">{r.title}</h4>
                    <p className="text-[11px] text-emerald-200/80 mt-1 leading-snug">{r.desc}</p>
                  </div>
                  <button
                    onClick={() => setSelectedRecipe({ name: r.title, recipe: r.recipe })}
                    className="w-full py-1 rounded-lg bg-emerald-900/60 hover:bg-emerald-800 text-lime-300 text-[10px] font-black transition-colors"
                  >
                    View Prep Guide →
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* 7-Day Ramadan Plans */}
          {(activeRamadanSubTab === 'iftar-plan' || activeRamadanSubTab === 'suhoor-plan') && (
            <div className="glass-card p-3.5 rounded-2xl border border-emerald-500/20 space-y-2">
              <div className="flex items-center justify-between border-b border-emerald-500/15 pb-2">
                <h3 className="text-xs font-black text-white uppercase">
                  {activeRamadanSubTab === 'iftar-plan' ? '7-Day Iftar Recovery Menu' : '7-Day Suhoor Energy Menu'}
                </h3>
                <span className="text-[10px] text-lime-400 font-bold">Tap item for recipe</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {(activeRamadanSubTab === 'iftar-plan' ? IFTAR_PLAN : SUHOOR_PLAN).map((item, idx) => (
                  <div
                    key={idx}
                    onClick={() => setSelectedRecipe({ name: `${item.day}: ${item.meal}`, recipe: item.recipe })}
                    className="p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-500/15 hover:border-lime-400/40 cursor-pointer transition-colors flex items-center justify-between"
                  >
                    <div>
                      <span className="text-[10px] font-black text-lime-400 block">{item.day}</span>
                      <span className="text-xs font-bold text-white">{item.meal}</span>
                    </div>
                    <span className="text-xs text-emerald-400 font-bold">→</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: TASKS & CHORES */}
      {activeTab === 'tasks' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          {/* Task Add Form */}
          <div className="glass-card p-3.5 rounded-2xl border border-emerald-500/20 space-y-3">
            <h3 className="text-xs font-black text-white uppercase border-b border-emerald-500/15 pb-2">
              Add Household Task
            </h3>
            <form onSubmit={handleTaskSubmit} className="space-y-2.5 text-xs">
              <div>
                <label className="block text-[10px] font-bold text-emerald-300/70 uppercase mb-1">Task Title</label>
                <input
                  type="text"
                  placeholder="e.g. Clean AC filters, Groceries"
                  value={taskTitle}
                  onChange={e => setTaskTitle(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-[#061f12] border border-emerald-500/30 rounded-lg text-white font-bold outline-none focus:border-lime-400 text-xs"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-emerald-300/70 uppercase mb-1">Priority</label>
                <select
                  value={taskPriority}
                  onChange={e => setTaskPriority(e.target.value as Priority)}
                  className="w-full px-2.5 py-1.5 bg-[#061f12] border border-emerald-500/30 rounded-lg text-white font-bold outline-none focus:border-lime-400 text-xs"
                >
                  <option value={Priority.HIGH}>High Priority</option>
                  <option value={Priority.MEDIUM}>Medium Priority</option>
                  <option value={Priority.LOW}>Low Priority</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full py-2 rounded-xl bg-lime-400 text-emerald-950 text-xs font-black hover:bg-lime-300 shadow-sm transition-all"
              >
                + Add Task
              </button>
            </form>
          </div>

          {/* Task List */}
          <div className="lg:col-span-2 glass-card p-3.5 rounded-2xl border border-emerald-500/20 space-y-2">
            <div className="flex items-center justify-between border-b border-emerald-500/15 pb-2">
              <h3 className="text-xs font-black text-white uppercase">Household Tasks ({state.tasks.length})</h3>
              <span className="text-[10px] text-emerald-400/70 font-mono">Active</span>
            </div>

            {state.tasks.length === 0 ? (
              <div className="text-center py-8 text-emerald-300/60 text-xs">
                No active tasks. Add one using the form on the left.
              </div>
            ) : (
              <div className="space-y-1.5 max-h-[380px] overflow-y-auto pr-1">
                {state.tasks.map(t => (
                  <div
                    key={t.id}
                    className="p-2 rounded-xl bg-emerald-950/40 border border-emerald-500/10 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <input
                        type="checkbox"
                        checked={t.completed}
                        onChange={() => {}}
                        className="accent-lime-400 w-3.5 h-3.5"
                      />
                      <span className={`text-xs font-bold truncate ${t.completed ? 'line-through text-emerald-300/40' : 'text-white'}`}>
                        {t.title}
                      </span>
                    </div>
                    <span className={`text-[9px] uppercase font-black px-2 py-0.5 rounded-full shrink-0 ${
                      t.priority === Priority.HIGH ? 'bg-rose-950 text-rose-300 border border-rose-500/30' :
                      t.priority === Priority.MEDIUM ? 'bg-amber-950 text-amber-300 border border-amber-500/30' :
                      'bg-emerald-950 text-emerald-300 border border-emerald-500/30'
                    }`}>
                      {t.priority}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 4: VEHICLE LOG */}
      {activeTab === 'vehicle' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          {/* Odometer Form */}
          <div className="glass-card p-3.5 rounded-2xl border border-emerald-500/20 space-y-3">
            <h3 className="text-xs font-black text-white uppercase border-b border-emerald-500/15 pb-2">
              Record Odometer & Fuel
            </h3>
            <form onSubmit={handleVehSubmit} className="space-y-2.5 text-xs">
              <div>
                <label className="block text-[10px] font-bold text-emerald-300/70 uppercase mb-1">Date</label>
                <input
                  type="date"
                  value={vehData.date}
                  onChange={e => setVehData({ ...vehData, date: e.target.value })}
                  className="w-full px-2.5 py-1.5 bg-[#061f12] border border-emerald-500/30 rounded-lg text-white font-bold outline-none focus:border-lime-400 text-xs"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-emerald-300/70 uppercase mb-1">KM Reading</label>
                <input
                  type="number"
                  placeholder="e.g. 45200"
                  value={vehData.kilometers || ''}
                  onChange={e => setVehData({ ...vehData, kilometers: Number(e.target.value) })}
                  className="w-full px-2.5 py-1.5 bg-[#061f12] border border-emerald-500/30 rounded-lg text-white font-bold outline-none focus:border-lime-400 text-xs"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-bold text-emerald-300/70 uppercase mb-1">Cost (₹)</label>
                  <input
                    type="number"
                    placeholder="0"
                    value={vehData.cost || ''}
                    onChange={e => setVehData({ ...vehData, cost: Number(e.target.value) })}
                    className="w-full px-2 py-1.5 bg-[#061f12] border border-emerald-500/30 rounded-lg text-lime-400 font-black outline-none focus:border-lime-400 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-emerald-300/70 uppercase mb-1">Type</label>
                  <select
                    value={vehData.type}
                    onChange={e => setVehData({ ...vehData, type: e.target.value as any })}
                    className="w-full px-2 py-1.5 bg-[#061f12] border border-emerald-500/30 rounded-lg text-white font-bold outline-none focus:border-lime-400 text-xs"
                  >
                    <option value="Fuel">Fuel</option>
                    <option value="Service">Service</option>
                    <option value="Repair">Repair</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-emerald-300/70 uppercase mb-1">Notes</label>
                <input
                  type="text"
                  placeholder="e.g. Full tank at HPCL"
                  value={vehData.description}
                  onChange={e => setVehData({ ...vehData, description: e.target.value })}
                  className="w-full px-2.5 py-1.5 bg-[#061f12] border border-emerald-500/30 rounded-lg text-white text-xs outline-none focus:border-lime-400"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2 rounded-xl bg-lime-400 text-emerald-950 text-xs font-black hover:bg-lime-300 shadow-sm transition-all"
              >
                Save Vehicle Log
              </button>
            </form>
          </div>

          {/* Vehicle Stats & History */}
          <div className="lg:col-span-2 space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div className="glass-card p-3 rounded-xl border border-emerald-500/20">
                <span className="text-[10px] text-emerald-300/70 font-bold uppercase block">Total Fuel Spent</span>
                <span className="text-base font-black text-lime-400">₹{totalFuel.toLocaleString()}</span>
              </div>
              <div className="glass-card p-3 rounded-xl border border-emerald-500/20">
                <span className="text-[10px] text-emerald-300/70 font-bold uppercase block">Service & Maintenance</span>
                <span className="text-base font-black text-rose-400">₹{totalMaintenance.toLocaleString()}</span>
              </div>
            </div>

            <div className="glass-card p-3.5 rounded-2xl border border-emerald-500/20 space-y-2">
              <div className="flex items-center justify-between border-b border-emerald-500/15 pb-2">
                <h3 className="text-xs font-black text-white uppercase">Maintenance Logs ({state.vehicleRecords.length})</h3>
                <span className="text-[10px] text-emerald-400/70 font-mono">Recent entries</span>
              </div>

              {state.vehicleRecords.length === 0 ? (
                <div className="text-center py-6 text-emerald-300/60 text-xs">
                  No vehicle logs recorded yet.
                </div>
              ) : (
                <div className="space-y-1.5 max-h-[300px] overflow-y-auto pr-1">
                  {state.vehicleRecords.map(v => (
                    <div
                      key={v.id}
                      className="p-2 rounded-xl bg-emerald-950/40 border border-emerald-500/10 flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-black text-white">{v.kilometers.toLocaleString()} KM</span>
                          <span className="px-1.5 py-0.2 rounded bg-emerald-900 text-[9px] font-bold text-lime-300">{v.type}</span>
                        </div>
                        <div className="text-[10px] text-emerald-300/60">{v.date} • {v.description || 'Regular entry'}</div>
                      </div>
                      <span className="font-black text-white">₹{v.cost.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Recipe Modal */}
      {selectedRecipe && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#082215] border border-lime-400/30 w-full max-w-md rounded-2xl p-4 space-y-3 shadow-2xl">
            <div className="flex items-center justify-between border-b border-emerald-500/20 pb-2">
              <span className="text-xs font-black text-lime-400 uppercase">Recipe & Preparation</span>
              <button
                onClick={() => setSelectedRecipe(null)}
                className="text-xs text-emerald-300 hover:text-white font-bold p-1"
              >
                ✕
              </button>
            </div>

            <h3 className="text-sm font-black text-white">{selectedRecipe.name}</h3>
            <p className="text-xs text-emerald-100/90 leading-relaxed font-medium bg-emerald-950/60 p-3 rounded-xl border border-emerald-500/20">
              {selectedRecipe.recipe}
            </p>

            <button
              onClick={() => setSelectedRecipe(null)}
              className="w-full py-2 bg-lime-400 text-emerald-950 text-xs font-black rounded-xl hover:bg-lime-300 transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

export default Lifestyle;
