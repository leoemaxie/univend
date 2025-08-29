
'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { db, auth } from '@/lib/firebase';
import { updateProfile as updateFirebaseProfile } from 'firebase/auth';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { v2 as cloudinary } from 'cloudinary';
import { v4 as uuidv4 } from 'uuid';

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

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
    const userSnap = await getDoc(userRef);
    
    if(!userSnap.exists()){
        return { success: false, error: "User not found." };
    }
    const existingData = userSnap.data();

    let photoURL: string | undefined = existingData.photoURL;

    // Handle photo upload
    if (photo && photo.size > 0) {
        const bytes = await photo.arrayBuffer();
        const buffer = Buffer.from(bytes);

        const uploadResult = await new Promise<any>((resolve, reject) => {
            cloudinary.uploader.upload_stream({
                folder: 'univend/avatars',
                public_id: userId,
                resource_type: 'image',
                overwrite: true,
            }, (error, result) => {
                if (error) reject(error);
                resolve(result);
            }).end(buffer);
        });

      if (!uploadResult || !uploadResult.secure_url) {
          throw new Error("Cloudinary upload failed.");
      }
      
      photoURL = uploadResult.secure_url;
    }
    
    // Prepare updates
    const transformedFirstName = toSentenceCase(firstName);
    const transformedLastName = toSentenceCase(lastName);
    const fullName = `${transformedFirstName} ${transformedLastName}`;
    
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

export async function saveFcmToken(userId: string, token: string): Promise<ActionResponse> {
    if (!userId || !token) {
      return { success: false, error: 'Invalid user ID or token.' };
    }
  
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, { fcmToken: token });
      return { success: true };
    } catch (error) {
      console.error('Error saving FCM token:', error);
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
      return { success: false, error: `Failed to save FCM token. ${errorMessage}` };
    }
}
