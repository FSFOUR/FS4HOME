import React, { useState } from 'react';
import { Transaction, WealthType, KakeiboCategory } from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onAddTransaction: (t: Omit<Transaction, 'id'>) => void;
}

const QuickAddModal: React.FC<Props> = ({ isOpen, onClose, onAddTransaction }) => {
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<WealthType>(WealthType.EXPENSE);
  const [category, setCategory] = useState<KakeiboCategory>(KakeiboCategory.NEEDS);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || Number(amount) <= 0) return;
    onAddTransaction({
      amount: Number(amount),
      description,
      type,
      kakeiboCategory: category,
      date: new Date().toISOString()
    });
    setAmount('');
    setDescription('');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-md z-[200] flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-[#0d2e1c] border border-lime-500/30 rounded-3xl p-6 md:p-8 w-full max-w-md shadow-2xl text-slate-100 glow-lime-sm relative">
        <button 
          onClick={onClose}
          type="button"
          className="absolute top-5 right-5 text-emerald-400 hover:text-white p-2 rounded-full hover:bg-emerald-900/50 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-2xl bg-lime-400 text-emerald-950 font-black flex items-center justify-center text-xl shadow-lg glow-lime-sm">
            +
          </div>
          <div>
            <h3 className="text-xl font-black text-white tracking-tight">Quick Add Transaction</h3>
            <p className="text-xs text-emerald-300/70 font-medium">Record income, expense, asset or liability</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[10px] font-black uppercase text-emerald-300/70 tracking-widest mb-1.5">Amount (₹)</label>
            <input 
              type="number" 
              placeholder="0.00" 
              value={amount} 
              onChange={(e) => setAmount(e.target.value)}
              className="w-full px-4 py-3.5 bg-[#061e12] border border-emerald-500/30 rounded-2xl text-lime-400 font-black text-2xl placeholder-emerald-800 outline-none focus:border-lime-400 focus:ring-1 focus:ring-lime-400 transition-all"
              required
              autoFocus
            />
          </div>

          <div>
            <label className="block text-[10px] font-black uppercase text-emerald-300/70 tracking-widest mb-1.5">Description</label>
            <input 
              type="text" 
              placeholder="e.g. Groceries, Salary, Coffee" 
              value={description} 
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-3 bg-[#061e12] border border-emerald-500/30 rounded-2xl text-slate-100 font-bold placeholder-emerald-800 outline-none focus:border-lime-400 focus:ring-1 focus:ring-lime-400 transition-all text-sm"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-black uppercase text-emerald-300/70 tracking-widest mb-1.5">Type</label>
              <select 
                value={type} 
                onChange={(e) => setType(e.target.value as WealthType)} 
                className="w-full px-3 py-3 bg-[#061e12] border border-emerald-500/30 rounded-2xl text-slate-100 font-bold text-sm outline-none focus:border-lime-400 transition-all"
              >
                {Object.values(WealthType).map(t => <option key={t} value={t} className="bg-[#0d2a1a]">{t}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase text-emerald-300/70 tracking-widest mb-1.5">Category</label>
              <select 
                value={category} 
                onChange={(e) => setCategory(e.target.value as KakeiboCategory)} 
                className="w-full px-3 py-3 bg-[#061e12] border border-emerald-500/30 rounded-2xl text-slate-100 font-bold text-sm outline-none focus:border-lime-400 transition-all"
              >
                {Object.values(KakeiboCategory).map(c => <option key={c} value={c} className="bg-[#0d2a1a]">{c}</option>)}
              </select>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button 
              type="button" 
              onClick={onClose} 
              className="flex-1 py-3.5 rounded-2xl border border-emerald-500/30 text-emerald-300 font-bold hover:bg-emerald-900/40 transition-colors text-sm"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="flex-1 py-3.5 rounded-2xl bg-lime-400 text-emerald-950 font-black hover:bg-lime-300 transition-all shadow-lg glow-lime-sm text-sm"
            >
              Save Transaction
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default QuickAddModal;
