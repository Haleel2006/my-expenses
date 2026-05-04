'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { addMoneyToGoal, withdrawFromGoal } from '@/lib/api/goals';
import { useStore } from '@/lib/store';
import { useToast } from '@/hooks/use-toast';
import { PaymentMethod } from '@/lib/api/transactions';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { Calendar as CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface GoalActionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  goalId: string;
  goalName: string;
  type: 'add' | 'withdraw';
  onSuccess?: () => void;
}

export function GoalActionDialog({ open, onOpenChange, goalId, goalName, type, onSuccess }: GoalActionDialogProps) {
  const { user, balances, setBalances } = useStore();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Cash');
  const [date, setDate] = useState<Date>(new Date());

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    const numAmount = Number(amount);
    if (!amount || isNaN(numAmount) || numAmount <= 0) {
      toast({ title: "Invalid amount", variant: "destructive" });
      return;
    }

    if (type === 'add') {
        const available = paymentMethod === 'Cash' ? balances.cash : balances.googlePay;
        if (numAmount > available) {
            toast({ title: "Insufficient balance", description: `You only have ₹${available} in ${paymentMethod}`, variant: "destructive" });
            return;
        }
    }

    setLoading(true);
    try {
      if (type === 'add') {
        await addMoneyToGoal(user.uid, goalId, numAmount, paymentMethod, date);
        toast({ title: "Added to goal!", description: `₹${numAmount} moved to ${goalName}` });
        
        // Update local store balance to reflect changes immediately
        if (paymentMethod === 'Cash') {
            setBalances({ cash: balances.cash - numAmount, goalSavings: balances.goalSavings + numAmount });
        } else {
            setBalances({ googlePay: balances.googlePay - numAmount, goalSavings: balances.goalSavings + numAmount });
        }
      } else {
        await withdrawFromGoal(user.uid, goalId, numAmount, paymentMethod, date);
        toast({ title: "Withdrawn from goal!", description: `₹${numAmount} moved back to ${paymentMethod}` });

        if (paymentMethod === 'Cash') {
            setBalances({ cash: balances.cash + numAmount, goalSavings: balances.goalSavings - numAmount });
        } else {
            setBalances({ googlePay: balances.googlePay + numAmount, goalSavings: balances.goalSavings - numAmount });
        }
      }
      
      setAmount('');
      setDate(new Date());
      onOpenChange(false);
      if (onSuccess) onSuccess();
    } catch (error: unknown) {
      const err = error as Error;
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{type === 'add' ? 'Add Money to Goal' : 'Withdraw from Goal'}</DialogTitle>
          <DialogDescription>
            {type === 'add' ? `Save money towards ${goalName}` : `Move money from ${goalName} back to your balance`}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="grid gap-2">
            <Label htmlFor="amount">Amount (₹)</Label>
            <Input
              id="amount"
              type="number"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              step="0.01"
              autoFocus
            />
          </div>

          <div className="grid gap-2">
            <Label>Transaction Date</Label>
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
            <Label htmlFor="paymentMethod">{type === 'add' ? 'Transfer From' : 'Transfer To'}</Label>
            <Select value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as PaymentMethod)} required>
              <SelectTrigger>
                <SelectValue placeholder="Select account" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Cash">Cash (Available: ₹{balances.cash})</SelectItem>
                <SelectItem value="Google Pay">Google Pay (Available: ₹{balances.googlePay})</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Processing..." : type === 'add' ? "Add Money" : "Withdraw"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
