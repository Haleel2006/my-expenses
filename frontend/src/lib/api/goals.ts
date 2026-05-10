import { db } from '@/lib/firebase';
import { collection, doc, addDoc, getDoc, getDocs, updateDoc, query, orderBy, writeBatch, Timestamp } from 'firebase/firestore';
import { PaymentMethod } from './transactions';

export interface Goal {
  id?: string;
  goalName: string;
  targetAmount: number;
  savedAmount: number;
  startDate: Date;
  targetDate?: Date;
  description?: string;
  createdAt: Date;
}

export const fetchGoals = async (userId: string) => {
  const q = query(
    collection(db, 'users', userId, 'goals'),
    orderBy('createdAt', 'desc')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      startDate: data.startDate?.toDate(),
      targetDate: data.targetDate?.toDate(),
      createdAt: data.createdAt?.toDate(),
    } as Goal;
  });
};

export const addGoal = async (userId: string, goal: Omit<Goal, 'id'>) => {
  const docRef = await addDoc(collection(db, 'users', userId, 'goals'), {
    ...goal,
    startDate: Timestamp.fromDate(goal.startDate),
    targetDate: goal.targetDate ? Timestamp.fromDate(goal.targetDate) : null,
    createdAt: Timestamp.now(),
  });
  return docRef.id;
};

export const updateGoal = async (userId: string, goalId: string, data: Partial<Goal>) => {
  const goalRef = doc(db, 'users', userId, 'goals', goalId);
  const updateData: Record<string, unknown> = { ...data };
  if (data.startDate) updateData.startDate = Timestamp.fromDate(data.startDate);
  if (data.targetDate) updateData.targetDate = Timestamp.fromDate(data.targetDate);
  
  await updateDoc(goalRef, updateData);
};

export const deleteGoal = async (userId: string, goalId: string) => {
  const batch = writeBatch(db);
  const goalRef = doc(db, 'users', userId, 'goals', goalId);
  const goalSnap = await getDoc(goalRef);
  
  if (!goalSnap.exists()) return;
  const savedAmount = goalSnap.data().savedAmount || 0;

  // 1. Delete the goal document
  batch.delete(goalRef);

  // 2. Update the total goal savings balance if there was any money in it
  if (savedAmount > 0) {
    const balanceRef = doc(db, 'users', userId, 'balances', 'current');
    const balanceSnap = await getDoc(balanceRef);
    if (balanceSnap.exists()) {
      const currentBalances = balanceSnap.data();
      const { goalSavings = 0 } = currentBalances;
      batch.update(balanceRef, {
        goalSavings: Math.max(0, goalSavings - savedAmount),
        lastUpdated: Timestamp.now()
      });
    }
  }

  await batch.commit();
};

export const addMoneyToGoal = async (userId: string, goalId: string, amount: number, paymentMethod: PaymentMethod, date: Date = new Date()) => {
  const batch = writeBatch(db);
  
  // 1. Update Goal
  const goalRef = doc(db, 'users', userId, 'goals', goalId);
  const goalSnap = await getDoc(goalRef);
  if (!goalSnap.exists()) throw new Error("Goal not found");
  
  const currentSaved = goalSnap.data().savedAmount || 0;
  batch.update(goalRef, { savedAmount: currentSaved + amount });

  // 2. Update Balances
  const balanceRef = doc(db, 'users', userId, 'balances', 'current');
  const balanceSnap = await getDoc(balanceRef);
  
  if (balanceSnap.exists()) {
    const currentBalances = balanceSnap.data();
    let wallet = currentBalances.wallet !== undefined ? currentBalances.wallet : (currentBalances.cash || 0);
    let bankAccount = currentBalances.bankAccount !== undefined ? currentBalances.bankAccount : (currentBalances.googlePay || 0);
    const { goalSavings = 0 } = currentBalances;
    
    if (paymentMethod === 'Wallet') {
      wallet -= amount;
    } else {
      bankAccount -= amount;
    }
    
    batch.update(balanceRef, {
      wallet,
      bankAccount,
      goalSavings: goalSavings + amount,
      lastUpdated: Timestamp.now(),
      cash: null,
      googlePay: null
    });
  }

  // 3. Add a transaction record for this move
  const txRef = doc(collection(db, 'users', userId, 'transactions'));
  batch.set(txRef, {
    amount,
    type: 'expense',
    category: 'Savings Goal',
    paymentMethod,
    date: Timestamp.fromDate(date),
    notes: `Added to goal: ${goalSnap.data().goalName}`,
    createdAt: Timestamp.now(),
    isGoalContribution: true,
    goalId
  });

  await batch.commit();
};

export const withdrawFromGoal = async (userId: string, goalId: string, amount: number, paymentMethod: PaymentMethod, date: Date = new Date()) => {
  const batch = writeBatch(db);
  
  // 1. Update Goal
  const goalRef = doc(db, 'users', userId, 'goals', goalId);
  const goalSnap = await getDoc(goalRef);
  if (!goalSnap.exists()) throw new Error("Goal not found");
  
  const currentSaved = goalSnap.data().savedAmount || 0;
  if (currentSaved < amount) throw new Error("Insufficient funds in goal");
  
  batch.update(goalRef, { savedAmount: currentSaved - amount });

  // 2. Update Balances
  const balanceRef = doc(db, 'users', userId, 'balances', 'current');
  const balanceSnap = await getDoc(balanceRef);
  
  if (balanceSnap.exists()) {
    const currentBalances = balanceSnap.data();
    let wallet = currentBalances.wallet !== undefined ? currentBalances.wallet : (currentBalances.cash || 0);
    let bankAccount = currentBalances.bankAccount !== undefined ? currentBalances.bankAccount : (currentBalances.googlePay || 0);
    const { goalSavings = 0 } = currentBalances;
    
    if (paymentMethod === 'Wallet') {
      wallet += amount;
    } else {
      bankAccount += amount;
    }
    
    batch.update(balanceRef, {
      wallet,
      bankAccount,
      goalSavings: goalSavings - amount,
      lastUpdated: Timestamp.now(),
      cash: null,
      googlePay: null
    });
  }

  // 3. Add a transaction record for this move
  const txRef = doc(collection(db, 'users', userId, 'transactions'));
  batch.set(txRef, {
    amount,
    type: 'income',
    category: 'Goal Withdrawal',
    paymentMethod,
    date: Timestamp.fromDate(date),
    notes: `Withdrawn from goal: ${goalSnap.data().goalName}`,
    createdAt: Timestamp.now(),
    isGoalWithdrawal: true,
    goalId
  });

  await batch.commit();
};

export const clearAllUserData = async (userId: string) => {
  const batch = writeBatch(db);
  
  // Delete all transactions
  const txSnap = await getDocs(collection(db, 'users', userId, 'transactions'));
  txSnap.forEach(d => batch.delete(d.ref));
  
  // Delete all loans
  const loanSnap = await getDocs(collection(db, 'users', userId, 'loans'));
  loanSnap.forEach(d => batch.delete(d.ref));
  
  // Delete all goals
  const goalSnap = await getDocs(collection(db, 'users', userId, 'goals'));
  goalSnap.forEach(d => batch.delete(d.ref));
  
  // Reset balances
  const balanceRef = doc(db, 'users', userId, 'balances', 'current');
  batch.set(balanceRef, {
    wallet: 0,
    bankAccount: 0,
    goalSavings: 0,
    lastUpdated: Timestamp.now(),
    cash: null,
    googlePay: null
  });
  
  await batch.commit();
};
