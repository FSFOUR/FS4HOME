import React, { useState } from 'react';
import { formatINR } from '../../services/loanService';

interface InstantAmortizationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const InstantAmortizationModal: React.FC<InstantAmortizationModalProps> = ({ isOpen, onClose }) => {
  const [principal, setPrincipal] = useState<number>(500000);
  const [annualRate, setAnnualRate] = useState<number>(9.5);
  const [tenureMonths, setTenureMonths] = useState<number>(60);

  if (!isOpen) return null;

  // Standard EMI Formula: P * r * (1+r)^n / ((1+r)^n - 1)
  const monthlyRate = annualRate > 0 ? annualRate / 100 / 12 : 0;
  const n = tenureMonths > 0 ? tenureMonths : 1;

  let emi = 0;
  if (monthlyRate > 0) {
    const pow = Math.pow(1 + monthlyRate, n);
    emi = Math.round((principal * monthlyRate * pow) / (pow - 1));
  } else {
    emi = Math.round(principal / n);
  }

  const totalPayment = emi * n;
  const totalInterest = Math.max(0, totalPayment - principal);

  // Generate first 12 months amortization preview schedule
  const schedulePreview = [];
  let balance = principal;
  for (let m = 1; m <= Math.min(12, n); m++) {
    const interestForMonth = Math.round(balance * monthlyRate);
    const principalForMonth = Math.min(balance, emi - interestForMonth);
    const closingBalance = Math.max(0, balance - principalForMonth);
    schedulePreview.push({
      month: m,
      opening: balance,
      emi,
      principal: principalForMonth,
      interest: interestForMonth,
      closing: closingBalance,
    });
    balance = closingBalance;
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-[240] flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="w-full max-w-xl bg-white border border-[#E1E5DC] rounded-2xl shadow-2xl overflow-hidden my-auto animate-in zoom-in-95 duration-200 text-[#24342B]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#E1E5DC] bg-[#F0F1E9]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#244A38] text-white flex items-center justify-center text-xs font-bold shadow-xs">
              ⚡
            </div>
            <div>
              <h3 className="text-base font-bold text-[#24342B] tracking-tight">
                Instant Amortization Preview
              </h3>
              <p className="text-xs text-[#68756C]">
                Standard EMI formula simulation with Calm Wealth precision
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg text-[#68756C] hover:text-[#24342B] hover:bg-[#E9EEE5] flex items-center justify-center text-sm font-bold transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
          
          {/* Input Controls */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-[#68756C] uppercase mb-1">
                Principal Amount (₹)
              </label>
              <input
                type="number"
                value={principal}
                onChange={(e) => setPrincipal(Math.max(0, Number(e.target.value)))}
                className="w-full bg-white border border-[#D6DDD2] rounded-xl px-3 py-2 text-xs font-bold text-[#24342B] focus:outline-none focus:border-[#527A5B] shadow-xs transition-all"
                placeholder="500000"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-[#68756C] uppercase mb-1">
                Interest Rate (% p.a.)
              </label>
              <input
                type="number"
                step="0.1"
                value={annualRate}
                onChange={(e) => setAnnualRate(Math.max(0, Number(e.target.value)))}
                className="w-full bg-white border border-[#D6DDD2] rounded-xl px-2.5 py-1.5 text-[11px] font-bold text-[#24342B] focus:outline-none focus:border-[#527A5B] shadow-xs transition-all"
                placeholder="9.5"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-[#68756C] uppercase mb-1">
                Tenure (Months)
              </label>
              <input
                type="number"
                value={tenureMonths}
                onChange={(e) => setTenureMonths(Math.max(1, Number(e.target.value)))}
                className="w-full bg-white border border-[#D6DDD2] rounded-xl px-3 py-2 text-xs font-bold text-[#24342B] focus:outline-none focus:border-[#527A5B] shadow-xs transition-all"
                placeholder="60"
              />
            </div>
          </div>

          {/* Quick Summary KPI Cards */}
          <div className="grid grid-cols-3 gap-3 pt-2">
            <div className="bg-[#F0F1E9] p-3 rounded-xl border border-[#E1E5DC] text-center">
              <span className="text-[10px] font-bold uppercase text-[#68756C] block">Monthly EMI</span>
              <span className="text-base sm:text-lg font-black text-[#244A38]">{formatINR(emi)}</span>
            </div>
            <div className="bg-[#F0F1E9] p-3 rounded-xl border border-[#E1E5DC] text-center">
              <span className="text-[10px] font-bold uppercase text-[#68756C] block">Total Interest</span>
              <span className="text-base sm:text-lg font-black text-[#B85D4B]">{formatINR(totalInterest)}</span>
            </div>
            <div className="bg-[#F0F1E9] p-3 rounded-xl border border-[#E1E5DC] text-center">
              <span className="text-[10px] font-bold uppercase text-[#68756C] block">Total Payable</span>
              <span className="text-base sm:text-lg font-black text-[#24342B]">{formatINR(totalPayment)}</span>
            </div>
          </div>

          {/* Amortization Formula Note */}
          <div className="bg-[#EAF1E6] p-2.5 rounded-xl border border-[#A8C5A0]/40 text-[11px] text-[#244A38] flex items-center justify-between">
            <span>Formula: E = P · r · (1 + r)ⁿ / ((1 + r)ⁿ - 1)</span>
            <span className="font-bold">Reducing Balance</span>
          </div>

          {/* Amortization Table Preview (First 12 Months) */}
          <div className="space-y-2 pt-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#24342B]">Amortization Schedule Preview (First 12 Months)</span>
              <span className="text-[10px] text-[#68756C]">Showing {schedulePreview.length} of {n} months</span>
            </div>

            <div className="border border-[#E1E5DC] rounded-xl overflow-hidden max-h-56 overflow-y-auto">
              <table className="w-full text-left border-collapse text-[11px]">
                <thead className="bg-[#F0F1E9] text-[#68756C] font-bold uppercase sticky top-0 border-b border-[#E1E5DC]">
                  <tr>
                    <th className="p-2">Mo</th>
                    <th className="p-2 text-right">Opening</th>
                    <th className="p-2 text-right">Principal</th>
                    <th className="p-2 text-right">Interest</th>
                    <th className="p-2 text-right">Closing</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E1E5DC] text-[#24342B]">
                  {schedulePreview.map((row) => (
                    <tr key={row.month} className="hover:bg-[#F0F1E9]/50">
                      <td className="p-2 font-bold">#{row.month}</td>
                      <td className="p-2 text-right font-mono">{formatINR(row.opening)}</td>
                      <td className="p-2 text-right font-mono text-[#287548] font-bold">{formatINR(row.principal)}</td>
                      <td className="p-2 text-right font-mono text-[#B85D4B]">{formatINR(row.interest)}</td>
                      <td className="p-2 text-right font-mono">{formatINR(row.closing)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-[#E1E5DC] bg-[#F0F1E9]">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-[#244A38] hover:bg-[#1a382a] text-white text-xs font-bold transition-all shadow-xs"
          >
            Close Preview
          </button>
        </div>

      </div>
    </div>
  );
};

export default InstantAmortizationModal;
