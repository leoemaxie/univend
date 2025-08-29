
'use server';

import { revalidatePath } from 'next/cache';
import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc, runTransaction, writeBatch, increment } from 'firebase/firestore';
import type { Order, UserDetails } from '@/lib/types';
import { getWallet, createTransaction } from '../wallet/actions';
import { MailerSend, EmailParams, Sender, Recipient } from 'mailersend';


async function sendOrderAcceptedEmail(buyerEmail: string, buyerName: string, order: Order) {
    if (!process.env.MAILERSEND_API_KEY) {
        console.log("MAILERSEND_API_KEY not set. Skipping buyer confirmation email.");
        return;
    }

    const mailerSend = new MailerSend({
        apiKey: process.env.MAILERSEND_API_KEY,
    });

    const sentFrom = new Sender("no-reply@trial-yzkq340xke3gJ9o0.mlsender.net", "Univend"); // Use a verified domain
    const recipients = [new Recipient(buyerEmail, buyerName)];
    const deliveryStatusMessage = order.deliveryMethod === 'delivery' 
        ? "It will be assigned to a rider for delivery shortly." 
        : "It is now ready for pickup at the vendor's designated location.";

    const emailParams = new EmailParams()
        .setFrom(sentFrom)
        .setTo(recipients)
        .setSubject(`Your Univend Order #${order.id.substring(0, 8)} has been Accepted!`)
        .setHtml(
            `<h1>Great News, ${buyerName}!</h1>
            <p>The vendor has accepted your order. ${deliveryStatusMessage}</p>
            <h2>Order Summary</h2>
            <p><strong>Order ID:</strong> ${order.id}</p>
            <p>We have deducted <strong>₦${order.total.toLocaleString()}</strong> from your wallet for this order.</p>
            <p>You can view your order details and track its status in your dashboard.</p>`
        );

    try {
        await mailerSend.email.send(emailParams);
        console.log(`Buyer "order accepted" email sent to ${buyerEmail}`);
    } catch (error) {
        console.error("Error sending buyer email:", error);
    }
}


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

            // Fetch buyer details to get their email
            const buyerRef = doc(db, 'users', order.buyerId);
            const buyerDoc = await transaction.get(buyerRef);
            if (!buyerDoc.exists()) {
                throw new Error("Buyer details not found.");
            }
            const buyerDetails = buyerDoc.data() as UserDetails;

            // Deduct funds from buyer's wallet
            const walletRef = doc(db, 'wallets', order.buyerId);
            const walletDoc = await transaction.get(walletRef);

            if (!walletDoc.exists() || walletDoc.data().balance < order.total) {
                throw new Error("Buyer has insufficient wallet balance.");
            }
    
            const newBalance = walletDoc.data().balance - order.total;
            transaction.update(walletRef, { balance: newBalance });
    
            // Create a debit transaction record for the buyer
            await createTransaction({
                userId: order.buyerId,
                type: 'debit',
                amount: order.total,
                description: `Payment for order ${order.id.substring(0, 8)}`,
                relatedEntityType: 'order',
                relatedEntityId: order.id,
            }, transaction);

            // Mark product as 'sold'
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

            // Send notification email outside of the transaction
            // We pass the necessary details to the function
            await sendOrderAcceptedEmail(buyerDetails.email, order.buyerName, order);
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
            
            const vendorEarnings = order.subtotal; // Vendor gets the full subtotal

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
