
'use client';

import { useCart } from '@/hooks/use-cart';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import Image from 'next/image';
import { Input } from '@/components/ui/input';
import { MinusCircle, PlusCircle, Trash2, ShoppingCart, Wallet, Truck, Hand } from 'lucide-react';
import Link from 'next/link';
import { placeOrder } from './actions';
import { useToast } from '@/hooks/use-toast';
import { useTransition, useState, useEffect, useMemo } from 'react';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/auth/provider';
import { useRouter } from 'next/navigation';
import { getWallet } from '../wallet/actions';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import type { DeliveryMethod } from '@/lib/types';
import { DELIVERY_FEE } from '@/lib/types';


export default function CartPage() {
  const { cart, removeFromCart, updateQuantity, clearCart } = useCart();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const { user, userDetails } = useAuth();
  const router = useRouter();
  const [walletBalance, setWalletBalance] = useState<number | null>(null);
  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>('delivery');

  const availableDeliveryMethods = useMemo(() => {
    if (cart.length === 0) return [];
    
    const allProductsSupportDelivery = cart.every(item => item.product.deliveryMethods?.includes('delivery'));
    const allProductsSupportPickup = cart.every(item => item.product.deliveryMethods?.includes('pickup'));

    const methods: DeliveryMethod[] = [];
    if (allProductsSupportDelivery) methods.push('delivery');
    if (allProductsSupportPickup) methods.push('pickup');
    
    // Default to first available method if current selection is not possible
    if(methods.length > 0 && !methods.includes(deliveryMethod)) {
        setDeliveryMethod(methods[0]);
    }

    return methods;
  }, [cart, deliveryMethod]);


  const subtotal = cart.reduce((acc, item) => acc + item.product.price * item.quantity, 0);
  const deliveryFee = deliveryMethod === 'delivery' ? DELIVERY_FEE : 0;
  const total = subtotal + deliveryFee;

  useEffect(() => {
    if(user) {
        getWallet(user.uid).then(wallet => setWalletBalance(wallet.balance));
    }
  }, [user]);

  const handleCheckout = () => {
    if(!user || !userDetails) {
        toast({ variant: 'destructive', title: "Authentication required", description: "Please sign in to place an order." });
        router.push('/signin?callbackUrl=/cart');
        return;
    }

    if (walletBalance !== null && walletBalance < total) {
        toast({ variant: 'destructive', title: "Insufficient Funds", description: "Your wallet balance is too low. Please fund your wallet before placing an order." });
        router.push('/wallet');
        return;
    }

    if (deliveryMethod === 'delivery' && !userDetails.address) {
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
        const result = await placeOrder(cart, fullUser, deliveryMethod);
        if(result.success) {
            toast({ title: "Order Sent for Confirmation!", description: "Your order has been sent to the vendor for confirmation." });
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
                 <div className='flex gap-1 mt-1'>
                    {item.product.deliveryMethods?.map(method => (
                        <span key={method} className='text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded-sm'>
                            {method === 'delivery' ? 'Delivery' : 'Pickup'} available
                        </span>
                    ))}
                 </div>
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
                <div>
                    <h4 className="text-sm font-medium mb-2">Delivery Method</h4>
                    <RadioGroup 
                        value={deliveryMethod} 
                        onValueChange={(val) => setDeliveryMethod(val as DeliveryMethod)} 
                        className="space-y-2"
                        disabled={availableDeliveryMethods.length === 0}
                    >
                        {availableDeliveryMethods.length === 0 && cart.length > 0 &&
                            <p className="text-sm text-destructive">Items in cart have conflicting delivery methods. Please create separate orders.</p>
                        }
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="delivery" id="delivery" disabled={!availableDeliveryMethods.includes('delivery')} />
                            <Label htmlFor="delivery" className='flex items-center gap-2'><Truck className='h-4 w-4' /> Rider Delivery</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="pickup" id="pickup" disabled={!availableDeliveryMethods.includes('pickup')} />
                            <Label htmlFor="pickup" className='flex items-center gap-2'><Hand className='h-4 w-4' /> Self Pickup</Label>
                        </div>
                    </RadioGroup>
                </div>

              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>₦{new Intl.NumberFormat('en-NG').format(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span>Delivery Fee</span>
                <span>₦{new Intl.NumberFormat('en-NG').format(deliveryFee)}</span>
              </div>
              <div className="flex justify-between font-bold text-lg">
                <span>Total</span>
                <span>₦{new Intl.NumberFormat('en-NG').format(total)}</span>
              </div>
               {walletBalance !== null && (
                <div className="flex justify-between text-sm pt-2 border-t">
                    <span className="text-muted-foreground flex items-center gap-2"><Wallet className="h-4 w-4" /> Your Balance</span>
                    <span className={walletBalance < total ? 'text-destructive' : 'text-green-600'}>
                        ₦{new Intl.NumberFormat('en-NG').format(walletBalance)}
                    </span>
                </div>
               )}
            </CardContent>
            <CardFooter>
              <Button className="w-full" size="lg" onClick={handleCheckout} disabled={isPending || availableDeliveryMethods.length === 0}>
                {isPending ? <Loader2 className="animate-spin mr-2" /> : null}
                Pay with Wallet & Place Order
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}
