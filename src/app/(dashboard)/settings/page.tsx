'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Shield, 
  Lock, 
  Trash2, 
  User, 
  Bell, 
  ChevronRight,
  Fingerprint,
  Smartphone,
  Eye,
  EyeOff
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { ClearHistoryDialog } from '@/components/ClearHistoryDialog';
import { useStore } from '@/lib/store';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';

export default function SettingsPage() {
  const [isClearHistoryOpen, setIsClearHistoryOpen] = useState(false);
  const { user, securitySettings, setSecuritySettings } = useStore();
  const { toast } = useToast();
  
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [showPin, setShowPin] = useState(false);

  useEffect(() => {
    // Load security settings from Firestore on mount
    if (user) {
      const loadSecurity = async () => {
        const userRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          const data = userSnap.data();
          if (data.security) {
            setSecuritySettings(data.security);
          }
        }
      };
      loadSecurity();
    }
  }, [user, setSecuritySettings]);

  const handleTogglePin = async () => {
    if (!user) return;
    
    const newEnabled = !securitySettings.pinEnabled;
    
    if (newEnabled) {
      setIsPinModalOpen(true);
    } else {
      // Disable PIN
      try {
        const userRef = doc(db, 'users', user.uid);
        await setDoc(userRef, {
          security: {
            pinEnabled: false,
            pin: null
          }
        }, { merge: true });
        setSecuritySettings({ pinEnabled: false, pin: null });
        toast({ title: "PIN Security disabled" });
      } catch (err: any) {
        toast({ title: "Error updating security", description: err.message, variant: "destructive" });
      }
    }
  };

  const handleSavePin = async () => {
    if (!user || pinInput.length !== 4) return;

    try {
      const userRef = doc(db, 'users', user.uid);
      await setDoc(userRef, {
        security: {
          pinEnabled: true,
          pin: pinInput
        }
      }, { merge: true });
      setSecuritySettings({ pinEnabled: true, pin: pinInput });
      setIsPinModalOpen(false);
      setPinInput('');
      toast({ title: "PIN Security enabled", description: "Your actions are now protected." });
    } catch (err: any) {
      toast({ title: "Error saving PIN", description: err.message, variant: "destructive" });
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-32">
      <div className="flex flex-col gap-2 px-1">
        <h1 className="text-3xl font-bold tracking-tight text-white">Settings</h1>
        <p className="text-white/60 text-sm">Manage your account preferences and security settings.</p>
      </div>

      <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
        {/* Account Section */}
        <Card className="glass-card border-white/10 bg-white/5 overflow-hidden">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-2xl bg-primary/20 text-primary">
                <User className="h-6 w-6" />
              </div>
              <div>
                <CardTitle className="text-xl font-bold">Profile</CardTitle>
                <CardDescription className="text-white/40">Personal information</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 pt-2">
            <div className="flex items-center justify-between p-4 rounded-2xl bg-white/5 hover:bg-white/10 transition-colors cursor-pointer group active:scale-[0.98]">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-lg">
                  {user?.name?.[0] || 'U'}
                </div>
                <div>
                  <p className="text-base font-bold text-white">{user?.name}</p>
                  <p className="text-xs text-white/40">{user?.email}</p>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-white/20 group-hover:text-white/60 transition-colors" />
            </div>
          </CardContent>
        </Card>

        {/* Security Section */}
        <Card className="glass-card border-white/10 bg-white/5 overflow-hidden">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-2xl bg-rose-500/20 text-rose-500">
                <Shield className="h-6 w-6" />
              </div>
              <div>
                <CardTitle className="text-xl font-bold">Security</CardTitle>
                <CardDescription className="text-white/40">Data protection</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-8 pt-2">
            {/* PIN Toggle */}
            <div className="flex items-center justify-between p-4 rounded-2xl bg-white/5">
              <div className="space-y-1">
                <Label className="text-base font-bold text-white">Security PIN</Label>
                <p className="text-xs text-white/40">Required for sensitive actions</p>
              </div>
              <button 
                onClick={handleTogglePin}
                className={`relative w-14 h-8 rounded-full transition-colors duration-300 focus:outline-none ${securitySettings.pinEnabled ? 'bg-primary shadow-[0_0_15px_rgba(99,102,241,0.5)]' : 'bg-white/10'}`}
              >
                <motion.div 
                  animate={{ x: securitySettings.pinEnabled ? 28 : 4 }}
                  className="absolute top-1.5 w-5 h-5 rounded-full bg-white shadow-lg"
                />
              </button>
            </div>

            <div className="pt-6 border-t border-white/5 space-y-4">
              <Label className="text-rose-400 font-bold flex items-center gap-2 ml-1">
                <Trash2 className="h-4 w-4" />
                DANGER ZONE
              </Label>
              <Button 
                variant="destructive" 
                onClick={() => setIsClearHistoryOpen(true)}
                className="w-full h-14 rounded-2xl bg-rose-500/10 hover:bg-rose-500 text-rose-500 hover:text-white border border-rose-500/20 transition-all duration-300 font-bold text-base"
              >
                <Lock className="h-5 w-5 mr-2" />
                Clear All History
              </Button>
              <p className="text-[11px] text-center text-white/30 px-4">
                Permanently delete all transactions, goals, and loans. This cannot be undone.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* PIN Modal - Bottom Sheet Style */}
      {isPinModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-md p-0 sm:p-4">
          <motion.div 
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="bg-[#0F172A] w-full max-w-lg sm:max-w-sm p-8 pb-12 sm:pb-8 space-y-8 rounded-t-[2.5rem] sm:rounded-[2rem] border-t sm:border border-white/10"
          >
            <div className="sm:hidden w-12 h-1.5 bg-white/10 rounded-full mx-auto -mt-2 mb-6" />
            
            <div className="text-center space-y-3">
              <div className="mx-auto w-16 h-16 rounded-3xl bg-primary/20 flex items-center justify-center mb-4 rotate-3">
                <Fingerprint className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-2xl font-bold text-white tracking-tight">Create PIN</h3>
              <p className="text-sm text-white/40 px-4">Set a 4-digit security PIN to protect your financial history.</p>
            </div>

            <div className="relative">
              <Input 
                type={showPin ? "text" : "password"}
                inputMode="numeric"
                maxLength={4}
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value.replace(/\D/g, ''))}
                className="text-center text-4xl tracking-[1.2em] font-black bg-white/5 border-white/10 h-20 rounded-2xl focus:ring-primary/40 pl-[1.2em]"
                placeholder="0000"
              />
              <button 
                onClick={() => setShowPin(!showPin)}
                className="absolute right-6 top-1/2 -translate-y-1/2 p-2 text-white/20 hover:text-white transition-colors"
              >
                {showPin ? <EyeOff className="h-6 w-6" /> : <Eye className="h-6 w-6" />}
              </button>
            </div>

            <div className="flex gap-4 pt-2">
              <Button variant="ghost" className="flex-1 h-14 rounded-2xl text-white/40 hover:text-white" onClick={() => setIsPinModalOpen(false)}>Cancel</Button>
              <Button 
                className="flex-[2] btn-premium h-14 rounded-2xl text-lg font-bold" 
                disabled={pinInput.length !== 4}
                onClick={handleSavePin}
              >
                Save PIN
              </Button>
            </div>
          </motion.div>
        </div>
      )}

      <ClearHistoryDialog 
        open={isClearHistoryOpen} 
        onOpenChange={setIsClearHistoryOpen} 
      />
    </div>
  );
}
