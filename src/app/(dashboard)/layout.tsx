'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { auth } from '@/lib/firebase';
import { signOut } from 'firebase/auth';
import { LayoutDashboard, Calendar, CreditCard, PieChart, Lightbulb, LogOut, Menu, Target, Trash2, X, Settings, Plus, List } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useStore } from '@/lib/store';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useToast } from '@/hooks/use-toast';
import { fetchBalances } from '@/lib/api/transactions';
import { motion, AnimatePresence } from 'framer-motion';
import { AddTransactionDialog } from '@/components/AddTransactionDialog';

const navItems = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Transactions', href: '/calendar', icon: List },
  { name: 'Loans', href: '/loans', icon: CreditCard },
  { name: 'Goals', href: '/goals', icon: Target },
  { name: 'Analytics', href: '/analytics', icon: PieChart },
  { name: 'Insights', href: '/insights', icon: Lightbulb },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isLoading, setBalances } = useStore();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [isAddOpen, setIsAddOpen] = useState(false);

  useEffect(() => {
    if (user) {
      fetchBalances(user.uid).then((data) => {
        if (data) {
          setBalances({
            wallet: data.wallet || 0,
            bankAccount: data.bankAccount || 0,
            loansReceivable: data.loansReceivable || 0,
            loansPayable: data.loansPayable || 0,
            goalSavings: data.goalSavings || 0,
          });
        }
      });
    }
  }, [user, setBalances]);

  const handleLogout = async () => {
    await signOut(auth);
    router.push('/login');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen premium-bg">
        <div className="blob blob-1" />
        <div className="blob blob-2" />
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full"
        />
      </div>
    );
  }

  const SidebarContent = () => (
    <div className="flex h-full flex-col p-4">
      <div className="flex items-center gap-3 px-2 mb-8">
        <div className="w-10 h-10 rounded-xl fintech-gradient flex items-center justify-center shadow-lg glow-primary">
          <PieChart className="h-6 w-6 text-white" />
        </div>
        <span className="text-xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60">Expenso</span>
      </div>
      
      <nav className="flex-1 space-y-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={() => setOpen(false)}
              className="relative group flex items-center gap-3 rounded-xl px-4 py-3 transition-all duration-300"
            >
              {isActive && (
                <motion.div 
                  layoutId="activeNav"
                  className="absolute inset-0 bg-primary/20 rounded-xl border border-primary/30 glow-primary"
                />
              )}
              <item.icon className={`h-5 w-5 transition-colors ${isActive ? "text-primary" : "text-white/60 group-hover:text-white"}`} />
              <span className={`font-medium transition-colors ${isActive ? "text-white" : "text-white/60 group-hover:text-white"}`}>
                {item.name}
              </span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto pt-4 border-t border-white/10 space-y-4">
        <div className="flex items-center gap-3 px-2">
          <div className="flex-1 truncate">
            <p className="text-sm font-semibold text-white">{user?.name || 'User'}</p>
            <p className="text-xs text-white/40 truncate">{user?.email}</p>
          </div>
          <button 
            onClick={handleLogout}
            className="p-2 rounded-lg hover:bg-white/10 text-white/60 hover:text-white transition-all"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen w-full relative safe-area-inset">
      <div className="premium-bg" />
      <div className="blob blob-1" />
      <div className="blob blob-2" />
      <div className="blob blob-3" />

      <div className="grid md:grid-cols-[240px_1fr] lg:grid-cols-[280px_1fr] h-screen overflow-hidden">
        {/* Desktop Sidebar */}
        <aside className="hidden md:block m-4 mr-0 glass-card">
          <SidebarContent />
        </aside>

        {/* Main Content Area */}
        <div className="flex flex-col h-screen overflow-hidden">
          <header className="md:hidden flex h-16 items-center justify-between px-6 bg-transparent">
             <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg fintech-gradient flex items-center justify-center shadow-lg">
                  <PieChart className="h-5 w-5 text-white" />
                </div>
                <span className="font-bold text-lg">Expenso</span>
             </div>
             <Sheet open={open} onOpenChange={setOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="text-white">
                    <Menu className="h-6 w-6" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="p-0 w-72 glass-card border-none">
                  <SidebarContent />
                </SheetContent>
             </Sheet>
          </header>

          <main className="flex-1 overflow-y-auto overflow-x-hidden px-4 py-6 md:p-8 lg:p-10 custom-scrollbar">
            <AnimatePresence mode="popLayout">
              <motion.div
                key={pathname}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="max-w-7xl mx-auto w-full pb-24 md:pb-0"
              >
                {children}
              </motion.div>
            </AnimatePresence>
          </main>
        </div>
      </div>

      {/* Mobile Bottom Nav - Native App Style */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-[72px] bg-[#0F172A]/80 backdrop-blur-2xl border-t border-white/5 flex items-center justify-around px-2 z-50 pb-safe">
        <Link href="/dashboard" className="flex flex-col items-center gap-1 flex-1">
          <LayoutDashboard className={`h-6 w-6 transition-colors ${pathname === '/dashboard' ? "text-primary" : "text-white/40"}`} />
          <span className={`text-[10px] font-medium ${pathname === '/dashboard' ? "text-white" : "text-white/40"}`}>Dashboard</span>
        </Link>
        
        <Link href="/calendar" className="flex flex-col items-center gap-1 flex-1">
          <List className={`h-6 w-6 transition-colors ${pathname === '/calendar' ? "text-primary" : "text-white/40"}`} />
          <span className={`text-[10px] font-medium ${pathname === '/calendar' ? "text-white" : "text-white/40"}`}>History</span>
        </Link>

        <div className="flex-1 flex justify-center -translate-y-4">
          <button 
            onClick={() => setIsAddOpen(true)}
            className="w-14 h-14 rounded-full fintech-gradient flex items-center justify-center shadow-2xl shadow-primary/40 border-4 border-[#0F172A] active:scale-90 transition-transform"
          >
            <Plus className="h-8 w-8 text-white" />
          </button>
        </div>

        <Link href="/goals" className="flex flex-col items-center gap-1 flex-1">
          <Target className={`h-6 w-6 transition-colors ${pathname === '/goals' ? "text-primary" : "text-white/40"}`} />
          <span className={`text-[10px] font-medium ${pathname === '/goals' ? "text-white" : "text-white/40"}`}>Goals</span>
        </Link>

        <Link href="/settings" className="flex flex-col items-center gap-1 flex-1">
          <Settings className={`h-6 w-6 transition-colors ${pathname === '/settings' ? "text-primary" : "text-white/40"}`} />
          <span className={`text-[10px] font-medium ${pathname === '/settings' ? "text-white" : "text-white/40"}`}>Settings</span>
        </Link>
      </nav>

      <AddTransactionDialog 
        open={isAddOpen} 
        onOpenChange={setIsAddOpen} 
        type="expense"
        onSuccess={() => {
          setIsAddOpen(false);
          router.refresh();
        }}
      />
    </div>
  );
}
