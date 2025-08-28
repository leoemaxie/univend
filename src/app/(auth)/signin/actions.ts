'use server';
import { signIn as nextAuthSignIn } from '@/auth/auth';
import { adminAuth, adminDb } from '@/lib/firebase';
import { AuthError } from 'next-auth';

export async function authenticate(
  prevState: string | undefined,
  formData: FormData
) {
  try {
    const { email, password } = Object.fromEntries(formData.entries());
    
    // This is a temporary way to sign in with NextAuth
    // In a real app, you would verify credentials against your DB
    // Here we're just using a dummy verification
    const user = await new Promise((resolve) => {
        setTimeout(() => resolve({
            email,
            password
        }), 1000)
    })

    if(!user){
        return "Invalid credentials"
    }

    await nextAuthSignIn('credentials', { email, password, redirect: false });

    // The logic below is to get user data for NextAuth session
    // This should ideally be a single DB call
    const userRecord = await adminAuth.getUserByEmail(email as string);
    const userDoc = await adminDb.collection('users').doc(userRecord.uid).get();
    
    if(!userDoc.exists){
        throw new Error("User data not found in Firestore.");
    }

    return { ...userDoc.data(), id: userDoc.id };

  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case 'CredentialsSignin':
          return 'Invalid credentials.';
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
