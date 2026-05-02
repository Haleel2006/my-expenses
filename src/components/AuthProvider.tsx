'use client';

import { useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { useStore } from '@/lib/store';
import { useRouter, usePathname } from 'next/navigation';
import { doc, getDoc, setDoc } from 'firebase/firestore';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setUser, setIsLoading } = useStore();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Check if user profile exists in Firestore, if not create one (e.g. for Google Sign In)
        const userRef = doc(db, 'users', firebaseUser.uid, 'profile', 'info');
        const userSnap = await getDoc(userRef);
        
        if (!userSnap.exists()) {
          try {
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
              lastUpdated: new Date()
            });
          } catch (error) {
            console.error("Error creating user profile:", error);
          }
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
        setUser(null);
        if (pathname !== '/login' && pathname !== '/signup') {
          router.push('/login');
        }
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [setUser, setIsLoading, router, pathname]);

  return <>{children}</>;
}
