import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppState } from '../types';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  state: AppState;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({ isOpen, onClose, state }) => {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
        else setQuery('');
      } else if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const cleanQuery = query.toLowerCase().trim();

  // Search Results
  const matchedTransactions = cleanQuery
    ? state.transactions
        .filter(t => 
          t.description.toLowerCase().includes(cleanQuery) ||
          t.amount.toString().includes(cleanQuery) ||
          (t.kakeiboCategory && t.kakeiboCategory.toLowerCase().includes(cleanQuery)) ||
          t.type.toLowerCase().includes(cleanQuery)
        )
        .slice(0, 5)
    : [];

  const matchedGoals = cleanQuery
    ? (state.financialGoals || [])
        .filter(g => g.title.toLowerCase().includes(cleanQuery) || g.category.toLowerCase().includes(cleanQuery))
        .slice(0, 3)
    : [];

  const quickNav = [
    { label: 'Dashboard', path: '/', category: 'Page' },
    { label: 'Transactions & Finance', path: '/finance', category: 'Page' },
    { label: '80/20 Insights', path: '/pareto', category: 'Page' },
    { label: 'Budget Planner', path: '/budget', category: 'Page' },
    { label: 'Financial Goals', path: '/goals', category: 'Page' },
    { label: 'Daily Schedule & Routine', path: '/schedule', category: 'Page' },
    { label: 'Food & Lifestyle', path: '/lifestyle', category: 'Page' },
    { label: 'Zakat Calculator', path: '/zakat', category: 'Page' },
    { label: 'Financial Calculator', path: '/tools/calculator', category: 'Tool' },
    { label: 'Settings', path: '/settings', category: 'System' },
  ].filter(p => !cleanQuery || p.label.toLowerCase().includes(cleanQuery));

  const handleSelect = (path: string) => {
    navigate(path);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-[250] flex items-start justify-center pt-12 md:pt-20 p-3 animate-in fade-in duration-150">
      <div 
        className="w-full max-w-lg bg-[#0a2618] border border-lime-500/30 rounded-2xl shadow-2xl overflow-hidden text-slate-100 flex flex-col max-h-[80vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-emerald-500/20 bg-emerald-950/40">
          <svg className="w-4 h-4 text-lime-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
          <input 
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search transactions, goals, pages... (Esc to close)"
            className="w-full bg-transparent text-sm text-white placeholder-emerald-400/50 outline-none font-medium"
          />
          {query && (
            <button 
              onClick={() => setQuery('')} 
              className="text-xs text-emerald-400 hover:text-white px-1.5 py-0.5 rounded bg-emerald-900/50"
            >
              Clear
            </button>
          )}
          <span className="text-[10px] text-emerald-400/60 font-mono border border-emerald-500/30 rounded px-1.5 py-0.5 hidden sm:inline">
            ESC
          </span>
        </div>

        {/* Results Body */}
        <div className="p-2 overflow-y-auto space-y-3 flex-1 text-xs">
          {/* Quick Pages */}
          {quickNav.length > 0 && (
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-400/70 px-2 py-1">
                Navigation ({quickNav.length})
              </div>
              <div className="space-y-0.5">
                {quickNav.slice(0, 6).map((nav) => (
                  <button
                    key={nav.path}
                    onClick={() => handleSelect(nav.path)}
                    className="w-full text-left px-3 py-2 rounded-xl hover:bg-lime-400/15 hover:text-lime-300 flex items-center justify-between text-xs transition-colors group"
                  >
                    <span className="font-semibold text-white group-hover:text-lime-300">{nav.label}</span>
                    <span className="text-[10px] text-emerald-400/60 bg-emerald-900/40 px-2 py-0.5 rounded">
                      {nav.category}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Transactions Match */}
          {matchedTransactions.length > 0 && (
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-400/70 px-2 py-1">
                Matching Transactions
              </div>
              <div className="space-y-1">
                {matchedTransactions.map((t) => (
                  <div
                    key={t.id}
                    onClick={() => handleSelect('/finance')}
                    className="p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-500/10 hover:border-lime-500/30 flex items-center justify-between cursor-pointer transition-colors"
                  >
                    <div>
                      <div className="font-bold text-white text-xs">{t.description}</div>
                      <div className="text-[10px] text-emerald-300/60">
                        {t.kakeiboCategory || t.type} • {new Date(t.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                      </div>
                    </div>
                    <div className={`font-black text-xs ${t.type === 'Income' ? 'text-lime-400' : 'text-slate-200'}`}>
                      {t.type === 'Income' ? '+' : '-'}₹{t.amount.toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Goals Match */}
          {matchedGoals.length > 0 && (
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-400/70 px-2 py-1">
                Matching Goals
              </div>
              <div className="space-y-1">
                {matchedGoals.map((g) => (
                  <div
                    key={g.id}
                    onClick={() => handleSelect('/goals')}
                    className="p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-500/10 hover:border-lime-500/30 flex items-center justify-between cursor-pointer transition-colors"
                  >
                    <div>
                      <div className="font-bold text-white text-xs">{g.title}</div>
                      <div className="text-[10px] text-emerald-300/60">{g.category}</div>
                    </div>
                    <div className="font-black text-xs text-lime-400">
                      ₹{g.currentAmount.toLocaleString()} / ₹{g.targetAmount.toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {cleanQuery && matchedTransactions.length === 0 && matchedGoals.length === 0 && quickNav.length === 0 && (
            <div className="text-center py-6 text-emerald-300/60 text-xs">
              No matching records found for "{query}".
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="px-4 py-2 border-t border-emerald-500/20 bg-emerald-950/60 flex items-center justify-between text-[10px] text-emerald-300/60">
          <span>Search transactions, categories, goals, or pages</span>
          <span>Tab / ↑↓ to navigate</span>
        </div>
      </div>
    </div>
  );
};
