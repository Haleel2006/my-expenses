'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { auth } from '@/lib/firebase';
import { signOut } from 'firebase/auth';
import { LayoutDashboard, Calendar, CreditCard, PieChart, Lightbulb, LogOut, Menu, Target, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useStore } from '@/lib/store';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { clearAllUserData } from '@/lib/api/goals';
import { useToast } from '@/hooks/use-toast';
import { useEffect } from 'react';
import { fetchBalances } from '@/lib/api/transactions';

const navItems = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Calendar', href: '/calendar', icon: Calendar },
  { name: 'Loans', href: '/loans', icon: CreditCard },
  { name: 'Savings Goals', href: '/goals', icon: Target },
  { name: 'Analytics', href: '/analytics', icon: PieChart },
  { name: 'Insights', href: '/insights', icon: Lightbulb },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isLoading, setBalances } = useStore();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (user) {
      fetchBalances(user.uid).then((data) => {
        if (data) {
          setBalances({
            cash: data.cash || 0,
            googlePay: data.googlePay || 0,
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

  const handleClearData = async () => {
    if (!user) return;
    if (!confirm("Are you sure you want to clear all history? This cannot be undone.")) return;
    
    try {
      await clearAllUserData(user.uid);
      setBalances({ cash: 0, googlePay: 0, goalSavings: 0, loansReceivable: 0, loansPayable: 0 });
      toast({ title: "History cleared successfully" });
      router.refresh();
    } catch (error: unknown) {
      const err = error as Error;
      toast({ title: "Error clearing data", description: err.message, variant: "destructive" });
    }
  };

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  const SidebarContent = () => (
    <div className="flex h-full flex-col">
      <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
        <Link href="/dashboard" className="flex items-center gap-2 font-semibold">
          <PieChart className="h-6 w-6 text-primary" />
          <span className="">Expenso</span>
        </Link>
      </div>
      <div className="flex-1 overflow-auto py-2">
        <nav className="grid items-start px-2 text-sm font-medium lg:px-4">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setOpen(false)}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-all ${
                  isActive 
                    ? "bg-muted text-primary" 
                    : "text-muted-foreground hover:bg-muted hover:text-primary"
                }`}
              >
                <item.icon className="h-4 w-4" />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </div>
      <div className="mt-auto p-4 border-t space-y-2">
        <Button 
          variant="ghost" 
          size="sm" 
          className="w-full justify-start gap-3 text-destructive hover:text-destructive hover:bg-destructive/10"
          onClick={handleClearData}
        >
          <Trash2 className="h-4 w-4" />
          Clear All History
        </Button>
        <div className="flex items-center gap-3 px-2 py-2">
          <div className="flex-1 truncate">
            <p className="text-sm font-medium">{user?.name || 'User'}</p>
            <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
          </div>
          <Button variant="ghost" size="icon" onClick={handleLogout} title="Log out">
            <LogOut className="h-4 w-4" />
            <span className="sr-only">Log out</span>
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
      <div className="hidden border-r bg-muted/40 md:block">
        <SidebarContent />
      </div>
      <div className="flex flex-col">
        <header className="flex h-14 items-center gap-4 border-b bg-muted/40 px-4 lg:h-[60px] lg:px-6">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="shrink-0 md:hidden">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle navigation menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="flex flex-col p-0 w-72">
              <SidebarContent />
            </SheetContent>
          </Sheet>
          <div className="w-full flex-1">
            {/* Header Title or Global Search could go here */}
            <h1 className="font-semibold text-lg sm:hidden">Expenso</h1>
          </div>
        </header>
        <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6 bg-background">
          {children}
        </main>
      </div>
    </div>
  );
}
