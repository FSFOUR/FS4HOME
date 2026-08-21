import React from 'react';
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Cell
} from 'recharts';
import { CategoryParetoItem } from '../../services/paretoEngine';

interface Props {
  categories: CategoryParetoItem[];
  onSelectCategory?: (cat: CategoryParetoItem) => void;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0]?.payload as CategoryParetoItem;
    return (
      <div className="bg-[#051f12]/95 border border-lime-400/40 p-3.5 rounded-2xl shadow-2xl backdrop-blur-xl text-slate-100 text-xs">
        <div className="flex items-center gap-2 mb-2 pb-1.5 border-b border-emerald-800/60 font-black text-white">
          <span className="text-base">{data?.icon || '📊'}</span>
          <span>{label}</span>
          {data?.isParetoDriver && (
            <span className="text-[9px] bg-lime-400 text-emerald-950 font-black px-2 py-0.5 rounded-full ml-auto">
              80/20 Driver #{data?.rank}
            </span>
          )}
        </div>
        <div className="space-y-1">
          <div className="flex justify-between gap-4">
            <span className="text-emerald-300/80">Category Spending:</span>
            <span className="font-black text-white">₹{data?.amount?.toLocaleString('en-IN')}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-emerald-300/80">Share of Total Spend:</span>
            <span className="font-bold text-lime-400">{data?.sharePercent}%</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-emerald-300/80">Cumulative Spend %:</span>
            <span className="font-bold text-amber-300">{data?.cumulativePercent}%</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-emerald-300/80">Potential Monthly Saving:</span>
            <span className="font-bold text-emerald-300">~₹{data?.potentialMonthlySavings?.min?.toLocaleString('en-IN')}</span>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

const ParetoChart: React.FC<Props> = ({ categories, onSelectCategory }) => {
  if (!categories || categories.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-emerald-400/60 text-xs font-bold">
        No transaction data available for this timeframe
      </div>
    );
  }

  // Format data for chart
  const chartData = categories.slice(0, 10).map(c => ({
    ...c,
    shortName: c.category.split(' ')[0] || c.category,
    amount: c.amount,
    cumulativePercent: c.cumulativePercent
  }));

  const maxAmount = Math.max(...chartData.map(d => d.amount), 1000);

  return (
    <div className="w-full h-80 flex flex-col justify-between">
      <div className="flex items-center justify-between mb-2 text-xs">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-gradient-to-t from-emerald-500 to-lime-400 inline-block" />
            <span className="text-emerald-200 font-bold">Category Spending (₹)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 bg-amber-400 inline-block" />
            <span className="text-amber-300 font-bold">Cumulative %</span>
          </div>
        </div>
        <div className="flex items-center gap-1.5 text-lime-400 font-black text-[11px]">
          <span className="w-2 h-2 rounded-full bg-lime-400 animate-pulse" />
          <span>80% Pareto Boundary</span>
        </div>
      </div>

      <div className="flex-1 w-full min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={chartData}
            margin={{ top: 15, right: 20, left: 10, bottom: 25 }}
            onClick={(e: any) => {
              if (e && e.activePayload && e.activePayload[0] && onSelectCategory) {
                onSelectCategory(e.activePayload[0].payload);
              }
            }}
          >
            <XAxis
              dataKey="shortName"
              tick={{ fontSize: 10, fill: '#a7f3d0', fontWeight: 'bold' }}
              stroke="#15803d"
              interval={0}
              angle={-20}
              textAnchor="end"
            />
            {/* Left Y Axis for Spend Amount */}
            <YAxis
              yAxisId="left"
              orientation="left"
              tick={{ fontSize: 10, fill: '#a7f3d0' }}
              stroke="#15803d"
              tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
              domain={[0, Math.ceil(maxAmount * 1.1)]}
            />
            {/* Right Y Axis for Cumulative Percentage */}
            <YAxis
              yAxisId="right"
              orientation="right"
              tick={{ fontSize: 10, fill: '#fde047', fontWeight: 'bold' }}
              stroke="#ca8a04"
              domain={[0, 100]}
              tickFormatter={(v) => `${v}%`}
            />

            <Tooltip content={<CustomTooltip />} />

            {/* Reference Line at 80% */}
            <ReferenceLine
              yAxisId="right"
              y={80}
              stroke="#a3e635"
              strokeDasharray="4 4"
              strokeWidth={2}
              label={{
                value: '80% Spending Line',
                position: 'insideTopRight',
                fill: '#a3e635',
                fontSize: 10,
                fontWeight: 'bold'
              }}
            />

            {/* Category Spend Bars */}
            <Bar
              yAxisId="left"
              dataKey="amount"
              radius={[8, 8, 0, 0]}
              cursor="pointer"
            >
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.isParetoDriver ? '#a3e635' : '#10b981'}
                  fillOpacity={entry.isParetoDriver ? 0.95 : 0.45}
                />
              ))}
            </Bar>

            {/* Cumulative Percentage Line */}
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="cumulativePercent"
              stroke="#fbbf24"
              strokeWidth={3}
              dot={{ fill: '#fbbf24', r: 4, strokeWidth: 2, stroke: '#082b18' }}
              activeDot={{ r: 6, fill: '#f59e0b' }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <div className="text-center pt-1 text-[11px] text-emerald-400/80">
        💡 Click on any bar to inspect subcategories, merchants, and transaction details.
      </div>
    </div>
  );
};

export default ParetoChart;
