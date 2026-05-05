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
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight text-white">Settings</h1>
        <p className="text-white/60">Manage your account preferences and security settings.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Account Section */}
        <Card className="glass-card border-white/10 bg-white/5">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/20 text-primary">
                <User className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-lg">Account Profile</CardTitle>
                <CardDescription className="text-white/40">Manage your personal information</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-xl hover:bg-white/5 transition-colors cursor-pointer group">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white/60">
                  {user?.name?.[0] || 'U'}
                </div>
                <div>
                  <p className="text-sm font-medium text-white">{user?.name}</p>
                  <p className="text-xs text-white/40">{user?.email}</p>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-white/20 group-hover:text-white/60 transition-colors" />
            </div>
          </CardContent>
        </Card>

        {/* Security Section */}
        <Card className="glass-card border-white/10 bg-white/5">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-rose-500/20 text-rose-500">
                <Shield className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-lg">Security</CardTitle>
                <CardDescription className="text-white/40">Keep your financial data safe</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* PIN Toggle */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-white">Enable PIN</Label>
                <p className="text-xs text-white/40">Require 4-digit PIN for sensitive actions</p>
              </div>
              <button 
                onClick={handleTogglePin}
                className={`relative w-11 h-6 rounded-full transition-colors duration-200 focus:outline-none ${securitySettings.pinEnabled ? 'bg-primary' : 'bg-white/20'}`}
              >
                <motion.div 
                  animate={{ x: securitySettings.pinEnabled ? 22 : 2 }}
                  className="absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm"
                />
              </button>
            </div>

            <div className="pt-4 border-t border-white/5">
              <div className="space-y-4">
                <Label className="text-rose-400 font-semibold flex items-center gap-2">
                  <Trash2 className="h-4 w-4" />
                  Sensitive Actions
                </Label>
                <Button 
                  variant="destructive" 
                  onClick={() => setIsClearHistoryOpen(true)}
                  className="w-full flex items-center justify-center gap-2 bg-rose-500/10 hover:bg-rose-500 text-rose-500 hover:text-white border border-rose-500/20 transition-all duration-300 py-6 rounded-xl"
                >
                  <Lock className="h-4 w-4" />
                  Clear All History
                </Button>
                <p className="text-[10px] text-center text-white/20">
                  This will permanently delete all transactions, goals, and loans.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* PIN Modal */}
      {isPinModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-card no-hover w-full max-w-sm p-6 space-y-6 border-primary/20"
          >
            <div className="text-center space-y-2">
              <div className="mx-auto w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center mb-4">
                <Fingerprint className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-bold text-white">Set 4-Digit PIN</h3>
              <p className="text-sm text-white/60">Create a PIN to protect sensitive actions</p>
            </div>

            <div className="relative">
              <Input 
                type={showPin ? "text" : "password"}
                maxLength={4}
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value.replace(/\D/g, ''))}
                className="text-center text-2xl tracking-[1.5em] font-bold bg-white/5 border-white/10 h-16"
                placeholder="0000"
              />
              <button 
                onClick={() => setShowPin(!showPin)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white"
              >
                {showPin ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>

            <div className="flex gap-3">
              <Button variant="ghost" className="flex-1 text-white" onClick={() => setIsPinModalOpen(false)}>Cancel</Button>
              <Button 
                className="flex-1 fintech-gradient" 
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
