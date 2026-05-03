'use client';

import { useState, useEffect } from 'react';
import { useStore } from '@/lib/store';
import { fetchLoans, markLoanPaid, Loan } from '@/lib/api/loans';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PlusCircle, CheckCircle2 } from 'lucide-react';
import { AddLoanDialog } from '@/components/AddLoanDialog';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

export default function LoansPage() {
  const { user } = useStore();
  const { toast } = useToast();
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddOpen, setIsAddOpen] = useState(false);

  const loadLoans = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await fetchLoans(user.uid);
      setLoans(data);
    } catch (error) {
      console.error("Failed to load loans", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLoans();
  }, [user]);

  const handleMarkPaid = async (loan: Loan) => {
    if (!user || !loan.id) return;
    try {
      await markLoanPaid(user.uid, loan);
      toast({ title: "Loan marked as paid" });
      loadLoans();
    } catch (error: any) {
      toast({ title: "Error updating loan", description: error.message, variant: "destructive" });
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount);
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Loans</h1>
        <Button onClick={() => setIsAddOpen(true)} className="gap-2">
          <PlusCircle className="h-4 w-4" />
          Add Loan
        </Button>
      </div>

      <div className="rounded-xl border bg-card text-card-foreground shadow">
        <div className="p-0">
          {loading ? (
            <div className="p-8 text-center text-muted-foreground">Loading loans...</div>
          ) : loans.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">No active or past loans found.</div>
          ) : (
            <div className="w-full">
              {/* Mobile View: Cards */}
              <div className="sm:hidden divide-y">
                {loans.map((loan) => (
                  <div key={loan.id} className={`p-4 flex flex-col gap-3 ${loan.status === 'paid' ? 'opacity-60' : ''}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex flex-col">
                        <span className="font-semibold">{loan.personName}</span>
                        <span className="text-xs text-muted-foreground">{format(loan.date, 'dd MMM yyyy')}</span>
                      </div>
                      <span className="font-bold">{formatCurrency(loan.amount)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex gap-2">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${
                          loan.type === 'given' 
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' 
                            : 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
                        }`}>
                          {loan.type === 'given' ? 'GIVEN' : 'TAKEN'}
                        </span>
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${
                          loan.status === 'paid' 
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                            : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                        }`}>
                          {loan.status.toUpperCase()}
                        </span>
                      </div>
                      {loan.status === 'pending' && (
                        <Button variant="outline" size="sm" onClick={() => handleMarkPaid(loan)} className="h-7 text-xs gap-1 text-green-600">
                          <CheckCircle2 className="h-3 w-3" />
                          Mark Paid
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop View: Table */}
              <div className="hidden sm:block overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Person</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead className="w-[100px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loans.map((loan) => (
                      <TableRow key={loan.id} className={loan.status === 'paid' ? 'opacity-60' : ''}>
                        <TableCell>{format(loan.date, 'dd MMM yyyy')}</TableCell>
                        <TableCell className="font-medium">{loan.personName}</TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                            loan.type === 'given' 
                              ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' 
                              : 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
                          }`}>
                            {loan.type === 'given' ? 'Given (Receivable)' : 'Taken (Payable)'}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                            loan.status === 'paid' 
                              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                              : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                          }`}>
                            {loan.status.toUpperCase()}
                          </span>
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(loan.amount)}
                        </TableCell>
                        <TableCell>
                          {loan.status === 'pending' && (
                            <Button variant="ghost" size="sm" onClick={() => handleMarkPaid(loan)} className="h-8 gap-1 text-green-600">
                              <CheckCircle2 className="h-4 w-4" />
                              <span className="hidden lg:inline">Mark Paid</span>
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </div>
      </div>

      <AddLoanDialog open={isAddOpen} onOpenChange={setIsAddOpen} onSuccess={loadLoans} />
    </div>
  );
}
