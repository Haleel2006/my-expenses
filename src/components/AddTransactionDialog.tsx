'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { addTransaction, Transaction, TransactionType, PaymentMethod } from '@/lib/api/transactions';
import { fetchGoals, Goal } from '@/lib/api/goals';
import { useStore } from '@/lib/store';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { SmsParser } from './SmsParser';
import { useEffect } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AddTransactionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: TransactionType;
  onSuccess?: () => void;
}

const EXPENSE_CATEGORIES = ['Food', 'Travel', 'Bills', 'Shopping', 'Entertainment', 'Health', 'Savings Goal', 'Other'];
const INCOME_CATEGORIES = ['Salary', 'Freelance', 'Investment', 'Gift', 'Goal Withdrawal', 'Other'];

export function AddTransactionDialog({ open, onOpenChange, type, onSuccess }: AddTransactionDialogProps) {
  const { user } = useStore();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Bank account');
  const [date, setDate] = useState<Date>(new Date());
  const [notes, setNotes] = useState('');
  const [goalId, setGoalId] = useState<string>('');
  const [goals, setGoals] = useState<Goal[]>([]);

  useEffect(() => {
    if (user && open) {
      fetchGoals(user.uid).then(setGoals);
    }
  }, [user, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      toast({ title: "Invalid amount", variant: "destructive" });
      return;
    }
    if (!category) {
      toast({ title: "Please select a category", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const transaction: Transaction = {
        amount: Number(amount),
        type,
        category,
        paymentMethod,
        date: date,
        notes,
        goalId: (category === 'Savings Goal' || category === 'Goal Withdrawal') ? goalId : undefined,
      };

      await addTransaction(user.uid, transaction);
      
      toast({ title: "Transaction added successfully!" });
      
      // Reset form
      setAmount('');
      setCategory('');
      setNotes('');
      setGoalId('');
      setDate(new Date());
      
      onOpenChange(false);
      if (onSuccess) onSuccess();
    } catch (error: unknown) {
      const err = error as Error;
      toast({ title: "Error adding transaction", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const categories = type === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;

  const handleSmsParsed = (data: { amount: string; category: string; paymentMethod: PaymentMethod; type: TransactionType; notes: string }) => {
    setAmount(data.amount);
    
    if (categories.includes(data.category)) {
      setCategory(data.category);
    } else {
      setCategory('Other');
    }
    
    setPaymentMethod(data.paymentMethod);
    setNotes(data.notes);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] w-full p-0 sm:p-6 overflow-hidden sm:rounded-3xl border-none sm:border bg-background sm:bg-background/80 sm:backdrop-blur-xl bottom-0 sm:bottom-auto fixed sm:relative translate-y-0 sm:-translate-y-1/2 rounded-t-[2.5rem] rounded-b-none sm:rounded-b-3xl max-h-[90vh] overflow-y-auto custom-scrollbar">
        <div className="sm:hidden w-12 h-1.5 bg-white/10 rounded-full mx-auto mt-4 mb-2" />
        <div className="p-6 pt-2 sm:p-0">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-2xl font-bold">Add {type === 'expense' ? 'Expense' : 'Income'}</DialogTitle>
          </DialogHeader>
          
          {type === 'expense' && (
            <div className="mb-6">
              <SmsParser onParsed={handleSmsParsed} />
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-2">
              <Label htmlFor="amount" className="text-sm font-medium text-white/60 ml-1">Amount (₹)</Label>
              <Input
                id="amount"
                type="number"
                inputMode="decimal"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                step="0.01"
                autoFocus
                className="input-premium text-3xl h-16 font-bold"
              />
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="category" className="text-sm font-medium text-white/60 ml-1">Category</Label>
                <Select value={category} onValueChange={setCategory} required>
                  <SelectTrigger className="h-14 rounded-2xl bg-white/5 border-white/10">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent className="glass-card no-hover">
                    {categories.map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="paymentMethod" className="text-sm font-medium text-white/60 ml-1">Source</Label>
                <Select value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as PaymentMethod)} required>
                  <SelectTrigger className="h-14 rounded-2xl bg-white/5 border-white/10">
                    <SelectValue placeholder="Select source" />
                  </SelectTrigger>
                  <SelectContent className="glass-card no-hover">
                    <SelectItem value="Bank account">Bank account / UPI</SelectItem>
                    <SelectItem value="Wallet">Wallet</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {(category === 'Savings Goal' || category === 'Goal Withdrawal') && (
              <div className="grid gap-2">
                <Label htmlFor="goalId" className="text-sm font-medium text-white/60 ml-1">Select Goal</Label>
                <Select value={goalId} onValueChange={setGoalId} required>
                  <SelectTrigger className="h-14 rounded-2xl bg-white/5 border-white/10">
                    <SelectValue placeholder="Select a goal" />
                  </SelectTrigger>
                  <SelectContent className="glass-card no-hover">
                    {goals.map((g) => (
                      <SelectItem key={g.id} value={g.id!}>{g.goalName}</SelectItem>
                    ))}
                    {goals.length === 0 && (
                      <SelectItem value="no-goals" disabled>No goals found</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="grid gap-2">
              <Label className="text-sm font-medium text-white/60 ml-1">Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full h-14 rounded-2xl justify-start text-left font-normal bg-white/5 border-white/10",
                      !date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 glass-card no-hover" align="start">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={(d) => d && setDate(d)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="notes" className="text-sm font-medium text-white/60 ml-1">Notes (Optional)</Label>
              <Input
                id="notes"
                type="text"
                placeholder="What was this for?"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="h-14 rounded-2xl bg-white/5 border-white/10"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <Button type="button" variant="ghost" className="flex-1 h-14 rounded-2xl text-white/60" onClick={() => onOpenChange(false)} disabled={loading}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading} className="btn-premium flex-[2] h-14 text-lg">
                {loading ? "Saving..." : "Save Transaction"}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
