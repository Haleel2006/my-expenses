import { create } from 'zustand';

interface User {
  uid: string;
  email: string | null;
  name: string | null;
}

interface Balances {
  wallet: number;
  bankAccount: number;
  loansReceivable: number;
  loansPayable: number;
  goalSavings: number;
  totalBalance: number;
}

interface SecuritySettings {
  pinEnabled: boolean;
  pin: string | null;
}

interface AppState {
  user: User | null;
  setUser: (user: User | null) => void;
  
  balances: Balances;
  setBalances: (balances: Partial<Balances>) => void;
  
  securitySettings: SecuritySettings;
  setSecuritySettings: (settings: Partial<SecuritySettings>) => void;
  
  isLoading: boolean;
  setIsLoading: (isLoading: boolean) => void;
  resetStore: () => void;
}

const defaultBalances: Balances = {
  wallet: 0,
  bankAccount: 0,
  loansReceivable: 0,
  loansPayable: 0,
  goalSavings: 0,
  totalBalance: 0,
};

export const useStore = create<AppState>((set) => ({
  user: null,
  setUser: (user) => set({ user }),
  
  balances: defaultBalances,
  setBalances: (newBalances) => set((state) => {
    const updated = { ...state.balances, ...newBalances };
    updated.totalBalance = (updated.wallet || 0) + (updated.bankAccount || 0) + (updated.loansReceivable || 0) - (updated.loansPayable || 0) + (updated.goalSavings || 0);
    return { balances: updated };
  }),
  
  securitySettings: { pinEnabled: false, pin: null },
  setSecuritySettings: (newSettings) => set((state) => ({
    securitySettings: { ...state.securitySettings, ...newSettings }
  })),
  
  isLoading: true,
  setIsLoading: (isLoading) => set({ isLoading }),
  
  resetStore: () => set({ 
    user: null, 
    balances: defaultBalances,
    securitySettings: { pinEnabled: false, pin: null },
    isLoading: false 
  }),
}));
