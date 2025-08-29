'use server';

/**
 * @fileOverview This file defines a Genkit flow for generating related product suggestions.
 *
 * - generateRelatedProducts - A function that takes a product title and category and suggests related items.
 * - GenerateRelatedProductsInput - The input type for the generateRelatedProducts function.
 * - GenerateRelatedProductsOutput - The return type for the generateRelatedProducts function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const GenerateRelatedProductsInputSchema = z.object({
  productTitle: z.string().describe('The title of the product.'),
  productCategory: z.string().describe('The category of the product.'),
});
export type GenerateRelatedProductsInput = z.infer<typeof GenerateRelatedProductsInputSchema>;

const GenerateRelatedProductsOutputSchema = z.object({
  suggestions: z
    .array(z.string())
    .describe(
      'An array of 3-5 brief product suggestions that are related to the input product. These should be common search terms a user might type, like "leather laptop bag" or "ergonomic mouse".'
    ),
});
export type GenerateRelatedProductsOutput = z.infer<typeof GenerateRelatedProductsOutputSchema>;

export async function generateRelatedProducts(
  input: GenerateRelatedProductsInput
): Promise<GenerateRelatedProductsOutput> {
  return generateRelatedProductsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateRelatedProductsPrompt',
  input: { schema: GenerateRelatedProductsInputSchema },
  output: { schema: GenerateRelatedProductsOutputSchema },
  prompt: `You are a helpful shopping assistant for a campus marketplace app.
Based on the product title and category, suggest 3 to 5 related items that the user might also be interested in.
The suggestions should be short and sound like search queries.

For example, if the product is "HP Spectre Laptop", you might suggest: "laptop sleeve", "wireless mouse", "usb-c hub".
If the product is "Ankara Dress", you might suggest: "beaded necklace", "heeled sandals", "clutch purse".

Product Title: {{{productTitle}}}
Product Category: {{{productCategory}}}

Suggestions:`,
});

const generateRelatedProductsFlow = ai.defineFlow(
  {
    name: 'generateRelatedProductsFlow',
    inputSchema: GenerateRelatedProductsInputSchema,
    outputSchema: GenerateRelatedProductsOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
