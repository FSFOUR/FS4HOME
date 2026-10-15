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
      className="bg-white rounded-2xl border border-[#E1E5DC] relative overflow-hidden shadow-xs transition-all"
    >
      {/* Main Welcome Content */}
      <div className="p-3.5 sm:p-4.5 relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-3.5">
        
        {/* Left: Avatar & Greeting */}
        <div className="flex items-start sm:items-center gap-3">
          {/* User Avatar Circle */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.88 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="relative shrink-0"
          >
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-[#244A38] border border-[#315B45] flex items-center justify-center text-white font-bold text-sm shadow-xs">
              {initials}
            </div>
            <span 
              className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-[#287548] border-2 border-white" 
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
                    className="px-2.5 py-0.5 text-sm bg-white border border-[#D6DDD2] rounded-lg text-[#24342B] font-bold focus:outline-none focus:border-[#244A38]"
                    autoFocus
                  />
                  <button
                    type="submit"
                    className="text-[10px] bg-[#244A38] text-white font-bold px-2 py-1 rounded-md hover:bg-[#1a382a]"
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsEditingName(false)}
                    className="text-[10px] text-[#68756C] hover:text-[#24342B] px-1"
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
                  <h1 className="text-base sm:text-lg font-bold text-[#24342B] tracking-tight flex items-center gap-1.5 flex-wrap">
                    <span>{greeting.text},</span>
                    <motion.span 
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ 
                        duration: 0.5, 
                        delay: 0.12, 
                        ease: [0.16, 1, 0.3, 1] 
                      }}
                      className="text-[#244A38] font-bold inline-block tracking-normal"
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
                      className="text-[#81897F] hover:text-[#244A38] p-0.5 text-xs transition-colors"
                      title="Edit display name"
                    >
                      ✏️
                    </motion.button>
                  )}
                </motion.div>
              )}

              {/* Status Indicator Chip */}
              {hasAlerts ? (
                <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border flex items-center gap-1 ${
                  highestSeverity === 'critical'
                    ? 'bg-[#FDF2F2] text-[#B63D3D] border-[#CBD5C8]'
                    : 'bg-[#FEF7ED] text-[#A96C18] border-[#E1E5DC]'
                }`} title={`${alerts.length} Category Alerts (≥80%)`}>
                  <span>{highestSeverity === 'critical' ? '🚨' : '⚠️'}</span>
                </span>
              ) : (
                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-[#EAF7ED] text-[#287548] border border-[#CBD5C8] flex items-center gap-1" title="Budgets Safe (<80%)">
                  <span>✓</span>
                </span>
              )}
            </div>

            {/* Sub-headline with Date & Pacing */}
            <p className="text-xs text-[#68756C] flex items-center gap-2 flex-wrap">
              <span>{formattedDate}</span>
            </p>
          </div>
        </div>

        {/* Right: Quick Action Controls */}
        <div className="flex items-center gap-2 flex-wrap lg:justify-end shrink-0 pt-1 lg:pt-0 border-t lg:border-t-0 border-[#E1E5DC]">
          {onOpenQuickAdd && (
            <button
              onClick={onOpenQuickAdd}
              className="px-3 py-1.5 rounded-xl bg-[#244A38] hover:bg-[#1a382a] text-white text-xs font-bold transition-all flex items-center gap-1 shadow-xs active:scale-95"
            >
              <span className="text-sm font-bold leading-none">+</span>
              <span>Log Expense</span>
            </button>
          )}

          <Link
            to="/budget"
            className="px-3 py-1.5 rounded-xl bg-white hover:bg-[#F0F1E9] text-[#244A38] text-xs font-bold transition-all border border-[#CBD5C8] flex items-center gap-1"
          >
            <span>Review Limits →</span>
          </Link>

          {/* Toggle Alert Drawer if alerts exist */}
          {hasAlerts && (
            <button
              onClick={() => setIsAlertsOpen(!isAlertsOpen)}
              className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border ${
                highestSeverity === 'critical'
                  ? 'bg-[#FDF2F2] text-[#B63D3D] border-[#CBD5C8] hover:bg-[#fae6e6]'
                  : 'bg-[#FEF7ED] text-[#A96C18] border-[#E1E5DC] hover:bg-[#faeedc]'
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
            ? 'bg-[#FDF2F2] border-[#E1E5DC] text-[#B63D3D]'
            : 'bg-[#FEF7ED] border-[#E1E5DC] text-[#A96C18]'
        }`}>
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                highestSeverity === 'critical' ? 'bg-[#B63D3D]' : 'bg-[#A96C18]'
              }`}></span>
              <span className={`relative inline-flex rounded-full h-2 w-2 ${
                highestSeverity === 'critical' ? 'bg-[#B63D3D]' : 'bg-[#A96C18]'
              }`}></span>
            </span>
            <span className="font-semibold text-[#24342B]">
              {alerts.length === 1 ? (
                <>
                  <strong className="text-[#24342B]">{alerts[0].categoryIcon} {alerts[0].categoryName}</strong> has spent{' '}
                  <span className={alerts[0].severity === 'critical' ? 'text-[#B63D3D] font-bold' : 'text-[#A96C18] font-bold'}>
                    {alerts[0].percentSpent}%
                  </span>{' '}
                  of its monthly budget (₹{alerts[0].actualSpent.toLocaleString()} / ₹{alerts[0].totalPlanned.toLocaleString()}).
                </>
              ) : (
                <>
                  <strong className="text-[#24342B]">{alerts.length} categories</strong> have crossed 80% planned allocation:{' '}
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
              className="text-[11px] text-[#244A38] hover:underline font-bold"
            >
              {isAlertsOpen ? 'Close Drawer' : 'Show Details'}
            </button>
            <Link
              to="/budget"
              className="text-[11px] text-[#244A38] font-semibold hover:underline"
            >
              Adjust Plan →
            </Link>
          </div>
        </div>
      )}

      {/* Expandable Alert Details Drawer (when alerts exist and drawer is toggled) */}
      {hasAlerts && isAlertsOpen && (
        <div className="p-3.5 sm:p-4 space-y-3.5 bg-[#F0F1E9] border-t border-[#E1E5DC] animate-in slide-in-from-top-2 duration-200">
          
          {/* Severity Filter Tabs */}
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-1 p-1 rounded-xl bg-white border border-[#E1E5DC] text-xs">
              <button
                onClick={() => setSelectedAlertFilter('all')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                  selectedAlertFilter === 'all'
                    ? 'bg-[#244A38] text-white shadow-xs'
                    : 'text-[#68756C] hover:text-[#24342B]'
                }`}
              >
                All Active ({alerts.length})
              </button>

              {criticalCount > 0 && (
                <button
                  onClick={() => setSelectedAlertFilter('critical')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                    selectedAlertFilter === 'critical'
                      ? 'bg-[#B63D3D] text-white shadow-xs'
                      : 'text-[#B63D3D] hover:bg-[#FDF2F2]'
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
                      ? 'bg-[#A96C18] text-white shadow-xs'
                      : 'text-[#A96C18] hover:bg-[#FEF7ED]'
                  }`}
                >
                  <span>Caution 80–99% ({cautionCount})</span>
                </button>
              )}
            </div>

            <span className="text-[11px] text-[#68756C]">
              Notification triggered because threshold &gt;= 80% was reached
            </span>
          </div>

          {/* Alert Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {displayedAlerts.map(alert => {
              const isOver = alert.severity === 'critical';
              const cardBorder = isOver ? 'border-[#F5D2CC]' : 'border-[#CBD5C8]';
              const cardBg = 'bg-white';
              const progressWidth = Math.min(100, alert.percentSpent);

              return (
                <div
                  key={alert.categoryId}
                  className={`p-3.5 rounded-2xl border ${cardBorder} ${cardBg} space-y-3 relative shadow-xs`}
                >
                  {/* Category Title & Severity Badge */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xl p-1.5 rounded-xl bg-[#F0F1E9] border border-[#E1E5DC]">
                        {alert.categoryIcon}
                      </span>
                      <div>
                        <h3 className="text-sm font-bold text-[#24342B] flex items-center gap-1.5">
                          {alert.categoryName}
                        </h3>
                        <div className="text-[10px] text-[#68756C] flex items-center gap-1.5">
                          <span>Plan: ₹{alert.totalPlanned.toLocaleString()}</span>
                          <span>•</span>
                          <span>Spent: ₹{alert.actualSpent.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border inline-block ${
                        isOver 
                          ? 'bg-[#FDF2F2] text-[#B63D3D] border-[#CBD5C8]' 
                          : 'bg-[#FEF7ED] text-[#A96C18] border-[#E1E5DC]'
                      }`}>
                        {isOver ? `Overbudget (${alert.percentSpent}%)` : `Nearing Limit (${alert.percentSpent}%)`}
                      </span>
                      <div className="text-[11px] font-bold mt-0.5">
                        {isOver ? (
                          <span className="text-[#B63D3D]">+₹{alert.overrun.toLocaleString()} over limit</span>
                        ) : (
                          <span className="text-[#287548]">₹{alert.remaining.toLocaleString()} remaining</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Progress Bar with 80% Threshold Mark */}
                  <div className="space-y-1">
                    <div className="w-full bg-[#F0F1E9] rounded-full h-2.5 p-0.5 border border-[#E1E5DC] overflow-hidden relative">
                      {/* 80% Threshold Tick */}
                      <div
                        className="absolute top-0 bottom-0 left-[80%] w-0.5 bg-[#A96C18] z-10"
                        title="80% Alert Threshold"
                      />
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          isOver ? 'bg-[#B63D3D]' : 'bg-[#A96C18]'
                        }`}
                        style={{ width: `${progressWidth}%` }}
                      />
                    </div>

                    <div className="flex justify-between text-[10px] text-[#68756C] font-medium px-0.5">
                      <span>₹0</span>
                      <span className="text-[#A96C18] font-bold">80% Mark (₹{Math.round(alert.totalPlanned * 0.8).toLocaleString()})</span>
                      <span className="font-bold text-[#24342B]">Target: ₹{alert.totalPlanned.toLocaleString()}</span>
                    </div>
                  </div>

                  {/* Pacing Analytics */}
                  <div className="grid grid-cols-3 gap-2 pt-1 border-t border-[#E1E5DC] text-[10px]">
                    <div className="p-2 rounded-xl bg-[#F0F1E9] border border-[#E1E5DC]">
                      <span className="text-[#68756C] block">Daily Burn</span>
                      <span className="text-xs font-bold text-[#24342B]">₹{alert.dailyBurnRate}/day</span>
                    </div>

                    <div className="p-2 rounded-xl bg-[#F0F1E9] border border-[#E1E5DC]">
                      <span className="text-[#68756C] block">Month-End Spend</span>
                      <span className={`text-xs font-bold ${alert.projectedOverspend > 0 ? 'text-[#B63D3D]' : 'text-[#24342B]'}`}>
                        ₹{alert.projectedMonthEndSpend.toLocaleString()}
                      </span>
                    </div>

                    <div className="p-2 rounded-xl bg-[#F0F1E9] border border-[#E1E5DC]">
                      <span className="text-[#68756C] block">Safe Daily Cap</span>
                      <span className={`text-xs font-bold ${alert.recommendedDailyCap === 0 ? 'text-[#B63D3D]' : 'text-[#287548]'}`}>
                        ₹{alert.recommendedDailyCap}/day
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between pt-1 text-[11px]">
                    <Link
                      to="/finance"
                      className="text-[#244A38] hover:underline flex items-center gap-1 font-semibold"
                    >
                      <span>View Transactions →</span>
                    </Link>
                    <Link
                      to="/budget"
                      className="text-[#244A38] hover:underline font-bold"
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
