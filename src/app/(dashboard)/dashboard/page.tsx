'use client';

import { BalanceCards } from '@/components/BalanceCards';
import { Button } from '@/components/ui/button';
import { PlusCircle, ArrowDownCircle } from 'lucide-react';
import { useState } from 'react';
import { TransactionList } from '@/components/TransactionList';
import { AddTransactionDialog } from '@/components/AddTransactionDialog';
import { ExportButton } from '@/components/ExportButton';
export default function DashboardPage() {
  const [isAddTransactionOpen, setIsAddTransactionOpen] = useState(false);
  const [transactionType, setTransactionType] = useState<'expense' | 'income'>('expense');

  const openAddTransaction = (type: 'expense' | 'income') => {
    setTransactionType(type);
    setIsAddTransactionOpen(true);
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <div className="grid grid-cols-2 sm:flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <ExportButton />
          <div className="contents sm:flex gap-2">
            <Button 
              variant="outline" 
              className="flex gap-2 text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-950 order-2 sm:order-none px-2 xs:px-4"
              onClick={() => openAddTransaction('income')}
            >
              <ArrowDownCircle className="h-4 w-4" />
              <span className="xs:hidden">Income</span>
              <span className="hidden xs:inline">Add Income</span>
            </Button>
            <Button 
              className="gap-2 order-1 sm:order-none px-2 xs:px-4"
              onClick={() => openAddTransaction('expense')}
            >
              <PlusCircle className="h-4 w-4" />
              <span className="xs:hidden">Expense</span>
              <span className="hidden xs:inline">Add Expense</span>
            </Button>
          </div>
        </div>
      </div>
      
      <BalanceCards />
      
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-7">
        <div className="lg:col-span-4 rounded-xl border bg-card text-card-foreground shadow">
          <div className="p-6 flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="font-semibold leading-none tracking-tight">Recent Transactions</h3>
          </div>
          <div className="p-0 pt-0">
            <TransactionList />
          </div>
        </div>
        
        <div className="lg:col-span-3 rounded-xl border bg-card text-card-foreground shadow">
          <div className="p-6 flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="font-semibold leading-none tracking-tight">Analytics Preview</h3>
          </div>
          <div className="p-6 pt-0 flex items-center justify-center min-h-[200px]">
            <p className="text-sm text-muted-foreground text-center">Visit the Analytics page for detailed charts.</p>
          </div>
        </div>
      </div>
      
      <AddTransactionDialog 
        open={isAddTransactionOpen} 
        onOpenChange={setIsAddTransactionOpen} 
        type={transactionType}
        onSuccess={() => {
          // A real app would use a global state or SWR to refetch, here we trigger a full reload or let the components handle it.
          window.location.reload(); 
        }}
      />
    </div>
  );
}
