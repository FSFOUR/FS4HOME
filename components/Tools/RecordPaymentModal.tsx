import React, { useState, useEffect } from 'react';
import { LoanRecord, LoanPayment, LoanTransactionType } from '../../types';
import { calculateLoanSummary, recalculateLoanSchedule, formatINR, getTodayDateStr } from '../../services/loanService';

interface RecordPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  loans: LoanRecord[];
  allPayments: LoanPayment[];
  selectedLoanId?: string;
  onSavePayment: (payment: LoanPayment, syncToTransactions?: boolean) => void;
}

export const RecordPaymentModal: React.FC<RecordPaymentModalProps> = ({
  isOpen,
  onClose,
  loans,
  allPayments,
  selectedLoanId,
  onSavePayment,
}) => {
  const activeLoans = loans.filter((l) => l.status !== 'Archived');
  const [loanId, setLoanId] = useState<string>(selectedLoanId || (activeLoans[0]?.id || ''));
  const today = getTodayDateStr();

  const selectedLoan = loans.find((l) => l.id === loanId);
  const loanSummary = selectedLoan ? calculateLoanSummary(selectedLoan, allPayments) : null;
  const schedule = selectedLoan ? recalculateLoanSchedule(selectedLoan, allPayments) : [];

  // Next due installment
  const nextInstallment = schedule.find((i) => i.status !== 'Paid');

  const [paymentDate, setPaymentDate] = useState<string>(today);
  const [amount, setAmount] = useState<number>(nextInstallment ? nextInstallment.remainingAmount : 5000);
  const [partyName, setPartyName] = useState<string>(selectedLoan?.partyName || '');
  const [type, setType] = useState<LoanTransactionType>(selectedLoan?.type || 'Borrowed');
  const [installmentNumber, setInstallmentNumber] = useState<number | undefined>(nextInstallment?.installmentNumber);

  // Auto-calculated split
  const [isManualSplit, setIsManualSplit] = useState<boolean>(false);
  const [principalComp, setPrincipalComp] = useState<number>(0);
  const [interestComp, setInterestComp] = useState<number>(0);
  const [feesComp, setFeesComp] = useState<number>(0);

  const [paymentMethod, setPaymentMethod] = useState<string>(selectedLoan?.paymentMethod || 'UPI / GPay');
  const [account, setAccount] = useState<string>(selectedLoan?.account || 'Bank Account (Primary)');
  const [receiptReference, setReceiptReference] = useState<string>('');
  const [remarks, setRemarks] = useState<string>('');
  const [syncToLedger, setSyncToLedger] = useState<boolean>(false);

  // Update when selectedLoan changes
  useEffect(() => {
    if (selectedLoan) {
      setPartyName(selectedLoan.partyName);
      setType(selectedLoan.type);
      setPaymentMethod(selectedLoan.paymentMethod || 'UPI / GPay');
      setAccount(selectedLoan.account || 'Bank Account (Primary)');
      
      const nextInst = schedule.find((i) => i.status !== 'Paid');
      if (nextInst) {
        setAmount(nextInst.remainingAmount);
        setInstallmentNumber(nextInst.installmentNumber);
      } else {
        setAmount(loanSummary ? loanSummary.outstandingBalance : 0);
        setInstallmentNumber(undefined);
      }
    }
  }, [loanId, selectedLoanId]);

  // Compute breakdown automatically based on target installment or waterfall
  useEffect(() => {
    if (!isManualSplit) {
      if (nextInstallment && amount === nextInstallment.remainingAmount) {
        setFeesComp(nextInstallment.feesComponent || 0);
        setInterestComp(nextInstallment.interestComponent || 0);
        setPrincipalComp(nextInstallment.principalComponent || 0);
      } else {
        // Simple allocation: fees -> interest -> principal
        const feeEst = 0;
        const interestEst = selectedLoan?.interestRate ? Math.round(amount * (selectedLoan.interestRate / 100 / 12)) : 0;
        const principalEst = Math.max(0, amount - interestEst - feeEst);
        setFeesComp(feeEst);
        setInterestComp(interestEst);
        setPrincipalComp(principalEst);
      }
    }
  }, [amount, loanId, isManualSplit, nextInstallment]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedLoan) {
      alert('Please select a valid loan');
      return;
    }
    if (amount <= 0) {
      alert('Payment amount must be greater than 0');
      return;
    }

    const newPayment: LoanPayment = {
      id: `pmt-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      loanId: selectedLoan.id,
      paymentDate,
      amount,
      partyName: partyName || selectedLoan.partyName,
      type: selectedLoan.type,
      principalComponent: principalComp,
      interestComponent: interestComp,
      feesComponent: feesComp,
      paymentMethod,
      account,
      installmentNumber,
      remarks: remarks.trim(),
      receiptReference: receiptReference.trim(),
      syncToTransactions: syncToLedger,
      createdAt: new Date().toISOString(),
    };

    onSavePayment(newPayment, syncToLedger);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[235] flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="w-full max-w-xl bg-[#072014] border border-lime-500/30 rounded-2xl shadow-2xl overflow-hidden my-auto animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-emerald-500/20 bg-[#05170e]">
          <div>
            <h3 className="text-base font-black text-white flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-lime-400" />
              Record Loan Payment
            </h3>
            <p className="text-xs text-emerald-300/70">
              Confirm payment allocation and automatically reduce the loan's outstanding balance
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
          
          {/* Loan Record Selector */}
          <div>
            <label className="block text-xs font-bold text-emerald-200 mb-1">
              Select Loan Record <span className="text-rose-400">*</span>
            </label>
            <select
              value={loanId}
              onChange={(e) => setLoanId(e.target.value)}
              className="w-full px-3 py-2 bg-[#04160c] border border-emerald-500/30 rounded-xl text-white font-bold text-xs outline-none focus:border-lime-400"
            >
              {activeLoans.map((loan) => {
                const s = calculateLoanSummary(loan, allPayments);
                return (
                  <option key={loan.id} value={loan.id}>
                    [{loan.type === 'Borrowed' ? 'Borrowed' : 'Lent'}] {loan.partyName} — {loan.name} (Outstanding: {formatINR(s.outstandingBalance)})
                  </option>
                );
              })}
            </select>
          </div>

          {/* Quick Context Pill */}
          {selectedLoan && loanSummary && (
            <div className="p-3 rounded-xl bg-[#04160c]/80 border border-emerald-500/20 flex flex-wrap items-center justify-between gap-2 text-xs">
              <div>
                <span className="text-slate-400 font-medium">Party: </span>
                <span className="font-bold text-white">{selectedLoan.partyName}</span>
                <span className="mx-2 text-emerald-500/40">·</span>
                <span className="text-slate-400 font-medium">Type: </span>
                <span className={selectedLoan.type === 'Borrowed' ? 'text-rose-300 font-bold' : 'text-lime-300 font-bold'}>
                  {selectedLoan.type === 'Borrowed' ? 'Repaying Liability' : 'Receiving Recovery'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 font-medium">Outstanding: </span>
                <span className="font-mono font-bold text-lime-400">{formatINR(loanSummary.outstandingBalance)}</span>
              </div>
            </div>
          )}

          {/* Payment Amount & Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-emerald-200 mb-1">
                Amount Paid (₹) <span className="text-rose-400">*</span>
              </label>
              <input
                type="number"
                min="1"
                step="1"
                required
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="w-full px-3 py-2 bg-[#04160c] border border-emerald-500/30 rounded-xl text-white font-bold text-sm outline-none focus:border-lime-400 tabular-nums"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-emerald-200 mb-1">
                Payment Date
              </label>
              <input
                type="date"
                required
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                className="w-full px-3 py-2 bg-[#04160c] border border-emerald-500/30 rounded-xl text-white text-xs outline-none focus:border-lime-400"
              />
            </div>
          </div>

          {/* Installment Association */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-emerald-200 mb-1">
                Target Installment (Optional)
              </label>
              <select
                value={installmentNumber || ''}
                onChange={(e) => setInstallmentNumber(e.target.value ? Number(e.target.value) : undefined)}
                className="w-full px-3 py-2 bg-[#04160c] border border-emerald-500/30 rounded-xl text-white text-xs outline-none focus:border-lime-400"
              >
                <option value="">Auto-allocate across oldest pending</option>
                {schedule.map((inst) => (
                  <option key={inst.id} value={inst.installmentNumber}>
                    Installment #{inst.installmentNumber} — Due {inst.dueDate} ({formatINR(inst.remainingAmount)} left) [{inst.status}]
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-emerald-200 mb-1">
                Receipt Reference / UTR
              </label>
              <input
                type="text"
                placeholder="e.g. UPI-92847291 / Cheque #1029"
                value={receiptReference}
                onChange={(e) => setReceiptReference(e.target.value)}
                className="w-full px-3 py-2 bg-[#04160c] border border-emerald-500/30 rounded-xl text-white text-xs outline-none focus:border-lime-400"
              />
            </div>
          </div>

          {/* Payment Split & Allocation */}
          <div className="p-3 rounded-xl bg-[#04160c]/60 border border-emerald-500/20 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-300">Allocation Breakdown</span>
              <button
                type="button"
                onClick={() => setIsManualSplit(!isManualSplit)}
                className="text-[10px] font-bold text-lime-400 hover:text-lime-300 underline"
              >
                {isManualSplit ? 'Reset to Auto Allocation' : 'Custom Split'}
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2 text-xs">
              <div>
                <label className="block text-[10px] text-slate-400 mb-1">Principal (₹)</label>
                <input
                  type="number"
                  min="0"
                  disabled={!isManualSplit}
                  value={principalComp}
                  onChange={(e) => setPrincipalComp(Number(e.target.value))}
                  className="w-full px-2 py-1.5 bg-[#072014] border border-emerald-500/30 rounded-lg text-white font-mono text-xs disabled:opacity-80"
                />
              </div>
              <div>
                <label className="block text-[10px] text-slate-400 mb-1">Interest (₹)</label>
                <input
                  type="number"
                  min="0"
                  disabled={!isManualSplit}
                  value={interestComp}
                  onChange={(e) => setInterestComp(Number(e.target.value))}
                  className="w-full px-2 py-1.5 bg-[#072014] border border-emerald-500/30 rounded-lg text-white font-mono text-xs disabled:opacity-80"
                />
              </div>
              <div>
                <label className="block text-[10px] text-slate-400 mb-1">Fees/Charges (₹)</label>
                <input
                  type="number"
                  min="0"
                  disabled={!isManualSplit}
                  value={feesComp}
                  onChange={(e) => setFeesComp(Number(e.target.value))}
                  className="w-full px-2 py-1.5 bg-[#072014] border border-emerald-500/30 rounded-lg text-white font-mono text-xs disabled:opacity-80"
                />
              </div>
            </div>
          </div>

          {/* Payment Method & Account */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-emerald-200 mb-1">
                Payment Method
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

            <div>
              <label className="block text-xs font-bold text-emerald-200 mb-1">
                Account
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
          </div>

          {/* Remarks */}
          <div>
            <label className="block text-xs font-bold text-emerald-200 mb-1">
              Remarks
            </label>
            <input
              type="text"
              placeholder="e.g. Paid online, installment cleared"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              className="w-full px-3 py-2 bg-[#04160c] border border-emerald-500/30 rounded-xl text-white text-xs outline-none focus:border-lime-400"
            />
          </div>

          {/* Ledger Sync Option */}
          <label className="flex items-center gap-2 p-3 rounded-xl bg-[#04160c] border border-emerald-500/20 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={syncToLedger}
              onChange={(e) => setSyncToLedger(e.target.checked)}
              className="w-4 h-4 rounded text-lime-400 bg-emerald-950 border-emerald-500 focus:ring-0"
            />
            <div className="text-xs">
              <span className="font-bold text-white">Record as General Transaction in FS4HOME Ledger</span>
              <p className="text-[11px] text-emerald-400/70">
                Adds a corresponding {selectedLoan?.type === 'Borrowed' ? 'Debt Payment Expense' : 'Income / Asset Recovery'} entry in Transactions
              </p>
            </div>
          </label>

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
              <span>+ Confirm & Record Payment</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
