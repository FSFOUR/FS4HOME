import React, { useState, useMemo } from 'react';
import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  Legend, 
  CartesianGrid, 
  ReferenceLine 
} from 'recharts';
import { KakeiboCategory, Transaction, WealthType } from '../types';

interface Props {
  spending?: Record<string, number>;
  targets?: Record<string, { amount: number }>;
  transactions?: Transaction[];
  monthlySavingsTarget?: number;
}

type ChartView = 'trend' | 'categories' | 'bars';

const MonthlySpendingChart: React.FC<Props> = ({ 
  spending = {}, 
  targets = {}, 
  transactions = [], 
  monthlySavingsTarget = 5000 
}) => {
  const [viewMode, setViewMode] = useState<ChartView>('trend');

  // Compute 6-month historical & current spending trends
  const trendData = useMemo(() => {
    const months = ['Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'];
    const now = new Date();
    const currentMonthIdx = now.getMonth();
    const safeSpending: Record<string, number> = spending || {};
    const safeTargets: Record<string, { amount: number }> = targets || {};

    // Calculate current month's actual spending from spending prop or transactions
    let currentSpent = (Object.values(safeSpending) as number[]).reduce(
      (a: number, b: number) => a + (Number(b) || 0), 
      0
    );
    let needsSpent: number = Number(safeSpending[KakeiboCategory.NEEDS]) || 0;
    let wantsSpent: number = Number(safeSpending[KakeiboCategory.WANTS]) || 0;
    let cultureSpent: number = Number(safeSpending[KakeiboCategory.CULTURE]) || 0;

    // Fallback: calculate current month spending from transactions if safeSpending is empty
    if (currentSpent === 0 && transactions && transactions.length > 0) {
      const currentYear = now.getFullYear();
      transactions.forEach(t => {
        if (t.type === WealthType.EXPENSE || t.transactionType === 'Expense') {
          const d = new Date(t.date);
          if (d.getMonth() === currentMonthIdx && d.getFullYear() === currentYear) {
            currentSpent += Number(t.amount || 0);
            if (t.kakeiboCategory === KakeiboCategory.NEEDS) needsSpent += Number(t.amount || 0);
            else if (t.kakeiboCategory === KakeiboCategory.WANTS) wantsSpent += Number(t.amount || 0);
            else if (t.kakeiboCategory === KakeiboCategory.CULTURE) cultureSpent += Number(t.amount || 0);
          }
        }
      });
    }
    
    // Overall budget target based on Kakeibo targets or baseline
    const targetTotal = (Object.values(safeTargets) as { amount?: number }[]).reduce(
      (sum: number, t: { amount?: number }) => sum + (Number(t?.amount) || 0), 
      0
    ) || 45000;
    const needsTarget: number = Number(safeTargets[KakeiboCategory.NEEDS]?.amount) || Math.round(targetTotal * 0.5);
    const wantsTarget: number = Number(safeTargets[KakeiboCategory.WANTS]?.amount) || Math.round(targetTotal * 0.3);

    // Group actual transactions if available across recent months
    const monthMap = new Map<string, { total: number; needs: number; wants: number; culture: number; count: number }>();
    
    // Initialize past 6 months
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = d.toLocaleString('en-US', { month: 'short' });
      monthMap.set(key, { total: 0, needs: 0, wants: 0, culture: 0, count: 0 });
    }

    if (transactions && transactions.length > 0) {
      transactions.forEach(t => {
        if (t.type === WealthType.EXPENSE || t.transactionType === 'Expense') {
          const d = new Date(t.date);
          const key = d.toLocaleString('en-US', { month: 'short' });
          if (monthMap.has(key)) {
            const item = monthMap.get(key)!;
            item.total += Number(t.amount || 0);
            item.count += 1;
            if (t.kakeiboCategory === KakeiboCategory.NEEDS) item.needs += Number(t.amount || 0);
            if (t.kakeiboCategory === KakeiboCategory.WANTS) item.wants += Number(t.amount || 0);
            if (t.kakeiboCategory === KakeiboCategory.CULTURE) item.culture += Number(t.amount || 0);
          }
        }
      });
    }

    return Array.from(monthMap.entries()).map(([month, val], idx) => {
      const isCurrent = idx === monthMap.size - 1;
      const actualSpent = isCurrent && currentSpent > 0 ? currentSpent : val.total;
      const actualNeeds = isCurrent && needsSpent > 0 ? needsSpent : val.needs;
      const actualWants = isCurrent && wantsSpent > 0 ? wantsSpent : val.wants;

      return {
        month,
        spent: Number(actualSpent),
        target: Number(targetTotal),
        needs: Number(actualNeeds),
        needsTarget: Number(needsTarget),
        wants: Number(actualWants),
        wantsTarget: Number(wantsTarget),
        savingsBuffer: Math.max(0, targetTotal - Number(actualSpent)),
        isCurrent
      };
    });
  }, [spending, targets, transactions]);

  // Category bar comparison data
  const categoryData = useMemo(() => {
    const safeSpending = spending || {};
    const safeTargets = targets || {};
    const now = new Date();
    const currentMonthIdx = now.getMonth();
    const currentYear = now.getFullYear();

    return Object.values(KakeiboCategory).map(category => {
      let spent = Number(safeSpending[category]) || 0;
      if (spent === 0 && transactions && transactions.length > 0) {
        spent = transactions
          .filter(t => (t.type === WealthType.EXPENSE || t.transactionType === 'Expense') && 
                       t.kakeiboCategory === category && 
                       new Date(t.date).getMonth() === currentMonthIdx && 
                       new Date(t.date).getFullYear() === currentYear)
          .reduce((acc, t) => acc + Number(t.amount || 0), 0);
      }
      return {
        category: category.split(' ')[0], // Short name for label
        fullName: category,
        spent,
        target: safeTargets[category]?.amount || (category === KakeiboCategory.NEEDS ? 22500 : category === KakeiboCategory.WANTS ? 13500 : 4500)
      };
    });
  }, [spending, targets, transactions]);

  // Current month summary metrics
  const currentMonthData = trendData[trendData.length - 1];
  const isUnderBudget = currentMonthData ? currentMonthData.spent <= currentMonthData.target : true;
  const variancePct = currentMonthData && currentMonthData.target > 0
    ? Math.round(((currentMonthData.spent - currentMonthData.target) / currentMonthData.target) * 100)
    : 0;

  return (
    <div className="w-full flex flex-col justify-between space-y-3">
      {/* Chart Header & Mode Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 bg-emerald-950/80 p-0.5 rounded-lg border border-emerald-500/20 text-[10px] font-bold">
            <button
              type="button"
              onClick={() => setViewMode('trend')}
              className={`px-2.5 py-1 rounded-md transition-all ${
                viewMode === 'trend'
                  ? 'bg-lime-400 text-emerald-950 shadow-sm'
                  : 'text-emerald-300/70 hover:text-white'
              }`}
            >
              📈 Monthly Trend
            </button>
            <button
              type="button"
              onClick={() => setViewMode('categories')}
              className={`px-2.5 py-1 rounded-md transition-all ${
                viewMode === 'categories'
                  ? 'bg-lime-400 text-emerald-950 shadow-sm'
                  : 'text-emerald-300/70 hover:text-white'
              }`}
            >
              📊 Needs vs Wants
            </button>
            <button
              type="button"
              onClick={() => setViewMode('bars')}
              className={`px-2.5 py-1 rounded-md transition-all ${
                viewMode === 'bars'
                  ? 'bg-lime-400 text-emerald-950 shadow-sm'
                  : 'text-emerald-300/70 hover:text-white'
              }`}
            >
              📋 Breakdown
            </button>
          </div>
        </div>

        {/* Status Indicator */}
        <div className="flex items-center gap-1.5 self-start sm:self-auto text-[10px] font-bold">
          <span className={`px-2 py-0.5 rounded-full border ${
            isUnderBudget 
              ? 'bg-emerald-950/80 border-lime-400/30 text-lime-400' 
              : 'bg-rose-950/80 border-rose-500/30 text-rose-400'
          }`}>
            {isUnderBudget ? `✓ ${Math.abs(variancePct)}% Under Budget` : `⚠️ +${variancePct}% Over Target`}
          </span>
        </div>
      </div>

      {/* Chart Canvas Area */}
      <div className="h-56 sm:h-64 w-full pt-1">
        <ResponsiveContainer width="100%" height="100%">
          {viewMode === 'trend' ? (
            <LineChart data={trendData} margin={{ top: 10, right: 12, left: -15, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#134e30" vertical={false} opacity={0.5} />
              <XAxis 
                dataKey="month" 
                tick={{ fontSize: 10, fill: '#a7f3d0', fontWeight: 'bold' }} 
                stroke="#15803d" 
              />
              <YAxis 
                tick={{ fontSize: 10, fill: '#a7f3d0' }} 
                stroke="#15803d"
                tickFormatter={(val) => `₹${val >= 1000 ? `${Math.round(val / 1000)}k` : val}`}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#072415', 
                  borderRadius: '0.75rem', 
                  border: '1px solid rgba(163, 230, 53, 0.3)', 
                  boxShadow: '0 10px 25px -5px rgba(0,0,0,0.6)',
                  color: '#ffffff',
                  fontSize: '11px',
                  padding: '8px 12px'
                }}
                formatter={(value: any, name: any) => [
                  `₹${Number(value).toLocaleString()}`,
                  name === 'spent' ? 'Actual Spent' : name === 'target' ? 'Budget Target' : name
                ]}
                labelFormatter={(label) => `Month: ${label}`}
              />
              <Legend 
                wrapperStyle={{ fontSize: '10px', paddingTop: '6px', color: '#a7f3d0' }}
                formatter={(val) => (
                  <span className="text-[10px] font-bold text-emerald-200">
                    {val === 'spent' ? 'Actual Spending' : val === 'target' ? 'Kakeibo Target Limit' : val}
                  </span>
                )}
              />
              <Line 
                type="monotone" 
                dataKey="spent" 
                name="spent" 
                stroke="#fb7185" 
                strokeWidth={3}
                dot={{ r: 4, fill: '#fb7185', strokeWidth: 2, stroke: '#072415' }}
                activeDot={{ r: 6, fill: '#fda4af', stroke: '#fff', strokeWidth: 2 }}
              />
              <Line 
                type="monotone" 
                dataKey="target" 
                name="target" 
                stroke="#a3e635" 
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={{ r: 3, fill: '#a3e635', strokeWidth: 1, stroke: '#072415' }}
              />
            </LineChart>
          ) : viewMode === 'categories' ? (
            <LineChart data={trendData} margin={{ top: 10, right: 12, left: -15, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#134e30" vertical={false} opacity={0.5} />
              <XAxis 
                dataKey="month" 
                tick={{ fontSize: 10, fill: '#a7f3d0', fontWeight: 'bold' }} 
                stroke="#15803d" 
              />
              <YAxis 
                tick={{ fontSize: 10, fill: '#a7f3d0' }} 
                stroke="#15803d"
                tickFormatter={(val) => `₹${val >= 1000 ? `${Math.round(val / 1000)}k` : val}`}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#072415', 
                  borderRadius: '0.75rem', 
                  border: '1px solid rgba(163, 230, 53, 0.3)', 
                  color: '#ffffff',
                  fontSize: '11px',
                  padding: '8px 12px'
                }}
                formatter={(val: any, name: any) => [
                  `₹${Number(val).toLocaleString()}`,
                  name === 'needs' ? 'Essential Needs' : name === 'wants' ? 'Discretionary Wants' : name
                ]}
              />
              <Legend wrapperStyle={{ fontSize: '10px', paddingTop: '6px', color: '#a7f3d0' }} />
              <Line 
                type="monotone" 
                dataKey="needs" 
                name="Essential Needs" 
                stroke="#38bdf8" 
                strokeWidth={2.5}
                dot={{ r: 3, fill: '#38bdf8' }}
              />
              <Line 
                type="monotone" 
                dataKey="wants" 
                name="Discretionary Wants" 
                stroke="#fbbf24" 
                strokeWidth={2.5}
                dot={{ r: 3, fill: '#fbbf24' }}
              />
              <Line 
                type="monotone" 
                dataKey="needsTarget" 
                name="Needs Benchmark" 
                stroke="#38bdf8" 
                strokeDasharray="4 4"
                strokeWidth={1.5}
                dot={false}
              />
            </LineChart>
          ) : (
            <BarChart data={categoryData} margin={{ top: 10, right: 12, left: -15, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#134e30" vertical={false} opacity={0.5} />
              <XAxis dataKey="category" tick={{ fontSize: 10, fill: '#a7f3d0', fontWeight: 'bold' }} stroke="#15803d" />
              <YAxis 
                tick={{ fontSize: 10, fill: '#a7f3d0' }} 
                stroke="#15803d"
                tickFormatter={(val) => `₹${val >= 1000 ? `${Math.round(val / 1000)}k` : val}`}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#072415', 
                  borderRadius: '0.75rem', 
                  border: '1px solid rgba(163, 230, 53, 0.3)', 
                  color: '#ffffff',
                  fontSize: '11px',
                  padding: '8px 12px'
                }}
                formatter={(value: any, name: any) => [`₹${Number(value).toLocaleString()}`, name === 'spent' ? 'Spent' : 'Target']}
                labelFormatter={(label, item) => item[0]?.payload?.fullName || label}
              />
              <Legend wrapperStyle={{ fontSize: '10px', paddingTop: '6px', color: '#a7f3d0' }} />
              <Bar dataKey="spent" name="Spent (₹)" fill="#fb7185" radius={[4, 4, 0, 0]} />
              <Bar dataKey="target" name="Target (₹)" fill="#a3e635" radius={[4, 4, 0, 0]} />
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* Footer Metrics Row */}
      <div className="grid grid-cols-3 gap-2 pt-1 border-t border-emerald-500/10 text-center">
        <div className="p-1.5 rounded-lg bg-emerald-950/50 border border-emerald-500/10">
          <span className="text-[9px] text-emerald-300/70 block">Current Spent</span>
          <span className="text-xs font-black text-rose-400">
            ₹{(currentMonthData?.spent || 0).toLocaleString()}
          </span>
        </div>
        <div className="p-1.5 rounded-lg bg-emerald-950/50 border border-emerald-500/10">
          <span className="text-[9px] text-emerald-300/70 block">Target Ceiling</span>
          <span className="text-xs font-black text-lime-400">
            ₹{(currentMonthData?.target || 0).toLocaleString()}
          </span>
        </div>
        <div className="p-1.5 rounded-lg bg-emerald-950/50 border border-emerald-500/10">
          <span className="text-[9px] text-emerald-300/70 block">Buffer / Surplus</span>
          <span className="text-xs font-black text-emerald-200">
            ₹{(currentMonthData?.savingsBuffer || 0).toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  );
};

export default MonthlySpendingChart;
