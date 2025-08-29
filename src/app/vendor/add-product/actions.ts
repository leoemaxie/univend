
'use server';

import {
  generateProductDescription,
  type GenerateProductDescriptionInput,
} from '@/ai/flows/generate-product-description';
import { db } from '@/lib/firebase';
import { supabase } from '@/lib/supabase';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { revalidatePath } from 'next/cache';
import { setDoc, doc } from 'firebase/firestore';


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
    userId: z.string(),
    userName: z.string(),
    userSchool: z.string(),
});

type AddProductResponse = {
    success: boolean;
    error?: string;
    productId?: string;
};

export async function addProduct(formData: FormData): Promise<AddProductResponse> {
    const rawData = Object.fromEntries(formData.entries());
    const validationResult = AddProductSchema.safeParse(rawData);

    if (!validationResult.success) {
        console.error("Add Product Validation Error:", validationResult.error.flatten());
        return { success: false, error: "Invalid product data provided." };
    }
    
    const { productTitle, productCategory, productDescription, price, image, userId, userName, userSchool } = validationResult.data;
    
    try {
        const productId = uuidv4();
        const imagePath = `products/${productId}/${image.name}`;

        const { error: uploadError } = await supabase.storage
          .from('products')
          .upload(imagePath, image);

        if (uploadError) {
          throw new Error(`Supabase upload error: ${uploadError.message}`);
        }
        
        const { data: publicUrlData } = supabase.storage
            .from('products')
            .getPublicUrl(imagePath);

        if (!publicUrlData) {
            throw new Error("Could not get public URL for the uploaded image.");
        }
        
        const imageUrl = publicUrlData.publicUrl;


        await setDoc(doc(db, "products", productId), {
            id: productId,
            vendorId: userId,
            vendorName: userName,
            university: userSchool,
            title: productTitle,
            category: productCategory,
            description: productDescription,
            price,
            imageUrl,
            createdAt: new Date().toISOString(),
            status: 'available',
            reviewCount: 0,
            averageRating: 0,
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
