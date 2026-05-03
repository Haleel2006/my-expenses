import { db } from '@/lib/firebase';
import { collection, doc, addDoc, getDoc, getDocs, updateDoc, deleteDoc, query, where, orderBy, writeBatch, Timestamp } from 'firebase/firestore';

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
  const batch = writeBatch(db);
  
  // 1. Add Transaction
  const newTxRef = doc(collection(db, 'users', userId, 'transactions'));
  batch.set(newTxRef, {
    ...transaction,
    date: Timestamp.fromDate(transaction.date),
    createdAt: Timestamp.now(),
  });

  // 2. Update Balances
  const balanceRef = doc(db, 'users', userId, 'balances', 'current');
  const balanceSnap = await getDoc(balanceRef);
  
  if (balanceSnap.exists()) {
    const currentBalances = balanceSnap.data();
    let { cash, googlePay } = currentBalances;
    
    const amount = transaction.amount;
    const isExpense = transaction.type === 'expense';
    
    if (transaction.paymentMethod === 'Cash') {
      cash = isExpense ? cash - amount : cash + amount;
    } else {
      googlePay = isExpense ? googlePay - amount : googlePay + amount;
    }
    
    batch.update(balanceRef, {
      cash,
      googlePay,
      lastUpdated: Timestamp.now()
    });
  }
  
  await batch.commit();
  return newTxRef.id;
};

export const deleteTransaction = async (userId: string, transactionId: string, transaction: Transaction) => {
  const batch = writeBatch(db);
  
  // 1. Delete Transaction
  const txRef = doc(db, 'users', userId, 'transactions', transactionId);
  batch.delete(txRef);

  // 2. Reverse Balances
  const balanceRef = doc(db, 'users', userId, 'balances', 'current');
  const balanceSnap = await getDoc(balanceRef);
  
  if (balanceSnap.exists()) {
    const currentBalances = balanceSnap.data();
    let { cash, googlePay } = currentBalances;
    
    const amount = transaction.amount;
    const isExpense = transaction.type === 'expense';
    
    // Reverse the logic
    if (transaction.paymentMethod === 'Cash') {
      cash = isExpense ? cash + amount : cash - amount;
    } else {
      googlePay = isExpense ? googlePay + amount : googlePay - amount;
    }
    
    batch.update(balanceRef, {
      cash,
      googlePay,
      lastUpdated: Timestamp.now()
    });
  }
  
  await batch.commit();
};
