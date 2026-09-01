import React, { useState } from 'react';
import { AppState, DisplayDensity } from '../types';
import { DEFAULT_STATE } from '../App';

interface SettingsProps {
  state: AppState;
  onUpdateState: React.Dispatch<React.SetStateAction<AppState>>;
  onShowToast: (msg: string) => void;
}

export const Settings: React.FC<SettingsProps> = ({ state, onUpdateState, onShowToast }) => {
  const [activeTab, setActiveTab] = useState<'appearance' | 'account' | 'finance' | 'ai' | 'notifications' | 'data'>('appearance');
  const [nameInput, setNameInput] = useState(state.userName || 'User');
  const [savingsInput, setSavingsInput] = useState(state.monthlySavingsTarget || 5000);

  const density = state.displayDensity || 'compact';

  const handleDensityChange = (newDensity: DisplayDensity) => {
    onUpdateState(prev => ({ ...prev, displayDensity: newDensity }));
    document.documentElement.className = `density-${newDensity}`;
    localStorage.setItem('fs4home_density', newDensity);
    onShowToast(`Density set to ${newDensity.replace('-', ' ')} ✓`);
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateState(prev => ({
      ...prev,
      userName: nameInput.trim() || 'User',
      monthlySavingsTarget: Number(savingsInput) || 5000
    }));
    onShowToast('Profile & Finance Settings Saved ✓');
  };

  const handleExportData = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(state, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `fs4home_backup_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    onShowToast('Financial backup exported ✓');
  };

  const handleImportData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileReader = new FileReader();
    if (e.target.files && e.target.files[0]) {
      fileReader.readAsText(e.target.files[0], "UTF-8");
      fileReader.onload = (event) => {
        try {
          const parsed = JSON.parse(event.target?.result as string);
          if (parsed && typeof parsed === 'object') {
            onUpdateState(prev => ({ ...prev, ...parsed }));
            onShowToast('Backup imported successfully ✓');
          }
        } catch {
          alert('Invalid backup file format');
        }
      };
    }
  };

  const handleClearTransactions = () => {
    if (window.confirm('Are you sure you want to clear all transactions? This will reset all transaction history.')) {
      onUpdateState(prev => ({
        ...prev,
        transactions: [],
        zakatGiven: 0
      }));
      onShowToast('Transactions cleared ✓');
    }
  };

  const handleFullReset = () => {
    if (window.confirm('⚠️ WARNING: Are you sure you want to delete ALL data and start with a completely fresh, empty app for a new user? This will reset all transactions, goals, debts, food plan, vehicle records, and routines.')) {
      localStorage.removeItem('fs4home_data');
      localStorage.removeItem('fs4home_density');
      document.documentElement.className = 'density-compact';
      onUpdateState(DEFAULT_STATE);
      setNameInput('');
      setSavingsInput(0);
      onShowToast('App wiped to fresh new user state ✓');
    }
  };

  return (
    <div className="space-y-4 max-w-4xl mx-auto text-slate-100 animate-in fade-in duration-200 pb-16">
      {/* Compact Page Header */}
      <div className="flex items-center justify-between border-b border-emerald-500/20 pb-3">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-white tracking-tight">Settings</h1>
          <p className="text-xs text-emerald-300/70">Personalize display density, accounts, AI, and data backups</p>
        </div>
        <button
          onClick={handleExportData}
          className="px-3 py-1.5 rounded-xl bg-lime-400/20 hover:bg-lime-400/30 text-lime-300 text-xs font-bold border border-lime-400/30 transition-colors"
        >
          Quick Backup
        </button>
      </div>

      {/* Compact Tab Switcher */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-emerald-500/10 no-scrollbar">
        {[
          { id: 'appearance', label: 'Display & Density' },
          { id: 'account', label: 'Profile' },
          { id: 'finance', label: 'Finance Rules' },
          { id: 'ai', label: 'AI Advisory' },
          { id: 'notifications', label: 'Alerts' },
          { id: 'data', label: 'Data & Backup' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors ${
              activeTab === tab.id
                ? 'bg-lime-400 text-emerald-950 shadow-sm'
                : 'text-emerald-300/70 hover:text-white hover:bg-emerald-950/60'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab 1: Appearance & Display Density */}
      {activeTab === 'appearance' && (
        <div className="glass-card p-4 md:p-5 rounded-2xl space-y-4 border border-emerald-500/20">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
            <div>
              <h3 className="text-sm font-black text-white">Display Density</h3>
              <p className="text-xs text-emerald-300/70">Updates global spacing, card paddings, and data row heights</p>
            </div>
            <span className="self-start sm:self-auto text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-emerald-950/80 border border-emerald-500/30 text-lime-400">
              html.density-{density}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
            {[
              { 
                id: 'comfortable', 
                label: 'Comfortable', 
                badge: '16px+ Spacing',
                desc: 'Generous padding and relaxed breathing room for touch screens',
                bars: ['h-2.5', 'h-2.5', 'h-2.5'],
                gap: 'gap-2'
              },
              { 
                id: 'compact', 
                label: 'Compact', 
                badge: 'Recommended',
                desc: 'Standard balanced spacing (12px) optimized for high scannability',
                bars: ['h-2', 'h-2', 'h-2'],
                gap: 'gap-1.5'
              },
              { 
                id: 'extra-compact', 
                label: 'Extra Compact', 
                badge: 'Max Density',
                desc: 'Tightly packed data rows (8px) for maximum information on screen',
                bars: ['h-1.5', 'h-1.5', 'h-1.5'],
                gap: 'gap-1'
              },
            ].map(mode => (
              <button
                type="button"
                key={mode.id}
                onClick={() => handleDensityChange(mode.id as DisplayDensity)}
                className={`p-3.5 rounded-xl border text-left cursor-pointer transition-all flex flex-col justify-between ${
                  density === mode.id
                    ? 'border-lime-400 bg-lime-400/15 glow-lime-sm'
                    : 'border-emerald-500/20 bg-emerald-950/40 hover:border-emerald-400/40'
                }`}
              >
                <div className="space-y-1.5 w-full">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-black text-white">{mode.label}</span>
                      {mode.id === 'compact' && (
                        <span className="text-[9px] bg-lime-400/20 text-lime-300 font-bold px-1.5 py-0.2 rounded">Default</span>
                      )}
                    </div>
                    <input
                      type="radio"
                      name="density"
                      checked={density === mode.id}
                      onChange={() => handleDensityChange(mode.id as DisplayDensity)}
                      className="accent-lime-400 w-3.5 h-3.5"
                    />
                  </div>

                  {/* Visual Preview Bars */}
                  <div className={`w-full p-2 rounded-lg bg-emerald-950/80 border border-emerald-500/15 flex flex-col ${mode.gap}`}>
                    {mode.bars.map((bClass, idx) => (
                      <div 
                        key={idx} 
                        className={`w-full ${bClass} rounded ${density === mode.id ? 'bg-lime-400/50' : 'bg-emerald-500/30'}`}
                      />
                    ))}
                  </div>

                  <p className="text-[10px] text-emerald-300/70 leading-relaxed pt-0.5">{mode.desc}</p>
                </div>

                <div className="mt-2 pt-2 border-t border-emerald-500/10 flex items-center justify-between text-[10px] font-bold">
                  <span className="text-emerald-400/60 font-mono">.{`density-${mode.id}`}</span>
                  <span className={density === mode.id ? 'text-lime-400' : 'text-emerald-400/50'}>
                    {density === mode.id ? '● Active' : 'Select'}
                  </span>
                </div>
              </button>
            ))}
          </div>

          <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-500/15 text-xs text-emerald-300/80 flex items-center justify-between">
            <span>Active CSS Mode: <strong className="text-lime-400 font-mono">&lt;html class="density-{density}"&gt;</strong></span>
            <span className="text-[10px] bg-lime-400/20 text-lime-300 px-2 py-0.5 rounded font-bold">Applied Globally</span>
          </div>
        </div>
      )}

      {/* Tab 2: Profile & Account */}
      {activeTab === 'account' && (
        <form onSubmit={handleSaveProfile} className="glass-card p-4 md:p-5 rounded-2xl space-y-3.5 border border-emerald-500/20">
          <h3 className="text-sm font-black text-white">Profile Information</h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-emerald-300/80 uppercase mb-1">Display Name</label>
              <input
                type="text"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                className="w-full px-3 py-2 bg-[#061f12] border border-emerald-500/30 rounded-xl text-white font-bold text-xs focus:border-lime-400 outline-none"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-emerald-300/80 uppercase mb-1">Currency</label>
              <select className="w-full px-3 py-2 bg-[#061f12] border border-emerald-500/30 rounded-xl text-white font-bold text-xs focus:border-lime-400 outline-none">
                <option value="INR">INR (₹) - Indian Rupee</option>
                <option value="USD">USD ($) - US Dollar</option>
                <option value="EUR">EUR (€) - Euro</option>
                <option value="AED">AED (د.إ) - UAE Dirham</option>
                <option value="SAR">SAR (﷼) - Saudi Riyal</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            className="px-4 py-2 bg-lime-400 text-emerald-950 text-xs font-black rounded-xl hover:bg-lime-300 transition-all shadow-md"
          >
            Save Changes
          </button>
        </form>
      )}

      {/* Tab 3: Finance Rules */}
      {activeTab === 'finance' && (
        <form onSubmit={handleSaveProfile} className="glass-card p-4 md:p-5 rounded-2xl space-y-3.5 border border-emerald-500/20">
          <h3 className="text-sm font-black text-white">Budget & Savings Targets</h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-emerald-300/80 uppercase mb-1">Monthly Savings Goal (₹)</label>
              <input
                type="number"
                value={savingsInput}
                onChange={(e) => setSavingsInput(Number(e.target.value))}
                className="w-full px-3 py-2 bg-[#061f12] border border-emerald-500/30 rounded-xl text-lime-400 font-black text-xs focus:border-lime-400 outline-none"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-emerald-300/80 uppercase mb-1">Kakeibo Framework</label>
              <div className="px-3 py-2 bg-emerald-950/60 rounded-xl border border-emerald-500/20 text-xs text-white font-medium">
                50% Needs • 30% Wants • 20% Culture/Savings
              </div>
            </div>
          </div>

          <button
            type="submit"
            className="px-4 py-2 bg-lime-400 text-emerald-950 text-xs font-black rounded-xl hover:bg-lime-300 transition-all shadow-md"
          >
            Update Finance Rules
          </button>
        </form>
      )}

      {/* Tab 4: AI Settings */}
      {activeTab === 'ai' && (
        <div className="glass-card p-4 md:p-5 rounded-2xl space-y-3 border border-emerald-500/20">
          <h3 className="text-sm font-black text-white">AI Financial Advisory</h3>
          <p className="text-xs text-emerald-300/70">Configure intelligent spending insights, 80/20 opportunity models, and Sharia compliance suggestions</p>

          <div className="space-y-2 pt-1">
            {[
              { title: '80/20 Spending Leak Detection', desc: 'Auto-identify recurring subscriptions and high-impact reductions', checked: true },
              { title: 'Kakeibo Reflection Prompts', desc: 'Weekly prompts evaluating Needs vs Wants', checked: true },
              { title: 'Islamic Financial Principles', desc: 'Ethical guidance on debt-free living and Zakat readiness', checked: true },
            ].map((item, idx) => (
              <label key={idx} className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/15 flex items-center justify-between cursor-pointer hover:border-lime-500/30 transition-colors">
                <div>
                  <div className="text-xs font-bold text-white">{item.title}</div>
                  <div className="text-[10px] text-emerald-300/60">{item.desc}</div>
                </div>
                <input type="checkbox" defaultChecked={item.checked} className="accent-lime-400 w-4 h-4 rounded" />
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Tab 5: Notifications */}
      {activeTab === 'notifications' && (
        <div className="glass-card p-4 md:p-5 rounded-2xl space-y-3 border border-emerald-500/20">
          <h3 className="text-sm font-black text-white">Alert Preferences</h3>

          <div className="space-y-2">
            {[
              { title: '80% Category Threshold Warning', desc: 'Notify when a category surpasses 80% of target budget', checked: true },
              { title: 'Upcoming Recurring Bills', desc: 'Alerts 3 days prior to recurring charges and subscriptions', checked: true },
              { title: 'Goal Milestone Celebrations', desc: 'Toast alerts when reaching 25%, 50%, 75%, and 100% of targets', checked: true },
            ].map((item, idx) => (
              <label key={idx} className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/15 flex items-center justify-between cursor-pointer hover:border-lime-500/30 transition-colors">
                <div>
                  <div className="text-xs font-bold text-white">{item.title}</div>
                  <div className="text-[10px] text-emerald-300/60">{item.desc}</div>
                </div>
                <input type="checkbox" defaultChecked={item.checked} className="accent-lime-400 w-4 h-4 rounded" />
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Tab 6: Data & Backup */}
      {activeTab === 'data' && (
        <div className="glass-card p-4 md:p-5 rounded-2xl space-y-4 border border-emerald-500/20">
          <div>
            <h3 className="text-sm font-black text-white">Data Management</h3>
            <p className="text-xs text-emerald-300/70">Export, import, or reset your local financial records safely</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-500/15 space-y-2">
              <div className="text-xs font-bold text-white">Backup JSON File</div>
              <p className="text-[10px] text-emerald-300/60">Export all transactions, goals, and schedule routines.</p>
              <button
                onClick={handleExportData}
                className="w-full py-2 bg-lime-400 text-emerald-950 text-xs font-bold rounded-lg hover:bg-lime-300 transition-colors"
              >
                Download Backup
              </button>
            </div>

            <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-500/15 space-y-2">
              <div className="text-xs font-bold text-white">Restore Backup</div>
              <p className="text-[10px] text-emerald-300/60">Import a previously saved JSON state file.</p>
              <label className="block w-full text-center py-2 bg-emerald-900/60 hover:bg-emerald-800 text-emerald-200 text-xs font-bold rounded-lg border border-emerald-500/30 cursor-pointer transition-colors">
                <span>Select JSON File</span>
                <input type="file" accept=".json" onChange={handleImportData} className="hidden" />
              </label>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-amber-950/30 border border-amber-500/20 flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-amber-300">Clear Transaction History</div>
              <p className="text-[10px] text-amber-200/60">Reset all income, expense, and Zakat transaction logs.</p>
            </div>
            <button
              onClick={handleClearTransactions}
              className="px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-xs font-bold border border-amber-500/30 transition-colors"
            >
              Clear Logs
            </button>
          </div>

          <div className="p-3.5 rounded-xl bg-rose-950/40 border border-rose-500/30 flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-rose-300">Reset All App Data (Fresh User)</div>
              <p className="text-[10px] text-rose-200/70">Wipe all demo data, goals, tasks, routines, and start completely fresh.</p>
            </div>
            <button
              onClick={handleFullReset}
              className="px-3 py-1.5 rounded-lg bg-rose-500 text-white hover:bg-rose-600 text-xs font-bold shadow-sm transition-colors"
            >
              Fresh App Reset
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
