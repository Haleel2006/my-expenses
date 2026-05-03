'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useStore } from '@/lib/store';
import { Wallet, IndianRupee, HandCoins, ArrowRightLeft } from 'lucide-react';
import { useEffect } from 'react';
import { fetchBalances } from '@/lib/api/transactions';

export function BalanceCards() {
  const { user, balances, setBalances } = useStore();

  useEffect(() => {
    if (user) {
      fetchBalances(user.uid).then((data) => {
        if (data) {
          setBalances({
            cash: data.cash || 0,
            googlePay: data.googlePay || 0,
            loansReceivable: data.loansReceivable || 0,
            loansPayable: data.loansPayable || 0,
          });
        }
      });
    }
  }, [user, setBalances]);

  const totalBalance = balances.cash + balances.googlePay + balances.loansReceivable - balances.loansPayable;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card className="bg-primary text-primary-foreground shadow-lg col-span-full lg:col-span-1 relative overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Balance</CardTitle>
          <IndianRupee className="h-4 w-4" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(totalBalance)}</div>
          <p className="text-xs opacity-80 pt-1">
            Overall liquidity
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Cash in Hand</CardTitle>
          <Wallet className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(balances.cash)}</div>
          <p className="text-xs text-muted-foreground pt-1">
            Physical currency
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Google Pay</CardTitle>
          <ArrowRightLeft className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(balances.googlePay)}</div>
          <p className="text-xs text-muted-foreground pt-1">
            UPI & Bank balance
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Loans</CardTitle>
          <HandCoins className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-end">
            <div>
              <p className="text-xs text-muted-foreground">Receivable</p>
              <div className="text-lg font-bold text-green-600 dark:text-green-400">
                +{formatCurrency(balances.loansReceivable)}
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Payable</p>
              <div className="text-lg font-bold text-red-600 dark:text-red-400">
                -{formatCurrency(balances.loansPayable)}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
