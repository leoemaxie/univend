
'use server';

import { getAdminServices } from '@/lib/firebase-admin';
import type { CartItem } from '@/hooks/use-cart';
import type { Order, OrderItem, UserDetails, DeliveryMethod } from '@/lib/types';
import { DELIVERY_FEE, SERVICE_CHARGE_RATE } from '@/lib/types';
import { v4 as uuidv4 } from 'uuid';
import { revalidatePath } from 'next/cache';
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { MailerSend, EmailParams, Sender, Recipient } from 'mailersend';

type ActionResponse = {
  success: boolean;
  error?: string;
  orderId?: string;
};

async function sendOrderNotification(vendorId: string, orderId: string, buyerName: string) {
    const { messaging: adminMessaging, db: adminDb, success } = getAdminServices();

    if (!success || !adminMessaging || !adminDb) {
        console.error("Firebase Admin not available. Skipping push notification.");
        return;
    }

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
                    title: 'New Order for Confirmation!',
                    body: `${buyerName} has placed an order. Please confirm it in your dashboard. ID: ${orderId.substring(0,8)}...`
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

async function sendBuyerConfirmationEmail(buyerEmail: string, buyerName: string, order: Order) {
    if (!process.env.MAILERSEND_API_KEY) {
        console.log("MAILERSEND_API_KEY not set. Skipping buyer confirmation email.");
        return;
    }

    const mailerSend = new MailerSend({
        apiKey: process.env.MAILERSEND_API_KEY,
    });

    const sentFrom = new Sender("no-reply@trial-yzkq340xke3gJ9o0.mlsender.net", "Univend"); // Use a verified domain
    const recipients = [new Recipient(buyerEmail, buyerName)];

    const emailParams = new EmailParams()
        .setFrom(sentFrom)
        .setTo(recipients)
        .setSubject(`Your Univend Order Confirmation #${order.id.substring(0, 8)}`)
        .setHtml(
            `<h1>Thanks for your order, ${buyerName}!</h1>
            <p>Your order has been sent to the vendor for confirmation. We'll notify you once it's accepted.</p>
            <h2>Order Summary</h2>
            <p><strong>Order ID:</strong> ${order.id}</p>
            <ul>
                ${order.items.map(item => `<li>${item.title} (x${item.quantity}) - ₦${(item.price * item.quantity).toLocaleString()}</li>`).join('')}
            </ul>
            <p><strong>Subtotal:</strong> ₦${order.subtotal.toLocaleString()}</p>
            <p><strong>Delivery Fee:</strong> ₦${order.deliveryFee.toLocaleString()}</p>
            <p><strong>Service Charge:</strong> ₦${order.serviceCharge.toLocaleString()}</p>
            <p><strong>Total:</strong> ₦${order.total.toLocaleString()}</p>
            <p>You can view your order details in your dashboard.</p>`
        );

    try {
        await mailerSend.email.send(emailParams);
        console.log(`Buyer confirmation email sent to ${buyerEmail}`);
    } catch (error) {
        console.error("Error sending buyer email:", error);
    }
}


export async function placeOrder(cart: CartItem[], user: { uid: string; displayName?: string | null; email?: string | null; university?: string; address?: string }, deliveryMethod: DeliveryMethod): Promise<ActionResponse> {
  if (!user || !user.email) {
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

  // Verify all products in the cart support the chosen delivery method
  const allSupportMethod = cart.every(item => item.product.deliveryMethods?.includes(deliveryMethod));
  if (!allSupportMethod) {
    return { success: false, error: 'One or more items in your cart do not support the selected delivery method.' };
  }


  const orderItems: OrderItem[] = cart.map(item => ({
    productId: item.product.id,
    title: item.product.title,
    price: item.product.price,
    quantity: item.quantity,
    imageUrl: item.product.imageUrl,
  }));
  
  const subtotal = orderItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const deliveryFee = deliveryMethod === 'delivery' ? DELIVERY_FEE : 0;
  const serviceCharge = subtotal * SERVICE_CHARGE_RATE;
  const total = subtotal + deliveryFee; 

  const order: Order = {
    id: orderId,
    buyerId: user.uid,
    buyerName: user.displayName ?? 'Anonymous',
    vendorId,
    items: orderItems,
    subtotal,
    deliveryFee,
    serviceCharge,
    total,
    status: 'pending-confirmation',
    paymentStatus: 'pending',
    createdAt: new Date().toISOString(),
    university: user.university || '',
    deliveryAddress: user.address || 'No address provided',
    deliveryMethod: deliveryMethod,
  };

  try {
    const orderRef = doc(db, 'orders', orderId);
    
    await setDoc(orderRef, order);


    // After successfully placing the order, send notifications
    await sendOrderNotification(vendorId, orderId, user.displayName ?? 'A customer');
    await sendBuyerConfirmationEmail(user.email, user.displayName ?? 'Customer', order);


    revalidatePath('/dashboard');
    revalidatePath('/products');
    
    return { success: true, orderId: orderId };

  } catch (error) {
    console.error("Error placing order: ", error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    return { success: false, error: `${errorMessage}` };
  }
}
