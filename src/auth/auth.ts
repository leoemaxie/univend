'use server';

import {
  type NextAuthOptions,
  type User,
  type DefaultSession,
} from 'next-auth';
import { JWT, type DefaultJWT } from 'next-auth/jwt';
import CredentialsProvider from 'next-auth/providers/credentials';
import NextAuth from 'next-auth';
import { adminAuth, adminDb } from '@/lib/firebase';
import { AuthError } from 'next-auth';

declare module 'next-auth' {
  interface Session extends DefaultSession {
    user: {
      id: string;
      school: string;
      role: string;
    } & DefaultSession['user'];
  }

  interface User {
     school?: string;
     role?: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT extends DefaultJWT {
    id: string;
    school: string;
    role: string;
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        try {
          // This is a temporary way to sign in with NextAuth
          // In a real app, you would verify credentials against your DB
          // Here we're just using a dummy verification
          await new Promise((resolve) => {
              setTimeout(() => resolve({
                  email: credentials.email,
                  password: credentials.password
              }), 1000)
          })
          
          const userRecord = await adminAuth.getUserByEmail(credentials.email as string);
          const userDoc = await adminDb.collection('users').doc(userRecord.uid).get();
          
          if(!userDoc.exists){
              throw new Error("User data not found in Firestore.");
          }
      
          const userData = userDoc.data();

          return { 
            id: userDoc.id,
            name: userData?.fullName,
            email: userData?.email,
            school: userData?.school,
            role: userData?.role
          } as User;

        } catch (error) {
          if (error instanceof AuthError) {
            switch (error.type) {
              case 'CredentialsSignin':
                throw new Error('Invalid credentials.');
              default:
                throw new Error('Something went wrong.');
            }
          }
          if (error instanceof Error) {
            if((error as any).code === 'auth/user-not-found' || (error as any).code === 'auth/wrong-password' || error.message.includes('INVALID_LOGIN_CREDENTIALS')) {
              throw new Error('Invalid email or password.');
            }
          }
          console.error(error);
          return null;
        }
      },
    }),
  ],
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async jwt({ token, user }) {
        if (user) {
          token.id = user.id;
          token.email = user.email;
          token.name = user.name;
          token.school = user.school;
          token.role = user.role;
        }
        return token;
      },
      async session({ session, token }) {
        if (token && session.user) {
          session.user.id = token.id;
          session.user.email = token.email;
          session.user.name = token.name;
          session.user.school = token.school;
          session.user.role = token.role;
        }
        return session;
      },
  },
  pages: {
    signIn: '/signin',
  },
  secret: process.env.AUTH_SECRET,
};

export const {
  handlers: { GET, POST },
  auth,
  signIn,
  signOut,
} = NextAuth(authOptions);