import { db } from '@/lib/firebase';
import { 
  collection, 
  doc, 
  addDoc, 
  getDoc, 
  getDocs, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  writeBatch, 
  Timestamp,
  increment
} from 'firebase/firestore';

export type LoanType = 'given' | 'taken';
export type LoanStatus = 'pending' | 'paid';

export interface Loan {
  id?: string;
  personName: string;
  amount: number;
  type: LoanType;
  date: Date;
  status: LoanStatus;
  createdAt?: Date;
}

export const fetchLoans = async (userId: string) => {
  const q = query(
    collection(db, 'users', userId, 'loans'),
    orderBy('createdAt', 'desc')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      date: data.date.toDate(),
      createdAt: data.createdAt?.toDate(),
    } as Loan;
  });
};

export const addLoan = async (userId: string, loan: Loan) => {
  const batch = writeBatch(db);
  
  // 1. Add Loan
  const newLoanRef = doc(collection(db, 'users', userId, 'loans'));
  batch.set(newLoanRef, {
    ...loan,
    date: Timestamp.fromDate(loan.date),
    createdAt: Timestamp.now(),
  });

  // 2. Update Balances (Only Loan Tracking, NOT Cash/GPay)
  const balanceRef = doc(db, 'users', userId, 'balances', 'current');
  const update: any = { lastUpdated: Timestamp.now() };

  if (loan.type === 'given') {
    update.loansReceivable = increment(loan.amount);
  } else {
    update.loansPayable = increment(loan.amount);
  }

  batch.update(balanceRef, update);
  await batch.commit();
  return newLoanRef.id;
};

export const markLoanPaid = async (userId: string, loan: Loan) => {
  if (!loan.id) return;
  const batch = writeBatch(db);
  
  // 1. Update Loan Status
  const loanRef = doc(db, 'users', userId, 'loans', loan.id);
  batch.update(loanRef, { status: 'paid' });

  // 2. Update Balances (Reverse Loan Tracking)
  const balanceRef = doc(db, 'users', userId, 'balances', 'current');
  const update: any = { lastUpdated: Timestamp.now() };

  if (loan.type === 'given') {
    update.loansReceivable = increment(-loan.amount);
  } else {
    update.loansPayable = increment(-loan.amount);
  }

  batch.update(balanceRef, update);
  await batch.commit();
};
