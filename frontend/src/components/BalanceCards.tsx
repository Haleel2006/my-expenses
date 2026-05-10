'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useStore } from '@/lib/store';
import { Wallet, IndianRupee, HandCoins, ArrowRightLeft, Target, Lock } from 'lucide-react';
import CountUp from 'react-countup';
import { motion } from 'framer-motion';

export function BalanceCards() {
  const { balances } = useStore();

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { opacity: 0, scale: 0.9, y: 20 },
    show: { opacity: 1, scale: 1, y: 0 }
  };

  return (
    <motion.div 
      variants={container}
      initial="hidden"
      animate="show"
      className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5"
    >
      <motion.div variants={item}>
        <Card className="fintech-gradient text-white border-none shadow-2xl glow-primary relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-125 transition-transform duration-500">
            <IndianRupee className="h-20 w-20" />
          </div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
            <CardTitle className="text-sm font-semibold opacity-80 uppercase tracking-wider">Total Balance</CardTitle>
            <div className="p-2 bg-white/10 rounded-lg">
              <IndianRupee className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-3xl font-bold tracking-tight">
              ₹<CountUp end={balances.totalBalance} duration={2} separator="," />
            </div>
            <p className="text-xs opacity-60 pt-2 font-medium">Overall Net Worth</p>
          </CardContent>
        </Card>
      </motion.div>
      
      <motion.div variants={item}>
        <Card className="glass-card group">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-white/60 uppercase tracking-wider">Wallet</CardTitle>
            <div className="p-2 bg-orange-500/10 rounded-lg text-orange-500 group-hover:bg-orange-500 group-hover:text-white transition-all duration-300">
              <Wallet className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              ₹<CountUp end={balances.wallet} duration={1.5} separator="," />
            </div>
            <p className="text-xs text-white/40 pt-2">Physical Currency</p>
          </CardContent>
        </Card>
      </motion.div>
      
      <motion.div variants={item}>
        <Card className="glass-card group">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-white/60 uppercase tracking-wider">Bank account</CardTitle>
            <div className="p-2 bg-blue-500/10 rounded-lg text-blue-500 group-hover:bg-blue-500 group-hover:text-white transition-all duration-300">
              <ArrowRightLeft className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              ₹<CountUp end={balances.bankAccount} duration={1.5} separator="," />
            </div>
            <p className="text-xs text-white/40 pt-2">UPI & Digital Balance</p>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div variants={item}>
        <Card className="glass-card group relative overflow-hidden">
          <div className="absolute -top-4 -right-4 text-indigo-500/10 group-hover:scale-150 transition-transform duration-700">
             <Target className="h-24 w-24" />
          </div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-white/60 uppercase tracking-wider flex items-center gap-2">
              Savings <Lock className="h-3 w-3" />
            </CardTitle>
            <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-400 glow-primary group-hover:bg-indigo-500 group-hover:text-white transition-all duration-300">
              <Target className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-indigo-400">
              ₹<CountUp end={balances.goalSavings} duration={1.5} separator="," />
            </div>
            <p className="text-xs text-white/40 pt-2">Locked Goal Funds</p>
          </CardContent>
        </Card>
      </motion.div>
      
      <motion.div variants={item}>
        <Card className="glass-card group">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-white/60 uppercase tracking-wider">Loans</CardTitle>
            <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-400 group-hover:bg-emerald-500 group-hover:text-white transition-all duration-300">
              <HandCoins className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-[10px] text-white/40 uppercase">Receivable</span>
                <span className="text-sm font-bold text-emerald-400">
                  +₹<CountUp end={balances.loansReceivable} duration={1} />
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[10px] text-white/40 uppercase">Payable</span>
                <span className="text-sm font-bold text-rose-400">
                  -₹<CountUp end={balances.loansPayable} duration={1} />
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
