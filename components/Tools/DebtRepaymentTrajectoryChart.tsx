import React, { useMemo, useState } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts';
import { LoanRecord, LoanPayment } from '../../types';
import { calculateLoanSummary, recalculateLoanSchedule, formatINR } from '../../services/loanService';

interface DebtRepaymentTrajectoryChartProps {
  loans: LoanRecord[];
  payments: LoanPayment[];
  onAddLoanClick?: () => void;
}

interface MonthTrajectoryData {
  month: string;
  monthFull: string;
  monthKey: string;
  outstandingDebt: number;
  repaymentProgress: number;
  monthlyScheduled: number;
  progressPercent: number;
}

export const DebtRepaymentTrajectoryChart: React.FC<DebtRepaymentTrajectoryChartProps> = ({
  loans,
  payments,
  onAddLoanClick,
}) => {
  const [viewMode, setViewMode] = useState<'both' | 'debt' | 'repayment'>('both');

  const isCalmWealth = typeof document !== 'undefined' ? document.documentElement.getAttribute('data-theme') !== 'midnight-ledger' : true;
  const gridStroke = isCalmWealth ? '#E1E5DC' : '#064e3b';
  const axisStroke = isCalmWealth ? '#68756C' : '#6ee7b7';
  const debtBarColor = isCalmWealth ? '#b91c1c' : '#f43f5e';
  const repaymentBarColor = isCalmWealth ? '#244A38' : '#a3e635';

  // Filter only active/open Borrowed loans (liabilities that the user owes)
  const activeBorrowedLoans = useMemo(() => {
    return loans.filter(
      (loan) => loan.type === 'Borrowed' && loan.status !== 'Archived' && loan.status !== 'Closed'
    );
  }, [loans]);

  // Compute 6-month trajectory data
  const { chartData, startingDebt, projectedEndingDebt, total6MoRepayments, totalDebtReduction } = useMemo(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    // 1. Calculate current starting outstanding balance for all active borrowed loans
    let totalInitialOutstanding = 0;
    let totalInitialPaid = 0;
    let totalInitialPayable = 0;

    activeBorrowedLoans.forEach((loan) => {
      const summary = calculateLoanSummary(loan, payments);
      totalInitialOutstanding += summary.outstandingBalance;
      totalInitialPaid += summary.totalPaid;
      totalInitialPayable += summary.totalPayable;
    });

    // 2. Generate 6 consecutive monthly points
    const data: MonthTrajectoryData[] = [];
    let runningPrincipalRepaidFuture = 0;
    let runningCumulativePaid = totalInitialPaid;
    let totalScheduledNext6Months = 0;

    for (let i = 0; i < 6; i++) {
      const targetDate = new Date(currentYear, currentMonth + i, 1);
      const year = targetDate.getFullYear();
      const monthIndex = targetDate.getMonth();
      const monthKey = `${year}-${String(monthIndex + 1).padStart(2, '0')}`;
      const monthLabel = targetDate.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
      const monthFull = targetDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

      // Calculate scheduled payments due strictly in this calendar month across active borrowed loans
      let monthScheduledAmount = 0;
      let monthScheduledPrincipal = 0;

      activeBorrowedLoans.forEach((loan) => {
        const schedule = recalculateLoanSchedule(loan, payments);
        schedule.forEach((inst) => {
          if (inst.dueDate && inst.dueDate.startsWith(monthKey) && inst.status !== 'Skipped') {
            monthScheduledAmount += inst.remainingAmount > 0 ? inst.remainingAmount : (i === 0 && inst.status === 'Paid' ? 0 : inst.scheduledAmount);
            monthScheduledPrincipal += inst.principalComponent || (inst.scheduledAmount - (inst.interestComponent || 0));
          }
        });
      });

      if (i > 0) {
        runningPrincipalRepaidFuture += monthScheduledPrincipal;
        runningCumulativePaid += monthScheduledAmount;
      }
      totalScheduledNext6Months += monthScheduledAmount;

      // Projected remaining debt decreases as principal is repaid
      const projectedDebt = Math.max(0, Math.round(totalInitialOutstanding - runningPrincipalRepaidFuture));
      const progressPercent = totalInitialPayable > 0 
        ? Math.min(100, Math.round((runningCumulativePaid / totalInitialPayable) * 100))
        : 0;

      data.push({
        month: monthLabel,
        monthFull,
        monthKey,
        outstandingDebt: projectedDebt,
        repaymentProgress: Math.round(runningCumulativePaid),
        monthlyScheduled: Math.round(monthScheduledAmount),
        progressPercent,
      });
    }

    const startDebt = totalInitialOutstanding;
    const endDebt = data.length > 0 ? data[data.length - 1].outstandingDebt : 0;
    const debtReduction = Math.max(0, startDebt - endDebt);

    return {
      chartData: data,
      startingDebt: startDebt,
      projectedEndingDebt: endDebt,
      total6MoRepayments: totalScheduledNext6Months,
      totalDebtReduction: debtReduction,
    };
  }, [activeBorrowedLoans, payments]);

  const hasBorrowedLoans = activeBorrowedLoans.length > 0 && startingDebt > 0;

  return (
    <div className="bg-[#061f12] border border-emerald-500/20 rounded-2xl p-4 sm:p-5 shadow-sm space-y-4">
      {/* Chart Header with Key Metrics */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-emerald-500/15 pb-3.5">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1 rounded-md bg-rose-500/20 text-rose-300 text-xs">📉</span>
            <h2 className="text-sm sm:text-base font-bold text-white tracking-tight">
              Outstanding Debt vs. Repayment Progress
            </h2>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950 border border-emerald-500/30 text-lime-400 font-mono font-bold hidden sm:inline">
              Next 6 Months Trajectory
            </span>
          </div>
          <p className="text-xs text-emerald-300/70 mt-0.5">
            Forecast your debt reduction and cumulative principal & interest repayment milestones
          </p>
        </div>

        {/* View toggles & Quick Action */}
        <div className="flex items-center gap-1.5 self-start sm:self-auto">
          {hasBorrowedLoans && (
            <div className="flex items-center bg-emerald-950/80 p-0.5 rounded-lg border border-emerald-500/20 text-[11px]">
              <button
                onClick={() => setViewMode('both')}
                className={`px-2.5 py-1 rounded-md transition-colors font-medium ${
                  viewMode === 'both' ? 'bg-lime-400 text-emerald-950 font-bold shadow-xs' : 'text-slate-300 hover:text-white'
                }`}
              >
                Combined
              </button>
              <button
                onClick={() => setViewMode('debt')}
                className={`px-2.5 py-1 rounded-md transition-colors font-medium ${
                  viewMode === 'debt' ? 'bg-rose-500 text-white font-bold shadow-xs' : 'text-slate-300 hover:text-white'
                }`}
              >
                Debt Only
              </button>
              <button
                onClick={() => setViewMode('repayment')}
                className={`px-2.5 py-1 rounded-md transition-colors font-medium ${
                  viewMode === 'repayment' ? 'bg-lime-400 text-emerald-950 font-bold shadow-xs' : 'text-slate-300 hover:text-white'
                }`}
              >
                Repayment Only
              </button>
            </div>
          )}

          {onAddLoanClick && (
            <button
              onClick={onAddLoanClick}
              className="px-2.5 py-1 text-[11px] font-bold text-emerald-300 hover:text-lime-300 bg-emerald-900/40 hover:bg-emerald-900/70 border border-emerald-500/30 rounded-lg transition-colors flex items-center gap-1"
              title="Add a new borrowing record"
            >
              <span>+ Add Loan</span>
            </button>
          )}
        </div>
      </div>

      {/* Trajectory KPI Summary Highlights */}
      {hasBorrowedLoans && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
          <div className="p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-500/15">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
              Current Debt
            </span>
            <span className="text-base sm:text-lg font-black text-rose-400 font-mono">
              {formatINR(startingDebt)}
            </span>
          </div>

          <div className="p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-500/15">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
              6-Month Projected Debt
            </span>
            <span className="text-base sm:text-lg font-black text-amber-300 font-mono">
              {formatINR(projectedEndingDebt)}
            </span>
          </div>

          <div className="p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-500/15">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
              Projected Reduction
            </span>
            <span className="text-base sm:text-lg font-black text-lime-400 font-mono">
              ↓ {formatINR(totalDebtReduction)}
            </span>
          </div>

          <div className="p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-500/15">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
              Next 6M Repayments
            </span>
            <span className="text-base sm:text-lg font-black text-emerald-200 font-mono">
              {formatINR(total6MoRepayments)}
            </span>
          </div>
        </div>
      )}

      {/* Recharts Bar Chart or Clean Empty State */}
      {hasBorrowedLoans ? (
        <div className="pt-2">
          <div className="h-[250px] sm:h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{ top: 12, right: 12, left: -10, bottom: 0 }}
                barGap={6}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke={gridStroke}
                  vertical={false}
                  opacity={0.5}
                />
                <XAxis
                  dataKey="month"
                  stroke={axisStroke}
                  fontSize={11}
                  tickLine={false}
                  axisLine={{ stroke: gridStroke }}
                />
                <YAxis
                  stroke={axisStroke}
                  fontSize={10}
                  tickLine={false}
                  axisLine={{ stroke: gridStroke }}
                  tickFormatter={(val) => {
                    if (val === 0) return '₹0';
                    if (val >= 100000) return `₹${(val / 100000).toFixed(1)}L`;
                    if (val >= 1000) return `₹${(val / 1000).toFixed(0)}k`;
                    return `₹${val}`;
                  }}
                />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      const dataPoint = payload[0].payload as MonthTrajectoryData;
                      return (
                        <div className={`p-3 rounded-xl text-xs space-y-1.5 min-w-[210px] ${
                          isCalmWealth
                            ? 'bg-white border border-[#E1E5DC] text-[#24342B] shadow-xl'
                            : 'bg-[#04160c]/95 backdrop-blur-md border border-lime-500/30 text-white shadow-2xl'
                        }`}>
                          <div className="flex items-center justify-between border-b border-emerald-500/20 pb-1.5">
                            <span className="font-black text-current">{dataPoint.monthFull}</span>
                            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono font-bold ${
                              isCalmWealth ? 'bg-emerald-100 text-emerald-800' : 'bg-emerald-900/60 text-lime-300'
                            }`}>
                              {dataPoint.progressPercent}% Repaid
                            </span>
                          </div>

                          <div className="space-y-1 pt-0.5">
                            <div className="flex items-center justify-between gap-3 text-rose-500">
                              <span className="flex items-center gap-1.5">
                                <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: debtBarColor }} />
                                <span>Outstanding Debt:</span>
                              </span>
                              <span className="font-mono font-bold text-current">
                                {formatINR(dataPoint.outstandingDebt)}
                              </span>
                            </div>

                            <div className="flex items-center justify-between gap-3 text-emerald-600">
                              <span className="flex items-center gap-1.5">
                                <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: repaymentBarColor }} />
                                <span>Repayment Progress:</span>
                              </span>
                              <span className="font-mono font-bold text-current">
                                {formatINR(dataPoint.repaymentProgress)}
                              </span>
                            </div>

                            {dataPoint.monthlyScheduled > 0 && (
                              <div className="flex items-center justify-between gap-3 opacity-80 pt-1 border-t border-current/15 text-[11px]">
                                <span>Due In This Month:</span>
                                <span className="font-mono font-bold">
                                  {formatINR(dataPoint.monthlyScheduled)}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend
                  wrapperStyle={{ paddingTop: '10px', fontSize: '12px' }}
                  formatter={(value) => {
                    return <span className="opacity-90 font-medium">{value}</span>;
                  }}
                />

                {(viewMode === 'both' || viewMode === 'debt') && (
                  <Bar
                    dataKey="outstandingDebt"
                    name="Outstanding Debt"
                    fill={debtBarColor}
                    radius={[4, 4, 0, 0]}
                    maxBarSize={38}
                  />
                )}

                {(viewMode === 'both' || viewMode === 'repayment') && (
                  <Bar
                    dataKey="repaymentProgress"
                    name="Repayment Progress"
                    fill={repaymentBarColor}
                    radius={[4, 4, 0, 0]}
                    maxBarSize={38}
                  />
                )}
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 px-1">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-rose-500" />
              <span>Red bars show outstanding principal balance declining as payments occur</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-lime-400" />
              <span>Lime bars show cumulative repayment progress climbing toward 100%</span>
            </span>
          </div>
        </div>
      ) : (
        /* Clean Live Empty State for when no borrowings are active yet */
        <div className="p-6 rounded-xl bg-emerald-950/20 border border-dashed border-emerald-500/30 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-900/50 border border-emerald-500/30 flex items-center justify-center mx-auto text-xl text-lime-400">
            📊
          </div>
          <div className="max-w-md mx-auto">
            <h3 className="text-sm font-bold text-white">
              No Active Borrowings Recorded Yet
            </h3>
            <p className="text-xs text-emerald-300/70 mt-1">
              The app is live and ready for real use. Add your personal borrowings or bank loans to visualize your 6-month debt reduction trajectory, scheduled EMI burden, and progress toward becoming debt-free.
            </p>
          </div>
          {onAddLoanClick && (
            <button
              onClick={onAddLoanClick}
              className="px-4 py-2 rounded-xl bg-lime-400 hover:bg-lime-300 text-emerald-950 font-black text-xs transition-colors shadow-md active:scale-95 inline-flex items-center gap-1.5"
            >
              <span>+ Add First Loan / Borrowing</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};
