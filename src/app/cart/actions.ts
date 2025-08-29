
'use server';

import { messaging as adminMessaging, db as adminDb } from '@/lib/firebase-admin';
import type { CartItem } from '@/hooks/use-cart';
import type { Order, OrderItem, UserDetails } from '@/lib/types';
import { v4 as uuidv4 } from 'uuid';
import { revalidatePath } from 'next/cache';
import { db } from '@/lib/firebase';
import { writeBatch, doc, getDoc, runTransaction } from 'firebase/firestore';
import { getWallet, createTransaction } from '@/app/wallet/actions';

export const DELIVERY_FEE = 500;

type ActionResponse = {
  success: boolean;
  error?: string;
  orderId?: string;
};

async function sendOrderNotification(vendorId: string, orderId: string, buyerName: string) {
    try {
        const vendorRef = adminDb.collection('users').doc(vendorId);
        const vendorDoc = await vendorRef.get();

        if(!vendorDoc.exists) {
            console.error("Vendor not found for notification:", vendorId);
            return;
        }

        const vendorData = vendorDoc.data() as UserDetails;
        const fcmToken = vendorData.fcmToken;

        if (fcmToken) {
            const message = {
                notification: {
                    title: 'New Order Received!',
                    body: `${buyerName} has placed an order. Order ID: ${orderId.substring(0,8)}...`
                },
                token: fcmToken,
            };

            await adminMessaging.send(message);
            console.log("Successfully sent notification to vendor:", vendorId);

        } else {
            console.log("Vendor does not have an FCM token, skipping notification.");
        }
    } catch(error) {
        console.error("Error sending order notification:", error);
    }
}

export async function placeOrder(cart: CartItem[], user: { uid: string, displayName?: string | null, university?: string, address?: string }): Promise<ActionResponse> {
  if (!user) {
    return { success: false, error: 'Authentication required.' };
  }

  if (!cart || cart.length === 0) {
    return { success: false, error: 'Your cart is empty.' };
  }

  const orderId = uuidv4();
  
  const vendorId = cart[0].product.vendorId;
  if(!vendorId){
    return { success: false, error: 'Product vendor information is missing.' };
  }

  const orderItems: OrderItem[] = cart.map(item => ({
    productId: item.product.id,
    title: item.product.title,
    price: item.product.price,
    quantity: item.quantity,
    imageUrl: item.product.imageUrl,
  }));
  
  const subtotal = orderItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const total = subtotal + DELIVERY_FEE;

  const order: Order = {
    id: orderId,
    buyerId: user.uid,
    buyerName: user.displayName ?? 'Anonymous',
    vendorId,
    items: orderItems,
    subtotal,
    deliveryFee: DELIVERY_FEE,
    total,
    status: 'pending',
    paymentStatus: 'pending',
    createdAt: new Date().toISOString(),
    university: user.university || '',
    deliveryAddress: user.address || 'No address provided',
  };

  try {
    await runTransaction(db, async (transaction) => {
        const walletRef = doc(db, 'wallets', user.uid);
        const walletDoc = await transaction.get(walletRef);

        if (!walletDoc.exists() || walletDoc.data().balance < total) {
            throw new Error("Insufficient wallet balance. Please fund your wallet.");
        }

        // 1. Debit buyer's wallet
        const newBalance = walletDoc.data().balance - total;
        transaction.update(walletRef, { balance: newBalance });

        // 2. Create a debit transaction record
        await createTransaction({
            userId: user.uid,
            type: 'debit',
            amount: total,
            description: `Payment for order ${orderId.substring(0, 8)}`,
            relatedEntityType: 'order',
            relatedEntityId: orderId,
        }, transaction);

        // 3. Create the order
        const orderRef = doc(db, 'orders', orderId);
        transaction.set(orderRef, { ...order, paymentStatus: 'paid' });
    
        // 4. Mark products as sold
        cart.forEach(item => {
            const productRef = doc(db, 'products', item.product.id);
            transaction.update(productRef, { status: 'sold' });
        });
    });

    // After successfully placing the order, send a notification
    await sendOrderNotification(vendorId, orderId, user.displayName ?? 'A customer');

    revalidatePath('/dashboard');
    revalidatePath('/products');
    revalidatePath('/wallet');
    
    return { success: true, orderId: orderId };

  } catch (error) {
    console.error("Error placing order: ", error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    return { success: false, error: `${errorMessage}` };
  }
}
