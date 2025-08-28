'use client';
import type { Session } from 'next-auth';
import { SessionProvider, useSession, signIn, signOut } from 'next-auth/react';

type AuthProviderProps = {
  children: React.ReactNode;
  session: Session | null;
};

export const AuthProvider = ({ children, session }: AuthProviderProps) => {
  return <SessionProvider session={session}>{children}</SessionProvider>;
};

export { useSession, signIn, signOut };
