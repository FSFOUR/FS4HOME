import React, { useState } from 'react';
import { LoanRecord, LoanTransactionType, LoanInterestType, RepaymentFrequency, LoanStatus } from '../../types';
import { generateLoanSchedule, calculateReducingBalanceEMI, formatINR, getTodayDateStr } from '../../services/loanService';

interface AddLoanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (loan: LoanRecord) => void;
  initialLoan?: LoanRecord | null;
}

export const AddLoanModal: React.FC<AddLoanModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialLoan,
}) => {
  const isEditing = Boolean(initialLoan);
  const today = getTodayDateStr();

  const [name, setName] = useState<string>(initialLoan?.name || '');
  const [type, setType] = useState<LoanTransactionType>(initialLoan?.type || 'Borrowed');
  const [partyName, setPartyName] = useState<string>(initialLoan?.partyName || '');
  const [principalAmount, setPrincipalAmount] = useState<number>(initialLoan?.principalAmount || 30000);
  const [interestType, setInterestType] = useState<LoanInterestType>(initialLoan?.interestType || 'No Interest');
  const [interestRate, setInterestRate] = useState<number>(initialLoan?.interestRate || 0);
  const [processingFee, setProcessingFee] = useState<number>(initialLoan?.processingFee || 0);
  const [startDate, setStartDate] = useState<string>(initialLoan?.startDate || today);
  const [firstPaymentDate, setFirstPaymentDate] = useState<string>(initialLoan?.firstPaymentDate || today);
  const [frequency, setFrequency] = useState<RepaymentFrequency>(initialLoan?.frequency || 'Monthly');
  const [numberOfInstallments, setNumberOfInstallments] = useState<number>(initialLoan?.numberOfInstallments || 6);
  const [totalTenureMonths, setTotalTenureMonths] = useState<number>(initialLoan?.totalTenureMonths || 6);
  const [plannedInstallmentAmount, setPlannedInstallmentAmount] = useState<number>(initialLoan?.plannedInstallmentAmount || 5000);
  const [account, setAccount] = useState<string>(initialLoan?.account || 'Bank Account (Primary)');
  const [paymentMethod, setPaymentMethod] = useState<string>(initialLoan?.paymentMethod || 'UPI / GPay');
  const [remarks, setRemarks] = useState<string>(initialLoan?.remarks || '');
  const [status, setStatus] = useState<LoanStatus>(initialLoan?.status || 'Active');

  if (!isOpen) return null;

  // Real-time preview calculation
  let calculatedEMI = 0;
  let estimatedTotalInterest = 0;
  let estimatedTotalPayable = principalAmount + processingFee;

  if (interestType === 'No Interest') {
    calculatedEMI = numberOfInstallments > 0 ? Math.round(principalAmount / numberOfInstallments) : principalAmount;
    estimatedTotalInterest = 0;
    estimatedTotalPayable = principalAmount + processingFee;
  } else if (interestType === 'Reducing Balance / EMI') {
    const res = calculateReducingBalanceEMI(principalAmount, interestRate, totalTenureMonths || numberOfInstallments);
    calculatedEMI = res.emi;
    estimatedTotalInterest = res.totalInterest;
    estimatedTotalPayable = principalAmount + estimatedTotalInterest + processingFee;
  } else if (interestType === 'Simple Interest' || interestType === 'Flat Interest') {
    const tenureYears = (totalTenureMonths || numberOfInstallments) / 12;
    estimatedTotalInterest = Math.round(principalAmount * (interestRate / 100) * tenureYears);
    estimatedTotalPayable = principalAmount + estimatedTotalInterest + processingFee;
    calculatedEMI = numberOfInstallments > 0 ? Math.round(estimatedTotalPayable / numberOfInstallments) : estimatedTotalPayable;
  } else {
    calculatedEMI = plannedInstallmentAmount || Math.round(principalAmount / (numberOfInstallments || 1));
    estimatedTotalPayable = principalAmount + processingFee;
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!partyName.trim()) {
      alert('Please enter a party or lender name');
      return;
    }
    if (principalAmount <= 0) {
      alert('Principal amount must be greater than 0');
      return;
    }

    const loanId = initialLoan?.id || `LN-${Date.now().toString().slice(-4)}`;
    const schedule = generateLoanSchedule({
      principalAmount,
      interestType,
      interestRate: interestType === 'No Interest' ? 0 : interestRate,
      processingFee,
      firstPaymentDate,
      frequency,
      numberOfInstallments,
      totalTenureMonths,
      plannedInstallmentAmount,
    });

    // If editing, preserve any existing paid amounts if schedule matches
    const finalSchedule = initialLoan
      ? schedule.map((inst, idx) => {
          const old = initialLoan.schedule?.[idx];
          if (old && old.amountPaid > 0) {
            return {
              ...inst,
              amountPaid: old.amountPaid,
              remainingAmount: Math.max(0, inst.scheduledAmount - old.amountPaid),
              status: old.status,
              paidDate: old.paidDate,
              paymentMethod: old.paymentMethod,
            };
          }
          return inst;
        })
      : schedule;

    const recordName = name.trim() || `${partyName} ${type === 'Borrowed' ? 'Borrowing' : 'Loan'}`;

    const newLoan: LoanRecord = {
      id: loanId,
      name: recordName,
      type,
      partyName: partyName.trim(),
      principalAmount,
      interestType,
      interestRate: interestType === 'No Interest' ? 0 : interestRate,
      processingFee,
      startDate,
      firstPaymentDate,
      frequency,
      totalTenureMonths,
      numberOfInstallments,
      plannedInstallmentAmount: calculatedEMI,
      account,
      paymentMethod,
      remarks: remarks.trim(),
      status,
      schedule: finalSchedule,
      createdAt: initialLoan?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onSave(newLoan);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[230] flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="w-full max-w-2xl bg-[#072014] border border-lime-500/30 rounded-2xl shadow-2xl overflow-hidden my-auto animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-emerald-500/20 bg-[#05170e]">
          <div>
            <h3 className="text-base font-black text-white flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-lime-400" />
              {isEditing ? 'Edit Loan / Borrowing Record' : 'Add Loan / Borrowing Record'}
            </h3>
            <p className="text-xs text-emerald-300/70">
              Create an independent debt, borrowing, or lent record with dedicated repayment schedule
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-lg text-emerald-400 hover:text-white hover:bg-emerald-900/60 flex items-center justify-center text-sm font-bold transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-4 max-h-[82vh] overflow-y-auto">
          
          {/* Transaction Type Choice */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-emerald-300">
              Transaction Type <span className="text-rose-400">*</span>
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setType('Borrowed')}
                className={`p-3 rounded-xl border text-left transition-all ${
                  type === 'Borrowed'
                    ? 'bg-rose-950/40 border-rose-500 text-white shadow-sm ring-1 ring-rose-500'
                    : 'bg-[#04160c] border-emerald-500/20 text-slate-300 hover:border-emerald-500/40'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-black text-rose-300">Borrowed / Received</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 font-mono">Liability</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-tight">
                  Money I borrowed from bank, friend, or lender. I must repay this amount.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setType('Lent')}
                className={`p-3 rounded-xl border text-left transition-all ${
                  type === 'Lent'
                    ? 'bg-emerald-950/40 border-lime-400 text-white shadow-sm ring-1 ring-lime-400'
                    : 'bg-[#04160c] border-emerald-500/20 text-slate-300 hover:border-emerald-500/40'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-black text-lime-300">Lent / Loan Given</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-lime-500/20 text-lime-300 font-mono">Asset / Receivable</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-tight">
                  Money I gave to another party. They owe me and must repay this amount.
                </p>
              </button>
            </div>
          </div>

          {/* Party & Record Name */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-emerald-200 mb-1">
                Party / Lender / Borrower Name <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Ahmed, Bank A, Friend B"
                value={partyName}
                onChange={(e) => setPartyName(e.target.value)}
                className="w-full px-3 py-2 bg-[#04160c] border border-emerald-500/30 rounded-xl text-white font-medium text-xs outline-none focus:border-lime-400 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-emerald-200 mb-1">
                Record Name / Label (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Personal Borrowing, HDFC EMI Loan"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 bg-[#04160c] border border-emerald-500/30 rounded-xl text-white font-medium text-xs outline-none focus:border-lime-400 transition-colors"
              />
            </div>
          </div>

          {/* Principal & Processing Fee */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-emerald-200 mb-1">
                Principal Amount (₹) <span className="text-rose-400">*</span>
              </label>
              <input
                type="number"
                min="100"
                step="100"
                required
                value={principalAmount}
                onChange={(e) => setPrincipalAmount(Number(e.target.value))}
                className="w-full px-3 py-2 bg-[#04160c] border border-emerald-500/30 rounded-xl text-white font-bold text-xs outline-none focus:border-lime-400 tabular-nums transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-emerald-200 mb-1">
                Processing Fee / Charges (₹)
              </label>
              <input
                type="number"
                min="0"
                step="50"
                value={processingFee}
                onChange={(e) => setProcessingFee(Number(e.target.value))}
                placeholder="0"
                className="w-full px-3 py-2 bg-[#04160c] border border-emerald-500/30 rounded-xl text-white font-medium text-xs outline-none focus:border-lime-400 tabular-nums transition-colors"
              />
              <span className="text-[10px] text-emerald-400/60 mt-0.5 block">Identified separately from principal</span>
            </div>
          </div>

          {/* Interest Type & Rate */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 rounded-xl bg-[#04160c]/60 border border-emerald-500/20">
            <div>
              <label className="block text-xs font-bold text-emerald-200 mb-1">
                Interest Calculation Model
              </label>
              <select
                value={interestType}
                onChange={(e) => setInterestType(e.target.value as LoanInterestType)}
                className="w-full px-3 py-2 bg-[#072014] border border-emerald-500/30 rounded-xl text-white font-medium text-xs outline-none focus:border-lime-400"
              >
                <option value="No Interest">No Interest (0% Friendly Loan)</option>
                <option value="Reducing Balance / EMI">Reducing Balance / Standard EMI</option>
                <option value="Simple Interest">Simple Interest (P × R × T)</option>
                <option value="Flat Interest">Flat Interest</option>
                <option value="Custom Repayment Plan">Custom Repayment Plan</option>
              </select>
            </div>

            {interestType !== 'No Interest' && (
              <div>
                <label className="block text-xs font-bold text-emerald-200 mb-1">
                  Annual Interest Rate (% p.a.)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0.1"
                  max="100"
                  value={interestRate}
                  onChange={(e) => setInterestRate(Number(e.target.value))}
                  placeholder="e.g. 9.5"
                  className="w-full px-3 py-2 bg-[#072014] border border-emerald-500/30 rounded-xl text-white font-bold text-xs outline-none focus:border-lime-400 tabular-nums"
                />
              </div>
            )}
          </div>

          {/* Repayment Frequency & Schedule Duration */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div>
              <label className="block text-[11px] font-bold text-emerald-200 mb-1">
                Frequency
              </label>
              <select
                value={frequency}
                onChange={(e) => setFrequency(e.target.value as RepaymentFrequency)}
                className="w-full px-2.5 py-1.5 bg-[#04160c] border border-emerald-500/30 rounded-xl text-white text-xs outline-none focus:border-lime-400"
              >
                <option value="Monthly">Monthly</option>
                <option value="Weekly">Weekly</option>
                <option value="Fortnightly">Fortnightly</option>
                <option value="Quarterly">Quarterly</option>
                <option value="One-time settlement">One-time settlement</option>
                <option value="Custom dates">Custom dates</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-emerald-200 mb-1">
                Installments Count
              </label>
              <input
                type="number"
                min="1"
                max="360"
                value={numberOfInstallments}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setNumberOfInstallments(val);
                  setTotalTenureMonths(val);
                }}
                className="w-full px-2.5 py-1.5 bg-[#04160c] border border-emerald-500/30 rounded-xl text-white font-bold text-xs outline-none focus:border-lime-400 tabular-nums"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-emerald-200 mb-1">
                Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-2 py-1.5 bg-[#04160c] border border-emerald-500/30 rounded-xl text-white text-xs outline-none focus:border-lime-400"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-emerald-200 mb-1">
                First Payment Date
              </label>
              <input
                type="date"
                value={firstPaymentDate}
                onChange={(e) => setFirstPaymentDate(e.target.value)}
                className="w-full px-2 py-1.5 bg-[#04160c] border border-emerald-500/30 rounded-xl text-white text-xs outline-none focus:border-lime-400"
              />
            </div>
          </div>

          {/* Payment Method & Account */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-emerald-200 mb-1">
                Linked Account
              </label>
              <select
                value={account}
                onChange={(e) => setAccount(e.target.value)}
                className="w-full px-3 py-2 bg-[#04160c] border border-emerald-500/30 rounded-xl text-white text-xs outline-none focus:border-lime-400"
              >
                <option value="Bank Account (Primary)">Bank Account (Primary)</option>
                <option value="Cash in Hand">Cash in Hand</option>
                <option value="UPI / GPay">UPI / GPay</option>
                <option value="Credit Card">Credit Card</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-emerald-200 mb-1">
                Default Payment Method
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full px-3 py-2 bg-[#04160c] border border-emerald-500/30 rounded-xl text-white text-xs outline-none focus:border-lime-400"
              >
                <option value="UPI / GPay">UPI / GPay</option>
                <option value="Bank Transfer / NEFT">Bank Transfer / NEFT</option>
                <option value="Auto Debit / ECS">Auto Debit / ECS</option>
                <option value="Cash">Cash</option>
                <option value="Cheque">Cheque</option>
                <option value="Net Banking">Net Banking</option>
              </select>
            </div>
          </div>

          {/* Remarks */}
          <div>
            <label className="block text-xs font-bold text-emerald-200 mb-1">
              Remarks & Terms
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Purpose, mutual terms, guarantor or reference notes"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              className="w-full px-3 py-2 bg-[#04160c] border border-emerald-500/30 rounded-xl text-white text-xs outline-none focus:border-lime-400 resize-none"
            />
          </div>

          {/* Live Schedule Calculation Summary Preview */}
          <div className="p-3.5 rounded-xl bg-gradient-to-r from-emerald-950/80 via-[#062415] to-emerald-950/80 border border-emerald-500/30">
            <div className="text-[11px] font-bold text-emerald-300 uppercase tracking-wider mb-2 flex items-center justify-between">
              <span>Automatic Schedule Projection</span>
              <span className="text-[10px] text-lime-400 font-mono">{numberOfInstallments} payments ({frequency})</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
              <div className="p-2 rounded-lg bg-[#03140a]/70">
                <div className="text-[10px] text-slate-400 font-medium">Principal</div>
                <div className="text-sm font-black text-white tabular-nums">{formatINR(principalAmount)}</div>
              </div>
              <div className="p-2 rounded-lg bg-[#03140a]/70">
                <div className="text-[10px] text-slate-400 font-medium">Total Interest</div>
                <div className="text-sm font-black text-amber-300 tabular-nums">
                  {estimatedTotalInterest > 0 ? formatINR(estimatedTotalInterest) : '₹0 (0%)'}
                </div>
              </div>
              <div className="p-2 rounded-lg bg-[#03140a]/70">
                <div className="text-[10px] text-slate-400 font-medium">Planned Installment</div>
                <div className="text-sm font-black text-lime-400 tabular-nums">{formatINR(calculatedEMI)}/mo</div>
              </div>
              <div className="p-2 rounded-lg bg-[#03140a]/70">
                <div className="text-[10px] text-slate-400 font-medium">Total Payable</div>
                <div className="text-sm font-black text-white tabular-nums">{formatINR(estimatedTotalPayable)}</div>
              </div>
            </div>
          </div>

          {/* Footer Controls */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-emerald-500/20">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-300 hover:text-white bg-emerald-950/40 hover:bg-emerald-900/60 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-black text-emerald-950 bg-lime-400 hover:bg-lime-300 rounded-xl shadow-lg transition-colors flex items-center gap-1.5"
            >
              <span>{isEditing ? 'Save Changes' : '+ Create Loan Record'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
