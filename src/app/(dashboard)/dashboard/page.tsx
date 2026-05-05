'use client';

import { BalanceCards } from '@/components/BalanceCards';
import { Button } from '@/components/ui/button';
import { PlusCircle, ArrowDownCircle, ArrowRight } from 'lucide-react';
import { useState } from 'react';
import { TransactionList } from '@/components/TransactionList';
import { AddTransactionDialog } from '@/components/AddTransactionDialog';
import { AnalyticsPreview } from '@/components/AnalyticsPreview';
import { motion } from 'framer-motion';
import Link from 'next/link';

import { ExportButton } from '@/components/ExportButton';

export default function DashboardPage() {
  const [isAddTransactionOpen, setIsAddTransactionOpen] = useState(false);
  const [transactionType, setTransactionType] = useState<'expense' | 'income'>('expense');

  const openAddTransaction = (type: 'expense' | 'income') => {
    setTransactionType(type);
    setIsAddTransactionOpen(true);
  };

  return (
    <div className="flex flex-col gap-8 pb-10">
      <motion.div 
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6"
      >
        <div>
          <h1 className="text-4xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60">
            Overview
          </h1>
          <p className="text-white/40 mt-1">Monitor your finances with precision.</p>
        </div>
        
        <div className="hidden sm:flex items-center gap-3 w-full sm:w-auto">
          <ExportButton />
          <Button 
            variant="outline" 
            className="rounded-xl border-emerald-500/30 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500 hover:text-white transition-all duration-300 gap-2 h-11"
            onClick={() => openAddTransaction('income')}
          >
            <ArrowDownCircle className="h-4 w-4" />
            <span>Add Income</span>
          </Button>
          <Button 
            className="btn-premium h-11"
            onClick={() => openAddTransaction('expense')}
          >
            <PlusCircle className="h-4 w-4" />
            <span>Add Expense</span>
          </Button>
        </div>
      </motion.div>
      
      <BalanceCards />
      
      <div className="grid gap-8 grid-cols-1 lg:grid-cols-7">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-4 glass-card overflow-hidden"
        >
          <div className="p-6 flex flex-row items-center justify-between border-b border-white/5">
            <h3 className="font-bold text-lg tracking-tight">Recent Transactions</h3>
            <Link href="/calendar" className="text-xs text-primary hover:underline flex items-center gap-1 font-medium">
               View Calendar <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="p-0">
            <TransactionList />
          </div>
        </motion.div>
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="lg:col-span-3 glass-card overflow-hidden"
        >
          <div className="p-6 flex flex-row items-center justify-between border-b border-white/5">
            <h3 className="font-bold text-lg tracking-tight">Analytics Preview</h3>
            <Link href="/analytics" className="text-xs text-primary hover:underline flex items-center gap-1 font-medium">
               Details <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="p-0">
            <AnalyticsPreview />
          </div>
        </motion.div>
      </div>
      
      <AddTransactionDialog 
        open={isAddTransactionOpen} 
        onOpenChange={setIsAddTransactionOpen} 
        type={transactionType}
        onSuccess={() => {
          window.location.reload(); 
        }}
      />
    </div>
  );
}
