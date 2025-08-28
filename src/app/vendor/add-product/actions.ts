'use server';

import {
  generateProductDescription,
  type GenerateProductDescriptionInput,
} from '@/ai/flows/generate-product-description';
import { z } from 'zod';

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
