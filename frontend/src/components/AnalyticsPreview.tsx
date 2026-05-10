'use client';

import { useState, useEffect } from 'react';
import { useStore } from '@/lib/store';
import { fetchTransactions, Transaction } from '@/lib/api/transactions';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format, subMonths, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import { motion } from 'framer-motion';

export function AnalyticsPreview() {
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
    return (
      <div className="space-y-4 p-6">
        <Skeleton className="h-4 w-[250px] shimmer rounded-full" />
        <Skeleton className="h-[200px] w-full shimmer rounded-2xl" />
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <div className="flex h-[250px] items-center justify-center text-sm text-white/40 italic">
        No transaction data available yet.
      </div>
    );
  }

  // Monthly Trend (Last 6 Months)
  const now = new Date();
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
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="h-[300px] w-full p-4 relative"
    >
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
            </linearGradient>
            <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff10" />
          <XAxis 
            dataKey="name" 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: '#ffffff60', fontSize: 12 }}
            dy={10}
          />
          <YAxis 
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#ffffff60', fontSize: 10 }}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: 'rgba(15, 23, 42, 0.9)', 
              borderRadius: '12px', 
              border: '1px solid rgba(255,255,255,0.1)',
              backdropFilter: 'blur(8px)',
              boxShadow: '0 10px 30px rgba(0,0,0,0.5)'
            }}
            itemStyle={{ fontSize: '12px' }}
            formatter={(value: any) => [formatCurrency(value), '']}
          />
          <Area 
            type="monotone" 
            dataKey="income" 
            stroke="#10b981" 
            strokeWidth={3}
            fillOpacity={1} 
            fill="url(#colorIncome)" 
          />
          <Area 
            type="monotone" 
            dataKey="expense" 
            stroke="#ef4444" 
            strokeWidth={3}
            fillOpacity={1} 
            fill="url(#colorExpense)" 
          />
        </AreaChart>
      </ResponsiveContainer>
    </motion.div>
  );
}
