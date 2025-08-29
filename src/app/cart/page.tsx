'use client';

import { useCart } from '@/hooks/use-cart';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import Image from 'next/image';
import { Input } from '@/components/ui/input';
import { MinusCircle, PlusCircle, Trash2, ShoppingCart } from 'lucide-react';
import Link from 'next/link';
import { placeOrder } from './actions';
import { useToast } from '@/hooks/use-toast';
import { useTransition } from 'react';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/auth/provider';
import { useRouter } from 'next/navigation';

export default function CartPage() {
  const { cart, removeFromCart, updateQuantity, clearCart } = useCart();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const { user, userDetails } = useAuth();
  const router = useRouter();

  const total = cart.reduce((acc, item) => acc + item.product.price * item.quantity, 0);

  const handleCheckout = () => {
    if(!user || !userDetails) {
        toast({ variant: 'destructive', title: "Authentication required", description: "Please sign in to place an order." });
        router.push('/signin?callbackUrl=/cart');
        return;
    }

    if (!userDetails.address) {
        toast({ variant: 'destructive', title: "Address Required", description: "Please add a delivery address to your profile before placing an order." });
        router.push('/profile');
        return;
    }

    startTransition(async () => {
        const fullUser = {
            uid: user.uid,
            displayName: user.displayName,
            university: userDetails.school,
            address: userDetails.address
        }
        const result = await placeOrder(cart, fullUser);
        if(result.success) {
            toast({ title: "Order Placed!", description: "Your order has been successfully placed." });
            clearCart();
            router.push('/dashboard');
        } else {
            toast({ variant: 'destructive', title: "Order Failed", description: result.error });
        }
    });
  };

  if (cart.length === 0) {
    return (
      <div className="container mx-auto px-4 py-24 text-center">
        <ShoppingCart className="mx-auto h-24 w-24 text-muted-foreground mb-6" />
        <h1 className="text-3xl font-bold mb-2">Your Cart is Empty</h1>
        <p className="text-muted-foreground mb-6">Looks like you haven't added anything to your cart yet.</p>
        <Button asChild>
          <Link href="/products">Start Shopping</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold font-headline mb-8">Your Shopping Cart</h1>
      <div className="grid lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2 space-y-4">
          {cart.map(item => (
            <Card key={item.product.id} className="flex items-center p-4">
              <div className="relative w-24 h-24 rounded-md overflow-hidden mr-4">
                <Image src={item.product.imageUrl} alt={item.product.title} fill className="object-cover" />
              </div>
              <div className="flex-grow">
                <h2 className="font-semibold">{item.product.title}</h2>
                <p className="text-sm text-muted-foreground">₦{new Intl.NumberFormat('en-NG').format(item.product.price)}</p>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" onClick={() => updateQuantity(item.product.id, item.quantity - 1)}>
                  <MinusCircle className="h-5 w-5" />
                </Button>
                <Input type="number" value={item.quantity} onChange={(e) => updateQuantity(item.product.id, parseInt(e.target.value) || 1)} className="w-16 text-center" />
                <Button variant="ghost" size="icon" onClick={() => updateQuantity(item.product.id, item.quantity + 1)}>
                  <PlusCircle className="h-5 w-5" />
                </Button>
              </div>
              <Button variant="ghost" size="icon" className="ml-4 text-red-500 hover:text-red-700" onClick={() => removeFromCart(item.product.id)}>
                <Trash2 className="h-5 w-5" />
              </Button>
            </Card>
          ))}
        </div>
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>₦{new Intl.NumberFormat('en-NG').format(total)}</span>
              </div>
              <div className="flex justify-between">
                <span>Delivery Fee</span>
                <span>₦{new Intl.NumberFormat('en-NG').format(500)}</span>
              </div>
              <div className="flex justify-between font-bold text-lg">
                <span>Total</span>
                <span>₦{new Intl.NumberFormat('en-NG').format(total + 500)}</span>
              </div>
            </CardContent>
            <CardFooter>
              <Button className="w-full" size="lg" onClick={handleCheckout} disabled={isPending}>
                {isPending ? <Loader2 className="animate-spin mr-2" /> : null}
                Proceed to Checkout
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}
