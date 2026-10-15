import React, { useState } from 'react';
import { LoanRecord, LoanPayment, RepaymentInstallment } from '../../types';
import { calculateLoanSummary, recalculateLoanSchedule, formatINR } from '../../services/loanService';

interface LoanDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  loan: LoanRecord | null;
  allPayments: LoanPayment[];
  onRecordPayment: (loanId: string, installmentNumber?: number) => void;
  onEditLoan: (loan: LoanRecord) => void;
  onToggleStatus: (loanId: string, newStatus: 'Active' | 'Closed' | 'Archived') => void;
  onDeleteLoan: (loanId: string) => void;
  onDeletePayment: (paymentId: string) => void;
}

export const LoanDetailModal: React.FC<LoanDetailModalProps> = ({
  isOpen,
  onClose,
  loan,
  allPayments,
  onRecordPayment,
  onEditLoan,
  onToggleStatus,
  onDeleteLoan,
  onDeletePayment,
}) => {
  const [activeTab, setActiveTab] = useState<'schedule' | 'history'>('schedule');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<boolean>(false);

  if (!isOpen || !loan) return null;

  const summary = calculateLoanSummary(loan, allPayments);
  const schedule = recalculateLoanSchedule(loan, allPayments);
  const loanPayments = allPayments
    .filter((p) => p.loanId === loan.id)
    .sort((a, b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime());

  const handleExportCSV = () => {
    const headers = [
      'Installment #',
      'Due Date',
      'Scheduled (₹)',
      'Principal (₹)',
      'Interest (₹)',
      'Fees (₹)',
      'Paid (₹)',
      'Remaining (₹)',
      'Status',
      'Paid Date',
      'Payment Method',
    ];

    const rows = schedule.map((inst) => [
      inst.installmentNumber,
      inst.dueDate,
      inst.scheduledAmount,
      inst.principalComponent,
      inst.interestComponent,
      inst.feesComponent || 0,
      inst.amountPaid,
      inst.remainingAmount,
      inst.status,
      inst.paidDate || '',
      inst.paymentMethod || '',
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${loan.partyName.replace(/\s+/g, '_')}_Schedule.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-[230] flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="w-full max-w-4xl bg-[#072014] border border-lime-500/30 rounded-2xl shadow-2xl overflow-hidden my-auto animate-in zoom-in-95 duration-200">
        
        {/* Top Header Bar */}
        <div className="px-5 py-4 border-b border-emerald-500/20 bg-[#05170e] flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm ${
              loan.type === 'Borrowed' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' : 'bg-lime-400/20 text-lime-400 border border-lime-400/30'
            }`}>
              {loan.type === 'Borrowed' ? 'BOR' : 'LNT'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-white">{loan.partyName}</h2>
                <span className="text-xs text-slate-400 font-medium">· {loan.name}</span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  loan.status === 'Active'
                    ? 'bg-lime-400/20 text-lime-300 border border-lime-400/30'
                    : loan.status === 'Closed'
                    ? 'bg-slate-700/40 text-slate-300 border border-slate-600'
                    : 'bg-amber-400/20 text-amber-300 border border-amber-400/30'
                }`}>
                  {loan.status}
                </span>
              </div>
              <p className="text-xs text-emerald-300/70">
                {loan.type === 'Borrowed' ? 'Money Borrowed (Liability)' : 'Money Lent (Receivable)'} · {loan.interestType} {loan.interestRate > 0 ? `(${loan.interestRate}% p.a.)` : ''}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onRecordPayment(loan.id)}
              className="px-3.5 py-1.5 text-xs font-black text-emerald-950 bg-lime-400 hover:bg-lime-300 rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
            >
              <span>+ Record Payment</span>
            </button>
            <button
              onClick={() => onEditLoan(loan)}
              className="px-3 py-1.5 text-xs font-bold text-slate-200 hover:text-white bg-emerald-950/60 hover:bg-emerald-900 rounded-lg border border-emerald-500/30 transition-colors"
            >
              Edit
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg text-emerald-400 hover:text-white hover:bg-emerald-900/60 flex items-center justify-center text-sm font-bold transition-colors"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-5 space-y-5 max-h-[80vh] overflow-y-auto">
          
          {/* Prominent Outstanding Amount Hero */}
          <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-emerald-950/90 via-[#062415] to-emerald-950/90 border border-lime-500/30 shadow-lg">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-300">
                  {loan.type === 'Borrowed' ? 'Current Outstanding Balance (To Repay)' : 'Current Outstanding Balance (To Recover)'}
                </span>
                <div className="text-3xl sm:text-4xl font-black text-lime-400 tracking-tight tabular-nums mt-1">
                  {formatINR(summary.outstandingBalance)}
                </div>
                <div className="text-xs text-slate-400 mt-1 flex items-center gap-2">
                  <span>Principal Remaining: <strong className="text-white font-mono">{formatINR(summary.principalOutstanding)}</strong></span>
                  <span>·</span>
                  <span>Total Payable: <strong className="text-white font-mono">{formatINR(summary.totalPayable)}</strong></span>
                </div>
              </div>

              {/* Progress pill & metrics */}
              <div className="sm:text-right min-w-[200px]">
                <div className="flex items-center sm:justify-end gap-2 text-xs font-bold mb-1">
                  <span className="text-slate-300">Repayment Progress:</span>
                  <span className="text-lime-400 font-mono text-sm">{summary.progressPercentage}%</span>
                </div>
                {/* Progress bar */}
                <div className="w-full bg-[#03130a] rounded-full h-2.5 overflow-hidden border border-emerald-500/30">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-500 via-lime-400 to-lime-300 rounded-full transition-all duration-500"
                    style={{ width: `${summary.progressPercentage}%` }}
                  />
                </div>
                <div className="flex items-center sm:justify-end gap-3 text-[11px] text-slate-400 mt-1.5 tabular-nums">
                  <span>Paid: <strong className="text-lime-300 font-mono">{formatINR(summary.totalPaid)}</strong></span>
                  <span>Remaining: <strong className="text-rose-300 font-mono">{formatINR(summary.outstandingBalance)}</strong></span>
                </div>
              </div>
            </div>

            {/* Next Payment Banner */}
            {summary.nextPayment && (
              <div className="mt-4 pt-3 border-t border-emerald-500/20 flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-slate-400">Next Installment #{summary.nextPayment.installmentNumber}:</span>
                  <span className="font-bold text-white font-mono">{formatINR(summary.nextPayment.remainingAmount)}</span>
                  <span className="text-slate-400">due on</span>
                  <span className={`font-bold font-mono px-2 py-0.5 rounded ${
                    summary.nextPayment.status === 'Overdue' ? 'bg-rose-500/20 text-rose-300' : 'bg-lime-500/20 text-lime-300'
                  }`}>
                    {summary.nextPayment.dueDate} ({summary.nextPayment.status})
                  </span>
                </div>
                <button
                  onClick={() => onRecordPayment(loan.id, summary.nextPayment?.installmentNumber)}
                  className="text-xs font-bold text-lime-400 hover:text-lime-300 underline"
                >
                  Pay Next Installment Now →
                </button>
              </div>
            )}
          </div>

          {/* Loan Configuration Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
            <div className="p-3 rounded-xl bg-[#04160c] border border-emerald-500/20">
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Original Principal</span>
              <span className="text-sm font-bold text-white font-mono">{formatINR(loan.principalAmount)}</span>
            </div>
            <div className="p-3 rounded-xl bg-[#04160c] border border-emerald-500/20">
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Interest & Fees</span>
              <span className="text-sm font-bold text-amber-300 font-mono">
                {formatINR(summary.totalInterest + summary.totalFees)}
              </span>
            </div>
            <div className="p-3 rounded-xl bg-[#04160c] border border-emerald-500/20">
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Payment Frequency</span>
              <span className="text-sm font-bold text-white">{loan.frequency}</span>
            </div>
            <div className="p-3 rounded-xl bg-[#04160c] border border-emerald-500/20">
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Linked Account</span>
              <span className="text-sm font-bold text-white truncate block">{loan.account || 'Primary Bank'}</span>
            </div>
          </div>

          {loan.remarks && (
            <div className="p-3 rounded-xl bg-[#04160c]/50 border border-emerald-500/15 text-xs text-slate-300">
              <span className="font-bold text-emerald-300 mr-1.5">Remarks / Notes:</span>
              {loan.remarks}
            </div>
          )}

          {/* Tabs: Repayment Schedule vs Payment History */}
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-emerald-500/20 pb-2">
              <div className="flex gap-2">
                <button
                  onClick={() => setActiveTab('schedule')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                    activeTab === 'schedule'
                      ? 'bg-lime-400 text-emerald-950 font-black'
                      : 'bg-emerald-950/60 text-emerald-300 hover:bg-emerald-900'
                  }`}
                >
                  Repayment Schedule ({schedule.length})
                </button>
                <button
                  onClick={() => setActiveTab('history')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                    activeTab === 'history'
                      ? 'bg-lime-400 text-emerald-950 font-black'
                      : 'bg-emerald-950/60 text-emerald-300 hover:bg-emerald-900'
                  }`}
                >
                  Payment History ({loanPayments.length})
                </button>
              </div>

              {activeTab === 'schedule' && (
                <button
                  onClick={handleExportCSV}
                  className="px-2.5 py-1 rounded-lg text-[11px] font-bold text-emerald-300 hover:text-white bg-emerald-950/40 hover:bg-emerald-900 border border-emerald-500/30 flex items-center gap-1 transition-colors"
                >
                  <span>📥 Export CSV</span>
                </button>
              )}
            </div>

                        {/* Tab 1: Repayment Schedule Table */}
            {activeTab === 'schedule' && (
              <div>
                {/* Mobile Card View (No Horizontal Scrolling) */}
                <div className="block sm:hidden space-y-2.5">
                  {schedule.map((inst) => {
                    const isPaid = inst.status === 'Paid';
                    const isOverdue = inst.status === 'Overdue';

                    return (
                      <div
                        key={inst.id}
                        className={`p-3 rounded-xl border bg-[#04160c] space-y-2 ${
                          isOverdue
                            ? 'border-rose-500/40 bg-rose-950/20'
                            : isPaid
                            ? 'border-emerald-500/20 opacity-80'
                            : 'border-emerald-500/30'
                        }`}
                      >
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-lime-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-500/30">
                              #{inst.installmentNumber}
                            </span>
                            <span className="font-mono text-slate-300">{inst.dueDate}</span>
                          </div>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              isPaid
                                ? 'bg-lime-400/20 text-lime-300 border border-lime-400/30'
                                : isOverdue
                                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                                : inst.status === 'Partially Paid'
                                ? 'bg-amber-400/20 text-amber-300 border border-amber-400/30'
                                : 'bg-slate-700/30 text-slate-300 border border-slate-600/40'
                            }`}
                          >
                            {inst.status}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-2 pt-1 border-t border-emerald-500/10 text-xs tabular-nums">
                          <div>
                            <span className="text-[10px] text-slate-400 block uppercase">Scheduled</span>
                            <span className="font-bold text-white">{formatINR(inst.scheduledAmount + (inst.feesComponent || 0))}</span>
                          </div>
                          <div className="text-right">
                            <span className="text-[10px] text-slate-400 block uppercase">Remaining</span>
                            <span className="font-bold text-slate-200">{formatINR(inst.remainingAmount)}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 block uppercase">Prin / Int</span>
                            <span className="text-slate-300 text-[11px]">{formatINR(inst.principalComponent)} / <span className="text-amber-300">{formatINR(inst.interestComponent)}</span></span>
                          </div>
                          <div className="text-right flex items-center justify-end">
                            {!isPaid ? (
                              <button
                                onClick={() => onRecordPayment(loan.id, inst.installmentNumber)}
                                className="px-3 py-1 text-[11px] font-bold text-emerald-950 bg-lime-400 hover:bg-lime-300 rounded-lg shadow-sm transition-colors"
                              >
                                Pay Now
                              </button>
                            ) : (
                              <span className="text-[11px] text-emerald-400 font-bold">✓ Settled</span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Desktop/Tablet Compact Table View */}
                <div className="hidden sm:block overflow-x-auto rounded-xl border border-emerald-500/20 bg-[#04160c]">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-emerald-500/20 bg-[#03130a] text-slate-400 font-bold uppercase text-[10px]">
                        <th className="py-2.5 px-3">#</th>
                        <th className="py-2.5 px-3">Due Date</th>
                        <th className="py-2.5 px-3 text-right">Scheduled</th>
                        <th className="py-2.5 px-3 text-right">Principal</th>
                        <th className="py-2.5 px-3 text-right">Interest</th>
                        <th className="py-2.5 px-3 text-right">Paid</th>
                        <th className="py-2.5 px-3 text-right">Remaining</th>
                        <th className="py-2.5 px-3 text-center">Status</th>
                        <th className="py-2.5 px-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-emerald-500/10 tabular-nums">
                      {schedule.map((inst) => {
                        const isPaid = inst.status === 'Paid';
                        const isOverdue = inst.status === 'Overdue';

                        return (
                          <tr
                            key={inst.id}
                            className={`hover:bg-emerald-950/30 transition-colors ${
                              isOverdue ? 'bg-rose-950/15' : ''
                            }`}
                          >
                            <td className="py-2 px-3 font-mono font-bold text-slate-400">
                              {inst.installmentNumber}
                            </td>
                            <td className="py-2 px-3 font-mono text-white">
                              {inst.dueDate}
                            </td>
                            <td className="py-2 px-3 text-right font-bold text-white">
                              {formatINR(inst.scheduledAmount + (inst.feesComponent || 0))}
                            </td>
                            <td className="py-2 px-3 text-right text-slate-300">
                              {formatINR(inst.principalComponent)}
                            </td>
                            <td className="py-2 px-3 text-right text-amber-300">
                              {formatINR(inst.interestComponent)}
                            </td>
                            <td className="py-2 px-3 text-right text-lime-400 font-bold">
                              {formatINR(inst.amountPaid)}
                            </td>
                            <td className="py-2 px-3 text-right font-bold text-slate-200">
                              {formatINR(inst.remainingAmount)}
                            </td>
                            <td className="py-2 px-3 text-center">
                              <span
                                className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                                  isPaid
                                    ? 'bg-lime-400/20 text-lime-300 border border-lime-400/30'
                                    : isOverdue
                                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                                    : inst.status === 'Partially Paid'
                                    ? 'bg-amber-400/20 text-amber-300 border border-amber-400/30'
                                    : 'bg-slate-700/30 text-slate-300 border border-slate-600/40'
                                }`}
                              >
                                {inst.status}
                              </span>
                            </td>
                            <td className="py-2 px-3 text-right">
                              {!isPaid && (
                                <button
                                  onClick={() => onRecordPayment(loan.id, inst.installmentNumber)}
                                  className="px-2 py-1 text-[10px] font-bold text-emerald-950 bg-lime-400 hover:bg-lime-300 rounded transition-colors"
                                >
                                  Pay
                                </button>
                              )}
                              {isPaid && (
                                <span className="text-[10px] text-emerald-400/70">✓ Settled</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Tab 2: Payment History Table */}
            {activeTab === 'history' && (
              <div className="space-y-3">
                {loanPayments.length === 0 ? (
                  <div className="p-8 text-center bg-[#04160c] rounded-xl border border-emerald-500/20 text-slate-400 text-xs">
                    No payments recorded for this loan yet. Click "+ Record Payment" to log your first payment.
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-xl border border-emerald-500/20 bg-[#04160c]">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-emerald-500/20 bg-[#03130a] text-slate-400 font-bold uppercase text-[10px]">
                          <th className="py-2.5 px-3">Date</th>
                          <th className="py-2.5 px-3 text-right">Amount</th>
                          <th className="py-2.5 px-3 text-right">Principal</th>
                          <th className="py-2.5 px-3 text-right">Interest</th>
                          <th className="py-2.5 px-3">Method</th>
                          <th className="py-2.5 px-3">Account</th>
                          <th className="py-2.5 px-3">Ref</th>
                          <th className="py-2.5 px-3 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-emerald-500/10 tabular-nums">
                        {loanPayments.map((p) => (
                          <tr key={p.id} className="hover:bg-emerald-950/30 transition-colors">
                            <td className="py-2 px-3 font-mono text-white">{p.paymentDate}</td>
                            <td className="py-2 px-3 text-right font-bold text-lime-400">{formatINR(p.amount)}</td>
                            <td className="py-2 px-3 text-right text-slate-300">{formatINR(p.principalComponent)}</td>
                            <td className="py-2 px-3 text-right text-amber-300">{formatINR(p.interestComponent)}</td>
                            <td className="py-2 px-3 text-slate-300">{p.paymentMethod}</td>
                            <td className="py-2 px-3 text-slate-400 truncate max-w-[120px]">{p.account}</td>
                            <td className="py-2 px-3 text-slate-400 font-mono text-[11px]">{p.receiptReference || '—'}</td>
                            <td className="py-2 px-3 text-right">
                              <button
                                onClick={() => {
                                  if (confirm(`Delete payment of ${formatINR(p.amount)} recorded on ${p.paymentDate}? Outstanding balance will be updated automatically.`)) {
                                    onDeletePayment(p.id);
                                  }
                                }}
                                className="text-rose-400 hover:text-rose-300 text-xs font-bold"
                              >
                                Delete
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Action Row: Archive, Close, Delete */}
          <div className="pt-4 border-t border-emerald-500/20 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              {loan.status === 'Active' ? (
                <>
                  <button
                    onClick={() => onToggleStatus(loan.id, 'Closed')}
                    className="px-3 py-1.5 rounded-lg text-slate-300 hover:text-white bg-emerald-950/50 hover:bg-emerald-900 border border-emerald-500/30 font-bold transition-colors"
                  >
                    Mark as Closed
                  </button>
                  <button
                    onClick={() => onToggleStatus(loan.id, 'Archived')}
                    className="px-3 py-1.5 rounded-lg text-amber-300 hover:text-amber-200 bg-amber-950/30 hover:bg-amber-900/50 border border-amber-500/30 font-bold transition-colors"
                  >
                    Archive Record
                  </button>
                </>
              ) : (
                <button
                  onClick={() => onToggleStatus(loan.id, 'Active')}
                  className="px-3 py-1.5 rounded-lg text-lime-400 hover:text-lime-300 bg-emerald-950 border border-lime-400/40 font-bold transition-colors"
                >
                  Reopen as Active
                </button>
              )}
            </div>

            <div>
              {!showDeleteConfirm ? (
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="text-rose-400 hover:text-rose-300 font-bold underline"
                >
                  Delete Loan Record
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="text-rose-300 font-bold">Confirm delete?</span>
                  <button
                    onClick={() => {
                      onDeleteLoan(loan.id);
                      onClose();
                    }}
                    className="px-2.5 py-1 rounded bg-rose-600 hover:bg-rose-500 text-white font-bold"
                  >
                    Yes, Delete
                  </button>
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    className="px-2 py-1 rounded bg-slate-700 text-slate-200"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
