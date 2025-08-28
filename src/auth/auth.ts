
import {
  type NextAuthOptions,
  type User,
  type DefaultSession,
} from 'next-auth';
import { JWT, type DefaultJWT } from 'next-auth/jwt';
import CredentialsProvider from 'next-auth/providers/credentials';
import NextAuth from 'next-auth';
import { signInWithEmailAndPassword, db, doc, getDoc } from '@/lib/firebase';
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
          const userCredential = await signInWithEmailAndPassword(credentials.email as string, credentials.password as string);

          if (userCredential.user) {
            const userDoc = await getDoc(doc(db, "users", userCredential.user.uid));
            if (!userDoc.exists()) {
              throw new Error("User data not found in Firestore.");
            }
            const userData = userDoc.data();
            return {
              id: userDoc.id,
              name: userData?.fullName,
              email: userData?.email,
              school: userData?.school,
              role: userData?.role,
            } as User;
          }
          return null;

        } catch (error: any) {
          // Map Firebase auth errors to NextAuth errors
          let message = 'Invalid email or password.';
          if (error.code) {
            switch (error.code) {
              case 'auth/user-not-found':
              case 'auth/wrong-password':
              case 'auth/invalid-credential':
                message = 'Invalid email or password.';
                break;
              default:
                message = 'An unexpected error occurred. Please try again.';
            }
          }
          throw new Error(message);
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

export const { auth, signIn, signOut } = NextAuth(authOptions);
