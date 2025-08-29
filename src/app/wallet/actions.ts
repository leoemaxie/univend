
'use server';

import { db } from '@/lib/firebase';
import type { Wallet, WalletTransaction } from '@/lib/types';
import { doc, getDoc, setDoc, updateDoc, increment, collection, query, where, orderBy, getDocs, Transaction, writeBatch, serverTimestamp, addDoc } from 'firebase/firestore';
import { revalidatePath } from 'next/cache';
import { v4 as uuidv4 } from 'uuid';

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

    // Also create an initial funding transaction
    await createTransaction({
        userId,
        type: 'credit',
        amount: INITIAL_BALANCE,
        description: 'Initial wallet funding',
        relatedEntityType: 'funding',
    });

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

    try {
        await getWallet(userId); // Ensure wallet exists before trying to update
        
        const walletRef = doc(db, 'wallets', userId);

        await updateDoc(walletRef, {
            balance: increment(amount),
            updatedAt: new Date().toISOString()
        });
        
        await createTransaction({
            userId,
            type: 'credit',
            amount,
            description: 'Wallet top-up',
            relatedEntityType: 'funding',
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


// Can be used within a transaction or standalone
export async function createTransaction(
    txData: Omit<WalletTransaction, 'id' | 'createdAt'>,
    transaction?: Transaction
): Promise<void> {
    const txId = uuidv4();
    const newTransaction: WalletTransaction = {
        ...txData,
        id: txId,
        createdAt: new Date().toISOString(),
    };
    
    const transactionRef = doc(collection(db, 'transactions'), txId);

    if (transaction) {
        transaction.set(transactionRef, newTransaction);
    } else {
        await setDoc(transactionRef, newTransaction);
    }
}


export async function getWalletTransactions(userId: string): Promise<WalletTransaction[]> {
    if (!userId) {
      return [];
    }
  
    const transactionsCollection = collection(db, 'transactions');
    const q = query(
      transactionsCollection,
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );
  
    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) {
      return [];
    }
  
    return querySnapshot.docs.map(doc => doc.data() as WalletTransaction);
}
