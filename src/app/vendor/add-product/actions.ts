'use server';

import {
  generateProductDescription,
  type GenerateProductDescriptionInput,
} from '@/ai/flows/generate-product-description';
import { db, storage } from '@/lib/firebase-admin';
import { auth } from '@/auth/auth';
import { z } from 'zod';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { v4 as uuidv4 } from 'uuid';
import { revalidatePath } from 'next/cache';

const ActionInputSchema = z.object({
  productTitle: z.string(),
  productCategory: z.string(),
});

type ActionResponse = {
  success: boolean;
  description?: string;
  error?: string;
};

export async function handleGenerateDescription(
  input: GenerateProductDescriptionInput
): Promise<ActionResponse> {
  const parsedInput = ActionInputSchema.safeParse(input);
  if (!parsedInput.success) {
    return { success: false, error: 'Invalid input.' };
  }

  try {
    const result = await generateProductDescription(parsedInput.data);
    return {
      success: true,
      description: result.productDescription,
    };
  } catch (error) {
    console.error('Error generating product description:', error);
    return {
      success: false,
      error: 'Failed to generate description. Please try again.',
    };
  }
}

const AddProductSchema = z.object({
  productTitle: z.string().min(5),
  productCategory: z.string(),
  productDescription: z.string().min(20),
  price: z.coerce.number().positive(),
  image: z.instanceof(File),
});

type AddProductResponse = {
    success: boolean;
    error?: string;
    productId?: string;
};

export async function addProduct(formData: FormData): Promise<AddProductResponse> {
    const session = await auth();
    if (!session?.user) {
        return { success: false, error: 'You must be logged in to add a product.' };
    }

    const rawData = Object.fromEntries(formData.entries());
    const validationResult = AddProductSchema.safeParse(rawData);

    if (!validationResult.success) {
        return { success: false, error: validationResult.error.flatten().fieldErrors.toString() };
    }
    
    const { productTitle, productCategory, productDescription, price, image } = validationResult.data;
    
    try {
        const productId = uuidv4();
        const imageRef = ref(storage, `products/${productId}/${image.name}`);

        const imageBuffer = Buffer.from(await image.arrayBuffer());
        await uploadBytes(imageRef, imageBuffer, {
          contentType: image.type,
        });

        const imageUrl = await getDownloadURL(imageRef);

        await db.collection('products').doc(productId).set({
            id: productId,
            vendorId: session.user.id,
            vendorName: session.user.name,
            university: session.user.school,
            title: productTitle,
            category: productCategory,
            description: productDescription,
            price,
            imageUrl,
            createdAt: new Date().toISOString(),
            status: 'available',
        });

        revalidatePath('/dashboard');
        revalidatePath('/products');

        return { success: true, productId };

    } catch (error) {
        console.error('Error adding product:', error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
        return { success: false, error: `Failed to add product. ${errorMessage}` };
    }
}
