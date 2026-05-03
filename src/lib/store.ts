import { create } from 'zustand';

interface User {
  uid: string;
  email: string | null;
  name: string | null;
}

interface Balances {
  cash: number;
  googlePay: number;
  savings: number;
  loansReceivable: number;
  loansPayable: number;
  totalBalance: number;
}

interface AppState {
  user: User | null;
  setUser: (user: User | null) => void;
  
  balances: Balances;
  setBalances: (balances: Partial<Balances>) => void;
  
  isLoading: boolean;
  setIsLoading: (isLoading: boolean) => void;
}

const defaultBalances: Balances = {
  cash: 0,
  googlePay: 0,
  savings: 0,
  loansReceivable: 0,
  loansPayable: 0,
  totalBalance: 0,
};

export const useStore = create<AppState>((set) => ({
  user: null,
  setUser: (user) => set({ user }),
  
  balances: defaultBalances,
  setBalances: (newBalances) => set((state) => {
    const updated = { ...state.balances, ...newBalances };
    updated.totalBalance = (updated.cash || 0) + (updated.googlePay || 0) + (updated.savings || 0) + (updated.loansReceivable || 0) - (updated.loansPayable || 0);
    return { balances: updated };
  }),
  
  isLoading: true,
  setIsLoading: (isLoading) => set({ isLoading }),
}));
