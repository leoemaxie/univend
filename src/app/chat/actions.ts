'use server';

import { db } from '@/lib/firebase';
import type { Chat, Message, Product, UserDetails } from '@/lib/types';
import {
  collection,
  doc,
  getDoc,
  setDoc,
  addDoc,
  query,
  where,
  getDocs,
  orderBy,
  serverTimestamp,
  writeBatch,
} from 'firebase/firestore';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

type ActionResponse<T> = {
  success: boolean;
  data?: T;
  error?: string;
};

// Helper function to create a consistent chat ID
function getChatId(buyerId: string, vendorId: string, productId: string) {
  return [buyerId, vendorId, productId].sort().join('_');
}

export async function getOrCreateChat(
  productId: string,
  buyerId: string
): Promise<ActionResponse<{ chatId: string }>> {
  try {
    const productRef = doc(db, 'products', productId);
    const productSnap = await getDoc(productRef);

    if (!productSnap.exists()) {
      return { success: false, error: 'Product not found.' };
    }
    const product = productSnap.data() as Product;
    const vendorId = product.vendorId;

    if (buyerId === vendorId) {
        return { success: false, error: "You cannot start a chat for your own product." };
    }

    const chatId = getChatId(buyerId, vendorId, productId);
    const chatRef = doc(db, 'chats', chatId);
    const chatSnap = await getDoc(chatRef);

    if (!chatSnap.exists()) {
      const buyerRef = doc(db, 'users', buyerId);
      const vendorRef = doc(db, 'users', vendorId);
      const [buyerSnap, vendorSnap] = await Promise.all([getDoc(buyerRef), getDoc(vendorRef)]);
      
      if (!buyerSnap.exists() || !vendorSnap.exists()) {
        return { success: false, error: 'User not found.' };
      }

      const buyer = buyerSnap.data() as UserDetails;
      const vendor = vendorSnap.data() as UserDetails;

      const newChat: Chat = {
        id: chatId,
        productId: product.id,
        productTitle: product.title,
        productImageUrl: product.imageUrl,
        createdAt: new Date().toISOString(),
        participantIds: [buyerId, vendorId],
        participants: {
          [buyerId]: {
            name: buyer.fullName,
            avatar: buyer.photoURL || '',
          },
          [vendorId]: {
            name: vendor.fullName,
            avatar: vendor.photoURL || '',
          },
        },
        lastMessage: null,
      };
      await setDoc(chatRef, newChat);
    }

    return { success: true, data: { chatId } };
  } catch (error) {
    console.error('Error in getOrCreateChat:', error);
    return { success: false, error: 'Failed to start chat.' };
  }
}

const SendMessageSchema = z.object({
  chatId: z.string(),
  senderId: z.string(),
  text: z.string().min(1).max(1000),
});

export async function sendMessage(formData: FormData): Promise<ActionResponse<null>> {
  const rawData = Object.fromEntries(formData.entries());
  const validation = SendMessageSchema.safeParse(rawData);

  if (!validation.success) {
    return { success: false, error: 'Invalid message data.' };
  }

  const { chatId, senderId, text } = validation.data;

  try {
    const chatRef = doc(db, 'chats', chatId);
    const messagesCollection = collection(chatRef, 'messages');
    const batch = writeBatch(db);

    const newMessage: Message = {
      senderId,
      text,
      createdAt: new Date().toISOString(),
    };
    
    // Add new message to subcollection
    const messageRef = doc(messagesCollection); // auto-generate ID
    batch.set(messageRef, newMessage);

    // Update the last message on the chat document
    batch.update(chatRef, {
        lastMessage: {
            text,
            senderId,
            createdAt: newMessage.createdAt,
        }
    })

    await batch.commit();

    revalidatePath(`/chat/${chatId}`);
    revalidatePath('/chat');

    return { success: true, data: null };
  } catch (error) {
    console.error('Error sending message:', error);
    return { success: false, error: 'Failed to send message.' };
  }
}

export async function getChatsForUser(userId: string): Promise<Chat[]> {
    const chatsCollection = collection(db, 'chats');
    // Removed orderby to prevent index error. Sorting will be done on the client.
    const q = query(chatsCollection, where('participantIds', 'array-contains', userId));

    const snapshot = await getDocs(q);
    if (snapshot.empty) {
        return [];
    }
    return snapshot.docs.map(doc => doc.data() as Chat);
}
