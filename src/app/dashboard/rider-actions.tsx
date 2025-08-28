'use client';

import { Button } from "@/components/ui/button";
import { useTransition } from "react";
import { acceptDelivery } from "./actions";
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
  