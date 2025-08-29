
'use server';

import { revalidatePath } from 'next/cache';
import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc, runTransaction, writeBatch } from 'firebase/firestore';
import type { Order } from '@/lib/types';
import { getWallet, createTransaction } from '../wallet/actions';

export async function acceptOrder(orderId: string): Promise<{ success: boolean; error?: string }> {
    try {
        await runTransaction(db, async (transaction) => {
            const orderRef = doc(db, 'orders', orderId);
            const orderDoc = await transaction.get(orderRef);
    
            if (!orderDoc.exists()) {
                throw new Error('Order not found.');
            }
            
            const order = orderDoc.data() as Order;
    
            if(order.status !== 'pending-confirmation') {
                throw new Error('This order has already been actioned.');
            }

            // Deduct funds from buyer's wallet
            const walletRef = doc(db, 'wallets', order.buyerId);
            const walletDoc = await transaction.get(walletRef);

            if (!walletDoc.exists() || walletDoc.data().balance < order.total) {
                throw new Error("Insufficient wallet balance. Please fund your wallet.");
            }
    
            const newBalance = walletDoc.data().balance - order.total;
            transaction.update(walletRef, { balance: newBalance });
    
            // Create a debit transaction record
            await createTransaction({
                userId: order.buyerId,
                type: 'debit',
                amount: order.total,
                description: `Payment for order ${order.id.substring(0, 8)}`,
                relatedEntityType: 'order',
                relatedEntityId: order.id,
            }, transaction);

            // Update product status to 'sold'
            order.items.forEach(item => {
                const productRef = doc(db, 'products', item.productId);
                transaction.update(productRef, { status: 'sold' });
            });
    
            // Update order status
            const newStatus = order.deliveryMethod === 'delivery' ? 'pending' : 'ready-for-pickup';
            transaction.update(orderRef, {
                status: newStatus,
                paymentStatus: 'paid'
            });
        });

        revalidatePath('/dashboard');
        revalidatePath('/wallet');
        revalidatePath('/products');

        return { success: true };
    } catch (error) {
        console.error("Error accepting order:", error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
        return { success: false, error: `Failed to accept order. ${errorMessage}` };
    }
}

export async function rejectOrder(orderId: string): Promise<{ success: boolean; error?: string }> {
    try {
        const orderRef = doc(db, 'orders', orderId);
        const orderDoc = await getDoc(orderRef);

        if (!orderDoc.exists()) {
            return { success: false, error: 'Order not found.' };
        }
        
        const orderData = orderDoc.data();

        if(orderData?.status !== 'pending-confirmation') {
            return { success: false, error: 'This order has already been actioned.' };
        }

        await updateDoc(orderRef, {
            status: 'rejected',
        });

        revalidatePath('/dashboard');

        return { success: true };
    } catch (error) {
        console.error("Error rejecting order:", error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
        return { success: false, error: `Failed to reject order. ${errorMessage}` };
    }
}


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

            if (order.status !== 'processing' && order.status !== 'ready-for-pickup') {
                throw new Error("Order must be in 'processing' or 'ready-for-pickup' status to be marked as delivered.");
            }

            const vendorWalletRef = doc(db, 'wallets', order.vendorId);
            await getWallet(order.vendorId); // Ensure wallet exists
            
            const vendorEarnings = order.subtotal;

            // 1. Credit vendor's wallet
            transaction.update(vendorWalletRef, { balance: increment(vendorEarnings) });
            await createTransaction({
                userId: order.vendorId,
                type: 'credit',
                amount: vendorEarnings,
                description: `Earnings from order ${order.id.substring(0, 8)}`,
                relatedEntityType: 'order',
                relatedEntityId: order.id,
            }, transaction);
            
            // 2. Credit rider's wallet if it was a delivery
            if (order.deliveryMethod === 'delivery' && order.riderId) {
                const riderWalletRef = doc(db, 'wallets', order.riderId);
                await getWallet(order.riderId); // Ensure wallet exists
                const riderEarnings = order.deliveryFee;

                transaction.update(riderWalletRef, { balance: increment(riderEarnings) });
                await createTransaction({
                    userId: order.riderId,
                    type: 'credit',
                    amount: riderEarnings,
                    description: `Delivery fee for order ${order.id.substring(0, 8)}`,
                    relatedEntityType: 'order',
                    relatedEntityId: order.id,
                }, transaction);
            }


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
