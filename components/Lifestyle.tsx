
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
  const [activeTab, setActiveTab] = useState<'food' | 'tasks' | 'vehicle' | 'ramadan'>('food');
  const [activeRamadanSubTab, setActiveRamadanSubTab] = useState<'iftar' | 'suhoor' | 'suhoor-plan' | 'iftar-plan'>('iftar');
  const [selectedRecipe, setSelectedRecipe] = useState<{name: string, recipe: string} | null>(null);
  
  const [taskTitle, setTaskTitle] = useState('');
  const [taskPriority, setTaskPriority] = useState(Priority.MEDIUM);

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
      desc: 'Steamed and mashed plantains stuffed with a sweet mixture of coconut, sugar, and cardamom, then deep-fried to perfection.',
      img: 'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=400&fit=crop',
      tag: 'Iftar Special'
    },
    {
      title: 'Thari Kanji',
      type: 'DRINK',
      desc: 'A comforting semolina milk porridge flavored with cardamom and garnished with fried shallots, cashews, and raisins.',
      img: 'https://images.unsplash.com/photo-1574484284002-952d92456975?w=400&fit=crop',
      tag: 'Hydrating'
    },
    {
      title: 'Erachi Pathiri',
      type: 'MAIN',
      desc: 'Layers of fried rice pancakes stuffed with a spicy, savory meat filling. A centerpiece of any Malabar Iftar table.',
      img: 'https://images.unsplash.com/photo-1601050690597-df056fb04791?w=400&fit=crop',
      tag: 'Traditional'
    }
  ];

  const SUHOOR_RECIPES = [
    {
      title: 'Malabar Banana Oats',
      type: 'BREAKFAST',
      desc: 'Slow-releasing energy oats cooked with coconut milk, topped with steamed Kerala bananas (Nendran) and a sprinkle of nuts.',
      img: 'https://images.unsplash.com/photo-1517673132405-a56a62b18977?w=400&fit=crop',
      tag: 'High Energy'
    },
    {
      title: 'Healthy Vegetable Stew',
      type: 'MAIN',
      desc: 'A light, coconut-based vegetable stew served with easy-to-digest steamed rice appams. Gentle on the stomach for Suhoor.',
      img: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=400&fit=crop',
      tag: 'Balanced'
    },
    {
      title: 'Date & Nut Power Smoothie',
      type: 'DRINK',
      desc: 'A dense blend of organic dates, almonds, and milk providing instant and sustained energy for the fasting hours ahead.',
      img: 'https://images.unsplash.com/photo-1553530666-ba11a7da3888?w=400&fit=crop',
      tag: 'Quick Prep'
    }
  ];

  const IMG_MAP = {
    puttu: 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=100&fit=crop',
    appam: 'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=100&fit=crop',
    kanji: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=100&fit=crop',
    oats: 'https://images.unsplash.com/photo-1517673132405-a56a62b18977?w=100&fit=crop',
    dosa: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=100&fit=crop',
    chapati: 'https://images.unsplash.com/photo-1626074353765-517a681e40be?w=100&fit=crop',
    khichdi: 'https://images.unsplash.com/photo-1624462966581-bc6d768cbce5?w=100&fit=crop',
    idly: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=100&fit=crop',
    dates: 'https://images.unsplash.com/photo-1590595906931-81f04f0ccebb?w=100&fit=crop',
    fish: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=100&fit=crop',
    soup: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=100&fit=crop',
    fruit: 'https://images.unsplash.com/photo-1589984662646-e7b2e4962f18?w=100&fit=crop',
    chicken: 'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=100&fit=crop'
  };

  const IFTAR_PLAN = [
    {
      week: "Week 1 — Light & Hydrating Start",
      items: [
        { name: "Day 1: Dates, Watermelon, Soup, Grilled Fish", img: IMG_MAP.fish, recipe: "Grill fish with turmeric, pepper, lemon (no deep fry). Serve with cucumber salad." },
        { name: "Day 2: Banana, Pineapple Salad, Chickpea Sundal", img: IMG_MAP.fruit, recipe: "Steamed chickpea sundal with minimal coconut. Serve with 1 chapati + veg curry." },
        { name: "Day 3: Papaya, Lentil Soup, Veg Stir Fry + Egg", img: IMG_MAP.soup, recipe: "Light lentil soup followed by a fiber-rich veg stir fry and one boiled egg." },
        { name: "Day 4: Watermelon Juice, Sprouted Salad, Red Rice", img: IMG_MAP.kanji, recipe: "Fresh watermelon juice (no sugar). Red rice served with light ash gourd curry." },
        { name: "Day 5: Dates, Tender Coconut, Mango Chaat, Paneer", img: IMG_MAP.chicken, recipe: "Fruit chaat (mango + cucumber + lime). Grilled chicken or paneer on the side." },
        { name: "Day 6: Banana, Almonds, Tomato Soup, Idiyappam", img: IMG_MAP.appam, recipe: "Tomato soup with Idiyappam served with a light vegetable stew." },
        { name: "Day 7: Pineapple, Moong Soup, Puttu + Green Gram", img: IMG_MAP.puttu, recipe: "Moong dal soup followed by classic Puttu and green gram curry." }
      ]
    },
    {
      week: "Week 2 — Protein & Fat Loss Week",
      items: [
        { name: "Day 8: Watermelon, Cucumber Yogurt, Egg Bhurji", img: IMG_MAP.dosa, recipe: "Chapati served with egg bhurji and plenty of mixed seasonal vegetables." },
        { name: "Day 9: Papaya + Lime, Veg Soup, Grilled Fish", img: IMG_MAP.fish, recipe: "Light vegetable soup. Fish grilled with spices and served with sautéed beans." },
        { name: "Day 10: Mango, Chickpea Salad, Millet Upma", img: IMG_MAP.oats, recipe: "Small portion of mango. Protein-rich chickpea salad and Millet upma." },
        { name: "Day 11: Banana + Peanuts, Pumpkin Soup, Red Rice", img: IMG_MAP.kanji, recipe: "Pumpkin soup. Red rice served with dal and fresh spinach (cheera)." },
        { name: "Day 12: Pineapple, Lentil Soup, Chicken Stew", img: IMG_MAP.chicken, recipe: "Lentil soup. Light chicken or tofu stew served with a large fresh salad." },
        { name: "Day 13: Muskmelon, Sprout Salad, Oats Khichdi", img: IMG_MAP.khichdi, recipe: "Veggie-loaded oats khichdi for slow-releasing energy and high fiber." },
        { name: "Day 14: Dates, Coconut Water, Chapati + Egg Stir Fry", img: IMG_MAP.chapati, recipe: "Snake gourd egg stir fry (thoran style) served with one whole wheat chapati." }
      ]
    },
    {
      week: "Week 3 — Easy Prep Week",
      items: [
        { name: "Day 15: Fruit Bowl, Clear Veg Soup, Idli + Sambar", img: IMG_MAP.idly, recipe: "Light clear vegetable soup. Soft idlis with vegetable-heavy sambar." },
        { name: "Day 16: Mango Salad, Boiled Chana, Veg Dosa", img: IMG_MAP.dosa, recipe: "Add grated carrots to dosa batter. Serve with boiled chana and chutney." },
        { name: "Day 17: Pineapple + Mint, Carrot Soup, Rice Kanji", img: IMG_MAP.kanji, recipe: "Refreshing pineapple mint juice. Carrot soup and red rice kanji with gram." },
        { name: "Day 18: Banana + Walnut, Lentil Soup, Grilled Paneer", img: IMG_MAP.dosa, recipe: "Lentil soup and grilled paneer with a large portion of garden salad." },
        { name: "Day 19: Papaya, Tomato Rasam, Chapati + Ridge Gourd", img: IMG_MAP.chapati, recipe: "Spicy tomato rasam. Chapati with ridge gourd dal (low oil)." },
        { name: "Day 20: Watermelon Juice, Veg Salad, Millet Pulao", img: IMG_MAP.khichdi, recipe: "Millet pulao with plenty of beans and carrots, served with a boiled egg." },
        { name: "Day 21: Muskmelon, Moong Soup, Appam + Veg Curry", img: IMG_MAP.appam, recipe: "Moong soup. Easy appams with a light coconut-based vegetable curry." }
      ]
    },
    {
      week: "Week 4 — Anti-Bloating & Belly-Friendly",
      items: [
        { name: "Day 22: Dates, Pineapple, Clear Soup, Fish Curry", img: IMG_MAP.fish, recipe: "Light fish curry (no coconut milk) with vegetable stir fry (thoran)." },
        { name: "Day 23: Banana + Peanuts, Sprouts, Pumpkin Curry", img: IMG_MAP.kanji, recipe: "Red rice served with a simple pumpkin curry and sprout salad." },
        { name: "Day 24: Papaya, Lentil Soup, Puttu + Kadala", img: IMG_MAP.puttu, recipe: "Lentil soup. Small portion of Puttu served with Kadala curry." },
        { name: "Day 25: Watermelon, Yogurt Bowl, Chapati + Gourd", img: IMG_MAP.chapati, recipe: "Yogurt cucumber bowl. Chapati with bottle gourd (Lauki) curry." },
        { name: "Day 26: Mango, Veg Soup, Oats Dosa + Chutney", img: IMG_MAP.dosa, recipe: "Instant oats dosa made by blending oats, curd, and water." },
        { name: "Day 27: Fruit Chaat, Dal Soup, Grilled Chicken", img: IMG_MAP.chicken, recipe: "Fruit chaat. Simple dal soup. Grilled chicken served with salad." },
        { name: "Day 28: Pineapple, Tomato Soup, Veg Khichdi", img: IMG_MAP.khichdi, recipe: "Tomato soup followed by a light vegetable khichdi (rice and moong dal)." }
      ]
    },
    {
      week: "Final 2 Days (Very Light)",
      items: [
        { name: "Day 29: Watermelon, Clear Soup, Idiyappam + Stew", img: IMG_MAP.appam, recipe: "Idiyappam served with a very light vegetable stew for gentle digestion." },
        { name: "Day 30: Papaya, Moong Soup, Kanji + Ash Gourd", img: IMG_MAP.kanji, recipe: "Rice porridge served with ash gourd curry. Very light for final fasting day." }
      ]
    }
  ];

  const SUHOOR_PLAN = [
    {
      week: "Week 1 — Light & Hydrating (Reset Week)",
      items: [
        { name: "Puttu + light kadala curry + cucumber", img: IMG_MAP.puttu, recipe: "Pressure cook black chickpeas (or use pre-cooked). Add onion, tomato, turmeric, coconut paste. Simmer 10 mins." },
        { name: "Appam + mixed vegetable stew", img: IMG_MAP.appam, recipe: "Boil carrot + beans + potato. Add thin coconut milk, ginger, pepper. Simmer 5 mins." },
        { name: "Red rice kanji + green gram", img: IMG_MAP.kanji, recipe: "Cook red rice very soft with extra water. Boil green gram separately. Serve together with salt & coconut." },
        { name: "Idiyappam + vegetable kurma", img: IMG_MAP.appam, recipe: "Sauté onion + mixed veggies. Add coconut paste + turmeric. Cook until soft." },
        { name: "Oats kanji + banana + nuts", img: IMG_MAP.oats, recipe: "Cook oats in water + little milk. Add banana slices + nuts." },
        { name: "Vegetable upma + curd", img: IMG_MAP.oats, recipe: "Roast rava. Add mustard, curry leaves, carrots, beans. Add hot water and cook 5 mins." },
        { name: "Chapati + ash gourd moong dal", img: IMG_MAP.chapati, recipe: "Cook moong dal + ash gourd cubes. Add cumin + turmeric + coconut." }
      ]
    },
    {
      week: "Week 2 — Fat-Loss Focus (Higher Protein)",
      items: [
        { name: "Ragi puttu + chickpea curry", img: IMG_MAP.puttu, recipe: "Use ragi flour for puttu. Serve with standard pressure-cooked chickpea masala." },
        { name: "Vegetable dosa + boiled egg", img: IMG_MAP.dosa, recipe: "Add grated carrot and onion to dosa batter. Serve with a hard-boiled egg for protein." },
        { name: "Wheat dosa + bottle gourd curry", img: IMG_MAP.dosa, recipe: "Wheat batter dosa. Curry: Cook bottle gourd + onion + tomato with light coconut." },
        { name: "Broken wheat upma + amaranth thoran", img: IMG_MAP.oats, recipe: "Cook broken wheat with veggies. Stir fry spinach/amaranth with coconut + garlic." },
        { name: "Moong dal chilla + mint yogurt", img: IMG_MAP.dosa, recipe: "Soak moong dal, blend into batter. Add onion + chili. Cook like dosa." },
        { name: "Rice kanji + pumpkin curry", img: IMG_MAP.kanji, recipe: "Rice porridge served with pumpkin cooked in turmeric and ground coconut." },
        { name: "Chapati + snake gourd egg thoran", img: IMG_MAP.chapati, recipe: "Stir fry snake gourd with spices. Add scrambled egg at the end." }
      ]
    },
    {
      week: "Week 3 — Easy Prep (Low Effort Week)",
      items: [
        { name: "Overnight oats (dates + chia)", img: IMG_MAP.oats, recipe: "Oats + milk + dates + chia. Refrigerate overnight. No cooking needed." },
        { name: "Semiya upma with carrots & beans", img: IMG_MAP.oats, recipe: "Roast vermicelli. Sauté carrots and beans, add water and vermicelli, cook until dry." },
        { name: "Leftover red rice + cucumber yogurt", img: IMG_MAP.kanji, recipe: "Mix cooled rice with curd and salt. Add fresh cucumber pieces." },
        { name: "Idli + vegetable sambar", img: IMG_MAP.idly, recipe: "Steam idlis. Pressure cook dal + vegetables for a quick sambar." },
        { name: "Millet porridge + roasted peanuts", img: IMG_MAP.oats, recipe: "Cook millet until soft with water/milk. Top with roasted peanuts for crunch." },
        { name: "Appam + tomato-coconut curry", img: IMG_MAP.appam, recipe: "Sauté tomato + onion. Add coconut paste and light spices. Simmer." },
        { name: "Vegetable khichdi (beans + carrots)", img: IMG_MAP.khichdi, recipe: "Rice + moong dal + carrots. Pressure cook together with turmeric and salt." }
      ]
    },
    {
      week: "Week 4 — Lean & Gentle Digestion",
      items: [
        { name: "Puttu + green gram curry", img: IMG_MAP.puttu, recipe: "Classic Kerala puttu. Green gram curry with simple onion + tomato tempering." },
        { name: "Chapati + ridge gourd dal", img: IMG_MAP.chapati, recipe: "Cook yellow moong dal with ridge gourd cubes. Temper with cumin." },
        { name: "Idiyappam + vegetable stew", img: IMG_MAP.appam, recipe: "Light stew with coconut milk and mixed winter vegetables." },
        { name: "Rice kanji + beetroot thoran", img: IMG_MAP.kanji, recipe: "Red rice porridge with grated beetroot stir-fried with coconut." },
        { name: "Oats dosa + tomato chutney", img: IMG_MAP.dosa, recipe: "Blend oats + curd + water for instant batter. Serve with spicy tomato chutney." },
        { name: "Pumpkin soup + boiled egg", img: IMG_MAP.kanji, recipe: "Boil pumpkin, blend into soup, season with pepper. Serve with egg." },
        { name: "Lemon rice + cucumber salad", img: IMG_MAP.khichdi, recipe: "Quick lemon rice with turmeric and peanuts. Fresh cucumber on the side." }
      ]
    },
    {
      week: "Last 2 Days (Light & Comforting)",
      items: [
        { name: "Vegetable uthappam + curd", img: IMG_MAP.dosa, recipe: "Thick dosa topped with finely chopped seasonal veggies. Served with fresh curd." },
        { name: "Soft rice porridge + ash gourd curry", img: IMG_MAP.kanji, recipe: "Very soft rice kanji. Ash gourd curry with minimal spices, light on the stomach." }
      ]
    }
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

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20 px-2 md:px-0">
      {/* Recipe Details Modal */}
      {selectedRecipe && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
           <div className="bg-white w-full max-w-lg rounded-[2rem] md:rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
              <div className="bg-emerald-800 p-6 md:p-8 text-white relative">
                <button onClick={() => setSelectedRecipe(null)} className="absolute top-4 md:top-6 right-4 md:right-6 p-2 hover:bg-white/10 rounded-full transition-colors">
                  <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
                <span className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] opacity-60">Ramadan Recipe</span>
                <h3 className="text-xl md:text-2xl font-black mt-1 leading-tight">{selectedRecipe.name}</h3>
              </div>
              <div className="p-6 md:p-8">
                 <div className="flex items-center gap-2 mb-4">
                    <div className="w-7 h-7 md:w-8 md:h-8 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-600">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                    </div>
                    <span className="font-black text-slate-400 text-[9px] md:text-[10px] uppercase tracking-widest">Preparation Instructions</span>
                 </div>
                 <p className="text-slate-600 font-medium leading-relaxed text-sm md:text-base">
                   {selectedRecipe.recipe}
                 </p>
                 <button onClick={() => setSelectedRecipe(null)} className="w-full mt-6 md:mt-8 bg-slate-900 text-white font-black py-4 rounded-xl md:rounded-2xl hover:bg-black transition-all shadow-lg active:scale-95 uppercase tracking-widest text-[10px] md:text-xs">Got it, thanks!</button>
              </div>
           </div>
        </div>
      )}

      {/* Main Tabs */}
      <div className="flex gap-1 bg-white p-1 rounded-2xl border border-slate-200 overflow-x-auto no-scrollbar shadow-sm">
        {[
          { id: 'food', label: 'Food Plan', icon: '🍲' },
          { id: 'ramadan', label: 'Ramadan', icon: '🌙' },
          { id: 'tasks', label: 'Tasks', icon: '✅' },
          { id: 'vehicle', label: 'Vehicle', icon: '🚗' }
        ].map((tab) => (
          <button 
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 md:px-6 rounded-xl font-bold text-[10px] md:text-sm whitespace-nowrap transition-all ${
              activeTab === tab.id 
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-100' 
                : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {activeTab === 'food' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
          <div className="lg:col-span-2 bg-white rounded-[2rem] md:rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="relative h-32 md:h-56">
              <img 
                src="https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&fit=crop" 
                alt="Healthy food" 
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent"></div>
              <div className="absolute bottom-4 left-6">
                <h3 className="text-lg md:text-2xl font-black text-slate-800">Weekly Menu</h3>
                <p className="text-[9px] md:text-xs font-bold text-emerald-600 uppercase tracking-widest">Balanced • Local</p>
              </div>
            </div>
            
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full min-w-[700px]">
                <thead>
                  <tr className="text-left text-[10px] text-gray-400 uppercase font-bold tracking-widest bg-gray-50/30">
                    <th className="px-6 py-4">Day</th>
                    <th className="px-6 py-4">Breakfast</th>
                    <th className="px-6 py-4">Lunch</th>
                    <th className="px-6 py-4">Dinner</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {DAYS_OF_WEEK.map(day => (
                    <tr key={day} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 font-bold text-slate-700 text-sm bg-gray-50/20">{day}</td>
                      {['breakfast', 'lunch', 'dinner'].map(meal => (
                        <td key={meal} className="px-4 py-2">
                          <input 
                            type="text" 
                            placeholder="..."
                            className="w-full text-sm border-b-2 border-transparent hover:border-emerald-100 focus:border-emerald-500 focus:outline-none py-2 px-1 bg-transparent transition-all"
                            value={(state.foodPlan[day] as any)[meal]}
                            onChange={(e) => onUpdateFood(day, meal, e.target.value)}
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card-Based View */}
            <div className="md:hidden divide-y divide-slate-100">
               {DAYS_OF_WEEK.map(day => (
                 <div key={day} className="p-4 space-y-3">
                    <div className="flex items-center gap-2 mb-1">
                       <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                       <h4 className="font-black text-slate-800 text-xs uppercase tracking-widest">{day}</h4>
                    </div>
                    <div className="grid grid-cols-1 gap-2">
                       {['breakfast', 'lunch', 'dinner'].map(meal => (
                         <div key={meal} className="flex items-center gap-3 bg-slate-50/50 p-2 rounded-xl border border-slate-100">
                            <span className="text-[8px] font-black text-slate-400 uppercase w-14 shrink-0">{meal}</span>
                            <input 
                              type="text" 
                              placeholder="Add menu..."
                              className="flex-1 text-[11px] font-bold text-slate-600 bg-transparent outline-none focus:text-emerald-700"
                              value={(state.foodPlan[day] as any)[meal]}
                              onChange={(e) => onUpdateFood(day, meal, e.target.value)}
                            />
                         </div>
                       ))}
                    </div>
                 </div>
               ))}
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-emerald-900 text-white p-6 rounded-[2rem] shadow-xl relative overflow-hidden group">
              <div className="relative z-10">
                <h4 className="font-bold text-lg mb-4 flex items-center gap-2">
                  <span className="text-xl">💡</span> Food Tips
                </h4>
                <ul className="text-xs md:text-sm space-y-3 font-medium opacity-90">
                  <li className="flex gap-2"><span>•</span> Use seasonal Mangoes for Manga Curry.</li>
                  <li className="flex gap-2"><span>•</span> Waste-free Thoran using veggie skins.</li>
                  <li className="flex gap-2"><span>•</span> Bulk store coconut for efficiency.</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'ramadan' && (
        <div className="space-y-6">
          {/* Sub-tabs for Ramadan Recipes */}
          <div className="flex gap-4 border-b border-slate-200 pb-2 overflow-x-auto no-scrollbar">
             {[
               { id: 'iftar', label: 'Iftar' },
               { id: 'suhoor', label: 'Suhoor' },
               { id: 'suhoor-plan', label: 'Suhoor Plan' },
               { id: 'iftar-plan', label: 'Iftar Plan' }
             ].map(sub => (
               <button 
                  key={sub.id}
                  onClick={() => setActiveRamadanSubTab(sub.id as any)}
                  className={`pb-2 px-1 text-[10px] md:text-sm font-black transition-all border-b-2 uppercase tracking-tight whitespace-nowrap ${activeRamadanSubTab === sub.id ? 'border-emerald-600 text-emerald-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
               >
                  {sub.label}
               </button>
             ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
            <div className="lg:col-span-2 space-y-6">
               {(activeRamadanSubTab === 'suhoor-plan' || activeRamadanSubTab === 'iftar-plan') ? (
                 <div className="space-y-6 md:space-y-8 animate-in fade-in duration-300">
                    <div className={`bg-gradient-to-r ${activeRamadanSubTab === 'iftar-plan' ? 'from-emerald-800 to-emerald-700' : 'from-emerald-900 to-emerald-800'} text-white p-6 md:p-8 rounded-[2rem] md:rounded-[2.5rem] shadow-xl relative overflow-hidden group`}>
                       <div className="absolute top-0 right-0 p-4 md:p-6 opacity-20 text-4xl md:text-6xl group-hover:scale-125 transition-transform duration-1000">
                          {activeRamadanSubTab === 'iftar-plan' ? '🍲' : '🍛'}
                       </div>
                       <h3 className="text-xl md:text-2xl font-black mb-1 md:mb-2 flex items-center gap-2">
                         <span>🌙</span> {activeRamadanSubTab === 'iftar-plan' ? '30-Day Iftar Plan' : '30-Day Suhoor Plan'}
                       </h3>
                       <p className="text-[10px] md:text-sm opacity-80 font-medium leading-relaxed">
                          {activeRamadanSubTab === 'iftar-plan' 
                            ? 'Nutritious recovery menus. Tap a meal for prep guide.' 
                            : 'Kerala-focused morning nutrition. Tap a meal for quick recipe.'}
                       </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
                       {(activeRamadanSubTab === 'iftar-plan' ? IFTAR_PLAN : SUHOOR_PLAN).map((section, sIdx) => (
                         <div key={sIdx} className="bg-white p-6 md:p-8 rounded-[2rem] md:rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col">
                            <h4 className="text-[9px] md:text-[11px] font-black text-emerald-600 uppercase tracking-[0.2em] border-b border-emerald-50/50 pb-3 md:pb-4 mb-4 md:mb-6">{section.week}</h4>
                            <ul className="space-y-3 md:space-y-4">
                               {section.items.map((item, iIdx) => (
                                 <li 
                                    key={iIdx} 
                                    onClick={() => setSelectedRecipe({name: item.name, recipe: item.recipe})}
                                    className="flex gap-3 md:gap-4 items-center p-2.5 md:p-3 rounded-2xl hover:bg-emerald-50/50 border border-transparent hover:border-emerald-100/50 transition-all cursor-pointer group active:bg-emerald-50"
                                  >
                                    <div className="relative shrink-0">
                                      <img 
                                        src={item.img} 
                                        alt={item.name} 
                                        className="w-12 h-12 md:w-14 md:h-14 rounded-xl object-cover shadow-sm group-hover:shadow-md transition-shadow group-hover:scale-105"
                                      />
                                      <span className="absolute -top-1 -left-1 w-5 h-5 rounded-full bg-white text-[9px] md:text-[10px] font-black text-slate-400 border border-slate-100 flex items-center justify-center shadow-xs group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                                        {iIdx + 1}
                                      </span>
                                    </div>
                                    <div className="flex-1">
                                      <span className="text-[11px] md:text-sm text-slate-700 font-bold leading-tight group-hover:text-emerald-900 line-clamp-2">
                                        {item.name}
                                      </span>
                                      <p className="text-[8px] md:text-[9px] text-emerald-600 font-bold uppercase mt-1 opacity-0 group-hover:opacity-100 md:group-hover:opacity-100 transition-opacity">Tap for guide</p>
                                    </div>
                                 </li>
                               ))}
                            </ul>
                         </div>
                       ))}
                    </div>

                    {activeRamadanSubTab === 'iftar-plan' && (
                      <div className="bg-white p-6 md:p-10 rounded-[2rem] md:rounded-[3rem] shadow-sm border border-slate-100 space-y-6 md:space-y-8">
                        <h3 className="text-lg md:text-xl font-black text-slate-800 uppercase tracking-tight">🥣 Easy Recipe Ideas</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                           {[
                             { title: "🥗 Fruit Chaat", desc: "Mango + pineapple + watermelon with lemon juice & black pepper." },
                             { title: "🍲 Lentil Soup", desc: "Moong dal with cumin & garlic. Hydrating and quick." },
                             { title: "🥒 Yogurt Salad", desc: "Curd + cucumber + salt + mint. Anti-bloating." },
                             { title: "🥘 Chickpea Sundal", desc: "Boiled chickpeas with coconut tempering." }
                           ].map((tip, idx) => (
                             <div key={idx} className="p-4 md:p-6 bg-slate-50 rounded-2xl border border-slate-100 active:bg-emerald-50 transition-colors">
                                <h4 className="font-black text-slate-800 text-xs md:text-sm mb-1.5">{tip.title}</h4>
                                <p className="text-[10px] md:text-xs text-slate-500 font-medium leading-relaxed">{tip.desc}</p>
                             </div>
                           ))}
                        </div>
                      </div>
                    )}
                 </div>
               ) : (
                 (activeRamadanSubTab === 'iftar' ? IFTAR_RECIPES : SUHOOR_RECIPES).map((recipe, idx) => (
                   <div key={idx} className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden flex flex-col sm:flex-row h-auto sm:h-52 hover:shadow-md transition-shadow active:scale-[0.99] transition-transform">
                      <div className="w-full sm:w-64 h-40 sm:h-auto overflow-hidden">
                        <img src={recipe.img} alt={recipe.title} className="w-full h-full object-cover transition-transform hover:scale-105 duration-500" />
                      </div>
                      <div className="p-5 md:p-6 flex-1 flex flex-col justify-center">
                        <div className="flex justify-between items-start mb-2">
                           <div>
                             <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest block mb-0.5 md:mb-1">{recipe.tag}</span>
                             <h4 className="text-base md:text-xl font-black text-slate-800 tracking-tight">{recipe.title}</h4>
                           </div>
                           <span className="bg-slate-100 text-slate-500 text-[8px] md:text-[9px] font-black px-1.5 md:px-2 py-0.5 md:py-1 rounded-lg uppercase whitespace-nowrap">{recipe.type}</span>
                        </div>
                        <p className="text-[11px] md:text-sm text-slate-500 leading-relaxed mb-3 md:mb-4 line-clamp-2">{recipe.desc}</p>
                        <button className="w-fit text-emerald-600 font-black text-[10px] md:text-xs hover:underline flex items-center gap-1">
                          Full Recipe <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" /></svg>
                        </button>
                      </div>
                   </div>
                 ))
               )}
            </div>

            <div className="space-y-6">
              <div className="bg-emerald-900 text-white p-6 rounded-[2rem] shadow-xl relative overflow-hidden group">
                <div className="relative z-10">
                  <h4 className="font-bold text-lg mb-4 flex items-center gap-2">
                    <span className="text-xl">💡</span> {activeRamadanSubTab.includes('iftar') ? 'Iftar Tips' : 'Suhoor Tips'}
                  </h4>
                  <ul className="text-xs md:text-sm space-y-4 font-medium opacity-90">
                    {activeRamadanSubTab.includes('iftar') ? (
                      <>
                        <li className="flex gap-2"><span>•</span> Break fast with dates and water first.</li>
                        <li className="flex gap-2"><span>•</span> Avoid fried snacks to prevent lethargy.</li>
                        <li className="flex gap-2"><span>•</span> Include soup for easy rehydration.</li>
                      </>
                    ) : (
                      <>
                        <li className="flex gap-2"><span>•</span> Focus on complex carbs for long satiety.</li>
                        <li className="flex gap-2"><span>•</span> Avoid salty foods to minimize thirst.</li>
                        <li className="flex gap-2"><span>•</span> Eat dates for natural fiber and energy.</li>
                      </>
                    )}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'tasks' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8 max-w-5xl">
          <div className="bg-white p-5 md:p-8 rounded-[2rem] shadow-sm border border-gray-100">
            <h3 className="text-lg md:text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
              Household Checklist
            </h3>
            <form onSubmit={handleTaskSubmit} className="flex flex-col gap-3 mb-8">
              <input 
                type="text" 
                placeholder="What needs doing?"
                className="w-full px-5 py-3.5 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 outline-none text-sm font-medium transition-all"
                value={taskTitle}
                onChange={e => setTaskTitle(e.target.value)}
              />
              <div className="flex gap-3">
                <select 
                  className="flex-1 px-4 py-3 border border-slate-200 rounded-2xl outline-none text-[11px] font-black uppercase bg-white cursor-pointer"
                  value={taskPriority}
                  onChange={e => setTaskPriority(e.target.value as Priority)}
                >
                  {Object.values(Priority).map(p => <option key={p} value={p}>{p}</option>)}
                </select>
                <button type="submit" className="shrink-0 bg-emerald-600 text-white px-8 py-3 rounded-2xl font-black text-xl shadow-lg shadow-emerald-100 active:scale-95 transition-all">+</button>
              </div>
            </form>

            <div className="space-y-3">
              {state.tasks.map(task => (
                <div key={task.id} className="group flex items-center gap-4 p-4 active:bg-emerald-50/50 rounded-2xl border border-slate-100 transition-all">
                  <input type="checkbox" checked={task.completed} className="w-5 h-5 rounded-lg text-emerald-600 border-slate-300 focus:ring-emerald-500 transition-all cursor-pointer" onChange={() => {}} />
                  <div className="flex-1">
                    <p className={`font-bold text-sm ${task.completed ? 'line-through text-slate-300' : 'text-slate-700'}`}>{task.title}</p>
                    <div className="flex gap-2 mt-1">
                      <span className={`text-[8px] uppercase font-black px-2 py-0.5 rounded-full ${
                        task.priority === Priority.HIGH ? 'bg-rose-100 text-rose-600' :
                        task.priority === Priority.MEDIUM ? 'bg-amber-100 text-amber-600' : 'bg-emerald-100 text-emerald-600'
                      }`}>{task.priority}</span>
                    </div>
                  </div>
                </div>
              ))}
              {state.tasks.length === 0 && <p className="text-center py-12 text-slate-300 font-bold uppercase text-[10px] tracking-widest italic">Empty checklist</p>}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'vehicle' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
          <div className="lg:col-span-1">
            <div className="bg-slate-50 p-6 md:p-8 rounded-[2rem] border border-slate-200 shadow-sm space-y-6">
              <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">Odometer Update</h3>
              <form onSubmit={handleVehSubmit} className="space-y-5">
                <div className="space-y-5 bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                  <div>
                    <label className="text-[9px] font-black text-slate-400 uppercase mb-2 block tracking-widest">Log Date</label>
                    <input 
                      type="date" 
                      className="w-full px-4 py-3 border border-slate-100 rounded-xl font-bold outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50/30 text-sm" 
                      value={vehData.date} 
                      onChange={e => setVehData({...vehData, date: e.target.value})} 
                    />
                  </div>
                  <div>
                    <label className="text-[9px] font-black text-slate-400 uppercase mb-2 block tracking-widest">KM Reading</label>
                    <div className="relative">
                      <input 
                        type="number" 
                        className="w-full px-4 py-4 border border-slate-100 rounded-xl font-black text-2xl outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50/30" 
                        value={vehData.kilometers} 
                        onChange={e => setVehData({...vehData, kilometers: Number(e.target.value)})} 
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-300">KM</span>
                    </div>
                  </div>
                </div>
                <button 
                  type="submit" 
                  className="w-full bg-[#0F172A] text-white font-black py-4 rounded-xl hover:bg-black transition-all shadow-xl active:scale-95 text-[10px] md:text-xs uppercase tracking-widest"
                >
                  Record Maintenance
                </button>
              </form>
            </div>
          </div>

          <div className="lg:col-span-2 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-white p-6 rounded-3xl border border-emerald-50 shadow-sm flex justify-between items-center transition-all">
                <div>
                  <p className="text-[9px] text-emerald-600 uppercase font-black mb-1.5 tracking-wider">Total Fuel Spent</p>
                  <p className="text-2xl font-black text-slate-900">₹{state.vehicleRecords.filter(v => v.type === 'Fuel').reduce((a, b) => a + b.cost, 0).toLocaleString()}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Lifestyle;
