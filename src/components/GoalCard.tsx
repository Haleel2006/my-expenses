'use client';

import { Goal } from '@/lib/api/goals';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Target, Calendar, TrendingUp, AlertCircle, Plus, ArrowDownLeft } from 'lucide-react';
import { format, differenceInDays, addDays } from 'date-fns';
import { useState } from 'react';
import { GoalActionDialog } from './GoalActionDialog';

interface GoalCardProps {
  goal: Goal;
  onUpdate?: () => void;
}

export function GoalCard({ goal, onUpdate }: GoalCardProps) {
  const [actionType, setActionType] = useState<'add' | 'withdraw' | null>(null);
  
  const percentage = Math.min(100, (goal.savedAmount / goal.targetAmount) * 100);
  const remaining = Math.max(0, goal.targetAmount - goal.savedAmount);
  
  const daysPassed = differenceInDays(new Date(), goal.startDate);
  const dailySavingTrend = daysPassed > 0 ? goal.savedAmount / daysPassed : 0;
  
  let estimatedDaysLeft = null;
  if (dailySavingTrend > 0 && remaining > 0) {
    estimatedDaysLeft = Math.ceil(remaining / dailySavingTrend);
  }

  const daysToTarget = goal.targetDate ? differenceInDays(goal.targetDate, new Date()) : null;

  const getInsight = () => {
    if (percentage >= 100) return { text: "Goal Reached! 🎉", variant: "success" };
    if (goal.targetDate) {
        if (daysToTarget !== null && daysToTarget < 0) return { text: "Behind schedule", variant: "destructive" };
        if (estimatedDaysLeft !== null && daysToTarget !== null && estimatedDaysLeft > daysToTarget) {
            const requiredDaily = remaining / daysToTarget;
            return { text: `Save ₹${requiredDaily.toFixed(0)} more per day to reach on time`, variant: "warning" };
        }
    }
    if (percentage > 50) return { text: "More than halfway there! Keep going!", variant: "info" };
    return { text: "Consistency is key. Start small, save often.", variant: "muted" };
  };

  const insight = getInsight();

  return (
    <Card className="overflow-hidden border-t-4 border-t-primary">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div className="flex-1 mr-2">
            <CardTitle className="text-xl font-bold">{goal.goalName}</CardTitle>
            <CardDescription className="line-clamp-1">{goal.description || 'No description'}</CardDescription>
          </div>
          <div className="bg-primary/10 p-2 rounded-full shrink-0">
            <Target className="h-5 w-5 text-primary" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-bold">{percentage.toFixed(1)}%</span>
          </div>
          <Progress value={percentage} className="h-2" />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>₹{goal.savedAmount.toLocaleString()} saved</span>
            <span>Target: ₹{goal.targetAmount.toLocaleString()}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 py-2 border-y border-border/50">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <div className="text-xs">
              <p className="text-muted-foreground">Target Date</p>
              <p className="font-medium">{goal.targetDate ? format(goal.targetDate, 'MMM d, yyyy') : 'Not set'}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
            <div className="text-xs">
              <p className="text-muted-foreground">Remaining</p>
              <p className="font-medium text-destructive">₹{remaining.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="bg-muted/30 p-3 rounded-lg space-y-2">
          <div className="flex items-center gap-2 text-xs">
            <AlertCircle className="h-3.5 w-3.5 text-primary" />
            <span className="font-semibold text-primary uppercase tracking-wider">Smart Insight</span>
          </div>
          <p className="text-sm font-medium">{insight.text}</p>
          {estimatedDaysLeft !== null && percentage < 100 && (
            <p className="text-xs text-muted-foreground">
              Est. completion: {format(addDays(new Date(), estimatedDaysLeft), 'MMM d, yyyy')}
            </p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3 pt-2">
          <Button size="sm" className="gap-2" onClick={() => setActionType('add')}>
            <Plus className="h-4 w-4" /> Add Money
          </Button>
          <Button size="sm" variant="outline" className="gap-2" onClick={() => setActionType('withdraw')}>
            <ArrowDownLeft className="h-4 w-4" /> Withdraw
          </Button>
        </div>
      </CardContent>

      <GoalActionDialog
        open={actionType !== null}
        onOpenChange={(open) => !open && setActionType(null)}
        goalId={goal.id!}
        goalName={goal.goalName}
        type={actionType || 'add'}
        onSuccess={onUpdate}
      />
    </Card>
  );
}
