'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { type Product } from '@/lib/types';
import { toast } from './use-toast';

export type CartItem = {
  product: Product;
  quantity: number;
};

type CartState = {
  cart: CartItem[];
  addToCart: (product: Product, quantity?: number) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
};

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      cart: [],
      addToCart: (product, quantity = 1) => {
        const currentCart = get().cart;
        const existingItem = currentCart.find((item) => item.product.id === product.id);

        if (existingItem) {
          set({
            cart: currentCart.map((item) =>
              item.product.id === product.id
                ? { ...item, quantity: item.quantity + quantity }
                : item
            ),
          });
          toast({ title: "Item quantity updated in cart."});
        } else {
          set({
            cart: [...currentCart, { product, quantity }],
          });
          toast({ title: "Item added to cart."});
        }
      },
      removeFromCart: (productId) => {
        set({
          cart: get().cart.filter((item) => item.product.id !== productId),
        });
        toast({ title: "Item removed from cart."});
      },
      updateQuantity: (productId, quantity) => {
        if (quantity < 1) {
          get().removeFromCart(productId);
          return;
        }
        set({
          cart: get().cart.map((item) =>
            item.product.id === productId ? { ...item, quantity } : item
          ),
        });
      },
      clearCart: () => set({ cart: [] }),
    }),
    {
      name: 'univend-cart-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
