import React, { useState, useEffect } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { ICONS } from '../constants';
import QuickAddModal from './QuickAddModal';
import { GlobalSearchModal } from './GlobalSearchModal';
import { Toast } from './Toast';
import { Transaction, AppState, RecurringExpenseItem, AutofillMemoryItem } from '../types';
import { getOrCreateMonthlyPlan, calculateBudgetCategoryAlerts } from '../services/budgetService';

interface LayoutProps {
  children: React.ReactNode;
  state?: AppState;
  onUpdateState?: React.Dispatch<React.SetStateAction<AppState>>;
  onAddTransaction?: (t: Omit<Transaction, 'id'>) => void;
  onAddRecurringExpense?: (item: Omit<RecurringExpenseItem, 'id'>) => void;
  onSaveAutofillMemory?: (item: Omit<AutofillMemoryItem, 'id'>) => void;
  toastMessage?: string | null;
  onCloseToast?: () => void;
  showToast?: (msg: string) => void;
}

const Layout: React.FC<LayoutProps> = ({ 
  children, 
  state,
  onUpdateState,
  onAddTransaction,
  onAddRecurringExpense,
  onSaveAutofillMemory,
  toastMessage = null,
  onCloseToast = () => {},
  showToast
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

  // Intelligent Category Budget Alerts Summary
  const budgetAlerts = React.useMemo(() => {
    if (!state) return null;
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    const currentMonthKey = `${currentYear}-${(currentMonth + 1).toString().padStart(2, '0')}`;
    const plan = getOrCreateMonthlyPlan(
      state.monthlyBudgetPlans,
      state.customBudgetCategories,
      currentMonthKey
    );
    return calculateBudgetCategoryAlerts(plan, state.transactions || [], currentMonthKey);
  }, [state?.monthlyBudgetPlans, state?.customBudgetCategories, state?.transactions]);

  // Title lookup
  const getPageTitle = () => {
    switch (location.pathname) {
      case '/': return 'Dashboard';
      case '/finance': return 'Transactions & Records';
      case '/pareto':
      case '/insights': return '80/20 Insights';
      case '/report':
      case '/reports': return 'Monthly Report';
      case '/budget': return 'Budget & Allocation';
      case '/goals': return 'Financial Goals';
      case '/schedule': return 'Schedule & Routines';
      case '/lifestyle': return 'Food & Lifestyle';
      case '/zakat': return 'Zakat & Charity';
      case '/loans':
      case '/tools/calculator': return 'Loan & Borrowing Manager';
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
        { path: '/loans', icon: ICONS.Analytics || ICONS.Finance, label: 'Loans & EMI', short: 'Loans' },
        { path: '/report', icon: ICONS.Analytics, label: 'Monthly Report', short: 'Report' },
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
        { path: '/tools/calculator', icon: ICONS.Analytics || ICONS.Finance, label: 'Loan Calculator', short: 'Calc' },
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
    <div className="min-h-screen app-main-layout font-sans relative selection:bg-lime-400 selection:text-white pb-20 md:pb-6 transition-colors duration-200">
      
      {/* Background ambient accents */}
      <div className="fixed top-0 left-1/4 w-72 h-72 rounded-full blur-3xl pointer-events-none -z-0 theme-ambient-accent-1 opacity-70" />
      <div className="fixed bottom-10 right-10 w-72 h-72 rounded-full blur-3xl pointer-events-none -z-0 theme-ambient-accent-2 opacity-70" />

      {/* Global Compact Header (Desktop & Mobile) */}
      <header className="sticky top-0 z-40 h-13 app-header backdrop-blur-md px-3 sm:px-6 flex items-center justify-between shadow-xs transition-colors duration-200">
        {/* Left: Brand & Page Context */}
        <div className="flex items-center gap-3">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-xl bg-[#244A38] text-white flex items-center justify-center font-black text-xs shadow-xs tracking-tight">
              FS
            </div>
            <span className="font-bold text-base text-[#24342B] tracking-tight hidden sm:inline">FS4HOME</span>
          </Link>

          <span className="text-[#CBD5C8] text-sm hidden sm:inline">/</span>
          <h2 className="text-xs md:text-sm font-semibold text-[#24342B] tracking-tight truncate max-w-[140px] sm:max-w-none">
            {getPageTitle()}
          </h2>
        </div>

        {/* Right: Search, Quick Add, Notifications, User Profile */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          {/* Quick Search Button (Pill shape matching Coinest snap) */}
          <button
            onClick={() => setIsSearchOpen(true)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-[#D6DDD2] hover:border-[#244A38] text-xs text-[#68756C] shadow-xs transition-all w-28 sm:w-48 md:w-56 justify-between"
            title="Search transactions, budgets, tools (Ctrl+K)"
          >
            <div className="flex items-center gap-1.5 truncate">
              <svg className="w-3.5 h-3.5 text-[#68756C] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
              </svg>
              <span className="truncate">Search...</span>
            </div>
            <kbd className="hidden md:inline text-[9px] font-mono px-1 rounded bg-[#F0F1E9] text-[#68756C]">
              ⌘K
            </kbd>
          </button>

          {/* Quick Add Button */}
          {onAddTransaction && (
            <button
              onClick={() => setIsQuickAddOpen(true)}
              className="px-3 py-1.5 rounded-xl bg-[#244A38] hover:bg-[#1a382a] text-white text-xs font-bold flex items-center gap-1 shadow-xs transition-all active:scale-95"
            >
              <span className="text-sm font-bold leading-none">+</span>
              <span className="hidden sm:inline">Add</span>
            </button>
          )}

          {/* Intelligent Budget Alerts Bell */}
          <Link
            to="/"
            className="relative w-8 h-8 rounded-full bg-white border border-[#D6DDD2] hover:bg-[#F0F1E9] flex items-center justify-center text-sm text-[#24342B] transition-colors"
            title={
              budgetAlerts && budgetAlerts.alerts.length > 0
                ? `${budgetAlerts.alerts.length} budget category alerts (≥80% limit)`
                : 'Budget categories healthy'
            }
          >
            <span>🔔</span>
            {budgetAlerts && budgetAlerts.alerts.length > 0 && (
              <span className={`absolute -top-0.5 -right-0.5 flex h-4 min-w-4 px-1 items-center justify-center rounded-full text-[9px] font-black text-white shadow-xs ${
                budgetAlerts.criticalCount > 0 ? 'bg-[#B63D3D] animate-pulse' : 'bg-[#A96C18]'
              }`}>
                {budgetAlerts.alerts.length}
              </span>
            )}
          </Link>

          {/* User Profile Capsule */}
          <Link
            to="/settings"
            className="flex items-center gap-2 pl-1 pr-2.5 py-1 rounded-full bg-white border border-[#D6DDD2] hover:border-[#244A38] transition-colors"
            title="Settings & Preferences"
          >
            <div className="w-6 h-6 rounded-full bg-[#244A38] text-white flex items-center justify-center text-[10px] font-bold">
              {state?.userName && state.userName !== 'User' ? state.userName.slice(0, 2).toUpperCase() : 'SH'}
            </div>
            <span className="text-xs font-bold text-[#24342B] hidden sm:inline truncate max-w-[80px]">
              {state?.userName && state.userName !== 'User' ? state.userName : 'Shafi'}
            </span>
          </Link>
        </div>
      </header>

      <div className="flex min-h-[calc(100vh-3.25rem)]">
        {/* Desktop Left Sidebar (224px or collapsed 64px) */}
        <aside 
          className={`hidden md:flex flex-col app-sidebar sticky top-13 h-[calc(100vh-3.25rem)] transition-all duration-200 justify-between ${
            isSidebarCollapsed ? 'w-16 p-2' : 'w-56 p-3.5'
          }`}
        >
          <div className="space-y-4 overflow-y-auto no-scrollbar">
            {/* Collapse / Expand Toggle Button */}
            <div className={`flex items-center ${isSidebarCollapsed ? 'justify-center' : 'justify-between'} pb-1 border-b border-[#315B45]`}>
              {!isSidebarCollapsed && (
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#A8C5A0]">Navigation</span>
              )}
              <button
                onClick={toggleSidebar}
                className="p-1 rounded-lg text-white/70 hover:text-white hover:bg-[#315B45] text-xs transition-colors"
                title={isSidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
              >
                {isSidebarCollapsed ? '→' : '←'}
              </button>
            </div>

            {/* Navigation Groups */}
            {navGroups.map((grp) => (
              <div key={grp.group} className="space-y-0.5">
                {!isSidebarCollapsed && (
                  <div className="text-[10px] font-bold uppercase tracking-wider text-[#A8C5A0] px-2.5 py-1">
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
                      className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs transition-all group font-semibold ${
                        isActive
                          ? 'bg-[#315B45] text-white font-bold border-l-4 border-[#A8C5A0] shadow-xs'
                          : 'text-[#EAF1E6] hover:text-white hover:bg-[#315B45]'
                      } ${isSidebarCollapsed ? 'justify-center px-2 py-2' : ''}`}
                    >
                      <div className={`shrink-0 ${isActive ? 'text-white' : 'text-[#A8C5A0]'} transition-colors`}>
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

          {/* Sidebar Footer: Calm Wealth Rule Card (matching Coinest snap!) */}
          {!isSidebarCollapsed ? (
            <div className="bg-[#244A38] text-white rounded-2xl p-3.5 space-y-2 mt-auto shadow-sm">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-[#315B45] flex items-center justify-center text-xs">
                  🌱
                </div>
                <span className="text-xs font-bold text-white leading-tight">Calm Wealth Focus</span>
              </div>
              <p className="text-[11px] text-[#A8C5A0] leading-snug">
                Prioritize top 20% spending drivers for 80% long-term financial clarity.
              </p>
              <Link
                to="/pareto"
                className="block text-center text-[10px] font-bold bg-[#A8C5A0] hover:bg-[#bce0b4] text-[#244A38] py-1.5 px-2 rounded-lg transition-colors"
              >
                80/20 Insights →
              </Link>
            </div>
          ) : (
            <div className="pt-2 border-t border-[#E1E5DC] flex justify-center">
              <Link
                to="/settings"
                className="w-8 h-8 rounded-full bg-[#244A38] text-white flex items-center justify-center text-[10px] font-bold"
                title="Settings"
              >
                {state?.userName && state.userName !== 'User' ? state.userName.slice(0, 2).toUpperCase() : 'SH'}
              </Link>
            </div>
          )}
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 p-3 sm:p-5 md:p-6 max-w-6xl mx-auto w-full">
          {children}
        </main>
      </div>

      {/* Mobile-Only Bottom Navigation Dock (5 slots: Home, Txns, Budget, Insights, More) */}
      <nav className="md:hidden fixed bottom-2 left-2 right-2 z-50 bg-white border border-[#E1E5DC] rounded-2xl px-1 py-1 flex items-center justify-around shadow-xl backdrop-blur-lg mobile-bottom-nav">
        {/* Slot 1: Home */}
        <Link
          to="/"
          className={`flex-1 flex flex-col items-center justify-center py-1.5 rounded-xl transition-all ${
            location.pathname === '/' ? 'bg-[#EAF1E6] text-[#244A38] font-bold' : 'text-[#68756C]'
          }`}
        >
          <svg className="w-4 h-4 mb-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h7.5" />
          </svg>
          <span className="text-[9px]">Home</span>
        </Link>

        {/* Slot 2: Transactions */}
        <Link
          to="/finance"
          className={`flex-1 flex flex-col items-center justify-center py-1.5 rounded-xl transition-all ${
            location.pathname === '/finance' ? 'bg-[#EAF1E6] text-[#244A38] font-bold' : 'text-[#68756C]'
          }`}
        >
          <svg className="w-4 h-4 mb-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
          </svg>
          <span className="text-[9px]">Txns</span>
        </Link>

        {/* Slot 3: Budget */}
        <Link
          to="/budget"
          className={`flex-1 flex flex-col items-center justify-center py-1.5 rounded-xl transition-all ${
            location.pathname === '/budget' ? 'bg-[#EAF1E6] text-[#244A38] font-bold' : 'text-[#68756C]'
          }`}
        >
          <svg className="w-4 h-4 mb-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
          </svg>
          <span className="text-[9px]">Budget</span>
        </Link>

        {/* Slot 4: 80/20 Insights */}
        <Link
          to="/pareto"
          className={`flex-1 flex flex-col items-center justify-center py-1.5 rounded-xl transition-all ${
            location.pathname === '/pareto' ? 'bg-[#EAF1E6] text-[#244A38] font-bold' : 'text-[#68756C]'
          }`}
        >
          <svg className="w-4 h-4 mb-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m1-3l1 3m5-3l-1 3m1-3l1 3M9 6.75h1.5m1.5 0H15m-6 3h1.5m1.5 0H15m-6 3h1.5m1.5 0H15" />
          </svg>
          <span className="text-[9px]">80/20</span>
        </Link>

        {/* Slot 5: More Menu Sheet Trigger */}
        <button
          onClick={() => setIsMoreMenuOpen(true)}
          className="flex-1 flex flex-col items-center justify-center py-1.5 rounded-xl text-[#68756C] hover:text-[#244A38]"
        >
          <svg className="w-4 h-4 mb-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
          </svg>
          <span className="text-[9px]">More</span>
        </button>
      </nav>

      {/* Mobile "More" Bottom Sheet Drawer */}
      {isMoreMenuOpen && (
        <div className="md:hidden fixed inset-0 bg-black/40 backdrop-blur-xs z-[150] flex flex-col justify-end animate-in fade-in duration-200">
          <div className="bg-white border-t border-[#E1E5DC] rounded-t-3xl p-4 space-y-4 max-h-[85vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#E1E5DC] pb-2">
              <span className="text-xs font-bold uppercase text-[#244A38] tracking-wider">All Modules & Tools</span>
              <button 
                onClick={() => setIsMoreMenuOpen(false)}
                className="text-xs text-[#68756C] font-bold p-1 hover:text-[#244A38]"
              >
                Done ✕
              </button>
            </div>

            {/* Grid of Tools */}
            <div className="grid grid-cols-3 gap-2">
              {[
                { path: '/loans', icon: '💳', label: 'Loans & EMI' },
                { path: '/report', icon: '📊', label: 'Report' },
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
                  className="p-3 rounded-2xl bg-[#F0F1E9] border border-[#E1E5DC] flex flex-col items-center gap-1 hover:border-[#244A38] hover:bg-[#E9EEE5] text-center transition-all"
                >
                  <span className="text-xl">{tool.icon}</span>
                  <span className="text-[11px] font-bold text-[#24342B]">{tool.label}</span>
                </button>
              ))}
            </div>

            {/* Quick Actions inside Drawer */}
            <div className="pt-2 border-t border-[#E1E5DC] flex gap-2">
              {onAddTransaction && (
                <button
                  onClick={() => {
                    setIsMoreMenuOpen(false);
                    setIsQuickAddOpen(true);
                  }}
                  className="flex-1 py-2.5 rounded-xl bg-[#244A38] hover:bg-[#1a382a] text-white font-bold text-xs shadow-xs flex items-center justify-center gap-1 transition-colors"
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
          state={state}
          onAddTransaction={onAddTransaction} 
          onAddRecurringExpense={onAddRecurringExpense}
          onSaveAutofillMemory={onSaveAutofillMemory}
          onShowToast={showToast}
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
