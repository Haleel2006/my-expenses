'use client';

import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { SavingsGoal, deleteGoal } from '@/lib/api/goals';
import { formatCurrency } from '@/lib/utils';
import { Plus, Minus, Trash2, Calendar, TrendingUp } from 'lucide-react';
import { useState } from 'react';
import { GoalActionDialog } from './GoalActionDialog';
import { useStore } from '@/lib/store';
import { useToast } from '@/hooks/use-toast';
import { differenceInDays, addDays, format } from 'date-fns';

interface GoalCardProps {
  goal: SavingsGoal;
  onRefresh: () => void;
}

export function GoalCard({ goal, onRefresh }: GoalCardProps) {
  const { user } = useStore();
  const { toast } = useToast();
  const [isActionOpen, setIsActionOpen] = useState(false);
  const [actionMode, setActionMode] = useState<'add' | 'withdraw'>('add');

  const progress = Math.min(Math.round((goal.savedAmount / goal.targetAmount) * 100), 100);
  const remainingAmount = Math.max(goal.targetAmount - goal.savedAmount, 0);
  
  const daysPassed = differenceInDays(new Date(), goal.startDate) || 1;
  const avgSavingPerDay = goal.savedAmount / daysPassed;
  
  let estCompletionDate = 'N/A';
  if (avgSavingPerDay > 0 && remainingAmount > 0) {
    const daysToFinish = Math.ceil(remainingAmount / avgSavingPerDay);
    estCompletionDate = format(addDays(new Date(), daysToFinish), 'MMM dd, yyyy');
  }

  const daysRemaining = goal.targetDate ? differenceInDays(goal.targetDate, new Date()) : null;
  const isBehind = goal.targetDate && avgSavingPerDay > 0 && 
    (differenceInDays(goal.targetDate, new Date()) < (remainingAmount / avgSavingPerDay));

  const handleDelete = async () => {
    if (!user || !goal.id) return;
    if (confirm(`Are you sure you want to delete "${goal.goalName}"? Saved money (₹${goal.savedAmount}) will be returned to your cash balance.`)) {
      try {
        await deleteGoal(user.uid, goal.id, goal.savedAmount);
        toast({ title: "Goal deleted" });
        onRefresh();
      } catch (e: any) {
        toast({ title: "Error deleting goal", description: e.message, variant: "destructive" });
      }
    }
  };

  const openAction = (mode: 'add' | 'withdraw') => {
    setActionMode(mode);
    setIsActionOpen(true);
  };

  return (
    <Card className="overflow-hidden border-2 hover:border-primary/50 transition-all shadow-md">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{goal.type}</p>
            <CardTitle className="text-xl font-bold truncate max-w-[180px]">{goal.goalName}</CardTitle>
          </div>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={handleDelete}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-between items-end mb-1">
          <div className="text-2xl font-bold text-primary">
            ₹{goal.savedAmount.toLocaleString()}
            <span className="text-sm font-normal text-muted-foreground ml-1">
              / ₹{goal.targetAmount.toLocaleString()}
            </span>
          </div>
          <div className="text-sm font-semibold text-primary">{progress}%</div>
        </div>
        
        <Progress value={progress} className="h-2" />
        
        <div className="grid grid-cols-2 gap-4 text-xs">
          <div className="space-y-1">
            <p className="text-muted-foreground">Remaining</p>
            <p className="font-semibold text-orange-600">₹{remainingAmount.toLocaleString()}</p>
          </div>
          <div className="space-y-1 text-right">
            <p className="text-muted-foreground">Target Date</p>
            <p className="font-semibold">
              {goal.targetDate ? format(goal.targetDate, 'MMM dd, yyyy') : 'No target'}
            </p>
          </div>
        </div>

        {goal.targetDate && (
          <div className={`p-2 rounded-lg text-[10px] flex items-center gap-2 ${isBehind ? 'bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400' : 'bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-400'}`}>
            <TrendingUp className="h-3 w-3" />
            <span>
              {isBehind 
                ? "Behind schedule. Save more per day to reach on time." 
                : "On track to reach your goal!"}
            </span>
          </div>
        )}

        <div className="space-y-1 pt-1 border-t text-[10px] text-muted-foreground">
          <div className="flex justify-between">
            <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> Est. Completion</span>
            <span className="font-medium text-foreground">{estCompletionDate}</span>
          </div>
          {daysRemaining !== null && (
             <div className="flex justify-between">
              <span>Days remaining</span>
              <span className={`font-medium ${daysRemaining < 0 ? 'text-red-500' : 'text-foreground'}`}>
                {daysRemaining < 0 ? 'Overdue' : `${daysRemaining} days`}
              </span>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="bg-muted/30 p-3 grid grid-cols-2 gap-2">
        <Button size="sm" variant="outline" className="gap-1 text-orange-600 border-orange-200 hover:bg-orange-50" onClick={() => openAction('withdraw')}>
          <Minus className="h-3 w-3" /> Withdraw
        </Button>
        <Button size="sm" className="gap-1" onClick={() => openAction('add')}>
          <Plus className="h-3 w-3" /> Add Money
        </Button>
      </CardFooter>

      <GoalActionDialog 
        open={isActionOpen}
        onOpenChange={setIsActionOpen}
        goalId={goal.id || ''}
        goalName={goal.goalName}
        mode={actionMode}
        onSuccess={onRefresh}
      />
    </Card>
  );
}
