'use client';

import { useState, useEffect, useCallback } from 'react';
import { useStore } from '@/lib/store';
import { fetchGoals, Goal } from '@/lib/api/goals';
import { Button } from '@/components/ui/button';
import { Plus, Target, PieChart as PieChartIcon, TrendingUp } from 'lucide-react';
import { AddGoalDialog } from '@/components/AddGoalDialog';
import { GoalCard } from '@/components/GoalCard';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

const COLORS = ['#3b82f6', '#2563eb', '#1d4ed8', '#1e40af', '#60a5fa', '#93c5fd']; // Blue variations
const RED_COLOR = '#ef4444'; // Red for pending/target

export default function GoalsPage() {
  const { user } = useStore();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  const loadGoals = useCallback(async () => {
    if (!user) return;
    try {
      const data = await fetchGoals(user.uid);
      setGoals(data);
    } catch (error) {
      console.error("Error fetching goals:", error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadGoals();
  }, [loadGoals]);

  if (loading) {
    return <div className="flex items-center justify-center min-h-[400px]">Loading goals...</div>;
  }

  // Chart Data Preparation
  const totalTarget = goals.reduce((acc, g) => acc + g.targetAmount, 0);
  const totalSaved = goals.reduce((acc, g) => acc + g.savedAmount, 0);
  const totalRemaining = Math.max(0, totalTarget - totalSaved);
  const overallPercentage = totalTarget > 0 ? (totalSaved / totalTarget) * 100 : 0;

  const distributionData = goals.map((g, index) => ({
    name: g.goalName,
    value: g.savedAmount,
    color: COLORS[index % COLORS.length]
  })).filter(d => d.value > 0);
  
  if (totalRemaining > 0) {
    distributionData.push({ name: 'Pending Target', value: totalRemaining, color: RED_COLOR });
  }

  const goalBreakdownData = goals.map((g, index) => ({
    name: g.goalName,
    saved: g.savedAmount,
    target: g.targetAmount,
    color: COLORS[index % COLORS.length]
  }));

  const formatCurrency = (value: number) => `₹${value.toLocaleString()}`;

  const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: any[]; label?: string }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background/95 backdrop-blur-md border border-border p-3 rounded-xl shadow-2xl ring-1 ring-black/5">
          <p className="font-bold text-sm mb-2">{label || payload[0].name}</p>
          <div className="space-y-1">
            {payload.map((entry, index) => (
              <div key={index} className="flex items-center justify-between gap-4 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.payload.color || entry.fill || entry.color }} />
                  <span className="text-muted-foreground">{entry.name}</span>
                </div>
                <span className="font-mono font-bold">{formatCurrency(entry.value)}</span>
              </div>
            ))}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Savings Goals</h1>
          <p className="text-muted-foreground">Track and manage your purpose-based savings.</p>
        </div>
        <Button onClick={() => setIsAddDialogOpen(true)} className="gap-2 shadow-lg shadow-primary/20">
          <Plus className="h-4 w-4" /> Create Goal
        </Button>
      </div>

      {goals.length > 0 && (
        <div className="grid gap-6 md:grid-cols-2">
          <Card className="overflow-hidden border-none shadow-xl bg-gradient-to-br from-card to-muted/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-bold flex items-center gap-2 text-primary">
                <PieChartIcon className="h-5 w-5" /> Savings Distribution
              </CardTitle>
              <CardDescription>How your savings are split across goals</CardDescription>
            </CardHeader>
            <CardContent className="h-[280px] relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={distributionData}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={90}
                    paddingAngle={4}
                    dataKey="value"
                    stroke="none"
                  >
                    {distributionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pt-8">
                <span className="text-3xl font-black text-primary">{overallPercentage.toFixed(0)}%</span>
                <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Total Progress</span>
              </div>
            </CardContent>
          </Card>

          <Card className="overflow-hidden border-none shadow-xl bg-gradient-to-br from-card to-muted/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-bold flex items-center gap-2 text-primary">
                <TrendingUp className="h-5 w-5" /> Goal Breakdown
              </CardTitle>
              <CardDescription>Achievement status per goal</CardDescription>
            </CardHeader>
            <CardContent className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={goalBreakdownData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.1} />
                  <XAxis dataKey="name" fontSize={11} tickLine={false} axisLine={false} tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                  <YAxis fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `₹${v/1000}k`} tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0,0,0,0.05)' }} />
                  <Bar dataKey="saved" name="Saved" radius={[6, 6, 0, 0]} barSize={24}>
                    {goalBreakdownData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                  <Bar dataKey="target" name="Target" fill={RED_COLOR} opacity={0.1} radius={[6, 6, 0, 0]} barSize={24} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}

      {goals.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[300px] bg-muted/20 rounded-xl border-2 border-dashed">
          <div className="bg-primary/10 p-4 rounded-full mb-4">
            <Target className="h-10 w-10 text-primary" />
          </div>
          <h2 className="text-xl font-semibold">No goals yet</h2>
          <p className="text-muted-foreground mb-6">Start saving for your dreams today!</p>
          <Button onClick={() => setIsAddDialogOpen(true)}>Create Your First Goal</Button>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {goals.map((goal) => (
            <GoalCard key={goal.id} goal={goal} onUpdate={loadGoals} />
          ))}
        </div>
      )}

      <AddGoalDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onSuccess={loadGoals}
      />
    </div>
  );
}
