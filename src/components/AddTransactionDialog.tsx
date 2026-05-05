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
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add {type === 'expense' ? 'Expense' : 'Income'}</DialogTitle>
        </DialogHeader>
        
        {type === 'expense' && (
          <div className="pt-2">
            <SmsParser onParsed={handleSmsParsed} />
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="grid gap-2">
            <Label htmlFor="amount">Amount</Label>
            <Input
              id="amount"
               type="number"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              step="0.01"
            />
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="category">Category</Label>
            <Select value={category} onValueChange={setCategory} required>
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {(category === 'Savings Goal' || category === 'Goal Withdrawal') && (
            <div className="grid gap-2">
              <Label htmlFor="goalId">Select Goal</Label>
              <Select value={goalId} onValueChange={setGoalId} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select a goal" />
                </SelectTrigger>
                <SelectContent>
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
            <Label htmlFor="paymentMethod">Payment Source</Label>
            <Select value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as PaymentMethod)} required>
              <SelectTrigger>
                <SelectValue placeholder="Select source" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Bank account">Bank account / UPI</SelectItem>
                <SelectItem value="Wallet">Wallet</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label>Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
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
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Input
              id="notes"
              type="text"
              placeholder="What was this for?"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : "Save Transaction"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
