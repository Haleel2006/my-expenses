'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertTriangle, Lock, Trash2, CheckCircle2 } from 'lucide-react';
import { auth } from '@/lib/firebase';
import { EmailAuthProvider, GoogleAuthProvider, reauthenticateWithCredential, signInWithPopup } from 'firebase/auth';
import { clearAllUserData } from '@/lib/api/goals';
import { useStore } from '@/lib/store';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

interface ClearHistoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type Step = 'pin' | 'confirm' | 'password' | 'final';

export function ClearHistoryDialog({ open, onOpenChange }: ClearHistoryDialogProps) {
  const { user, setBalances, securitySettings } = useStore();
  const [step, setStep] = useState<Step>(securitySettings.pinEnabled ? 'pin' : 'confirm');
  const [password, setPassword] = useState('');
  const [pin, setPin] = useState('');
  const [confirmText, setConfirmText] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pinError, setPinError] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const isGoogleUser = auth.currentUser?.providerData.some(p => p.providerId === 'google.com');

  const { toast } = useToast();
  const router = useRouter();

  const resetState = () => {
    setStep(securitySettings.pinEnabled ? 'pin' : 'confirm');
    setPassword('');
    setPin('');
    setConfirmText('');
    setError(null);
    setPinError(false);
    setIsVerifying(false);
    setIsDeleting(false);
  };

  const handleOpenChange = (val: boolean) => {
    if (!val) resetState();
    onOpenChange(val);
  };

  const handlePinVerify = () => {
    if (pin === securitySettings.pin) {
      setPinError(false);
      setStep('confirm');
    } else {
      setPinError(true);
      setPin('');
    }
  };

  const handleGoogleVerify = async () => {
    setIsVerifying(true);
    setError(null);
    try {
      const provider = new GoogleAuthProvider();
      if (auth.currentUser) {
        // For Google, we need to get a fresh credential via popup first
        const result = await signInWithPopup(auth, provider);
        const credential = GoogleAuthProvider.credentialFromResult(result);
        if (credential) {
          await reauthenticateWithCredential(auth.currentUser, credential);
          setStep('final');
        } else {
          throw new Error("Could not obtain Google credential");
        }
      }
    } catch (err: any) {
      setError('Google verification failed');
      console.error("Re-auth error:", err);
    } finally {
      setIsVerifying(false);
    }
  };

  const handlePasswordVerify = async () => {
    if (!user?.email || !password) return;
    setIsVerifying(true);
    setError(null);

    try {
      const credential = EmailAuthProvider.credential(user.email, password);
      if (auth.currentUser) {
        await reauthenticateWithCredential(auth.currentUser, credential);
        setStep('final');
      }
    } catch (err: any) {
      setError('Incorrect password');
      console.error(err);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleDelete = async () => {
    if (!user || confirmText !== 'DELETE ALL DATA') return;
    setIsDeleting(true);

    try {
      await clearAllUserData(user.uid);
      setBalances({ wallet: 0, bankAccount: 0, goalSavings: 0, loansReceivable: 0, loansPayable: 0 });
      toast({ 
        title: "History cleared successfully",
        description: "All your data has been permanently removed.",
      });
      handleOpenChange(false);
      router.refresh();
    } catch (err: any) {
      toast({ 
        title: "Error clearing data", 
        description: err.message, 
        variant: "destructive" 
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px] glass-card no-hover border-rose-500/30 bg-rose-950/20 backdrop-blur-xl text-white overflow-hidden border-none shadow-2xl">
        <AnimatePresence mode="wait">
          {step === 'pin' && (
            <motion.div
              key="pin"
              initial={{ opacity: 0, x: 20 }}
              animate={pinError ? {
                opacity: 1,
                x: [0, -10, 10, -10, 10, 0],
                transition: { duration: 0.4 }
              } : { opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <DialogHeader>
                <div className="mx-auto w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center mb-4">
                  <Lock className="h-6 w-6 text-primary" />
                </div>
                <DialogTitle className="text-center text-xl font-bold">Enter Security PIN</DialogTitle>
                <DialogDescription className="text-white/60 text-center mt-2">
                  PIN is required for sensitive actions
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-2">
                <Input 
                  type="password"
                  maxLength={4}
                  value={pin}
                  onChange={(e) => {
                    setPinError(false);
                    setPin(e.target.value.replace(/\D/g, ''));
                  }}
                  className={`text-center text-3xl tracking-[1.5em] font-bold bg-white/5 h-16 transition-colors ${pinError ? 'border-rose-500' : 'border-white/10'}`}
                  placeholder="0000"
                />
                {pinError && <p className="text-center text-xs text-rose-400 font-medium">Incorrect PIN. Please try again.</p>}
              </div>

              <DialogFooter>
                <Button 
                  onClick={handlePinVerify} 
                  disabled={pin.length !== 4}
                  className="w-full fintech-gradient border-none py-6 text-lg font-bold"
                >
                  Verify PIN
                </Button>
              </DialogFooter>
            </motion.div>
          )}

          {step === 'confirm' && (
            <motion.div
              key="confirm"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <DialogHeader>
                <div className="mx-auto w-12 h-12 rounded-full bg-rose-500/20 flex items-center justify-center mb-4">
                  <AlertTriangle className="h-6 w-6 text-rose-500" />
                </div>
                <DialogTitle className="text-center text-xl font-bold">⚠️ Confirm Data Deletion</DialogTitle>
                <DialogDescription className="text-rose-200/70 text-center mt-2">
                  This action will permanently delete all your financial records including:
                </DialogDescription>
              </DialogHeader>
              
              <ul className="space-y-2 text-sm text-rose-200/60 list-disc list-inside px-4">
                <li>Transactions</li>
                <li>Savings history</li>
                <li>Loan records</li>
                <li>Analytics data</li>
              </ul>
              
              <p className="text-sm font-semibold text-rose-400 text-center">
                This cannot be undone.
              </p>

              <DialogFooter className="flex-col sm:flex-row gap-2">
                <Button variant="ghost" onClick={() => handleOpenChange(false)} className="flex-1 text-white hover:bg-white/10">
                  Cancel
                </Button>
                <Button onClick={() => setStep('password')} className="flex-1 bg-rose-600 hover:bg-rose-700 text-white border-none shadow-lg shadow-rose-900/20">
                  Continue
                </Button>
              </DialogFooter>
            </motion.div>
          )}

          {step === 'password' && (
            <motion.div
              key="password"
              initial={{ opacity: 0, x: 20 }}
              animate={error ? {
                opacity: 1,
                x: [0, -10, 10, -10, 10, 0],
                transition: { duration: 0.4 }
              } : { opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <DialogHeader>
                <div className="mx-auto w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center mb-4">
                  <Lock className="h-6 w-6 text-blue-400" />
                </div>
                <DialogTitle className="text-center text-xl font-bold">🔒 Security Verification</DialogTitle>
                <DialogDescription className="text-white/60 text-center mt-2">
                  {isGoogleUser ? 'Please verify your identity with Google' : 'Enter your account password to continue'}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-2">
                {!isGoogleUser ? (
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input 
                      id="password" 
                      type="password" 
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        setError(null);
                      }}
                      className="bg-white/5 border-white/10 text-white placeholder:text-white/20"
                      placeholder="••••••••"
                    />
                    {error && <p className="text-xs text-rose-400 font-medium">{error}</p>}
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-4">
                     <Button 
                        onClick={handleGoogleVerify} 
                        disabled={isVerifying}
                        className="w-full bg-white text-black hover:bg-white/90 font-bold flex items-center justify-center gap-2"
                      >
                        {isVerifying ? "Verifying..." : "Verify with Google"}
                      </Button>
                      {error && <p className="text-xs text-rose-400 font-medium">{error}</p>}
                  </div>
                )}
              </div>

              <DialogFooter className="flex-col sm:flex-row gap-2">
                <Button variant="ghost" onClick={() => setStep('confirm')} className="flex-1 text-white hover:bg-white/10">
                  Back
                </Button>
                {!isGoogleUser && (
                  <Button 
                    onClick={handlePasswordVerify} 
                    disabled={!password || isVerifying}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white border-none shadow-lg shadow-blue-900/20"
                  >
                    {isVerifying ? "Verifying..." : "Verify"}
                  </Button>
                )}
              </DialogFooter>
            </motion.div>
          )}

          {step === 'final' && (
            <motion.div
              key="final"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <DialogHeader>
                <div className="mx-auto w-12 h-12 rounded-full bg-rose-500/20 flex items-center justify-center mb-4">
                  <Trash2 className="h-6 w-6 text-rose-500" />
                </div>
                <DialogTitle className="text-center text-xl font-bold text-rose-500">Final Confirmation</DialogTitle>
                <DialogDescription className="text-white/60 text-center mt-2">
                  Type the text below to confirm permanent deletion
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-2">
                <div className="bg-rose-500/10 border border-rose-500/20 rounded-lg p-3 text-center">
                  <span className="text-lg font-mono font-bold tracking-widest text-rose-500">DELETE ALL DATA</span>
                </div>
                
                <div className="space-y-2">
                  <Input 
                    value={confirmText}
                    onChange={(e) => setConfirmText(e.target.value)}
                    className="bg-white/5 border-white/10 text-white placeholder:text-white/20 text-center font-bold tracking-wide"
                    placeholder="Type the text here"
                  />
                </div>
              </div>

              <DialogFooter>
                <Button 
                  onClick={handleDelete} 
                  disabled={confirmText !== 'DELETE ALL DATA' || isDeleting}
                  className="w-full bg-rose-600 hover:bg-rose-700 text-white border-none shadow-xl shadow-rose-900/40 py-6 text-lg font-bold"
                >
                  {isDeleting ? "Deleting..." : "Permanently Delete Everything"}
                </Button>
              </DialogFooter>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
