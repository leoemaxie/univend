'use server';

import { revalidatePath } from 'next/cache';
import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';


export async function acceptDelivery(orderId: string, riderId: string): Promise<{ success: boolean; error?: string }> {
    try {
        const orderRef = doc(db, 'orders', orderId);
        const orderDoc = await getDoc(orderRef);

        if (!orderDoc.exists()) {
            return { success: false, error: 'Order not found.' };
        }
        
        const orderData = orderDoc.data();

        if(orderData?.status !== 'pending') {
            return { success: false, error: 'This delivery is no longer available.' };
        }

        await updateDoc(orderRef, {
            riderId: riderId,
            status: 'out-for-delivery',
        });

        revalidatePath('/dashboard');

        return { success: true };
    } catch (error) {
        console.error("Error accepting delivery:", error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
        return { success: false, error: `Failed to accept delivery. ${errorMessage}` };
    }
}
