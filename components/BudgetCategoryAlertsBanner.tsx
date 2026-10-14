import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { BudgetAlertsSummary, BudgetCategoryAlert } from '../services/budgetService';

interface BudgetCategoryAlertsBannerProps {
  alertsSummary: BudgetAlertsSummary;
  onOpenQuickAdd?: () => void;
}

export const BudgetCategoryAlertsBanner: React.FC<BudgetCategoryAlertsBannerProps> = ({
  alertsSummary,
  onOpenQuickAdd
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(true);
  const [isDismissed, setIsDismissed] = useState<boolean>(false);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'critical' | 'caution' | 'all-categories'>('all');

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

  // Filter items based on selected tab
  const displayedAlerts = alerts.filter(alert => {
    if (selectedFilter === 'critical') return alert.severity === 'critical';
    if (selectedFilter === 'caution') return alert.severity === 'caution';
    return true;
  });

  // If user minimized or dismissed the main banner, render a persistent compact alert pill
  if (isDismissed && hasAlerts) {
    return (
      <div className="w-full flex items-center justify-between px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-950/70 via-rose-950/60 to-emerald-950/70 border border-amber-500/30 text-xs shadow-md animate-in fade-in">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
          </span>
          <span className="font-bold text-white">
            ⚠️ {alerts.length} budget {alerts.length === 1 ? 'category exceeds' : 'categories exceed'} 80% allocation
          </span>
          {criticalCount > 0 && (
            <span className="text-[10px] bg-rose-500/20 text-rose-300 border border-rose-500/30 px-1.5 py-0.2 rounded font-black uppercase">
              {criticalCount} Overbudget
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsDismissed(false)}
            className="text-[11px] text-lime-400 hover:text-lime-300 font-bold underline"
          >
            Show Alerts
          </button>
          <Link
            to="/budget"
            className="text-[11px] text-emerald-300/80 hover:text-white"
          >
            Adjust Budget →
          </Link>
        </div>
      </div>
    );
  }

  // Case 1: Healthy status (Zero alerts exceeding 80%)
  if (!hasAlerts) {
    return (
      <div className="glass-card p-3 rounded-2xl border border-emerald-500/20 bg-gradient-to-r from-[#061e12]/90 via-[#0a2718]/85 to-[#061e12]/90 flex items-center justify-between text-xs text-emerald-200/90 shadow-sm">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 flex items-center justify-center text-sm font-bold">
            ✓
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-black text-white text-xs">Category Budgets On Track</span>
              <span className="text-[10px] font-black uppercase px-2 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Safe (&lt;80%)
              </span>
            </div>
            <p className="text-[11px] text-emerald-300/70">
              All {allCategories.length} categories are currently below 80% of their planned monthly limit (Day {daysElapsed}/{totalDaysInMonth}).
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to="/budget"
            className="text-[11px] text-lime-400 hover:text-lime-300 font-bold bg-lime-400/10 hover:bg-lime-400/20 px-2.5 py-1 rounded-lg border border-lime-400/25 transition-colors whitespace-nowrap"
          >
            Review Limits →
          </Link>
        </div>
      </div>
    );
  }

  // Case 2: Active Category Alerts (>= 80% threshold reached)
  const isCritical = highestSeverity === 'critical';
  const borderTone = isCritical ? 'border-rose-500/40' : 'border-amber-500/40';
  const glowTone = isCritical ? 'shadow-[0_0_20px_rgba(244,63,94,0.15)]' : 'shadow-[0_0_20px_rgba(251,191,36,0.15)]';
  const bgGradient = isCritical
    ? 'bg-gradient-to-br from-[#24080c]/95 via-[#1b0c10]/95 to-[#091f14]/95'
    : 'bg-gradient-to-br from-[#251b06]/95 via-[#1e1507]/95 to-[#081e13]/95';

  return (
    <section 
      aria-label="Budget Alerts Notification Center"
      className={`glass-card rounded-2xl border ${borderTone} ${bgGradient} ${glowTone} relative overflow-hidden transition-all duration-300`}
    >
      {/* Ambient background glow */}
      <div 
        className={`absolute -top-12 -right-12 w-48 h-48 rounded-full blur-3xl pointer-events-none ${
          isCritical ? 'bg-rose-500/15' : 'bg-amber-400/15'
        }`} 
      />

      {/* Primary Banner Header Bar */}
      <div className="p-3.5 sm:p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 relative z-10 border-b border-white/5">
        <div className="flex items-start gap-3">
          {/* Animated Status Beacon */}
          <div className="relative mt-0.5 shrink-0">
            <span className="relative flex h-3.5 w-3.5">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                isCritical ? 'bg-rose-400' : 'bg-amber-400'
              }`}></span>
              <span className={`relative inline-flex rounded-full h-3.5 w-3.5 ${
                isCritical ? 'bg-rose-500' : 'bg-amber-400'
              }`}></span>
            </span>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-base">{isCritical ? '🚨' : '⚠️'}</span>
              <h2 className="text-sm sm:text-base font-black text-white tracking-tight">
                Intelligent Budget Category Alert
              </h2>
              {criticalCount > 0 && (
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-rose-500/25 text-rose-300 border border-rose-500/40">
                  {criticalCount} Exceeded 100%
                </span>
              )}
              {cautionCount > 0 && (
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-500/25 text-amber-300 border border-amber-500/40">
                  {cautionCount} Reached 80%+ Limit
                </span>
              )}
              <span className="text-[10px] text-emerald-300/60 font-mono">
                Day {daysElapsed}/{totalDaysInMonth} ({monthElapsedPct}% of month)
              </span>
            </div>

            <p className="text-xs text-slate-200/90 leading-snug">
              {alerts.length === 1 ? (
                <>
                  <strong className="text-white font-bold">{alerts[0].categoryIcon} {alerts[0].categoryName}</strong> has spent{' '}
                  <span className={alerts[0].severity === 'critical' ? 'text-rose-400 font-bold' : 'text-amber-300 font-bold'}>
                    {alerts[0].percentSpent}%
                  </span>{' '}
                  of its monthly planned allocation (₹{alerts[0].actualSpent.toLocaleString()} of ₹{alerts[0].totalPlanned.toLocaleString()}).
                </>
              ) : (
                <>
                  <strong className="text-white font-bold">{alerts.length} categories</strong> have crossed the{' '}
                  <span className="text-amber-300 font-bold">80% allocation threshold</span>:{' '}
                  {alerts.map((a, i) => (
                    <span key={a.categoryId} className="whitespace-nowrap">
                      {a.categoryName} (<span className={a.severity === 'critical' ? 'text-rose-400 font-bold' : 'text-amber-300 font-bold'}>{a.percentSpent}%</span>)
                      {i < alerts.length - 1 ? ', ' : ''}
                    </span>
                  ))}
                  .
                </>
              )}
              {totalOverrunAmount > 0 && (
                <span className="text-rose-300 ml-1 font-semibold">
                  (Total overrun: +₹{totalOverrunAmount.toLocaleString()})
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Action Controls & Toggles */}
        <div className="flex items-center gap-2 self-start md:self-center shrink-0">
          <Link
            to="/budget"
            className="px-3 py-1.5 rounded-xl bg-lime-400 hover:bg-lime-300 text-emerald-950 text-xs font-black transition-all flex items-center gap-1 shadow-sm"
          >
            <span>Adjust Budget →</span>
          </Link>

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="px-2.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-bold transition-all flex items-center gap-1 border border-white/10"
            title={isExpanded ? 'Collapse Alert Drawer' : 'Expand Alert Details'}
          >
            <span>{isExpanded ? 'Hide Details' : `View Details (${alerts.length})`}</span>
            <span className="text-[10px] transform transition-transform">{isExpanded ? '▲' : '▼'}</span>
          </button>

          <button
            onClick={() => setIsDismissed(true)}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 text-xs transition-colors"
            title="Minimize to top bar"
            aria-label="Dismiss banner"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Expanded Detailed Breakdown Drawer */}
      {isExpanded && (
        <div className="p-3.5 sm:p-4 space-y-4 relative z-10 bg-black/20 backdrop-blur-sm border-t border-white/5 animate-in slide-in-from-top-2 duration-200">
          
          {/* Navigation Filter Tabs & Quick Action */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-1 p-1 rounded-xl bg-emerald-950/60 border border-emerald-500/20 text-xs">
              <button
                onClick={() => setSelectedFilter('all')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                  selectedFilter === 'all'
                    ? 'bg-amber-400 text-emerald-950 shadow-sm'
                    : 'text-emerald-300/70 hover:text-white'
                }`}
              >
                All Alerts ({alerts.length})
              </button>

              {criticalCount > 0 && (
                <button
                  onClick={() => setSelectedFilter('critical')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                    selectedFilter === 'critical'
                      ? 'bg-rose-500 text-white shadow-sm'
                      : 'text-rose-300/80 hover:text-rose-200'
                  }`}
                >
                  <span>Critical ({criticalCount})</span>
                </button>
              )}

              {cautionCount > 0 && (
                <button
                  onClick={() => setSelectedFilter('caution')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                    selectedFilter === 'caution'
                      ? 'bg-amber-400 text-emerald-950 shadow-sm'
                      : 'text-amber-300/80 hover:text-amber-200'
                  }`}
                >
                  <span>Caution 80–99% ({cautionCount})</span>
                </button>
              )}

              <button
                onClick={() => setSelectedFilter('all-categories')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                  selectedFilter === 'all-categories'
                    ? 'bg-lime-400 text-emerald-950 shadow-sm'
                    : 'text-emerald-300/70 hover:text-white'
                }`}
              >
                All Categories ({allCategories.length})
              </button>
            </div>

            {onOpenQuickAdd && (
              <button
                onClick={onOpenQuickAdd}
                className="text-xs text-lime-400 hover:text-lime-300 font-bold flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-900/40 border border-lime-400/20 transition-colors"
              >
                <span>+</span>
                <span>Log Transaction</span>
              </button>
            )}
          </div>

          {/* Cards Grid: Render Filtered Alerts */}
          {selectedFilter === 'all-categories' ? (
            // Full Categories Health View
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {allCategories.map(cat => {
                const isOver = cat.status === 'critical';
                const isWarn = cat.status === 'caution';
                return (
                  <div 
                    key={cat.categoryId}
                    className={`p-3 rounded-xl border flex flex-col justify-between transition-colors ${
                      isOver
                        ? 'bg-rose-950/30 border-rose-500/30'
                        : isWarn
                        ? 'bg-amber-950/30 border-amber-500/30'
                        : 'bg-emerald-950/40 border-emerald-500/15'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5 font-bold text-white truncate">
                        <span>{cat.categoryIcon}</span>
                        <span className="truncate">{cat.categoryName}</span>
                      </div>
                      <span className={`text-[10px] font-black uppercase px-1.5 py-0.2 rounded border ${
                        isOver
                          ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                          : isWarn
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                          : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                      }`}>
                        {cat.percentSpent}%
                      </span>
                    </div>

                    <div className="my-2 space-y-1">
                      <div className="w-full bg-emerald-950 rounded-full h-2 overflow-hidden border border-emerald-800 relative">
                        <div 
                          className={`h-full rounded-full transition-all ${
                            isOver ? 'bg-rose-500' : isWarn ? 'bg-amber-400' : 'bg-lime-400'
                          }`}
                          style={{ width: `${Math.min(100, cat.percentSpent)}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-[10px] text-emerald-300/70">
                        <span>Spent: ₹{cat.actualSpent.toLocaleString()}</span>
                        <span>Plan: ₹{cat.totalPlanned.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            // Targeted Category Alert Cards
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
                          {isOver ? `Exceeded (${alert.percentSpent}%)` : `Caution (${alert.percentSpent}%)`}
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

                    {/* Visual Progress Bar with 80% Threshold Tick Line */}
                    <div className="space-y-1">
                      <div className="w-full bg-emerald-950/90 rounded-full h-3 p-0.5 border border-emerald-500/30 overflow-hidden relative shadow-inner">
                        {/* 80% Alert Threshold Marker */}
                        <div 
                          className="absolute top-0 bottom-0 left-[80%] w-0.5 bg-amber-400 z-10 shadow-[0_0_4px_rgba(251,191,36,0.8)]" 
                          title="80% Visual Alert Threshold"
                        />

                        {/* Progress Bar Fill */}
                        <div
                          className={`h-full rounded-full transition-all duration-500 relative ${
                            isOver
                              ? 'bg-gradient-to-r from-amber-500 to-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.6)]'
                              : 'bg-gradient-to-r from-lime-400 to-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.5)]'
                          }`}
                          style={{ width: `${progressWidth}%` }}
                        />
                      </div>

                      {/* Threshold Scale Labels */}
                      <div className="flex justify-between text-[10px] text-slate-300/70 font-medium px-0.5">
                        <span>₹0</span>
                        <span className="text-amber-300 font-bold">80% Threshold (₹{Math.round(alert.totalPlanned * 0.8).toLocaleString()})</span>
                        <span className="font-bold text-white">Target: ₹{alert.totalPlanned.toLocaleString()}</span>
                      </div>
                    </div>

                    {/* Intelligent Pacing & Mitigation Metrics */}
                    <div className="grid grid-cols-3 gap-2 pt-1 border-t border-white/5 text-[10px]">
                      <div className="p-2 rounded-xl bg-black/20 border border-white/5">
                        <span className="text-slate-400 block">Daily Burn Rate</span>
                        <span className="text-xs font-black text-white">₹{alert.dailyBurnRate}/day</span>
                        <span className="text-[9px] text-slate-400/80 block mt-0.5">Day 1 to {daysElapsed}</span>
                      </div>

                      <div className="p-2 rounded-xl bg-black/20 border border-white/5">
                        <span className="text-slate-400 block">Projected Month-End</span>
                        <span className={`text-xs font-black ${alert.projectedOverspend > 0 ? 'text-rose-400' : 'text-white'}`}>
                          ₹{alert.projectedMonthEndSpend.toLocaleString()}
                        </span>
                        <span className="text-[9px] text-slate-400/80 block mt-0.5">
                          {alert.projectedOverspend > 0 ? `+₹${alert.projectedOverspend.toLocaleString()} risk` : 'On track'}
                        </span>
                      </div>

                      <div className="p-2 rounded-xl bg-black/20 border border-white/5">
                        <span className="text-slate-400 block">Safe Daily Cap</span>
                        <span className={`text-xs font-black ${alert.recommendedDailyCap === 0 ? 'text-rose-400' : 'text-lime-300'}`}>
                          ₹{alert.recommendedDailyCap}/day
                        </span>
                        <span className="text-[9px] text-slate-400/80 block mt-0.5">For next {daysRemaining} days</span>
                      </div>
                    </div>

                    {/* Granular Subcategory Drivers (Highlighting items that exceeded budget) */}
                    {alert.topSubcategoryDrivers.length > 0 && (
                      <div className="space-y-1 pt-1">
                        <div className="text-[10px] font-bold text-slate-300 uppercase tracking-wider flex items-center justify-between">
                          <span>Subcategory Item Drivers</span>
                          <span className="text-slate-400 font-normal">Actual / Plan</span>
                        </div>
                        <div className="space-y-1">
                          {alert.topSubcategoryDrivers.slice(0, 3).map(sub => {
                            const isSubAlert = sub.percentSpent >= 80;
                            return (
                              <div
                                key={sub.subcategoryId}
                                className="flex items-center justify-between p-1.5 rounded-lg bg-black/30 text-[11px] border border-white/5"
                              >
                                <div className="flex items-center gap-1.5 truncate">
                                  <span className={isSubAlert ? 'text-amber-400' : 'text-slate-400'}>
                                    {sub.percentSpent >= 100 ? '🔴' : isSubAlert ? '🟡' : '🟢'}
                                  </span>
                                  <span className="font-medium text-white truncate">{sub.subcategoryName}</span>
                                </div>

                                <div className="flex items-center gap-2 shrink-0">
                                  <span className="font-mono text-slate-300">
                                    ₹{sub.actualSpent.toLocaleString()} / ₹{sub.plannedAmount.toLocaleString()}
                                  </span>
                                  <span className={`font-bold px-1.5 py-0.2 rounded text-[10px] ${
                                    sub.percentSpent >= 100 
                                      ? 'bg-rose-500/20 text-rose-300' 
                                      : isSubAlert 
                                      ? 'bg-amber-500/20 text-amber-300' 
                                      : 'text-emerald-300/80'
                                  }`}>
                                    {sub.percentSpent}%
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Quick Category Action Links */}
                    <div className="flex items-center justify-between pt-1 text-[11px]">
                      <Link
                        to={`/finance`}
                        className="text-emerald-300/80 hover:text-white flex items-center gap-1 font-medium transition-colors"
                      >
                        <span>Inspect in Transactions →</span>
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
          )}
        </div>
      )}
    </section>
  );
};

export default BudgetCategoryAlertsBanner;
