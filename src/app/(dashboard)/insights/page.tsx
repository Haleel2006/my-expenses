'use client';

import { useState, useEffect } from 'react';
import { useStore } from '@/lib/store';
import { fetchTransactions, Transaction } from '@/lib/api/transactions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Lightbulb, TrendingUp, TrendingDown, Calendar, AlertTriangle } from 'lucide-react';
import { subMonths, startOfMonth, endOfMonth, isWithinInterval, format } from 'date-fns';

interface InsightCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  variant?: 'default' | 'positive' | 'negative' | 'warning';
}

function InsightCard({ title, description, icon, variant = 'default' }: InsightCardProps) {
  const colorMap = {
    default: 'text-blue-500 bg-blue-100 dark:bg-blue-900',
    positive: 'text-green-500 bg-green-100 dark:bg-green-900',
    negative: 'text-red-500 bg-red-100 dark:bg-red-900',
    warning: 'text-yellow-500 bg-yellow-100 dark:bg-yellow-900',
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center gap-4 space-y-0 pb-2">
        <div className={`p-2 rounded-full ${colorMap[variant]}`}>
          {icon}
        </div>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}

export default function InsightsPage() {
  const { user } = useStore();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchTransactions(user.uid, 500).then(data => {
        setTransactions(data);
        setLoading(false);
      });
    }
  }, [user]);

  if (loading) {
    return <div className="flex items-center justify-center min-h-[400px]">Generating insights...</div>;
  }

  // Generate Insights
  const insights = [];
  const now = new Date();
  
  const currentMonthStart = startOfMonth(now);
  const currentMonthEnd = endOfMonth(now);
  const lastMonthStart = startOfMonth(subMonths(now, 1));
  const lastMonthEnd = endOfMonth(subMonths(now, 1));

  const currentMonthTxs = transactions.filter(tx => isWithinInterval(tx.date, { start: currentMonthStart, end: currentMonthEnd }));
  const lastMonthTxs = transactions.filter(tx => isWithinInterval(tx.date, { start: lastMonthStart, end: lastMonthEnd }));

  const currentExpense = currentMonthTxs.filter(tx => tx.type === 'expense').reduce((acc, tx) => acc + tx.amount, 0);
  const lastExpense = lastMonthTxs.filter(tx => tx.type === 'expense').reduce((acc, tx) => acc + tx.amount, 0);

  // 1. Month over Month comparison
  if (lastExpense > 0) {
    const diff = currentExpense - lastExpense;
    const percent = Math.abs((diff / lastExpense) * 100).toFixed(1);
    
    if (diff > 0) {
      insights.push(
        <InsightCard 
          key="mom" 
          title="Spending Increased" 
          description={`Your spending this month is ₹${diff} (${percent}%) higher than last month.`} 
          icon={<TrendingUp className="h-5 w-5" />} 
          variant="negative" 
        />
      );
    } else {
      insights.push(
        <InsightCard 
          key="mom" 
          title="Great Job Saving!" 
          description={`Your spending is ₹${Math.abs(diff)} (${percent}%) lower than last month.`} 
          icon={<TrendingDown className="h-5 w-5" />} 
          variant="positive" 
        />
      );
    }
  }

  // 2. Highest Spending Category
  const categoryTotals = currentMonthTxs.filter(tx => tx.type === 'expense').reduce((acc, tx) => {
    acc[tx.category] = (acc[tx.category] || 0) + tx.amount;
    return acc;
  }, {} as Record<string, number>);

  const highestCategory = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1])[0];
  
  if (highestCategory && highestCategory[1] > 0) {
    insights.push(
      <InsightCard 
        key="cat" 
        title="Top Category" 
        description={`You spent the most on ${highestCategory[0]} (₹${highestCategory[1]}) this month.`} 
        icon={<PieChart className="h-5 w-5" />} 
        variant="warning" 
      />
    );
  }

  // 3. Most Active Day
  const dailyTotals = currentMonthTxs.filter(tx => tx.type === 'expense').reduce((acc, tx) => {
    const day = format(tx.date, 'EEEE');
    acc[day] = (acc[day] || 0) + tx.amount;
    return acc;
  }, {} as Record<string, number>);

  const mostActiveDay = Object.entries(dailyTotals).sort((a, b) => b[1] - a[1])[0];

  if (mostActiveDay) {
    insights.push(
      <InsightCard 
        key="day" 
        title="Busiest Day" 
        description={`You tend to spend the most on ${mostActiveDay[0]}s.`} 
        icon={<Calendar className="h-5 w-5" />} 
        variant="default" 
      />
    );
  }

  if (insights.length === 0) {
    insights.push(
      <div key="none" className="col-span-full p-8 text-center text-muted-foreground border rounded-lg bg-muted/20">
        <Lightbulb className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p>Not enough data to generate insights yet.</p>
        <p className="text-sm">Add more transactions to see trends.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-2">
        <h1 className="text-3xl font-bold tracking-tight">AI Insights</h1>
        <span className="bg-primary/10 text-primary text-xs px-2 py-1 rounded-full font-medium">Beta</span>
      </div>
      <p className="text-muted-foreground">Smart observations based on your spending habits.</p>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {insights}
      </div>
    </div>
  );
}

// Dummy icon for PieChart inside insights since we didn't import it at the top to avoid conflicts or just import it.
function PieChart(props: any) {
  return <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M21.21 15.89A10 10 0 1 1 8 2.83"/><path d="M22 12A10 10 0 0 0 12 2v10z"/></svg>;
}
