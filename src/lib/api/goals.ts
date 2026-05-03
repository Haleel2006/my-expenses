import { db } from '@/lib/firebase';
import { collection, doc, addDoc, getDoc, getDocs, updateDoc, deleteDoc, query, orderBy, writeBatch, Timestamp } from 'firebase/firestore';
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
  const updateData: any = { ...data };
  if (data.startDate) updateData.startDate = Timestamp.fromDate(data.startDate);
  if (data.targetDate) updateData.targetDate = Timestamp.fromDate(data.targetDate);
  
  await updateDoc(goalRef, updateData);
};

export const deleteGoal = async (userId: string, goalId: string) => {
  await deleteDoc(doc(db, 'users', userId, 'goals', goalId));
};

export const addMoneyToGoal = async (userId: string, goalId: string, amount: number, paymentMethod: PaymentMethod) => {
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
    let { cash = 0, googlePay = 0, goalSavings = 0 } = currentBalances;
    
    if (paymentMethod === 'Cash') {
      cash -= amount;
    } else {
      googlePay -= amount;
    }
    
    batch.update(balanceRef, {
      cash,
      googlePay,
      goalSavings: goalSavings + amount,
      lastUpdated: Timestamp.now()
    });
  }

  // 3. Add a transaction record for this move
  const txRef = doc(collection(db, 'users', userId, 'transactions'));
  batch.set(txRef, {
    amount,
    type: 'expense',
    category: 'Savings Goal',
    paymentMethod,
    date: Timestamp.now(),
    notes: `Added to goal: ${goalSnap.data().goalName}`,
    createdAt: Timestamp.now(),
    isGoalContribution: true,
    goalId
  });

  await batch.commit();
};

export const withdrawFromGoal = async (userId: string, goalId: string, amount: number, paymentMethod: PaymentMethod) => {
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
    let { cash = 0, googlePay = 0, goalSavings = 0 } = currentBalances;
    
    if (paymentMethod === 'Cash') {
      cash += amount;
    } else {
      googlePay += amount;
    }
    
    batch.update(balanceRef, {
      cash,
      googlePay,
      goalSavings: goalSavings - amount,
      lastUpdated: Timestamp.now()
    });
  }

  // 3. Add a transaction record for this move
  const txRef = doc(collection(db, 'users', userId, 'transactions'));
  batch.set(txRef, {
    amount,
    type: 'income',
    category: 'Goal Withdrawal',
    paymentMethod,
    date: Timestamp.now(),
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
    cash: 0,
    googlePay: 0,
    goalSavings: 0,
    lastUpdated: Timestamp.now()
  });
  
  await batch.commit();
};
