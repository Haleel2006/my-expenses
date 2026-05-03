import { db } from '@/lib/firebase';
import { collection, doc, addDoc, getDoc, getDocs, updateDoc, deleteDoc, query, where, orderBy, Timestamp } from 'firebase/firestore';

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
  // 1. Add Loan
  const docRef = await addDoc(collection(db, 'users', userId, 'loans'), {
    ...loan,
    date: Timestamp.fromDate(loan.date),
    createdAt: Timestamp.now(),
  });

  return docRef.id;
};

export const markLoanPaid = async (userId: string, loanId: string) => {
  const loanRef = doc(db, 'users', userId, 'loans', loanId);
  await updateDoc(loanRef, { status: 'paid' });
};
