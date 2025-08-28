'use server'

import { adminAuth, adminDb } from "@/lib/firebase";
import { signIn } from "@/auth/auth";

type SignUpState = {
    message: string | null;
    success?: boolean;
}

export async function signup(prevState: SignUpState, formData: FormData): Promise<SignUpState> {
    const { fullName, email, school, role, password } = Object.fromEntries(formData.entries());

    try {
        if(!fullName || !email || !school || !role || !password){
            return { message: "All fields are required" };
        }
        
        const userRecord = await adminAuth.createUser({
            email: email as string,
            password: password as string,
            displayName: fullName as string,
        });

        await adminDb.collection('users').doc(userRecord.uid).set({
            fullName,
            email,
            school,
            role,
            createdAt: new Date().toISOString()
        });
        
        await signIn('credentials', {
            email,
            password,
            redirect: false,
        })
        
        return { message: "Account created successfully!", success: true };

    } catch (error: any) {
        let message = "An unknown error occurred.";
        if(error.code === 'auth/email-already-exists'){
            message = "This email is already registered. Please sign in.";
        } else if (error.message){
            message = error.message;
        }

        return { message };
    }
}
