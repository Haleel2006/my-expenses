'use client';

import { useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { useStore } from '@/lib/store';
import { useRouter, usePathname } from 'next/navigation';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setUser, setIsLoading, resetStore } = useStore();
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();

  useEffect(() => {
    if (!auth) {
      setIsLoading(false);
      return;
    }
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log("Auth state changed:", firebaseUser ? `Logged in as ${firebaseUser.email}` : "Logged out");
      
      if (firebaseUser) {
        // Check if user profile exists in Firestore, if not create one (e.g. for Google Sign In)
        const userRef = doc(db, 'users', firebaseUser.uid, 'profile', 'info');
        console.log("Checking Firestore profile for:", firebaseUser.uid);
        
        try {
          const userSnap = await getDoc(userRef);
          
          if (!userSnap.exists()) {
            console.log("Profile not found, creating new profile...");
            await setDoc(userRef, {
              name: firebaseUser.displayName || '',
              email: firebaseUser.email,
              createdAt: new Date(),
              preferences: { currency: 'INR' }
            });
            
            // Also initialize balances document
            const balanceRef = doc(db, 'users', firebaseUser.uid, 'balances', 'current');
            await setDoc(balanceRef, {
              cash: 0,
              googlePay: 0,
              loansReceivable: 0,
              loansPayable: 0,
              goalSavings: 0,
              lastUpdated: new Date()
            });
            console.log("Profile and balances initialized.");
          } else {
            console.log("Profile found.");
          }
        } catch (error) {
          console.error("Firestore error in AuthProvider:", error);
          toast({
            title: "Database Error",
            description: "Failed to load user profile. Check Firestore rules.",
            variant: "destructive"
          });
        }

        setUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          name: firebaseUser.displayName,
        });

        if (pathname === '/login' || pathname === '/signup' || pathname === '/') {
          router.push('/dashboard');
        }
      } else {
        resetStore();
        if (pathname !== '/login' && pathname !== '/signup') {
          router.push('/login');
        }
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [setUser, setIsLoading, resetStore, router, pathname, toast]);

  return <>{children}</>;
}
