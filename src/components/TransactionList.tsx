'use client';

import { useEffect, useState } from 'react';
import { useStore } from '@/lib/store';
import { fetchTransactions, deleteTransaction, Transaction } from '@/lib/api/transactions';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

export function TransactionList() {
  const { user } = useStore();
  const { toast } = useToast();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  const loadTransactions = async () => {
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
  };

  useEffect(() => {
    loadTransactions();
  }, [user]);

  // Expose reload function to parent or listen to store changes
  // For simplicity, we'll just poll or rely on parent triggering reload.
  // Better approach is to use a real-time listener in Firestore, but fetching once is okay for now.

  const handleDelete = async (tx: Transaction) => {
    if (!user || !tx.id) return;
    
    if (confirm("Are you sure you want to delete this transaction?")) {
      try {
        await deleteTransaction(user.uid, tx.id, tx);
        toast({ title: "Transaction deleted" });
        loadTransactions();
        // Trigger balance reload
        useStore.getState().setBalances({}); // This is a hack to trigger useEffect in BalanceCards. In a real app, use SWR/React Query or Firestore real-time snapshot.
      } catch (error: any) {
        toast({ title: "Error deleting", description: error.message, variant: "destructive" });
      }
    }
  };

  if (loading) {
    return <div className="p-4 text-center text-sm text-muted-foreground">Loading transactions...</div>;
  }

  if (transactions.length === 0) {
    return <div className="p-4 text-center text-sm text-muted-foreground">No transactions found.</div>;
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(amount);
  };

  return (
    <div className="w-full">
      {/* Mobile View: Cards */}
      <div className="md:hidden divide-y">
        {transactions.map((tx) => (
          <div key={tx.id} className="p-4 flex items-center justify-between">
            <div className="flex flex-col gap-1">
              <span className="text-sm font-medium">{tx.category}</span>
              <span className="text-xs text-muted-foreground">{format(tx.date, 'dd MMM yyyy')} • {tx.paymentMethod}</span>
              {tx.notes && <span className="text-xs text-muted-foreground italic truncate max-w-[200px]">{tx.notes}</span>}
            </div>
            <div className="flex items-center gap-3">
              <span className={`font-semibold ${tx.type === 'income' ? 'text-green-600' : ''}`}>
                {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
              </span>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDelete(tx)}>
                <Trash2 className="h-4 w-4 text-red-500" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop View: Table */}
      <div className="hidden md:block overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Method</TableHead>
              <TableHead>Notes</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.map((tx) => (
              <TableRow key={tx.id}>
                <TableCell>{format(tx.date, 'dd MMM yyyy')}</TableCell>
                <TableCell>
                  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                    tx.type === 'income' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
                  }`}>
                    {tx.category}
                  </span>
                </TableCell>
                <TableCell>{tx.paymentMethod}</TableCell>
                <TableCell className="max-w-[150px] truncate" title={tx.notes}>{tx.notes}</TableCell>
                <TableCell className={`text-right font-medium ${
                  tx.type === 'income' ? 'text-green-600 dark:text-green-400' : ''
                }`}>
                  {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
                </TableCell>
                <TableCell>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(tx)}>
                    <Trash2 className="h-4 w-4 text-red-500" />
                    <span className="sr-only">Delete</span>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
