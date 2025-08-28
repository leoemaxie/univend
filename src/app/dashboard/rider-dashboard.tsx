import { db } from '@/lib/firebase-admin';
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

async function getRiderData(riderId: string, university: string) {
    const availableDeliveriesPromise = db.collection('orders')
        .where('university', '==', university)
        .where('status', '==', 'pending')
        .orderBy('createdAt', 'desc')
        .get();

    const myDeliveriesPromise = db.collection('orders')
        .where('riderId', '==', riderId)
        .orderBy('createdAt', 'desc')
        .get();

    const [availableDeliveriesSnapshot, myDeliveriesSnapshot] = await Promise.all([availableDeliveriesPromise, myDeliveriesPromise]);

    const availableDeliveries = availableDeliveriesSnapshot.docs.map(doc => doc.data() as Order);
    const myDeliveries = myDeliveriesSnapshot.docs.map(doc => doc.data() as Order);

    return { availableDeliveries, myDeliveries };
}


export default async function RiderDashboard({ userId, university }: { userId: string, university: string }) {
    const { availableDeliveries, myDeliveries } = await getRiderData(userId, university);

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Available Deliveries</CardTitle>
          <CardDescription>Pick up a delivery job in your university.</CardDescription>
        </CardHeader>
        <CardContent>
            {availableDeliveries.length > 0 ? (
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Order ID</TableHead>
                            <TableHead>From</TableHead>
                            <TableHead>To</TableHead>
                            <TableHead>Earnings</TableHead>
                            <TableHead>Action</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {availableDeliveries.map(order => (
                             <TableRow key={order.id}>
                                <TableCell className="font-mono text-xs">{order.id.substring(0, 8)}...</TableCell>
                                <TableCell>{order.vendorId.substring(0,8)}</TableCell>
                                <TableCell>{order.buyerName}</TableCell>
                                <TableCell>₦500</TableCell>
                                <TableCell>
                                    <AcceptDeliveryButton orderId={order.id} riderId={userId} />
                                </TableCell>
                             </TableRow>
                        ))}
                    </TableBody>
                </Table>
            ) : (
                <div className="text-center py-10 border-2 border-dashed rounded-lg">
                    <Bike className="mx-auto h-12 w-12 text-muted-foreground" />
                    <h3 className="mt-2 text-sm font-semibold">No available deliveries</h3>
                    <p className="mt-1 text-sm text-muted-foreground">Check back later for new delivery jobs.</p>
                </div>
            )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>My Delivery History</CardTitle>
          <CardDescription>Keep track of your completed and ongoing deliveries.</CardDescription>
        </CardHeader>
        <CardContent>
        {myDeliveries.length > 0 ? (
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
                <div className="text-center py-10 border-2 border-dashed rounded-lg">
                    <h3 className="text-sm font-semibold">You haven't accepted any deliveries yet.</h3>
                    <p className="mt-1 text-sm text-muted-foreground">Accept a job from the list above to get started.</p>
                </div>
            )}
        </CardContent>
      </Card>
    </div>
  );
}
