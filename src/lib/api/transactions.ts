import { db } from '@/lib/firebase';
import { collection, doc, addDoc, getDoc, getDocs, updateDoc, deleteDoc, query, where, orderBy, writeBatch, Timestamp, increment } from 'firebase/firestore';

export type TransactionType = 'income' | 'expense';
export type PaymentMethod = 'Wallet' | 'Bank account';

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
    const data = snap.data();
    // Backward compatibility: map old fields to new ones if new ones don't exist
    return {
      ...data,
      wallet: data.wallet !== undefined ? data.wallet : (data.cash || 0),
      bankAccount: data.bankAccount !== undefined ? data.bankAccount : (data.googlePay || 0)
    };
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
    let paymentMethod = data.paymentMethod;
    // Map old values to new ones for display
    if (paymentMethod === 'Cash') paymentMethod = 'Wallet';
    if (paymentMethod === 'Google Pay') paymentMethod = 'Bank account';

    return {
      id: doc.id,
      ...data,
      paymentMethod,
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
    // Use new field names, fallback to old ones
    let wallet = currentBalances.wallet !== undefined ? currentBalances.wallet : (currentBalances.cash || 0);
    let bankAccount = currentBalances.bankAccount !== undefined ? currentBalances.bankAccount : (currentBalances.googlePay || 0);
    let { goalSavings = 0 } = currentBalances;
    
    const amount = transaction.amount;
    const isExpense = transaction.type === 'expense';
    
    if (transaction.paymentMethod === 'Wallet') {
      wallet = isExpense ? wallet - amount : wallet + amount;
    } else {
      bankAccount = isExpense ? bankAccount - amount : bankAccount + amount;
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
      wallet,
      bankAccount,
      goalSavings,
      lastUpdated: Timestamp.now(),
      // Clean up old fields if they exist
      cash: null,
      googlePay: null
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
    let wallet = currentBalances.wallet !== undefined ? currentBalances.wallet : (currentBalances.cash || 0);
    let bankAccount = currentBalances.bankAccount !== undefined ? currentBalances.bankAccount : (currentBalances.googlePay || 0);
    
    const amount = transaction.amount;
    const isExpense = transaction.type === 'expense';
    
    // Reverse the logic
    // Note: transaction.paymentMethod might be old ('Cash') or new ('Wallet')
    const isWallet = transaction.paymentMethod === 'Wallet' || transaction.paymentMethod === 'Cash' as any;
    
    if (isWallet) {
      wallet = isExpense ? wallet + amount : wallet - amount;
    } else {
      bankAccount = isExpense ? bankAccount + amount : bankAccount - amount;
    }
    
    batch.update(balanceRef, {
      wallet,
      bankAccount,
      lastUpdated: Timestamp.now(),
      cash: null,
      googlePay: null
    });
  }
  
  await batch.commit();
};
