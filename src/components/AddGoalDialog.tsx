'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { addGoal, Goal } from '@/lib/api/goals';
import { useStore } from '@/lib/store';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface AddGoalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function AddGoalDialog({ open, onOpenChange, onSuccess }: AddGoalDialogProps) {
  const { user } = useStore();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  
  const [goalName, setGoalName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [startDate, setStartDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [targetDate, setTargetDate] = useState('');
  const [description, setDescription] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    if (!targetAmount || isNaN(Number(targetAmount)) || Number(targetAmount) <= 0) {
      toast({ title: "Invalid amount", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const goal: Omit<Goal, 'id'> = {
        goalName,
        targetAmount: Number(targetAmount),
        savedAmount: 0,
        startDate: new Date(startDate),
        targetDate: targetDate ? new Date(targetDate) : undefined,
        description,
        createdAt: new Date(),
      };

      await addGoal(user.uid, goal);
      
      toast({ title: "Goal created successfully!" });
      
      setGoalName('');
      setTargetAmount('');
      setStartDate(format(new Date(), 'yyyy-MM-dd'));
      setTargetDate('');
      setDescription('');
      
      onOpenChange(false);
      if (onSuccess) onSuccess();
    } catch (error: any) {
      toast({ title: "Error creating goal", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New Saving Goal</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="grid gap-2">
            <Label htmlFor="goalName">Goal Name</Label>
            <Input
              id="goalName"
              placeholder="e.g., Goa Trip, New Bike"
              value={goalName}
              onChange={(e) => setGoalName(e.target.value)}
              required
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="targetAmount">Target Amount (₹)</Label>
            <Input
              id="targetAmount"
              type="number"
              placeholder="0.00"
              value={targetAmount}
              onChange={(e) => setTargetAmount(e.target.value)}
              required
              step="0.01"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="targetDate">Target Date (Optional)</Label>
              <Input
                id="targetDate"
                type="date"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              placeholder="Why are you saving for this?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Creating..." : "Create Goal"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
