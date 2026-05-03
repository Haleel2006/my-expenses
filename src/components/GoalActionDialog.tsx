'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PaymentMethod } from '@/lib/api/transactions';
import { updateGoalMoney } from '@/lib/api/goals';
import { useStore } from '@/lib/store';
import { useToast } from '@/hooks/use-toast';

interface GoalActionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  goalId: string;
  goalName: string;
  mode: 'add' | 'withdraw';
  onSuccess?: () => void;
}

export function GoalActionDialog({ open, onOpenChange, goalId, goalName, mode, onSuccess }: GoalActionDialogProps) {
  const { user } = useStore();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Google Pay');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      toast({ title: "Invalid amount", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      await updateGoalMoney(user.uid, goalId, Number(amount), paymentMethod, mode);
      
      toast({ 
        title: mode === 'add' ? "Money added to goal!" : "Money withdrawn from goal!",
        description: `₹${amount} ${mode === 'add' ? 'moved to' : 'moved back from'} ${goalName}`
      });
      
      setAmount('');
      onOpenChange(false);
      if (onSuccess) onSuccess();
    } catch (error: any) {
      toast({ title: "Error updating goal", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>{mode === 'add' ? 'Add Money to Goal' : 'Withdraw from Goal'}</DialogTitle>
          <p className="text-sm text-muted-foreground">{goalName}</p>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="grid gap-2">
            <Label htmlFor="amount">Amount (₹)</Label>
            <Input
              id="amount"
              type="number"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="paymentMethod">
              {mode === 'add' ? 'Deduct from' : 'Add back to'}
            </Label>
            <Select value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as PaymentMethod)}>
              <SelectTrigger>
                <SelectValue placeholder="Select source" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Google Pay">Google Pay / UPI</SelectItem>
                <SelectItem value="Cash">Cash</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className={mode === 'withdraw' ? 'bg-orange-600 hover:bg-orange-700' : ''}>
              {loading ? "Processing..." : (mode === 'add' ? "Add Money" : "Withdraw")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
