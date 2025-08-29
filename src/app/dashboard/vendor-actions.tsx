
'use client';

import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useTransition } from "react";
import { acceptOrder, rejectOrder } from "./actions";
import { Loader2 } from "lucide-react";


export function VendorOrderActions({ orderId }: { orderId: string }) {
    const [isPending, startTransition] = useTransition();
    const { toast } = useToast();

    const handleAccept = () => {
        startTransition(async () => {
            const result = await acceptOrder(orderId);
            if (result.success) {
                toast({ title: 'Order Accepted!', description: 'The order is now pending for processing or pickup.' });
            } else {
                toast({ variant: 'destructive', title: 'Error', description: result.error });
            }
        });
    }

    const handleReject = () => {
        startTransition(async () => {
            const result = await rejectOrder(orderId);
            if (result.success) {
                toast({ title: 'Order Rejected', description: 'The order has been successfully rejected.' });
            } else {
                toast({ variant: 'destructive', title: 'Error', description: result.error });
            }
        });
    }

    return (
        <div className="flex gap-2">
            <Button size="sm" onClick={handleAccept} disabled={isPending}>
                {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                Accept
            </Button>
            <Button size="sm" variant="destructive" onClick={handleReject} disabled={isPending}>
                 {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                Reject
            </Button>
        </div>
    )
}
