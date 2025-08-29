
'use client';

import type { Order } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
  } from "@/components/ui/table"
import { AcceptDeliveryButton } from './rider-actions';
import { Bike } from 'lucide-react';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useEffect, useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

async function getRiderData(riderId: string, university: string) {
    const ordersCollection = collection(db, 'orders');

    const availableDeliveriesQuery = query(ordersCollection, 
        where('university', '==', university),
        where('status', '==', 'pending'),
        orderBy('createdAt', 'desc')
    );
    const myDeliveriesQuery = query(ordersCollection, 
        where('riderId', '==', riderId),
        orderBy('createdAt', 'desc')
    );

    const [availableDeliveriesSnapshot, myDeliveriesSnapshot] = await Promise.all([
        getDocs(availableDeliveriesQuery), 
        getDocs(myDeliveriesQuery)
    ]);

    const availableDeliveries = availableDeliveriesSnapshot.docs.map(doc => doc.data() as Order);
    const myDeliveries = myDeliveriesSnapshot.docs.map(doc => doc.data() as Order);

    return { availableDeliveries, myDeliveries };
}


export default function RiderDashboard({ userId, university }: { userId: string, university: string }) {
    const [availableDeliveries, setAvailableDeliveries] = useState<Order[]>([]);
    const [myDeliveries, setMyDeliveries] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchData() {
            setLoading(true);
            const { availableDeliveries, myDeliveries } = await getRiderData(userId, university);
            setAvailableDeliveries(availableDeliveries);
            setMyDeliveries(myDeliveries);
            setLoading(false);
        }
        fetchData();
    }, [userId, university]);

  return (
    <div className="space-y-8 p-6">
      <Card className='overflow-hidden'>
        <CardHeader className="bg-muted/30">
          <CardTitle className="text-xl font-headline">Available Deliveries</CardTitle>
          <CardDescription>Pick up a delivery job in your university.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
            {loading ? (
                <div className='space-y-px p-6'>
                    <Skeleton className='h-10 w-full' />
                    <Skeleton className='h-10 w-full' />
                    <Skeleton className='h-10 w-full' />
                </div>
            ) : availableDeliveries.length > 0 ? (
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Order ID</TableHead>
                            <TableHead>Deliver To</TableHead>
                            <TableHead>Address</TableHead>
                            <TableHead>Earnings</TableHead>
                            <TableHead>Action</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {availableDeliveries.map(order => (
                             <TableRow key={order.id}>
                                <TableCell className="font-mono text-xs">{order.id.substring(0, 8)}...</TableCell>
                                <TableCell>{order.buyerName}</TableCell>
                                <TableCell>{order.deliveryAddress}</TableCell>
                                <TableCell>₦500</TableCell>
                                <TableCell>
                                    <AcceptDeliveryButton orderId={order.id} riderId={userId} />
                                </TableCell>
                             </TableRow>
                        ))}
                    </TableBody>
                </Table>
            ) : (
                <div className="text-center py-10">
                    <Bike className="mx-auto h-12 w-12 text-muted-foreground" />
                    <h3 className="mt-2 text-sm font-semibold">No available deliveries</h3>
                    <p className="mt-1 text-sm text-muted-foreground">Check back later for new delivery jobs.</p>
                </div>
            )}
        </CardContent>
      </Card>

      <Card className='overflow-hidden'>
        <CardHeader className="bg-muted/30">
          <CardTitle className="text-xl font-headline">My Delivery History</CardTitle>
          <CardDescription>Keep track of your completed and ongoing deliveries.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
        {loading ? (
             <div className='space-y-px p-6'>
                <Skeleton className='h-10 w-full' />
                <Skeleton className='h-10 w-full' />
            </div>
        ): myDeliveries.length > 0 ? (
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Order ID</TableHead>
                            <TableHead>Customer</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Date</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                    {myDeliveries.map((order) => (
                        <TableRow key={order.id}>
                          <TableCell className="font-mono text-xs">{order.id.substring(0, 8)}...</TableCell>
                          <TableCell>{order.buyerName}</TableCell>
                          <TableCell>
                            <Badge>{order.status}</Badge>
                          </TableCell>
                          <TableCell>{new Date(order.createdAt).toLocaleDateString()}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                </Table>
            ) : (
                <div className="text-center py-10">
                    <h3 className="text-sm font-semibold">You haven't accepted any deliveries yet.</h3>
                    <p className="mt-1 text-sm text-muted-foreground">Accept a job from the list above to get started.</p>
                </div>
            )}
        </CardContent>
      </Card>
    </div>
  );
}
