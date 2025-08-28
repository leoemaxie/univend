'use server';

import { db } from '@/lib/firebase';
import { collection, writeBatch, doc } from 'firebase/firestore';
import { z } from 'zod';

const SchoolSchema = z.object({
  name: z.string().min(1),
  type: z.string().min(1),
  domain: z.string().min(1),
});

const SchoolsSchema = z.array(SchoolSchema);

type ActionResponse = {
  success: boolean;
  count?: number;
  error?: string;
};

export async function uploadSchools(schools: unknown): Promise<ActionResponse> {
  const validationResult = SchoolsSchema.safeParse(schools);
  if (!validationResult.success) {
    console.error('Invalid school data:', validationResult.error.flatten());
    return { success: false, error: 'Invalid data format.' };
  }

  const validatedSchools = validationResult.data;

  try {
    const batch = writeBatch(db);
    const schoolsCollection = collection(db, 'schools');
    
    validatedSchools.forEach((school) => {
      const docRef = doc(schoolsCollection, school.domain); // Use domain as a unique ID
      batch.set(docRef, {
        name: school.name,
        type: school.type,
        domain: school.domain,
      });
    });

    await batch.commit();

    return { success: true, count: validatedSchools.length };
  } catch (error) {
    console.error('Error writing to Firestore:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    return { success: false, error: `Failed to upload schools to Firestore. ${errorMessage}` };
  }
}
