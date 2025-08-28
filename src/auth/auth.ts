'use server';

import {
  type NextAuthOptions,
  type User,
  type DefaultSession,
} from 'next-auth';
import { JWT, type DefaultJWT } from 'next-auth/jwt';
import CredentialsProvider from 'next-auth/providers/credentials';
import { cookies } from 'next/headers';
import NextAuth from 'next-auth';
import { authenticate } from '@/app/(auth)/signin/actions';

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
          const user = await authenticate(undefined, credentials as any);
          return user as User | null;
        } catch (e) {
          console.error(e);
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
