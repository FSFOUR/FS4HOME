import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { BudgetAlertsSummary, BudgetCategoryAlert } from '../services/budgetService';

interface WelcomeBannerProps {
  userName: string;
  onUpdateUserName?: (name: string) => void;
  alertsSummary: BudgetAlertsSummary;
  dailyPacerStats: {
    targetDailyLimit: number;
    todayExpenses: number;
    remainingToday: number;
    daysElapsed: number;
    totalDaysInMonth: number;
    monthName: string;
    paceStatus: 'under' | 'nearing' | 'over';
  };
  onOpenQuickAdd?: () => void;
}

export const WelcomeBanner: React.FC<WelcomeBannerProps> = ({
  userName,
  onUpdateUserName,
  alertsSummary,
  dailyPacerStats,
  onOpenQuickAdd
}) => {
  const [isAlertsOpen, setIsAlertsOpen] = useState<boolean>(false);
  const [isEditingName, setIsEditingName] = useState<boolean>(false);
  const [tempName, setTempName] = useState<string>(userName && userName !== 'User' ? userName : 'Shafi');
  const [selectedAlertFilter, setSelectedAlertFilter] = useState<'all' | 'critical' | 'caution'>('all');

  const {
    alerts,
    criticalCount,
    cautionCount,
    totalOverrunAmount,
    highestSeverity,
    allCategories,
    daysElapsed,
    totalDaysInMonth,
    daysRemaining,
    monthElapsedPct
  } = alertsSummary;

  const hasAlerts = alerts.length > 0;

  // Determine time-of-day greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return { text: 'Good morning', icon: '☀️' };
    if (hour < 17) return { text: 'Good afternoon', icon: '🌤️' };
    return { text: 'Good evening', icon: '🌙' };
  };

  const greeting = getGreeting();

  // Current formatted date
  const now = new Date();
  const formattedDate = now.toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });

  // Initials for avatar and display name for logged-in user
  const displayName = (userName && userName.trim() !== 'User' && userName.trim()) || 'Shafi';
  const initials = displayName
    .split(' ')
    .filter(Boolean)
    .map(n => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() || 'SH';

  const handleSaveName = (e: React.FormEvent) => {
    e.preventDefault();
    if (tempName.trim() && onUpdateUserName) {
      onUpdateUserName(tempName.trim());
    }
    setIsEditingName(false);
  };

  // Filter alerts by severity tab
  const displayedAlerts = alerts.filter(a => {
    if (selectedAlertFilter === 'critical') return a.severity === 'critical';
    if (selectedAlertFilter === 'caution') return a.severity === 'caution';
    return true;
  });

  return (
    <section
      aria-label="Welcome and Financial Overview Banner"
      className="glass-card rounded-2xl border border-emerald-500/25 bg-gradient-to-r from-[#072416]/95 via-[#0b331f]/90 to-[#072416]/95 relative overflow-hidden shadow-sm transition-all"
    >
      {/* Ambient background glow */}
      <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full blur-3xl pointer-events-none bg-emerald-400/10" />

      {/* Main Welcome Content */}
      <div className="p-3.5 sm:p-4 relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-3.5">
        
        {/* Left: Avatar & Greeting */}
        <div className="flex items-start sm:items-center gap-3">
          {/* User Avatar Circle */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.88 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="relative shrink-0"
          >
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-800 border-2 border-emerald-400/30 flex items-center justify-center text-white font-black text-sm shadow-md">
              {initials}
            </div>
            <span 
              className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-lime-400 border-2 border-[#072416]" 
              title="Active & Syncing"
            />
          </motion.div>

          {/* Welcome Text & Date */}
          <div className="space-y-0.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm">{greeting.icon}</span>
              {isEditingName ? (
                <form onSubmit={handleSaveName} className="flex items-center gap-1.5">
                  <input
                    type="text"
                    value={tempName}
                    onChange={e => setTempName(e.target.value)}
                    className="px-2 py-0.5 text-sm bg-emerald-950 border border-emerald-500/50 rounded text-white font-bold focus:outline-none focus:border-lime-400"
                    autoFocus
                  />
                  <button
                    type="submit"
                    className="text-[10px] bg-lime-400 text-emerald-950 font-bold px-2 py-0.5 rounded hover:bg-lime-300"
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsEditingName(false)}
                    className="text-[10px] text-slate-400 hover:text-white px-1"
                  >
                    Cancel
                  </button>
                </form>
              ) : (
                <motion.div 
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                  className="flex items-center gap-1.5"
                >
                  <h1 className="text-base sm:text-lg font-black text-white tracking-tight flex items-center gap-1.5 flex-wrap">
                    <span>{greeting.text},</span>
                    <motion.span 
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ 
                        duration: 0.5, 
                        delay: 0.12, 
                        ease: [0.16, 1, 0.3, 1] 
                      }}
                      className="text-lime-300 font-black inline-block tracking-normal drop-shadow-[0_1px_10px_rgba(190,242,100,0.3)]"
                    >
                      {displayName}
                    </motion.span>
                    <span>!</span>
                  </h1>
                  {onUpdateUserName && (
                    <motion.button
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.3, delay: 0.3 }}
                      onClick={() => {
                        setTempName(displayName);
                        setIsEditingName(true);
                      }}
                      className="text-slate-400 hover:text-emerald-300 p-0.5 text-xs transition-colors"
                      title="Edit display name"
                    >
                      ✏️
                    </motion.button>
                  )}
                </motion.div>
              )}

              {/* Status Indicator Chip */}
              {hasAlerts ? (
                <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full border flex items-center gap-1 ${
                  highestSeverity === 'critical'
                    ? 'bg-rose-500/25 text-rose-300 border-rose-500/40 animate-pulse'
                    : 'bg-amber-500/25 text-amber-300 border-amber-500/40'
                }`}>
                  <span>{highestSeverity === 'critical' ? '🚨' : '⚠️'}</span>
                  <span>{alerts.length} Category Alert{alerts.length > 1 ? 's' : ''} (≥80%)</span>
                </span>
              ) : (
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                  <span>✓</span>
                  <span>Budgets Safe (&lt;80%)</span>
                </span>
              )}
            </div>

            {/* Sub-headline with Date & Pacing */}
            <p className="text-xs text-emerald-200/80 flex items-center gap-2 flex-wrap">
              <span>{formattedDate}</span>
              <span className="text-emerald-500/60">•</span>
              <span>Day {daysElapsed} of {totalDaysInMonth} ({monthElapsedPct}% of month)</span>
              <span className="text-emerald-500/60">•</span>
              <span className="text-slate-300">
                {dailyPacerStats.todayExpenses === 0
                  ? `₹${dailyPacerStats.targetDailyLimit.toLocaleString()} safe limit available today`
                  : `₹${dailyPacerStats.remainingToday.toLocaleString()} left today`}
              </span>
            </p>
          </div>
        </div>

        {/* Right: Quick Action Controls */}
        <div className="flex items-center gap-2 flex-wrap lg:justify-end shrink-0 pt-1 lg:pt-0 border-t lg:border-t-0 border-white/5">
          {onOpenQuickAdd && (
            <button
              onClick={onOpenQuickAdd}
              className="px-3 py-1.5 rounded-xl bg-lime-400 hover:bg-lime-300 text-emerald-950 text-xs font-black transition-all flex items-center gap-1 shadow-sm glow-lime-sm active:scale-95"
            >
              <span className="text-sm font-bold leading-none">+</span>
              <span>Log Expense</span>
            </button>
          )}

          <Link
            to="/budget"
            className="px-3 py-1.5 rounded-xl bg-emerald-900/50 hover:bg-emerald-900/80 text-emerald-200 hover:text-white text-xs font-bold transition-all border border-emerald-500/30 flex items-center gap-1"
          >
            <span>Review Limits →</span>
          </Link>

          {/* Toggle Alert Drawer if alerts exist */}
          {hasAlerts && (
            <button
              onClick={() => setIsAlertsOpen(!isAlertsOpen)}
              className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border ${
                highestSeverity === 'critical'
                  ? 'bg-rose-500/20 text-rose-200 border-rose-500/40 hover:bg-rose-500/30'
                  : 'bg-amber-500/20 text-amber-200 border-amber-500/40 hover:bg-amber-500/30'
              }`}
              title={isAlertsOpen ? 'Hide Alert Details' : 'View Alert Breakdown'}
            >
              <span>{isAlertsOpen ? 'Hide Alerts' : `View Alerts (${alerts.length})`}</span>
              <span className="text-[10px] transform transition-transform">{isAlertsOpen ? '▲' : '▼'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Persistent Inline Alert Bar if categories exceed 80% */}
      {hasAlerts && (
        <div className={`px-3.5 py-2 border-t flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs transition-colors ${
          highestSeverity === 'critical'
            ? 'bg-rose-950/40 border-rose-500/30 text-rose-200'
            : 'bg-amber-950/40 border-amber-500/30 text-amber-200'
        }`}>
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                highestSeverity === 'critical' ? 'bg-rose-400' : 'bg-amber-400'
              }`}></span>
              <span className={`relative inline-flex rounded-full h-2 w-2 ${
                highestSeverity === 'critical' ? 'bg-rose-500' : 'bg-amber-400'
              }`}></span>
            </span>
            <span className="font-semibold text-slate-100">
              {alerts.length === 1 ? (
                <>
                  <strong className="text-white">{alerts[0].categoryIcon} {alerts[0].categoryName}</strong> has spent{' '}
                  <span className={alerts[0].severity === 'critical' ? 'text-rose-400 font-bold' : 'text-amber-300 font-bold'}>
                    {alerts[0].percentSpent}%
                  </span>{' '}
                  of its monthly budget (₹{alerts[0].actualSpent.toLocaleString()} / ₹{alerts[0].totalPlanned.toLocaleString()}).
                </>
              ) : (
                <>
                  <strong className="text-white">{alerts.length} categories</strong> have crossed 80% planned allocation:{' '}
                  {alerts.map((a, i) => (
                    <span key={a.categoryId} className="whitespace-nowrap">
                      {a.categoryName} ({a.percentSpent}%){i < alerts.length - 1 ? ', ' : ''}
                    </span>
                  ))}
                  {totalOverrunAmount > 0 && ` (Overrun: +₹${totalOverrunAmount.toLocaleString()})`}
                </>
              )}
            </span>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
            <button
              onClick={() => setIsAlertsOpen(!isAlertsOpen)}
              className="text-[11px] text-lime-400 hover:text-lime-300 font-bold underline"
            >
              {isAlertsOpen ? 'Close Drawer' : 'Show Details'}
            </button>
            <Link
              to="/budget"
              className="text-[11px] text-emerald-300 hover:text-white"
            >
              Adjust Plan →
            </Link>
          </div>
        </div>
      )}

      {/* Expandable Alert Details Drawer (when alerts exist and drawer is toggled) */}
      {hasAlerts && isAlertsOpen && (
        <div className="p-3.5 sm:p-4 space-y-3.5 bg-black/30 backdrop-blur-sm border-t border-white/5 animate-in slide-in-from-top-2 duration-200">
          
          {/* Severity Filter Tabs */}
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-1 p-1 rounded-xl bg-emerald-950/60 border border-emerald-500/20 text-xs">
              <button
                onClick={() => setSelectedAlertFilter('all')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                  selectedAlertFilter === 'all'
                    ? 'bg-amber-400 text-emerald-950 shadow-sm'
                    : 'text-emerald-300/70 hover:text-white'
                }`}
              >
                All Active ({alerts.length})
              </button>

              {criticalCount > 0 && (
                <button
                  onClick={() => setSelectedAlertFilter('critical')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                    selectedAlertFilter === 'critical'
                      ? 'bg-rose-500 text-white shadow-sm'
                      : 'text-rose-300/80 hover:text-rose-200'
                  }`}
                >
                  <span>Critical &gt;100% ({criticalCount})</span>
                </button>
              )}

              {cautionCount > 0 && (
                <button
                  onClick={() => setSelectedAlertFilter('caution')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                    selectedAlertFilter === 'caution'
                      ? 'bg-amber-400 text-emerald-950 shadow-sm'
                      : 'text-amber-300/80 hover:text-amber-200'
                  }`}
                >
                  <span>Caution 80–99% ({cautionCount})</span>
                </button>
              )}
            </div>

            <span className="text-[11px] text-emerald-300/60">
              Notification triggered because threshold &gt;= 80% was reached
            </span>
          </div>

          {/* Alert Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {displayedAlerts.map(alert => {
              const isOver = alert.severity === 'critical';
              const cardBorder = isOver ? 'border-rose-500/30' : 'border-amber-500/30';
              const cardBg = isOver ? 'bg-rose-950/20' : 'bg-amber-950/20';
              const progressWidth = Math.min(100, alert.percentSpent);

              return (
                <div
                  key={alert.categoryId}
                  className={`p-3.5 rounded-2xl border ${cardBorder} ${cardBg} space-y-3 relative overflow-hidden`}
                >
                  {/* Category Title & Severity Badge */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xl p-1.5 rounded-xl bg-white/5 border border-white/10">
                        {alert.categoryIcon}
                      </span>
                      <div>
                        <h3 className="text-sm font-black text-white flex items-center gap-1.5">
                          {alert.categoryName}
                        </h3>
                        <div className="text-[10px] text-slate-300/80 flex items-center gap-1.5">
                          <span>Plan: ₹{alert.totalPlanned.toLocaleString()}</span>
                          <span>•</span>
                          <span>Spent: ₹{alert.actualSpent.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full border inline-block ${
                        isOver 
                          ? 'bg-rose-500/20 text-rose-300 border-rose-500/40' 
                          : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                      }`}>
                        {isOver ? `Overbudget (${alert.percentSpent}%)` : `Nearing Limit (${alert.percentSpent}%)`}
                      </span>
                      <div className="text-[11px] font-black mt-0.5">
                        {isOver ? (
                          <span className="text-rose-400">+₹{alert.overrun.toLocaleString()} over limit</span>
                        ) : (
                          <span className="text-lime-300">₹{alert.remaining.toLocaleString()} remaining</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Progress Bar with 80% Threshold Mark */}
                  <div className="space-y-1">
                    <div className="w-full bg-emerald-950/90 rounded-full h-3 p-0.5 border border-emerald-500/30 overflow-hidden relative shadow-inner">
                      {/* 80% Threshold Tick */}
                      <div
                        className="absolute top-0 bottom-0 left-[80%] w-0.5 bg-amber-400 z-10 shadow-[0_0_4px_rgba(251,191,36,0.8)]"
                        title="80% Alert Threshold"
                      />
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          isOver
                            ? 'bg-gradient-to-r from-amber-500 to-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.6)]'
                            : 'bg-gradient-to-r from-lime-400 to-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.5)]'
                        }`}
                        style={{ width: `${progressWidth}%` }}
                      />
                    </div>

                    <div className="flex justify-between text-[10px] text-slate-300/70 font-medium px-0.5">
                      <span>₹0</span>
                      <span className="text-amber-300 font-bold">80% Mark (₹{Math.round(alert.totalPlanned * 0.8).toLocaleString()})</span>
                      <span className="font-bold text-white">Target: ₹{alert.totalPlanned.toLocaleString()}</span>
                    </div>
                  </div>

                  {/* Pacing Analytics */}
                  <div className="grid grid-cols-3 gap-2 pt-1 border-t border-white/5 text-[10px]">
                    <div className="p-2 rounded-xl bg-black/20 border border-white/5">
                      <span className="text-slate-400 block">Daily Burn</span>
                      <span className="text-xs font-black text-white">₹{alert.dailyBurnRate}/day</span>
                    </div>

                    <div className="p-2 rounded-xl bg-black/20 border border-white/5">
                      <span className="text-slate-400 block">Month-End Spend</span>
                      <span className={`text-xs font-black ${alert.projectedOverspend > 0 ? 'text-rose-400' : 'text-white'}`}>
                        ₹{alert.projectedMonthEndSpend.toLocaleString()}
                      </span>
                    </div>

                    <div className="p-2 rounded-xl bg-black/20 border border-white/5">
                      <span className="text-slate-400 block">Safe Daily Cap</span>
                      <span className={`text-xs font-black ${alert.recommendedDailyCap === 0 ? 'text-rose-400' : 'text-lime-300'}`}>
                        ₹{alert.recommendedDailyCap}/day
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between pt-1 text-[11px]">
                    <Link
                      to="/finance"
                      className="text-emerald-300/80 hover:text-white flex items-center gap-1 font-medium"
                    >
                      <span>View Transactions →</span>
                    </Link>
                    <Link
                      to="/budget"
                      className="text-lime-400 hover:underline font-bold"
                    >
                      Reallocate Category →
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
};

export default WelcomeBanner;
