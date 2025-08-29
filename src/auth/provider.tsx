'use client';
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { onAuthStateChanged, User, signOut as firebaseSignOut, updateProfile } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { Loader2 } from 'lucide-react';
import type { UserDetails } from '@/lib/types';


interface AuthContextType {
  user: User | null;
  userDetails: UserDetails | null;
  loading: boolean;
  signOut: () => void;
  refreshUserDetails: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userDetails, setUserDetails] = useState<UserDetails | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUserDetails = useCallback(async (user: User | null) => {
    if (user) {
        const userDocRef = doc(db, 'users', user.uid);
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
          setUserDetails(userDocSnap.data() as UserDetails);
        } else {
          setUserDetails(null);
        }
      } else {
        setUserDetails(null);
      }
  }, []);


  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      await fetchUserDetails(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [fetchUserDetails]);

  const signOut = async () => {
    await firebaseSignOut(auth);
    // User state will be updated by the onAuthStateChanged listener
  };
  
  const refreshUserDetails = useCallback(async () => {
    if(auth.currentUser) {
        await auth.currentUser.reload();
        const refreshedUser = auth.currentUser;
        setUser(refreshedUser);
        await fetchUserDetails(refreshedUser);
    }
  }, [fetchUserDetails]);

  if (loading) {
      return (
          <div className='flex h-screen w-full items-center justify-center'>
              <Loader2 className='h-12 w-12 animate-spin text-primary' />
          </div>
      )
  }

  return (
    <AuthContext.Provider value={{ user, userDetails, loading, signOut, refreshUserDetails }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
