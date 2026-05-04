'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { addLoan, Loan, LoanType } from '@/lib/api/loans';
import { useStore } from '@/lib/store';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface AddLoanDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function AddLoanDialog({ open, onOpenChange, onSuccess }: AddLoanDialogProps) {
  const { user } = useStore();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  
  const [personName, setPersonName] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<LoanType>('given');
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      toast({ title: "Invalid amount", variant: "destructive" });
      return;
    }
    if (!personName) {
      toast({ title: "Please enter a name", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const loan: Loan = {
        personName,
        amount: Number(amount),
        type,
        date: new Date(date),
        status: 'pending'
      };

      await addLoan(user.uid, loan);
      
      toast({ title: "Loan added successfully!" });
      
      setPersonName('');
      setAmount('');
      setDate(format(new Date(), 'yyyy-MM-dd'));
      
      onOpenChange(false);
      if (onSuccess) onSuccess();
    } catch (error: unknown) {
      const err = error as Error;
      toast({ title: "Error adding loan", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Loan</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="grid gap-2">
            <Label htmlFor="type">Loan Type</Label>
            <Select value={type} onValueChange={(v) => setType(v as LoanType)} required>
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="given">Money Given (Receivable)</SelectItem>
                <SelectItem value="taken">Money Taken (Payable)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="personName">Person Name</Label>
            <Input
              id="personName"
              type="text"
              placeholder="John Doe"
              value={personName}
              onChange={(e) => setPersonName(e.target.value)}
              required
            />
          </div>

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
            <Label htmlFor="date">Date</Label>
            <Input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : "Save Loan"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
