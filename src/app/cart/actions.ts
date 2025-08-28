'use server';

import { auth } from '@/auth/auth';
import type { CartItem } from '@/hooks/use-cart';
import type { Order, OrderItem } from '@/lib/types';
import { v4 as uuidv4 } from 'uuid';
import { revalidatePath } from 'next/cache';
import { db } from '@/lib/firebase';
import { writeBatch, doc, collection, updateDoc, getDoc } from 'firebase/firestore';


type ActionResponse = {
  success: boolean;
  error?: string;
  orderId?: string;
};

export async function placeOrder(cart: CartItem[]): Promise<ActionResponse> {
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: 'Authentication required.' };
  }

  if (!cart || cart.length === 0) {
    return { success: false, error: 'Your cart is empty.' };
  }

  const { user } = session;
  const orderId = uuidv4();
  
  // For simplicity, we assume all items in a single cart order are from the same vendor.
  // A real-world app would group items by vendor and create separate orders.
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
  const deliveryFee = 500; // Example fixed delivery fee
  const total = subtotal + deliveryFee;

  const order: Order = {
    id: orderId,
    buyerId: user.id,
    buyerName: user.name ?? 'Anonymous',
    vendorId,
    items: orderItems,
    total,
    status: 'pending',
    createdAt: new Date().toISOString(),
    university: user.school,
  };

  try {
    const batch = writeBatch(db);

    const orderRef = doc(db, 'orders', orderId);
    batch.set(orderRef, order);
    
    // Mark products as sold
    cart.forEach(item => {
        const productRef = doc(db, 'products', item.product.id);
        batch.update(productRef, { status: 'sold' });
    });

    await batch.commit();

    revalidatePath('/dashboard');
    revalidatePath('/products');
    
    return { success: true, orderId: orderId };

  } catch (error) {
    console.error("Error placing order: ", error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    return { success: false, error: `Failed to place order. ${errorMessage}` };
  }
}
