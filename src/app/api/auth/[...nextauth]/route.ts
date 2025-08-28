import NextAuth from 'next-auth';
import { authOptions } from '@/auth/auth';

const handlers = NextAuth(authOptions);
export const { GET, POST } = handlers;
