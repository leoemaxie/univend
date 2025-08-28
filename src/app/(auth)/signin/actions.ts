'use server';
import { signIn } from '@/auth/auth';
import { AuthError } from 'next-auth';

export async function authenticate(
  prevState: string | undefined,
  formData: FormData
) {
  try {
    const { email, password } = Object.fromEntries(formData.entries());
    await signIn('credentials', { email, password, redirect: false, redirectTo: '/' });
    
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case 'CredentialsSignin':
          return 'Invalid credentials.';
        case 'CallbackRouteError':
          return error.cause?.err?.message;
        default:
          return 'Something went wrong.';
      }
    }
    
    if (error instanceof Error) {
        if(error.message.includes('INVALID_LOGIN_CREDENTIALS')){
            return 'Invalid email or password.';
        }
        return error.message;
    }
    throw error;
  }
}
