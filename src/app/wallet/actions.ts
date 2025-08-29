
'use server';

import { db } from '@/lib/firebase';
import type { Wallet } from '@/lib/types';
import { doc, getDoc, setDoc, updateDoc, increment, serverTimestamp } from 'firebase/firestore';
import { revalidatePath } from 'next/cache';

const INITIAL_BALANCE = 50000; // Default balance for new wallets

// This function gets the wallet, or creates it if it doesn't exist
export async function getWallet(userId: string): Promise<Wallet> {
  const walletRef = doc(db, 'wallets', userId);
  const walletSnap = await getDoc(walletRef);

  if (walletSnap.exists()) {
    return walletSnap.data() as Wallet;
  } else {
    // Create a new wallet with initial balance
    const newWallet: Wallet = {
      userId,
      balance: INITIAL_BALANCE,
      updatedAt: new Date().toISOString(),
    };
    await setDoc(walletRef, newWallet);
    return newWallet;
  }
}

type FundWalletResponse = {
    success: boolean;
    error?: string;
    newBalance?: number;
}

export async function fundWallet(userId: string, amount: number): Promise<FundWalletResponse> {
    if (!userId) {
        return { success: false, error: "User not authenticated."};
    }
    if (amount <= 0) {
        return { success: false, error: "Invalid funding amount."};
    }

    const walletRef = doc(db, 'wallets', userId);

    try {
        // Ensure wallet exists before trying to update
        await getWallet(userId); 

        await updateDoc(walletRef, {
            balance: increment(amount),
            updatedAt: new Date().toISOString()
        });
        
        const updatedWalletSnap = await getDoc(walletRef);
        const newBalance = updatedWalletSnap.data()?.balance;

        revalidatePath('/wallet');
        
        return { success: true, newBalance };

    } catch (error) {
        console.error("Error funding wallet:", error);
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
        return { success: false, error: `Failed to fund wallet. ${errorMessage}` };
    }
}
