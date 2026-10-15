import React from 'react';
import { AppState, Transaction } from '../types';
import { LoanBorrowingManager } from './Tools/LoanBorrowingManager';

export interface LoansProps {
  state?: AppState;
  onUpdateState?: React.Dispatch<React.SetStateAction<AppState>>;
  onShowToast?: (msg: string) => void;
  onAddTransaction?: (tx: Omit<Transaction, 'id'>) => void;
  isPage?: boolean;
}

/**
 * Loans Component integrated into the Finance section of FS4HOME
 * Houses:
 * - Top Summary (Total Outstanding, Due This Month, Total Paid, Overdue, Active Loans)
 * - Tabs: 'Loan Calculator', 'My Borrowings', 'Money Lent', 'EMI Schedule', 'Repayment History'
 * - Complete loan management, EMI schedules, repayment tracking, and Indian Rupee (₹) calculations
 */
export const Loans: React.FC<LoansProps> = (props) => {
  return <LoanBorrowingManager {...props} isPage={props.isPage !== undefined ? props.isPage : true} />;
};

export default Loans;
