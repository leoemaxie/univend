
'use client';

import { Button } from "@/components/ui/button";
import { useTransition } from "react";
import { acceptDelivery, markAsDelivered, markAsPickedUp } from "./actions";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";


export function AcceptDeliveryButton({ orderId, riderId }: { orderId: string; riderId: string }) {
    const [isPending, startTransition] = useTransition();
    const { toast } = useToast();
  
    const handleClick = () => {
      startTransition(async () => {
        const result = await acceptDelivery(orderId, riderId);
        if (result.success) {
          toast({ title: 'Delivery Accepted!', description: 'The delivery has been assigned to you.' });
        } else {
          toast({ variant: 'destructive', title: 'Error', description: result.error });
        }
      });
    };
  
    return (
      <Button onClick={handleClick} disabled={isPending} size="sm">
        {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
        Accept
      </Button>
    );
}

export function RiderActionButtons({ order }: { order: { id: string; status: string } }) {
    const [isPending, startTransition] = useTransition();
    const { toast } = useToast();

    const handlePickUp = () => {
        startTransition(async () => {
            const result = await markAsPickedUp(order.id);
            if (result.success) {
                toast({ title: 'Order Picked Up!', description: "You've confirmed pickup." });
            } else {
                toast({ variant: 'destructive', title: 'Error', description: result.error });
            }
        });
    };

    const handleDeliver = () => {
        startTransition(async () => {
            const result = await markAsDelivered(order.id);
            if (result.success) {
                toast({ title: 'Order Delivered!', description: 'Great job on completing the delivery.' });
            } else {
                toast({ variant: 'destructive', title: 'Error', description: result.error });
            }
        });
    };

    if (order.status === 'out-for-delivery') {
        return (
            <Button onClick={handlePickUp} disabled={isPending} size="sm" variant="outline">
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                I've Picked It Up
            </Button>
        );
    }

    if (order.status === 'processing') {
        return (
            <Button onClick={handleDeliver} disabled={isPending} size="sm">
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Mark as Delivered
            </Button>
        );
    }

    return null;
}
