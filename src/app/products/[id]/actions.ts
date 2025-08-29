
'use server';

import { db } from '@/lib/firebase';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { collection, writeBatch, doc, serverTimestamp, runTransaction } from 'firebase/firestore';
import type { Review, Product } from '@/lib/types';
import { revalidatePath } from 'next/cache';

const ReviewSchema = z.object({
    productId: z.string(),
    userId: z.string(),
    userName: z.string(),
    userPhotoURL: z.string().url().optional().or(z.literal('')),
    rating: z.coerce.number().min(1).max(5),
    comment: z.string().min(10).max(1000),
});

type ActionResponse = {
    success: boolean;
    error?: string;
};

export async function submitReview(formData: FormData): Promise<ActionResponse> {
    const rawData = Object.fromEntries(formData.entries());
    const validationResult = ReviewSchema.safeParse(rawData);

    if (!validationResult.success) {
        console.error("Review validation error:", validationResult.error.flatten());
        return { success: false, error: 'Invalid review data.' };
    }

    const { productId, userId, userName, userPhotoURL, rating, comment } = validationResult.data;
    const reviewId = uuidv4();

    try {
        const productRef = doc(db, 'products', productId);
        const reviewRef = doc(productRef, 'reviews', reviewId);

        await runTransaction(db, async (transaction) => {
            const productDoc = await transaction.get(productRef);
            if (!productDoc.exists()) {
                throw new Error("Product not found");
            }

            const productData = productDoc.data() as Product;
            const currentReviewCount = productData.reviewCount || 0;
            const currentAverageRating = productData.averageRating || 0;

            const newReviewCount = currentReviewCount + 1;
            const newAverageRating = ((currentAverageRating * currentReviewCount) + rating) / newReviewCount;
            
            const newReview: Review = {
                id: reviewId,
                productId,
                userId,
                userName,
                userPhotoURL: userPhotoURL || '',
                rating,
                comment,
                createdAt: new Date().toISOString(),
            };

            transaction.set(reviewRef, newReview);
            transaction.update(productRef, {
                reviewCount: newReviewCount,
                averageRating: newAverageRating,
            });
        });

        revalidatePath(`/products/${productId}`);
        return { success: true };

    } catch (error) {
        console.error("Error submitting review:", error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
        return { success: false, error: `Failed to submit review. ${errorMessage}` };
    }
}
