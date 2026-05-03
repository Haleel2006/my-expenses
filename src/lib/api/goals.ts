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
  orderBy, 
  writeBatch, 
  Timestamp,
  increment
} from 'firebase/firestore';
import { PaymentMethod } from './transactions';

export type GoalType = 'Trip' | 'Bike purchase' | 'Emergency fund' | 'Gadgets' | 'Custom goals';

export interface SavingsGoal {
  id?: string;
  goalName: string;
  targetAmount: number;
  savedAmount: number;
  startDate: Date;
  targetDate?: Date;
  description?: string;
  type: GoalType;
  createdAt?: Date;
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
    } as SavingsGoal;
  });
};

export const addGoal = async (userId: string, goal: SavingsGoal) => {
  const goalData = {
    ...goal,
    startDate: Timestamp.fromDate(goal.startDate),
    targetDate: goal.targetDate ? Timestamp.fromDate(goal.targetDate) : null,
    createdAt: Timestamp.now(),
    savedAmount: 0,
  };
  
  const docRef = await addDoc(collection(db, 'users', userId, 'goals'), goalData);
  return docRef.id;
};

export const deleteGoal = async (userId: string, goalId: string, savedAmount: number) => {
  const batch = writeBatch(db);
  
  // 1. Delete Goal
  batch.delete(doc(db, 'users', userId, 'goals', goalId));
  
  // 2. Refund saved money to Cash (and decrement savings)
  if (savedAmount > 0) {
    const balanceRef = doc(db, 'users', userId, 'balances', 'current');
    batch.update(balanceRef, {
      cash: increment(savedAmount),
      savings: increment(-savedAmount),
      // We don't have enough info to know if it was savingsCash or savingsGPay easily 
      // without extra storage, so we'll just decrement savings field.
      // Ideally we'd track this in the goal document.
      lastUpdated: Timestamp.now()
    });
  }
  
  await batch.commit();
};

export const updateGoalMoney = async (
  userId: string, 
  goalId: string, 
  amount: number, 
  paymentMethod: PaymentMethod,
  type: 'add' | 'withdraw'
) => {
  const batch = writeBatch(db);
  const goalRef = doc(db, 'users', userId, 'goals', goalId);
  const balanceRef = doc(db, 'users', userId, 'balances', 'current');
  
  const multiplier = type === 'add' ? 1 : -1;
  const balanceChange = -amount * multiplier; // if add, deduct from balance. if withdraw, add to balance.
  const goalChange = amount * multiplier;
  
  // 1. Update Goal
  batch.update(goalRef, {
    savedAmount: increment(goalChange)
  });
  
  // 2. Update Balances
  const balanceUpdate: any = {
    savings: increment(goalChange),
    lastUpdated: Timestamp.now()
  };
  
  if (paymentMethod === 'Cash') {
    balanceUpdate.cash = increment(balanceChange);
    balanceUpdate.savingsCash = increment(goalChange);
  } else {
    balanceUpdate.googlePay = increment(balanceChange);
    balanceUpdate.savingsGPay = increment(goalChange);
  }
  
  batch.update(balanceRef, balanceUpdate);
  
  await batch.commit();
};
