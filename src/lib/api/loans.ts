import { db } from '@/lib/firebase';
import { collection, doc, getDoc, getDocs, query, orderBy, writeBatch, Timestamp } from 'firebase/firestore';

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
    personName: loan.personName,
    amount: loan.amount,
    type: loan.type,
    status: loan.status,
    date: Timestamp.fromDate(loan.date),
    createdAt: Timestamp.now(),
  });

  // 2. Update Balances
  const balanceRef = doc(db, 'users', userId, 'balances', 'current');
  const balanceSnap = await getDoc(balanceRef);
  
  if (balanceSnap.exists()) {
    const currentBalances = balanceSnap.data();
    let { loansReceivable = 0, loansPayable = 0 } = currentBalances;
    
    if (loan.type === 'given') {
      loansReceivable += loan.amount;
    } else {
      loansPayable += loan.amount;
    }
    
    batch.update(balanceRef, {
      loansReceivable,
      loansPayable,
      lastUpdated: Timestamp.now()
    });
  }
  
  await batch.commit();
  return newLoanRef.id;
};

export const markLoanPaid = async (userId: string, loan: Loan) => {
  if (!loan.id) return;
  const batch = writeBatch(db);
  
  // 1. Update Loan Status
  const loanRef = doc(db, 'users', userId, 'loans', loan.id);
  batch.update(loanRef, { status: 'paid' });

  // 2. Update Balances
  const balanceRef = doc(db, 'users', userId, 'balances', 'current');
  const balanceSnap = await getDoc(balanceRef);
  
  if (balanceSnap.exists()) {
    const currentBalances = balanceSnap.data();
    let { loansReceivable = 0, loansPayable = 0 } = currentBalances;
    
    if (loan.type === 'given') {
      loansReceivable -= loan.amount; // Money received back
    } else {
      loansPayable -= loan.amount; // Money paid back
    }
    
    batch.update(balanceRef, {
      loansReceivable,
      loansPayable,
      lastUpdated: Timestamp.now()
    });
  }
  
  await batch.commit();
};
