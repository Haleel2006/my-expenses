'use client';

import { useEffect, useState, useCallback } from 'react';
import { useStore } from '@/lib/store';
import { fetchTransactions, deleteTransaction, Transaction } from '@/lib/api/transactions';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Trash2, ChevronDown, ChevronUp, Calendar as CalendarIcon, ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { motion, AnimatePresence } from 'framer-motion';

export function TransactionList() {
  const { user } = useStore();
  const { toast } = useToast();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);

  const loadTransactions = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await fetchTransactions(user.uid);
      setTransactions(data);
    } catch (error) {
      console.error("Failed to load transactions", error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadTransactions();
  }, [loadTransactions]);

  const handleDelete = async (tx: Transaction) => {
    if (!user || !tx.id) return;
    
    if (confirm("Are you sure you want to delete this transaction?")) {
      try {
        await deleteTransaction(user.uid, tx.id, tx);
        toast({ title: "Transaction deleted" });
        loadTransactions();
        useStore.getState().setBalances({}); 
      } catch (error: unknown) {
        const err = error as Error;
        toast({ title: "Error deleting", description: err.message, variant: "destructive" });
      }
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-16 w-full glass-card shimmer border-none" />
        ))}
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <div className="p-12 text-center">
        <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
           <CalendarIcon className="text-white/20 h-8 w-8" />
        </div>
        <p className="text-white/40 italic">No transactions found. Start tracking your money!</p>
      </div>
    );
  }

  const displayedTransactions = showAll ? transactions : transactions.slice(0, 5);

  return (
    <div className="w-full overflow-hidden">
      {/* Mobile View: Cards */}
      <div className="md:hidden space-y-3 p-4">
        <AnimatePresence>
          {displayedTransactions.map((tx, idx) => (
            <motion.div 
              key={tx.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="glass-card p-4 flex items-center justify-between group"
            >
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-xl ${tx.type === 'income' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                  {tx.type === 'income' ? <ArrowDownLeft className="h-5 w-5" /> : <ArrowUpRight className="h-5 w-5" />}
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-white">{tx.category}</span>
                  <span className="text-[10px] text-white/40 uppercase tracking-wider">
                    {format(tx.date, 'dd MMM yyyy')} • {tx.paymentMethod}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className={`text-sm font-bold ${tx.type === 'income' ? 'text-emerald-500' : 'text-white'}`}>
                  {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
                </span>
                <button 
                  onClick={() => handleDelete(tx)}
                  className="p-2 text-white/20 hover:text-rose-500 transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Desktop View: Table */}
      <div className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow className="border-white/5 hover:bg-transparent">
              <TableHead className="text-white/40 uppercase text-[10px] tracking-widest">Date</TableHead>
              <TableHead className="text-white/40 uppercase text-[10px] tracking-widest">Category</TableHead>
              <TableHead className="text-white/40 uppercase text-[10px] tracking-widest">Method</TableHead>
              <TableHead className="text-white/40 uppercase text-[10px] tracking-widest">Notes</TableHead>
              <TableHead className="text-right text-white/40 uppercase text-[10px] tracking-widest">Amount</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <AnimatePresence>
              {displayedTransactions.map((tx, idx) => (
                <motion.tr 
                  key={tx.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="group border-white/5 hover:bg-white/[0.02] transition-colors"
                >
                  <TableCell className="text-sm text-white/60">{format(tx.date, 'dd MMM yyyy')}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                       <div className={`w-2 h-2 rounded-full ${tx.type === 'income' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-rose-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]'}`} />
                       <span className="text-sm font-medium text-white">{tx.category}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-white/60">{tx.paymentMethod}</TableCell>
                  <TableCell className="text-sm text-white/40 italic truncate max-w-[150px]">{tx.notes}</TableCell>
                  <TableCell className={`text-right font-bold ${tx.type === 'income' ? 'text-emerald-500' : 'text-white'}`}>
                    {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity hover:bg-rose-500/10 hover:text-rose-500" onClick={() => handleDelete(tx)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </motion.tr>
              ))}
            </AnimatePresence>
          </TableBody>
        </Table>
      </div>

      {transactions.length > 5 && (
        <div className="p-6 flex justify-center border-t border-white/5">
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-white/40 hover:text-white gap-2 rounded-full px-6 hover:bg-white/5"
            onClick={() => setShowAll(!showAll)}
          >
            {showAll ? (
              <><ChevronUp className="h-4 w-4" /> Show less</>
            ) : (
              <><ChevronDown className="h-4 w-4" /> Read more ({transactions.length - 5} more)</>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
