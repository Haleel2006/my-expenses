import { db } from '@/lib/firebase';
import { collection, doc, addDoc, getDoc, getDocs, updateDoc, deleteDoc, query, where, orderBy, writeBatch, Timestamp, increment } from 'firebase/firestore';

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
  goalId?: string;
  isGoalContribution?: boolean;
  isGoalWithdrawal?: boolean;
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
  const txData: any = {
    amount: transaction.amount,
    type: transaction.type,
    category: transaction.category,
    paymentMethod: transaction.paymentMethod,
    date: Timestamp.fromDate(transaction.date),
    notes: transaction.notes || '',
    createdAt: Timestamp.now(),
  };

  if (transaction.goalId) txData.goalId = transaction.goalId;
  if (transaction.isGoalContribution) txData.isGoalContribution = transaction.isGoalContribution;
  if (transaction.isGoalWithdrawal) txData.isGoalWithdrawal = transaction.isGoalWithdrawal;

  batch.set(newTxRef, txData);

  // 2. Update Balances
  const balanceRef = doc(db, 'users', userId, 'balances', 'current');
  const balanceSnap = await getDoc(balanceRef);
  
  if (balanceSnap.exists()) {
    const currentBalances = balanceSnap.data();
    let { cash = 0, googlePay = 0, goalSavings = 0 } = currentBalances;
    
    const amount = transaction.amount;
    const isExpense = transaction.type === 'expense';
    
    if (transaction.paymentMethod === 'Cash') {
      cash = isExpense ? cash - amount : cash + amount;
    } else {
      googlePay = isExpense ? googlePay - amount : googlePay + amount;
    }

    // Handle Goal linking
    if (transaction.goalId) {
        if (isExpense) {
            // Money moved from balance to goal
            goalSavings += amount;
            const goalRef = doc(db, 'users', userId, 'goals', transaction.goalId);
            batch.update(goalRef, { savedAmount: increment(amount) });
        } else {
            // Money moved from goal to balance (withdrawal)
            goalSavings -= amount;
            const goalRef = doc(db, 'users', userId, 'goals', transaction.goalId);
            batch.update(goalRef, { savedAmount: increment(-amount) });
        }
    }
    
    batch.update(balanceRef, {
      cash,
      googlePay,
      goalSavings,
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
    let { cash = 0, googlePay = 0 } = currentBalances;
    
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
