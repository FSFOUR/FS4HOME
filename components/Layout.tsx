import React, { useState, useEffect } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { ICONS } from '../constants';
import QuickAddModal from './QuickAddModal';
import { GlobalSearchModal } from './GlobalSearchModal';
import { Toast } from './Toast';
import { Transaction, AppState } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  state?: AppState;
  onAddTransaction?: (t: Omit<Transaction, 'id'>) => void;
  toastMessage?: string | null;
  onCloseToast?: () => void;
}

const Layout: React.FC<LayoutProps> = ({ 
  children, 
  state,
  onAddTransaction,
  toastMessage = null,
  onCloseToast = () => {}
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    return localStorage.getItem('fs4home_sidebar_collapsed') === 'true';
  });

  const toggleSidebar = () => {
    const next = !isSidebarCollapsed;
    setIsSidebarCollapsed(next);
    localStorage.setItem('fs4home_sidebar_collapsed', String(next));
  };

  // Keyboard shortcut Ctrl+K or / for Search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Title lookup
  const getPageTitle = () => {
    switch (location.pathname) {
      case '/': return 'Dashboard';
      case '/finance': return 'Transactions & Records';
      case '/pareto':
      case '/insights': return '80/20 Insights';
      case '/budget': return 'Budget & Allocation';
      case '/goals': return 'Financial Goals';
      case '/schedule': return 'Schedule & Routines';
      case '/lifestyle': return 'Food & Lifestyle';
      case '/zakat': return 'Zakat & Charity';
      case '/tools/calculator': return 'Financial Calculator';
      case '/settings': return 'Settings';
      default: return 'FS4HOME';
    }
  };

  const navGroups = [
    {
      group: 'Main',
      items: [
        { path: '/', icon: ICONS.Dashboard, label: 'Dashboard', short: 'Home' },
        { path: '/finance', icon: ICONS.Finance, label: 'Transactions', short: 'Txns' },
        { path: '/budget', icon: ICONS.Finance, label: 'Budget', short: 'Budget' },
        { path: '/pareto', icon: ICONS.Analytics || ICONS.Dashboard, label: '80/20 Insights', short: '80/20' },
        { path: '/goals', icon: ICONS.Schedule, label: 'Goals', short: 'Goals' },
      ]
    },
    {
      group: 'Tools & Planning',
      items: [
        { path: '/schedule', icon: ICONS.Schedule, label: 'Schedule & Routine', short: 'Plan' },
        { path: '/lifestyle', icon: ICONS.Food, label: 'Food & Lifestyle', short: 'Food' },
        { path: '/zakat', icon: ICONS.Zakat, label: 'Zakat & Charity', short: 'Zakat' },
        { path: '/tools/calculator', icon: ICONS.Analytics || ICONS.Finance, label: 'Calculator', short: 'Calc' },
      ]
    },
    {
      group: 'System',
      items: [
        { path: '/settings', icon: ICONS.Dashboard, label: 'Settings', short: 'Settings' },
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#04160c] via-[#092616] to-[#0f3b23] text-slate-100 font-sans relative selection:bg-lime-400 selection:text-emerald-950 pb-20 md:pb-6">
      
      {/* Background ambient accents */}
      <div className="fixed top-0 left-1/4 w-72 h-72 bg-lime-500/10 rounded-full blur-3xl pointer-events-none -z-0" />
      <div className="fixed bottom-10 right-10 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none -z-0" />

      {/* Global Compact Header (Desktop & Mobile) */}
      <header className="sticky top-0 z-40 h-12 md:h-13 bg-[#061e12]/90 backdrop-blur-md border-b border-lime-500/20 px-3 md:px-5 flex items-center justify-between shadow-sm">
        {/* Left: Brand & Page Context */}
        <div className="flex items-center gap-2.5">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-7 h-7 rounded-lg bg-lime-400 text-emerald-950 flex items-center justify-center font-black text-xs shadow-sm glow-lime-sm">
              FS
            </div>
            <span className="font-black text-sm tracking-tight text-white hidden sm:inline">FS4HOME</span>
          </Link>

          <span className="text-emerald-500/50 text-xs hidden sm:inline">/</span>
          <h2 className="text-xs md:text-sm font-bold text-emerald-200 tracking-tight truncate max-w-[140px] sm:max-w-none">
            {getPageTitle()}
          </h2>
        </div>

        {/* Right: Quick Search, Add Button, Density Indicator, Profile */}
        <div className="flex items-center gap-2">
          {/* Quick Search Button */}
          <button
            onClick={() => setIsSearchOpen(true)}
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-emerald-950/60 border border-emerald-500/20 hover:border-lime-400/40 text-emerald-300 text-xs transition-colors"
            title="Search anything (Ctrl+K)"
          >
            <svg className="w-3.5 h-3.5 text-lime-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
            <span className="hidden md:inline text-[11px] text-emerald-300/70">Search...</span>
            <kbd className="hidden lg:inline text-[9px] font-mono px-1 bg-emerald-900/60 text-emerald-400/80 rounded border border-emerald-700/50">
              ⌘K
            </kbd>
          </button>

          {/* Quick Add Button */}
          {onAddTransaction && (
            <button
              onClick={() => setIsQuickAddOpen(true)}
              className="px-2.5 py-1.5 rounded-lg bg-lime-400 hover:bg-lime-300 text-emerald-950 text-xs font-black flex items-center gap-1 shadow-sm glow-lime-sm transition-all active:scale-95"
            >
              <span className="text-sm font-bold leading-none">+</span>
              <span className="hidden sm:inline">Add</span>
            </button>
          )}

          {/* Settings Link */}
          <Link
            to="/settings"
            className="p-1.5 rounded-lg text-emerald-300/80 hover:text-white hover:bg-emerald-900/40 transition-colors"
            title="Settings & Display Density"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 010 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 010-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </Link>
        </div>
      </header>

      <div className="flex min-h-[calc(100vh-3rem)]">
        {/* Desktop Left Sidebar (Collapsible: 200px or 60px) */}
        <aside 
          className={`hidden md:flex flex-col border-r border-lime-500/15 bg-[#051c10]/95 backdrop-blur-md sticky top-12 h-[calc(100vh-3rem)] transition-all duration-200 justify-between ${
            isSidebarCollapsed ? 'w-16 p-2' : 'w-52 p-3'
          }`}
        >
          <div className="space-y-4 overflow-y-auto no-scrollbar">
            {/* Collapse / Expand Toggle Button */}
            <div className={`flex items-center ${isSidebarCollapsed ? 'justify-center' : 'justify-between'} pb-1 border-b border-emerald-500/10`}>
              {!isSidebarCollapsed && (
                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400/60">Menu</span>
              )}
              <button
                onClick={toggleSidebar}
                className="p-1 rounded text-emerald-400 hover:text-white hover:bg-emerald-900/40 text-xs transition-colors"
                title={isSidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
              >
                {isSidebarCollapsed ? '→' : '←'}
              </button>
            </div>

            {/* Navigation Groups */}
            {navGroups.map((grp) => (
              <div key={grp.group} className="space-y-0.5">
                {!isSidebarCollapsed && (
                  <div className="text-[9px] font-black uppercase tracking-wider text-emerald-400/50 px-2 py-0.5">
                    {grp.group}
                  </div>
                )}
                {grp.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.path;

                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      title={item.label}
                      className={`flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all group ${
                        isActive
                          ? 'bg-lime-400 text-emerald-950 shadow-sm font-black glow-lime-sm'
                          : 'text-emerald-200/70 hover:text-white hover:bg-emerald-900/40'
                      } ${isSidebarCollapsed ? 'justify-center px-2 py-2' : ''}`}
                    >
                      <div className={`shrink-0 ${isActive ? 'text-emerald-950' : 'text-lime-400 group-hover:scale-105'} transition-transform`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      {!isSidebarCollapsed && (
                        <span className="truncate">{item.label}</span>
                      )}
                    </Link>
                  );
                })}
              </div>
            ))}
          </div>

          {/* Sidebar Footer User Badge */}
          <div className="pt-2 border-t border-emerald-500/15">
            <Link
              to="/settings"
              className={`flex items-center gap-2 p-1.5 rounded-xl hover:bg-emerald-900/40 transition-colors ${
                isSidebarCollapsed ? 'justify-center' : ''
              }`}
            >
              <div className="w-6 h-6 rounded-full bg-lime-400/20 border border-lime-400/40 flex items-center justify-center text-lime-400 font-bold text-[10px]">
                {state?.userName ? state.userName.slice(0, 2).toUpperCase() : 'ME'}
              </div>
              {!isSidebarCollapsed && (
                <div className="truncate">
                  <div className="text-xs font-bold text-white truncate">{state?.userName || 'User'}</div>
                  <div className="text-[9px] text-emerald-400/70 font-medium">80/20 Active</div>
                </div>
              )}
            </Link>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 p-3 sm:p-5 md:p-6 max-w-6xl mx-auto w-full">
          {children}
        </main>
      </div>

      {/* Mobile-Only Bottom Navigation Dock (5 slots: Home, Txns, Budget, Insights, More) */}
      <nav className="md:hidden fixed bottom-2 left-2 right-2 z-50 bg-[#061e12]/95 border border-lime-500/25 rounded-2xl px-1 py-1 flex items-center justify-around shadow-xl backdrop-blur-lg">
        {/* Slot 1: Home */}
        <Link
          to="/"
          className={`flex-1 flex flex-col items-center justify-center py-1 rounded-xl transition-all ${
            location.pathname === '/' ? 'bg-emerald-900/70 text-lime-300 font-black' : 'text-emerald-200/70'
          }`}
        >
          <svg className="w-4 h-4 mb-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h7.5" />
          </svg>
          <span className="text-[9px] font-bold">Home</span>
        </Link>

        {/* Slot 2: Transactions */}
        <Link
          to="/finance"
          className={`flex-1 flex flex-col items-center justify-center py-1 rounded-xl transition-all ${
            location.pathname === '/finance' ? 'bg-emerald-900/70 text-lime-300 font-black' : 'text-emerald-200/70'
          }`}
        >
          <svg className="w-4 h-4 mb-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
          </svg>
          <span className="text-[9px] font-bold">Txns</span>
        </Link>

        {/* Slot 3: Budget */}
        <Link
          to="/budget"
          className={`flex-1 flex flex-col items-center justify-center py-1 rounded-xl transition-all ${
            location.pathname === '/budget' ? 'bg-emerald-900/70 text-lime-300 font-black' : 'text-emerald-200/70'
          }`}
        >
          <svg className="w-4 h-4 mb-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
          </svg>
          <span className="text-[9px] font-bold">Budget</span>
        </Link>

        {/* Slot 4: 80/20 Insights */}
        <Link
          to="/pareto"
          className={`flex-1 flex flex-col items-center justify-center py-1 rounded-xl transition-all ${
            location.pathname === '/pareto' ? 'bg-emerald-900/70 text-lime-300 font-black' : 'text-emerald-200/70'
          }`}
        >
          <svg className="w-4 h-4 mb-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m1-3l1 3m5-3l-1 3m1-3l1 3M9 6.75h1.5m1.5 0H15m-6 3h1.5m1.5 0H15m-6 3h1.5m1.5 0H15" />
          </svg>
          <span className="text-[9px] font-bold">80/20</span>
        </Link>

        {/* Slot 5: More Menu Sheet Trigger */}
        <button
          onClick={() => setIsMoreMenuOpen(true)}
          className="flex-1 flex flex-col items-center justify-center py-1 rounded-xl text-emerald-200/70 hover:text-white"
        >
          <svg className="w-4 h-4 mb-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
          </svg>
          <span className="text-[9px] font-bold">More</span>
        </button>
      </nav>

      {/* Mobile "More" Bottom Sheet Drawer */}
      {isMoreMenuOpen && (
        <div className="md:hidden fixed inset-0 bg-black/75 backdrop-blur-sm z-[150] flex flex-col justify-end animate-in fade-in duration-200">
          <div className="bg-[#082215] border-t border-lime-400/30 rounded-t-3xl p-4 space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-emerald-500/20 pb-2">
              <span className="text-xs font-black uppercase text-lime-400 tracking-wider">All Modules & Tools</span>
              <button 
                onClick={() => setIsMoreMenuOpen(false)}
                className="text-xs text-emerald-300 font-bold p-1 hover:text-white"
              >
                Done ✕
              </button>
            </div>

            {/* Grid of Tools */}
            <div className="grid grid-cols-3 gap-1.5">
              {[
                { path: '/goals', icon: '🎯', label: 'Goals' },
                { path: '/schedule', icon: '📅', label: 'Schedule' },
                { path: '/lifestyle', icon: '🍽️', label: 'Lifestyle' },
                { path: '/zakat', icon: '🤲', label: 'Zakat' },
                { path: '/tools/calculator', icon: '🧮', label: 'Calculator' },
                { path: '/settings', icon: '⚙️', label: 'Settings' },
              ].map(tool => (
                <button
                  key={tool.path}
                  onClick={() => {
                    navigate(tool.path);
                    setIsMoreMenuOpen(false);
                  }}
                  className="p-2.5 rounded-xl bg-emerald-950/60 border border-emerald-500/20 flex flex-col items-center gap-1 hover:border-lime-400/40 text-center"
                >
                  <span className="text-lg">{tool.icon}</span>
                  <span className="text-[10px] font-black text-white">{tool.label}</span>
                </button>
              ))}
            </div>

            {/* Quick Actions inside Drawer */}
            <div className="pt-2 border-t border-emerald-500/15 flex gap-2">
              {onAddTransaction && (
                <button
                  onClick={() => {
                    setIsMoreMenuOpen(false);
                    setIsQuickAddOpen(true);
                  }}
                  className="flex-1 py-2.5 rounded-xl bg-lime-400 text-emerald-950 font-black text-xs shadow-md glow-lime-sm flex items-center justify-center gap-1"
                >
                  <span>+ Quick Add Transaction</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Global Quick Add Modal */}
      {onAddTransaction && (
        <QuickAddModal 
          isOpen={isQuickAddOpen} 
          onClose={() => setIsQuickAddOpen(false)} 
          onAddTransaction={onAddTransaction} 
        />
      )}

      {/* Global Search Modal */}
      {state && (
        <GlobalSearchModal
          isOpen={isSearchOpen}
          onClose={() => setIsSearchOpen(false)}
          state={state}
        />
      )}

      {/* Global Toast Notification */}
      <Toast 
        message={toastMessage} 
        onClose={onCloseToast} 
      />
    </div>
  );
};

export default Layout;
