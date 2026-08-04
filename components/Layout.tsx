import React, { useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { ICONS } from '../constants';
import QuickAddModal from './QuickAddModal';
import { Transaction } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  onAddTransaction?: (t: Omit<Transaction, 'id'>) => void;
}

const Layout: React.FC<LayoutProps> = ({ children, onAddTransaction }) => {
  const location = useLocation();
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);

  const navItems = [
    { path: '/', icon: ICONS.Dashboard, label: 'Overview' },
    { path: '/schedule', icon: ICONS.Schedule, label: 'Schedule' },
    // Central + action button is inserted manually in tab bar
    { path: '/finance', icon: ICONS.Finance, label: 'Finance' },
    { path: '/lifestyle', icon: ICONS.Food, label: 'Lifestyle' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#051a0f] via-[#0a2e1a] to-[#144d2e] text-slate-100 font-sans relative selection:bg-lime-400 selection:text-emerald-950 pb-28 md:pb-8">
      {/* Background ambient glow accents */}
      <div className="fixed top-0 left-1/4 w-96 h-96 bg-lime-500/10 rounded-full blur-3xl pointer-events-none -z-0" />
      <div className="fixed bottom-10 right-10 w-96 h-96 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none -z-0" />

      <div className="flex flex-col md:flex-row min-h-screen relative z-10">
        {/* Desktop Left Sidebar Navigation */}
        <aside className="hidden md:flex flex-col w-64 p-6 glass-card border-r border-lime-500/15 min-h-screen sticky top-0 h-screen justify-between">
          <div className="space-y-8">
            {/* App Brand Header */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-lime-400 to-emerald-500 text-emerald-950 flex items-center justify-center font-black text-lg shadow-lg glow-lime-sm tracking-tighter">
                FS
              </div>
              <div>
                <h1 className="text-xl font-black text-white tracking-tight flex items-center gap-1.5">
                  FS4HOME
                </h1>
              </div>
            </div>

            {/* Quick Add Button */}
            {onAddTransaction && (
              <button
                onClick={() => setIsQuickAddOpen(true)}
                className="w-full py-3 px-4 bg-lime-400 hover:bg-lime-300 text-emerald-950 font-black rounded-2xl shadow-lg glow-lime-sm flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-95"
              >
                <span className="text-lg font-black">+</span>
                <span>Add Transaction</span>
              </button>
            )}

            {/* Navigation Links */}
            <nav className="space-y-2 pt-2">
              {[
                { path: '/', icon: ICONS.Dashboard, label: 'Dashboard' },
                { path: '/schedule', icon: ICONS.Schedule, label: 'Schedule' },
                { path: '/finance', icon: ICONS.Finance, label: 'Finance & Budget' },
                { path: '/lifestyle', icon: ICONS.Food, label: 'Lifestyle Plan' },
                { path: '/zakat', icon: ICONS.Zakat, label: 'Donation & Zakat' },
              ].map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center gap-3.5 px-4 py-3 rounded-2xl font-bold text-sm transition-all duration-200 group ${
                      isActive 
                        ? 'bg-lime-400 text-emerald-950 shadow-md glow-lime-sm' 
                        : 'text-emerald-200/70 hover:text-white hover:bg-emerald-900/40'
                    }`}
                  >
                    <div className={`p-1.5 rounded-xl transition-colors ${isActive ? 'bg-emerald-950/20 text-emerald-950' : 'bg-emerald-900/40 text-lime-400 group-hover:bg-lime-400/20'}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* User / App Meta Bottom Card */}
          <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/20 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-lime-400/20 border border-lime-400/40 flex items-center justify-center text-lime-400 font-black text-xs">
                BP
              </div>
              <div>
                <p className="text-xs font-bold text-white">Smart Mode</p>
                <p className="text-[10px] text-emerald-400/80 font-medium">80% Alert Enabled</p>
              </div>
            </div>
            <span className="w-2 h-2 rounded-full bg-lime-400 animate-pulse glow-lime-sm" />
          </div>
        </aside>

        {/* Main Content View Container */}
        <main className="flex-1 p-4 md:p-8 lg:p-10 max-w-7xl mx-auto w-full">
          {children}
        </main>
      </div>

      {/* Mobile-Only Bottom Navigation Dock */}
      <div className="md:hidden fixed bottom-3 left-3 right-3 z-[100] bg-[#062415] rounded-3xl px-2 py-2 flex items-center justify-around shadow-xl">
        {/* Slot 1: Home */}
        <Link
          to="/"
          className={`flex-1 flex flex-col items-center justify-center py-1.5 px-2 rounded-2xl transition-all duration-200 ${
            location.pathname === '/' 
              ? 'bg-[#124d2c] text-white font-bold shadow-inner' 
              : 'text-emerald-200/70 hover:text-white'
          }`}
        >
          <svg className="w-5 h-5 mb-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h7.5" />
          </svg>
          <span className="text-[10px] font-semibold tracking-tight">Home</span>
        </Link>

        {/* Slot 2: Transactions */}
        <Link
          to="/finance"
          className={`flex-1 flex flex-col items-center justify-center py-1.5 px-2 rounded-2xl transition-all duration-200 ${
            location.pathname === '/finance' 
              ? 'bg-[#124d2c] text-white font-bold shadow-inner' 
              : 'text-emerald-200/70 hover:text-white'
          }`}
        >
          <svg className="w-5 h-5 mb-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
          </svg>
          <span className="text-[10px] font-semibold tracking-tight">Transactions</span>
        </Link>

        {/* Slot 3: Central Plus Button */}
        <div className="flex-1 flex justify-center items-center">
          {onAddTransaction ? (
            <button
              onClick={() => setIsQuickAddOpen(true)}
              className="w-11 h-11 rounded-full bg-gradient-to-tr from-emerald-500 via-lime-400 to-emerald-400 text-emerald-950 font-black flex items-center justify-center shadow-lg shadow-lime-500/20 transform hover:scale-110 active:scale-95 transition-all"
              title="Add Transaction"
            >
              <svg className="w-6 h-6 text-emerald-950 stroke-[3]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
            </button>
          ) : (
            <Link
              to="/finance"
              className="w-11 h-11 rounded-full bg-gradient-to-tr from-emerald-500 via-lime-400 to-emerald-400 text-emerald-950 font-black flex items-center justify-center shadow-lg shadow-lime-500/20 transform hover:scale-110 active:scale-95 transition-all"
            >
              <svg className="w-6 h-6 text-emerald-950 stroke-[3]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
            </Link>
          )}
        </div>

        {/* Slot 4: Goals */}
        <Link
          to="/schedule"
          className={`flex-1 flex flex-col items-center justify-center py-1.5 px-2 rounded-2xl transition-all duration-200 ${
            location.pathname === '/schedule' 
              ? 'bg-[#124d2c] text-white font-bold shadow-inner' 
              : 'text-emerald-200/70 hover:text-white'
          }`}
        >
          <svg className="w-5 h-5 mb-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9 9 0 100-18 9 9 0 000 18z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 15a3 3 0 100-6 3 3 0 000 6z" />
          </svg>
          <span className="text-[10px] font-semibold tracking-tight">Goals</span>
        </Link>

        {/* Slot 5: Settings / Lifestyle */}
        <Link
          to="/lifestyle"
          className={`flex-1 flex flex-col items-center justify-center py-1.5 px-2 rounded-2xl transition-all duration-200 ${
            location.pathname === '/lifestyle' 
              ? 'bg-[#124d2c] text-white font-bold shadow-inner' 
              : 'text-emerald-200/70 hover:text-white'
          }`}
        >
          <svg className="w-5 h-5 mb-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 010 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 010-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span className="text-[10px] font-semibold tracking-tight">Settings</span>
        </Link>
      </div>

      {/* Global Quick Add Modal */}
      {onAddTransaction && (
        <QuickAddModal 
          isOpen={isQuickAddOpen} 
          onClose={() => setIsQuickAddOpen(false)} 
          onAddTransaction={onAddTransaction} 
        />
      )}
    </div>
  );
};

export default Layout;
