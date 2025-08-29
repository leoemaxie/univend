
'use server';

import { revalidatePath } from 'next/cache';
import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc, runTransaction, writeBatch } from 'firebase/firestore';
import type { Order } from '@/lib/types';
import { getWallet, createTransaction } from '../wallet/actions';

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


export async function markAsPickedUp(orderId: string): Promise<{ success: boolean; error?: string }> {
    try {
        const orderRef = doc(db, 'orders', orderId);
        await updateDoc(orderRef, { status: 'processing' });
        revalidatePath('/dashboard');
        return { success: true };
    } catch (error) {
        console.error("Error marking as picked up:", error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
        return { success: false, error: `Failed to update order status. ${errorMessage}` };
    }
}

export async function markAsDelivered(orderId: string): Promise<{ success: boolean; error?: string }> {
    try {
        await runTransaction(db, async (transaction) => {
            const orderRef = doc(db, 'orders', orderId);
            const orderDoc = await transaction.get(orderRef);

            if (!orderDoc.exists()) {
                throw new Error("Order not found.");
            }
            
            const order = orderDoc.data() as Order;

            if (order.status !== 'processing') {
                throw new Error("Order must be in 'processing' status to be marked as delivered.");
            }
            if (!order.riderId) {
                throw new Error("No rider assigned to this order.");
            }

            const vendorWalletRef = doc(db, 'wallets', order.vendorId);
            const riderWalletRef = doc(db, 'wallets', order.riderId);

            // Ensure wallets exist
            await getWallet(order.vendorId);
            await getWallet(order.riderId);

            const vendorEarnings = order.subtotal;
            const riderEarnings = order.deliveryFee;

            // 1. Credit vendor's wallet
            transaction.update(vendorWalletRef, { balance: vendorEarnings });
            await createTransaction({
                userId: order.vendorId,
                type: 'credit',
                amount: vendorEarnings,
                description: `Earnings from order ${order.id.substring(0, 8)}`,
                relatedEntityType: 'order',
                relatedEntityId: order.id,
            }, transaction);

            // 2. Credit rider's wallet
            transaction.update(riderWalletRef, { balance: riderEarnings });
            await createTransaction({
                userId: order.riderId,
                type: 'credit',
                amount: riderEarnings,
                description: `Delivery fee for order ${order.id.substring(0, 8)}`,
                relatedEntityType: 'order',
                relatedEntityId: order.id,
            }, transaction);

            // 3. Update order status
            transaction.update(orderRef, { status: 'delivered' });
        });

        revalidatePath('/dashboard');
        revalidatePath('/wallet');
        return { success: true };

    } catch (error) {
        console.error("Error marking as delivered:", error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
        return { success: false, error: `Failed to update order status. ${errorMessage}` };
    }
}
