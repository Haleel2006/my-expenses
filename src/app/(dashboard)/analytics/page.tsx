'use client';

import { useState, useEffect } from 'react';
import { useStore } from '@/lib/store';
import { fetchTransactions, Transaction } from '@/lib/api/transactions';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { format, subMonths, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#ffc658', '#ef5350'];

export default function AnalyticsPage() {
  const { user } = useStore();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      // Fetch a larger dataset for analytics
      fetchTransactions(user.uid, 1000).then(data => {
        setTransactions(data);
        setLoading(false);
      });
    }
  }, [user]);

  if (loading) {
    return <div className="flex items-center justify-center min-h-[400px]">Loading analytics...</div>;
  }

  // 1. Current Month Data
  const now = new Date();
  const currentMonthStart = startOfMonth(now);
  const currentMonthEnd = endOfMonth(now);

  const currentMonthTxs = transactions.filter(tx =>
    isWithinInterval(tx.date, { start: currentMonthStart, end: currentMonthEnd })
  );

  const totalSpent = currentMonthTxs
    .filter(tx => tx.type === 'expense')
    .reduce((acc, tx) => acc + tx.amount, 0);

  const totalIncome = currentMonthTxs
    .filter(tx => tx.type === 'income')
    .reduce((acc, tx) => acc + tx.amount, 0);

  // 2. Category wise spending (Current Month)
  const categoryDataRaw = currentMonthTxs
    .filter(tx => tx.type === 'expense')
    .reduce((acc, tx) => {
      acc[tx.category] = (acc[tx.category] || 0) + tx.amount;
      return acc;
    }, {} as Record<string, number>);

  const categoryData = Object.entries(categoryDataRaw)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  // 3. Monthly Trend (Last 6 Months)
  const trendData = [];
  for (let i = 5; i >= 0; i--) {
    const monthDate = subMonths(now, i);
    const mStart = startOfMonth(monthDate);
    const mEnd = endOfMonth(monthDate);

    const mTxs = transactions.filter(tx => isWithinInterval(tx.date, { start: mStart, end: mEnd }));

    const mSpent = mTxs.filter(tx => tx.type === 'expense').reduce((acc, tx) => acc + tx.amount, 0);
    const mIncome = mTxs.filter(tx => tx.type === 'income').reduce((acc, tx) => acc + tx.amount, 0);

    trendData.push({
      name: format(monthDate, 'MMM'),
      expense: mSpent,
      income: mIncome
    });
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
  };

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Monthly Income</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">{formatCurrency(totalIncome)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Monthly Spending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600 dark:text-red-400">{formatCurrency(totalSpent)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Net Savings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${totalIncome - totalSpent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(totalIncome - totalSpent)}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Category Breakdown</CardTitle>
            <CardDescription>Where your money went this month</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            {categoryData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    fill="#8884d8"
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number | string) => formatCurrency(Number(value))} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-muted-foreground">No expenses this month</div>
            )}
          </CardContent>
        </Card>

        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>6-Month Trend</CardTitle>
            <CardDescription>Income vs Expense over time</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trendData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" />
                <YAxis tickFormatter={(value) => `₹${value}`} />
                <Tooltip formatter={(value: number | string) => formatCurrency(Number(value))} />
                <Legend />
                <Bar dataKey="income" name="Income" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="expense" name="Expense" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
