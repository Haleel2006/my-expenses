import { db } from '@/lib/firebase';
import { collection, doc, addDoc, getDoc, getDocs, updateDoc, deleteDoc, query, where, orderBy, Timestamp } from 'firebase/firestore';

export type TransactionType = 'income' | 'expense';
export type PaymentMethod = 'Cash' | 'Google Pay';

export interface Transaction {
  id?: string;
  amount: number;
  type: TransactionType;
  category: string;
  paymentMethod: PaymentMethod;
  date: Date;
  notes: string;
  createdAt?: Date;
}

export const fetchBalances = async (userId: string) => {
  const balanceRef = doc(db, 'users', userId, 'balances', 'current');
  const snap = await getDoc(balanceRef);
  if (snap.exists()) {
    return snap.data();
  }
  return null;
};

export const fetchTransactions = async (userId: string, limitCount: number = 50) => {
  const q = query(
    collection(db, 'users', userId, 'transactions'),
    orderBy('date', 'desc')
  );
  // We can add limit(limitCount) if needed
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      date: data.date.toDate(),
      createdAt: data.createdAt?.toDate(),
    } as Transaction;
  });
};

export const addTransaction = async (userId: string, transaction: Transaction) => {
  // 1. Add Transaction
  const docRef = await addDoc(collection(db, 'users', userId, 'transactions'), {
    ...transaction,
    date: Timestamp.fromDate(transaction.date),
    createdAt: Timestamp.now(),
  });

  // 2. Update Balances
  const balanceRef = doc(db, 'users', userId, 'balances', 'current');
  const balanceSnap = await getDoc(balanceRef);
  
  if (balanceSnap.exists()) {
    const data = balanceSnap.data();
    const amount = transaction.amount;
    const isExpense = transaction.type === 'expense';
    const change = isExpense ? -amount : amount;
    
    const update: any = {
      lastUpdated: Timestamp.now()
    };
    
    if (transaction.paymentMethod === 'Cash') {
      update.cash = (data.cash || 0) + change;
    } else {
      update.googlePay = (data.googlePay || 0) + change;
    }
    
    await updateDoc(balanceRef, update);
  }
  
  return docRef.id;
};

export const deleteTransaction = async (userId: string, transactionId: string, transaction: Transaction) => {
  // 1. Delete Transaction
  await deleteDoc(doc(db, 'users', userId, 'transactions', transactionId));

  // 2. Reverse Balances
  const balanceRef = doc(db, 'users', userId, 'balances', 'current');
  const balanceSnap = await getDoc(balanceRef);
  
  if (balanceSnap.exists()) {
    const data = balanceSnap.data();
    const amount = transaction.amount;
    const isExpense = transaction.type === 'expense';
    const reverseChange = isExpense ? amount : -amount;
    
    const update: any = {
      lastUpdated: Timestamp.now()
    };
    
    if (transaction.paymentMethod === 'Cash') {
      update.cash = (data.cash || 0) + reverseChange;
    } else {
      update.googlePay = (data.googlePay || 0) + reverseChange;
    }
    
    await updateDoc(balanceRef, update);
  }
};
