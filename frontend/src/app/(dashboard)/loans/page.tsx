'use client';

import { useState, useEffect, useCallback } from 'react';
import { useStore } from '@/lib/store';
import { fetchLoans, markLoanPaid, Loan, deleteAllLoans, deleteLoan } from '@/lib/api/loans';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PlusCircle, CheckCircle2, Trash2 } from 'lucide-react';
import { AddLoanDialog } from '@/components/AddLoanDialog';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { PinVerificationDialog } from '@/components/PinVerificationDialog';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription, 
  DialogFooter 
} from '@/components/ui/dialog';

export default function LoansPage() {
  const { user, securitySettings } = useStore();
  const { toast } = useToast();
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isPinOpen, setIsPinOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [loanToDelete, setLoanToDelete] = useState<Loan | null>(null);
  const [isSingleDeleteConfirmOpen, setIsSingleDeleteConfirmOpen] = useState(false);

  const loadLoans = useCallback(async () => {
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
  }, [user]);

  useEffect(() => {
    loadLoans();
  }, [loadLoans]);

  const handleMarkPaid = async (loan: Loan) => {
    if (!user) return;
    try {
      await markLoanPaid(user.uid, loan);
      toast({ title: "Loan marked as paid" });
      loadLoans();
      useStore.getState().setBalances({}); // Trigger balance update
    } catch (error: unknown) {
      const err = error as Error;
      toast({ title: "Error updating loan", description: err.message, variant: "destructive" });
    }
  };

  const handleClearAll = async () => {
    if (!user) return;
    setIsDeleting(true);
    try {
      await deleteAllLoans(user.uid);
      toast({ title: "All loans cleared successfully" });
      loadLoans();
      useStore.getState().setBalances({ loansReceivable: 0, loansPayable: 0 });
      setIsConfirmOpen(false);
    } catch (error: unknown) {
      const err = error as Error;
      toast({ title: "Error clearing loans", description: err.message, variant: "destructive" });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteLoan = async () => {
    if (!user || !loanToDelete) return;
    setIsDeleting(true);
    try {
      await deleteLoan(user.uid, loanToDelete);
      toast({ title: "Loan deleted successfully" });
      loadLoans();
      useStore.getState().setBalances({}); // Trigger balance update
      setIsSingleDeleteConfirmOpen(false);
      setLoanToDelete(null);
    } catch (error: unknown) {
      const err = error as Error;
      toast({ title: "Error deleting loan", description: err.message, variant: "destructive" });
    } finally {
      setIsDeleting(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount);
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Loans</h1>
        <div className="flex gap-2">
          {loans.length > 0 && (
            <Button 
              variant="outline" 
              className="text-rose-500 border-rose-500/20 hover:bg-rose-500/10 gap-2"
              onClick={() => {
                if (securitySettings.pinEnabled) {
                  setIsPinOpen(true);
                } else {
                  setIsConfirmOpen(true);
                }
              }}
            >
              <Trash2 className="h-4 w-4" />
              Clear All
            </Button>
          )}
          <Button onClick={() => setIsAddOpen(true)} className="gap-2">
            <PlusCircle className="h-4 w-4" />
            Add Loan
          </Button>
        </div>
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
                      <div className="flex gap-2">
                        {loan.status === 'pending' && (
                          <Button variant="outline" size="sm" onClick={() => handleMarkPaid(loan)} className="h-7 text-xs gap-1 text-green-600">
                            <CheckCircle2 className="h-3 w-3" />
                            Mark Paid
                          </Button>
                        )}
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-7 w-7 text-rose-500 hover:bg-rose-500/10"
                          onClick={() => {
                            setLoanToDelete(loan);
                            setIsSingleDeleteConfirmOpen(true);
                          }}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
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
                      <TableHead className="w-[120px]"></TableHead>
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
                          <div className="flex items-center justify-end gap-1">
                            {loan.status === 'pending' && (
                              <Button variant="ghost" size="sm" onClick={() => handleMarkPaid(loan)} className="h-8 gap-1 text-green-600 px-2">
                                <CheckCircle2 className="h-4 w-4" />
                                <span className="hidden lg:inline text-[10px]">Paid</span>
                              </Button>
                            )}
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 text-rose-500 hover:bg-rose-500/10"
                              onClick={() => {
                                setLoanToDelete(loan);
                                setIsSingleDeleteConfirmOpen(true);
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
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
      
      <PinVerificationDialog 
        open={isPinOpen}
        onOpenChange={setIsPinOpen}
        onSuccess={() => setIsConfirmOpen(true)}
        title="Verify PIN to Clear Loans"
        description="Enter your security PIN to clear all loan history."
      />

      <Dialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <Trash2 className="h-5 w-5" /> Clear All Loans
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete ALL loan records? This action will also reset your loans receivable and payable balances.
              <p className="mt-2 font-semibold text-destructive">This cannot be undone.</p>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setIsConfirmOpen(false)} disabled={isDeleting}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleClearAll} disabled={isDeleting}>
              {isDeleting ? "Clearing..." : "Yes, Clear All Loans"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isSingleDeleteConfirmOpen} onOpenChange={setIsSingleDeleteConfirmOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <Trash2 className="h-5 w-5" /> Delete Loan
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the loan for <span className="font-bold text-white">{loanToDelete?.personName}</span> of <span className="font-bold text-white">{loanToDelete && formatCurrency(loanToDelete.amount)}</span>?
              {loanToDelete?.status === 'pending' && (
                <p className="mt-2 text-rose-400 text-xs">
                  This will also update your {loanToDelete.type === 'given' ? 'receivable' : 'payable'} balance.
                </p>
              )}
              <p className="mt-2 font-semibold text-destructive">This action cannot be undone.</p>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setIsSingleDeleteConfirmOpen(false)} disabled={isDeleting}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteLoan} disabled={isDeleting}>
              {isDeleting ? "Deleting..." : "Delete Loan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
