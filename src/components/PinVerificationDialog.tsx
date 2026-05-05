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
import { Lock, Fingerprint } from 'lucide-react';
import { useStore } from '@/lib/store';

interface PinVerificationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  title?: string;
  description?: string;
}

export function PinVerificationDialog({ 
  open, 
  onOpenChange, 
  onSuccess,
  title = "Security PIN Required",
  description = "Enter your 4-digit PIN to continue with this sensitive action."
}: PinVerificationDialogProps) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  const { securitySettings } = useStore();

  const handleVerify = () => {
    if (pin === securitySettings.pin) {
      setError(false);
      onSuccess();
      onOpenChange(false);
      setPin('');
    } else {
      setError(true);
      setPin('');
      // Shake animation trigger
    }
  };

  return (
    <Dialog open={open} onOpenChange={(val) => {
      if (!val) {
        setPin('');
        setError(false);
      }
      onOpenChange(val);
    }}>
      <DialogContent className="sm:max-w-[350px] glass-card no-hover border-primary/20 bg-primary-950/20 backdrop-blur-xl text-white border-none shadow-2xl">
        <div className="space-y-6">
          <DialogHeader>
            <div className="mx-auto w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center mb-4">
              <Fingerprint className="h-6 w-6 text-primary" />
            </div>
            <DialogTitle className="text-center text-xl font-bold">{title}</DialogTitle>
            <DialogDescription className="text-white/60 text-center mt-2">
              {description}
            </DialogDescription>
          </DialogHeader>

          <motion.div 
            animate={error ? {
              x: [0, -10, 10, -10, 10, 0],
              transition: { duration: 0.4 }
            } : {}}
            className="space-y-4"
          >
            <Input 
              type="password"
              maxLength={4}
              value={pin}
              onChange={(e) => {
                setError(false);
                setPin(e.target.value.replace(/\D/g, ''));
              }}
              autoFocus
              className={`text-center text-3xl tracking-[1.5em] font-bold bg-white/5 h-16 transition-colors ${error ? 'border-rose-500 bg-rose-500/10' : 'border-white/10'}`}
              placeholder="0000"
              onKeyDown={(e) => e.key === 'Enter' && handleVerify()}
            />
            {error && <p className="text-center text-xs text-rose-400 font-medium">Incorrect PIN. Please try again.</p>}
          </motion.div>

          <DialogFooter>
            <Button 
              onClick={handleVerify} 
              disabled={pin.length !== 4}
              className="w-full fintech-gradient border-none py-6 text-lg font-bold"
            >
              Verify & Continue
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
