'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { addTransaction, Transaction, TransactionType, PaymentMethod } from '@/lib/api/transactions';
import { fetchGoals, SavingsGoal, updateGoalMoney } from '@/lib/api/goals';
import { useStore } from '@/lib/store';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { SmsParser } from './SmsParser';
import { useEffect } from 'react';

interface AddTransactionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: TransactionType;
  onSuccess?: () => void;
}

const EXPENSE_CATEGORIES = ['Food', 'Travel', 'Bills', 'Shopping', 'Entertainment', 'Health', 'Other'];
const INCOME_CATEGORIES = ['Salary', 'Freelance', 'Investment', 'Gift', 'Other'];

export function AddTransactionDialog({ open, onOpenChange, type, onSuccess }: AddTransactionDialogProps) {
  const { user } = useStore();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Google Pay');
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [notes, setNotes] = useState('');
  
  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  const [selectedGoalId, setSelectedGoalId] = useState<string>('none');

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
        date: new Date(date),
        notes,
      };

      await addTransaction(user.uid, transaction);
      
      // If linked to a goal, also update the goal
      if (selectedGoalId && selectedGoalId !== 'none') {
        const goal = goals.find(g => g.id === selectedGoalId);
        if (goal) {
          // If it's income, we ADD to goal. If it's expense, we usually don't "save" it, 
          // but the requirement says "tag a transaction as Saved to Goal".
          // We'll treat both as adding to the goal for now, as that's what "Saved to Goal" implies.
          await updateGoalMoney(user.uid, selectedGoalId, Number(amount), paymentMethod, 'add');
        }
      }
      
      toast({ title: "Transaction added successfully!" });
      
      // Reset form
      setAmount('');
      setCategory('');
      setNotes('');
      setSelectedGoalId('none');
      setDate(format(new Date(), 'yyyy-MM-dd'));
      
      onOpenChange(false);
      if (onSuccess) onSuccess();
    } catch (error: any) {
      toast({ title: "Error adding transaction", description: error.message, variant: "destructive" });
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
          <div className="grid grid-cols-2 gap-4">
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
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="paymentMethod">Source</Label>
              <Select value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as PaymentMethod)} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select source" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Google Pay">Google Pay</SelectItem>
                  <SelectItem value="Cash">Cash</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="goalLink">Link to Savings Goal (Optional)</Label>
            <Select value={selectedGoalId} onValueChange={setSelectedGoalId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a goal" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                {goals.map((g) => (
                  <SelectItem key={g.id} value={g.id || ''}>{g.goalName} (Saved: ₹{g.savedAmount})</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-[10px] text-muted-foreground">This will automatically move the amount to your goal.</p>
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
