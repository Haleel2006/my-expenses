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
        <div className="flex flex-wrap items-center gap-2">
          <ExportButton />
          <Button 
            variant="outline" 
            className="hidden sm:flex gap-2 text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-950"
            onClick={() => openAddTransaction('income')}
          >
            <ArrowDownCircle className="h-4 w-4" />
            Add Income
          </Button>
          <Button 
            className="gap-2"
            onClick={() => openAddTransaction('expense')}
          >
            <PlusCircle className="h-4 w-4" />
            Add Expense
          </Button>
        </div>
      </div>
      
      <BalanceCards />
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        <div className="col-span-4 rounded-xl border bg-card text-card-foreground shadow">
          <div className="p-6 flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="font-semibold leading-none tracking-tight">Recent Transactions</h3>
          </div>
          <div className="p-0 pt-0">
            <TransactionList />
          </div>
        </div>
        
        <div className="col-span-3 rounded-xl border bg-card text-card-foreground shadow">
          <div className="p-6 flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="font-semibold leading-none tracking-tight">Analytics Preview</h3>
          </div>
          <div className="p-6 pt-0 flex items-center justify-center min-h-[200px]">
            <p className="text-sm text-muted-foreground">Chart placeholder</p>
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
