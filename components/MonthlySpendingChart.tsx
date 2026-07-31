import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, Legend } from 'recharts';
import { KakeiboCategory } from '../types';

interface Props {
  spending: Record<string, number>;
  targets: Record<string, { amount: number }>;
}

const CATEGORY_COLORS: Record<string, string> = {
  [KakeiboCategory.NEEDS]: '#f59e0b', // amber-500
  [KakeiboCategory.WANTS]: '#10b981', // emerald-500
  [KakeiboCategory.CULTURE]: '#3b82f6', // blue-500
  [KakeiboCategory.UNEXPECTED]: '#f43f5e', // rose-500
};

const MonthlySpendingChart: React.FC<Props> = ({ spending, targets }) => {
  const data = Object.values(KakeiboCategory).map(category => ({
    category,
    spent: spending[category] || 0,
    target: targets[category]?.amount || 0
  }));

  return (
    <div className="h-64 w-full bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
      <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-4">Spending vs Target</h4>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <XAxis dataKey="category" tick={{fontSize: 10}} />
          <YAxis tick={{fontSize: 10}} />
          <Tooltip 
            contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
          />
          <Legend />
          <Bar dataKey="spent" name="Spent" fill="#ef4444" radius={[4, 4, 0, 0]} />
          <Bar dataKey="target" name="Target" fill="#10b981" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default MonthlySpendingChart;
