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
    onAddTransaction({
      amount: Number(amount),
      description,
      type,
      kakeiboCategory: category,
      date: new Date().toISOString()
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-[200] flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-xl">
        <h3 className="text-xl font-bold mb-4">Quick Add Transaction</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input 
            type="number" 
            placeholder="Amount" 
            value={amount} 
            onChange={(e) => setAmount(e.target.value)}
            className="w-full p-3 rounded-xl border border-slate-200"
            required
          />
          <input 
            type="text" 
            placeholder="Description" 
            value={description} 
            onChange={(e) => setDescription(e.target.value)}
            className="w-full p-3 rounded-xl border border-slate-200"
            required
          />
          <select value={type} onChange={(e) => setType(e.target.value as WealthType)} className="w-full p-3 rounded-xl border border-slate-200">
            {Object.values(WealthType).map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <select value={category} onChange={(e) => setCategory(e.target.value as KakeiboCategory)} className="w-full p-3 rounded-xl border border-slate-200">
            {Object.values(KakeiboCategory).map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <div className="flex gap-2">
            <button type="button" onClick={onClose} className="flex-1 py-3 rounded-xl border border-slate-200 font-bold">Cancel</button>
            <button type="submit" className="flex-1 py-3 rounded-xl bg-emerald-600 text-white font-bold">Add</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default QuickAddModal;
