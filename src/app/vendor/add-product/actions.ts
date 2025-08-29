
'use server';

import {
  generateProductDescription,
  type GenerateProductDescriptionInput,
} from '@/ai/flows/generate-product-description';
import { db } from '@/lib/firebase';
import { v2 as cloudinary } from 'cloudinary';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { revalidatePath } from 'next/cache';
import { setDoc, doc } from 'firebase/firestore';

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

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
    delivery: z.string().optional(),
    pickup: z.string().optional(),
}).refine(data => data.delivery || data.pickup, {
    message: "At least one delivery method must be selected.",
    path: ["delivery"], // path to show error on
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
        const firstError = validationResult.error.flatten().fieldErrors;
        const errorMessage = Object.values(firstError)[0]?.[0] || "Invalid product data provided.";
        return { success: false, error: errorMessage };
    }
    
    const { productTitle, productCategory, productDescription, price, image, userId, userName, userSchool, delivery, pickup } = validationResult.data;
    
    const deliveryMethods = [];
    if (delivery) deliveryMethods.push('delivery');
    if (pickup) deliveryMethods.push('pickup');
    
    try {
        const productId = uuidv4();

        // Convert image to buffer
        const bytes = await image.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Upload image to Cloudinary
        const uploadResult = await new Promise<any>((resolve, reject) => {
            cloudinary.uploader.upload_stream({
                folder: 'univend/products',
                public_id: productId,
                resource_type: 'image'
            }, (error, result) => {
                if (error) reject(error);
                resolve(result);
            }).end(buffer);
        });

        if (!uploadResult || !uploadResult.secure_url) {
            throw new Error("Cloudinary upload failed.");
        }
        
        const imageUrl = uploadResult.secure_url;

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
            deliveryMethods,
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
