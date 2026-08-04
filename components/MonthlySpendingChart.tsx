import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { KakeiboCategory } from '../types';

interface Props {
  spending: Record<string, number>;
  targets: Record<string, { amount: number }>;
}

const MonthlySpendingChart: React.FC<Props> = ({ spending, targets }) => {
  const data = Object.values(KakeiboCategory).map(category => ({
    category,
    spent: spending[category] || 0,
    target: targets[category]?.amount || 0
  }));

  return (
    <div className="h-64 w-full bg-[#0d2a1a]/80 p-5 rounded-3xl border border-lime-500/20 shadow-xl backdrop-blur-md flex flex-col justify-between">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-xs font-black text-lime-400 uppercase tracking-widest flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-lime-400 animate-pulse glow-lime-sm" />
          Spending vs Target
        </h4>
        <span className="text-[10px] text-emerald-300/60 font-medium">Monthly Breakdown</span>
      </div>
      <div className="flex-1 w-full min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <XAxis dataKey="category" tick={{ fontSize: 10, fill: '#a7f3d0', fontWeight: 'bold' }} stroke="#15803d" />
            <YAxis tick={{ fontSize: 10, fill: '#a7f3d0' }} stroke="#15803d" />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#0a2316', 
                borderRadius: '1rem', 
                border: '1px solid rgba(139, 197, 63, 0.3)', 
                boxShadow: '0 10px 25px -5px rgba(0,0,0,0.5)',
                color: '#ffffff'
              }}
              itemStyle={{ color: '#a3e635', fontWeight: 'bold' }}
            />
            <Legend wrapperStyle={{ fontSize: '10px', paddingTop: '4px', color: '#a7f3d0' }} />
            <Bar dataKey="spent" name="Spent (₹)" fill="#fb7185" radius={[6, 6, 0, 0]} />
            <Bar dataKey="target" name="Target (₹)" fill="#a3e635" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default MonthlySpendingChart;
