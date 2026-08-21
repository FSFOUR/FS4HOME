import React, { useState } from 'react';
import { CategoryParetoItem } from '../../services/paretoEngine';
import { Transaction } from '../../types';

interface Props {
  category: CategoryParetoItem | null;
  allTransactions: Transaction[];
  onClose: () => void;
  onOpenSavings?: (category: CategoryParetoItem) => void;
}

const CategoryDrilldownModal: React.FC<Props> = ({
  category,
  allTransactions,
  onClose,
  onOpenSavings
}) => {
  if (!category) return null;

  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'subcategories' | 'merchants' | 'transactions'>('subcategories');

  // Filter transactions matching this category
  const categoryTransactions = allTransactions.filter(t => {
    const desc = (t.description || '').toLowerCase();
    const catName = category.category.toLowerCase();

    if (catName.includes('housing') && (desc.includes('rent') || desc.includes('housing') || desc.includes('maintenance'))) return true;
    if (catName.includes('food delivery') && (desc.includes('swiggy') || desc.includes('zomato') || desc.includes('restaurant') || desc.includes('cafe') || desc.includes('dining') || desc.includes('eats'))) return true;
    if (catName.includes('groceries') && (desc.includes('grocery') || desc.includes('supermarket') || desc.includes('blinkit') || desc.includes('zepto') || desc.includes('milk') || desc.includes('instamart'))) return true;
    if (catName.includes('transport') && (desc.includes('uber') || desc.includes('ola') || desc.includes('fuel') || desc.includes('petrol') || desc.includes('diesel') || desc.includes('cab') || desc.includes('metro'))) return true;
    if (catName.includes('subscriptions') && (desc.includes('netflix') || desc.includes('prime') || desc.includes('hotstar') || desc.includes('spotify') || desc.includes('youtube') || desc.includes('icloud') || desc.includes('gym'))) return true;
    if (catName.includes('utilities') && (desc.includes('electricity') || desc.includes('water') || desc.includes('wifi') || desc.includes('broadband') || desc.includes('recharge') || desc.includes('gas'))) return true;
    if (catName.includes('shopping') && (desc.includes('amazon') || desc.includes('flipkart') || desc.includes('myntra') || desc.includes('clothes') || desc.includes('shopping'))) return true;
    if (catName.includes('debt') && (desc.includes('emi') || desc.includes('loan') || desc.includes('credit'))) return true;
    if (catName.includes('education') && (desc.includes('school') || desc.includes('tuition') || desc.includes('course') || desc.includes('books'))) return true;
    if (catName.includes('health') && (desc.includes('doctor') || desc.includes('pharmacy') || desc.includes('medicine') || desc.includes('hospital'))) return true;

    return desc.includes(catName.split(' ')[0].toLowerCase());
  }).filter(t => (t.description || '').toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-emerald-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-[#082b18] border border-lime-500/30 rounded-3xl p-6 md:p-8 shadow-2xl glow-lime text-slate-100 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-emerald-800/50">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-emerald-900/60 border border-lime-400/40 flex items-center justify-center text-2xl shadow-inner">
              {category.icon}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-black text-white tracking-tight">{category.category}</h3>
                {category.isParetoDriver && (
                  <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-lime-400 text-emerald-950 shadow-sm">
                    80/20 Driver # {category.rank}
                  </span>
                )}
              </div>
              <p className="text-xs text-emerald-300/80 font-medium">
                Total Spend: <span className="font-bold text-white">₹{category.amount.toLocaleString('en-IN')}</span> ({category.sharePercent}% of total expenses)
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full bg-emerald-900/40 hover:bg-emerald-800 text-emerald-300 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Quick KPI stats strip */}
        <div className="grid grid-cols-3 gap-2 my-4">
          <div className="p-3 rounded-2xl bg-emerald-950/60 border border-emerald-800/40 text-center">
            <span className="text-[10px] text-emerald-400/80 uppercase font-black tracking-wider block">Income Share</span>
            <span className="text-sm font-black text-white">{category.incomePercent}%</span>
          </div>
          <div className="p-3 rounded-2xl bg-emerald-950/60 border border-emerald-800/40 text-center">
            <span className="text-[10px] text-emerald-400/80 uppercase font-black tracking-wider block">Transactions</span>
            <span className="text-sm font-black text-white">{category.transactionCount} entries</span>
          </div>
          <div className="p-3 rounded-2xl bg-emerald-950/60 border border-emerald-800/40 text-center">
            <span className="text-[10px] text-lime-400 uppercase font-black tracking-wider block">Potential Saving</span>
            <span className="text-sm font-black text-lime-300">₹{category.potentialMonthlySavings.min.toLocaleString('en-IN')}/mo</span>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 p-1 bg-emerald-950/80 rounded-2xl border border-emerald-800/40 mb-4">
          <button
            onClick={() => setActiveTab('subcategories')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'subcategories' ? 'bg-lime-400 text-emerald-950 shadow-md' : 'text-emerald-300/70 hover:text-white'
            }`}
          >
            Subcategories ({category.subcategories.length})
          </button>
          <button
            onClick={() => setActiveTab('merchants')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'merchants' ? 'bg-lime-400 text-emerald-950 shadow-md' : 'text-emerald-300/70 hover:text-white'
            }`}
          >
            Top Merchants ({category.merchants.length})
          </button>
          <button
            onClick={() => setActiveTab('transactions')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'transactions' ? 'bg-lime-400 text-emerald-950 shadow-md' : 'text-emerald-300/70 hover:text-white'
            }`}
          >
            All Transactions
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-3 custom-scrollbar">
          {activeTab === 'subcategories' && (
            <div className="space-y-2.5">
              {category.subcategories.length === 0 ? (
                <div className="p-6 text-center text-emerald-400/60 text-xs">No subcategory breakdown available</div>
              ) : (
                category.subcategories.map((sub, idx) => (
                  <div key={idx} className="p-3.5 rounded-2xl bg-emerald-950/40 border border-emerald-800/30 flex items-center justify-between">
                    <div className="flex-1 mr-4">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs font-bold text-white">{sub.name}</span>
                        <span className="text-xs font-black text-emerald-200">₹{sub.amount.toLocaleString('en-IN')} ({sub.percentage}%)</span>
                      </div>
                      <div className="w-full h-1.5 bg-emerald-900/50 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-emerald-500 to-lime-400 rounded-full"
                          style={{ width: `${Math.min(100, sub.percentage)}%` }}
                        />
                      </div>
                    </div>
                    <span className="text-[10px] text-emerald-400/80 font-medium whitespace-nowrap">{sub.count} tx</span>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'merchants' && (
            <div className="space-y-2.5">
              {category.merchants.length === 0 ? (
                <div className="p-6 text-center text-emerald-400/60 text-xs">No merchant information recorded</div>
              ) : (
                category.merchants.map((m, idx) => (
                  <div key={idx} className="p-3.5 rounded-2xl bg-emerald-950/40 border border-emerald-800/30 flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-white block">{m.name}</span>
                      <span className="text-[10px] text-emerald-400/70">{m.count} transactions in timeframe</span>
                    </div>
                    <span className="text-xs font-black text-lime-300">₹{m.amount.toLocaleString('en-IN')}</span>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'transactions' && (
            <div className="space-y-2">
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Search within this category..."
                className="w-full px-3.5 py-2 rounded-xl bg-emerald-950/60 border border-emerald-700/50 text-xs text-white placeholder-emerald-400/50 focus:outline-none focus:border-lime-400 mb-2"
              />
              {categoryTransactions.length === 0 ? (
                <div className="p-6 text-center text-emerald-400/60 text-xs">No matching transactions found</div>
              ) : (
                categoryTransactions.map(t => (
                  <div key={t.id} className="p-3 rounded-2xl bg-emerald-950/40 border border-emerald-800/30 flex items-center justify-between hover:bg-emerald-900/30 transition-colors">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white">{t.description}</span>
                        {t.isRecurring && (
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-lime-400/20 text-lime-300 border border-lime-400/30">
                            Recurring
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-emerald-400/70">{new Date(t.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                    </div>
                    <span className="text-xs font-black text-white">₹{t.amount.toLocaleString('en-IN')}</span>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="pt-4 border-t border-emerald-800/50 flex items-center justify-between gap-3 mt-4">
          <p className="text-[11px] text-emerald-300/80">
            {category.isDiscretionary
              ? '💡 Discretionary category: high leverage for 20-30% spending reduction.'
              : '🔒 Essential baseline: optimize for bill plans and bulk purchases.'}
          </p>

          <div className="flex items-center gap-2">
            {onOpenSavings && (
              <button
                onClick={() => {
                  onClose();
                  onOpenSavings(category);
                }}
                className="px-4 py-2 rounded-xl bg-lime-400 hover:bg-lime-300 text-emerald-950 text-xs font-black transition-all shadow-md"
              >
                Find Savings 💡
              </button>
            )}
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-emerald-900/60 hover:bg-emerald-800 text-emerald-200 text-xs font-bold transition-all"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CategoryDrilldownModal;
