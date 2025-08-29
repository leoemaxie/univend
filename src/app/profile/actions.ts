
'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { db, auth, updateProfile as updateFirebaseProfile } from '@/lib/firebase';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { supabase } from '@/lib/supabase';
import { v4 as uuidv4 } from 'uuid';

const toSentenceCase = (str: string) => {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

const UpdateProfileSchema = z.object({
  firstName: z.string().min(2),
  lastName: z.string().min(2),
  address: z.string().optional(),
  photo: z.instanceof(File).optional(),
  userId: z.string(),
  // Vendor fields
  companyName: z.string().optional(),
  companyDescription: z.string().optional(),
  companyCategory: z.string().optional(),
  companyAddress: z.string().optional(),
});

type ActionResponse = {
  success: boolean;
  error?: string;
};

export async function updateProfile(formData: FormData): Promise<ActionResponse> {
  const rawData = Object.fromEntries(formData.entries());
  const validationResult = UpdateProfileSchema.safeParse(rawData);

  if (!validationResult.success) {
    console.error("Profile validation error:", validationResult.error.flatten());
    return { success: false, error: "Invalid data provided." };
  }

  const { userId, firstName, lastName, address, photo, ...vendorData } = validationResult.data;

  try {
    const userRef = doc(db, "users", userId);
    let photoURL: string | undefined = undefined;

    // Handle photo upload
    if (photo && photo.size > 0) {
      const imagePath = `avatars/${userId}/${uuidv4()}-${photo.name}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(imagePath, photo, { upsert: true });

      if (uploadError) {
        throw new Error(`Supabase upload error: ${uploadError.message}`);
      }
      
      const { data: publicUrlData } = supabase.storage
          .from('avatars')
          .getPublicUrl(imagePath);

      if (!publicUrlData) {
          throw new Error("Could not get public URL for the uploaded image.");
      }
      
      photoURL = publicUrlData.publicUrl;
    }
    
    // Prepare updates
    const transformedFirstName = toSentenceCase(firstName);
    const transformedLastName = toSentenceCase(lastName);
    const fullName = `${transformedFirstName} ${transformedLastName}`;

    const userInAuth = auth.currentUser;
    if (!userInAuth || userInAuth.uid !== userId) {
        return { success: false, error: "Authentication mismatch." };
    }

    // Update Firebase Auth Profile
    await updateFirebaseProfile(userInAuth, {
      displayName: fullName,
      ...(photoURL && { photoURL }),
    });
    
    const updates: Record<string, any> = {
        firstName: transformedFirstName,
        lastName: transformedLastName,
        fullName,
        address: address || '',
        ...(photoURL && { photoURL }),
        companyName: vendorData.companyName || '',
        companyDescription: vendorData.companyDescription || '',
        companyCategory: vendorData.companyCategory || '',
        companyAddress: vendorData.companyAddress || '',
    };

    // Update Firestore user document
    await updateDoc(userRef, updates);

    revalidatePath('/profile');
    revalidatePath('/dashboard');
    return { success: true };

  } catch (error) {
    console.error("Error updating profile:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
    return { success: false, error: `Failed to update profile. ${errorMessage}` };
  }
}

const UpdateRoleSchema = z.object({
  userId: z.string(),
  role: z.enum(['buyer', 'vendor', 'rider', 'superadminx']),
});

export async function updateUserRole(userId: string, role: string): Promise<ActionResponse> {
    const validationResult = UpdateRoleSchema.safeParse({ userId, role });
  
    if (!validationResult.success) {
      return { success: false, error: "Invalid role data." };
    }

    const { userId: validatedUserId, role: validatedRole } = validationResult.data;

    try {
        const userRef = doc(db, "users", validatedUserId);
        const userSnap = await getDoc(userRef);
        if(!userSnap.exists()){
            return { success: false, error: "User not found." };
        }

        await updateDoc(userRef, { role: validatedRole });

        revalidatePath('/profile');
        revalidatePath('/dashboard');
        
        return { success: true };
    } catch(error) {
        console.error("Error updating role:", error);
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
        return { success: false, error: `Failed to update role. ${errorMessage}` };
    }
}
