import { db } from '@/lib/firebase-admin';
import type { Order } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
  } from "@/components/ui/table"
  import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
  } from "@/components/ui/accordion"

async function getBuyerOrders(buyerId: string): Promise<Order[]> {
  const ordersSnapshot = await db.collection('orders').where('buyerId', '==', buyerId).orderBy('createdAt', 'desc').get();

  if (ordersSnapshot.empty) {
    return [];
  }

  return ordersSnapshot.docs.map(doc => doc.data() as Order);
}

export default async function BuyerDashboard({ userId }: { userId: string }) {
  const orders = await getBuyerOrders(userId);

  return (
    <Card>
      <CardHeader>
        <CardTitle>My Order History</CardTitle>
        <CardDescription>View the details and status of all your past orders.</CardDescription>
      </CardHeader>
      <CardContent>
        {orders.length > 0 ? (
            <Accordion type="single" collapsible className="w-full">
            {orders.map((order) => (
                <AccordionItem value={order.id} key={order.id}>
                    <AccordionTrigger>
                        <div className="flex justify-between w-full pr-4">
                            <span className="font-mono text-sm">Order #{order.id.substring(0, 8)}...</span>
                            <span className="text-sm text-muted-foreground">{new Date(order.createdAt).toLocaleDateString()}</span>
                            <Badge>{order.status}</Badge>
                            <span className="font-bold">₦{new Intl.NumberFormat('en-NG').format(order.total)}</span>
                        </div>
                    </AccordionTrigger>
                    <AccordionContent>
                       <Table>
                           <TableHeader>
                               <TableRow>
                                   <TableHead className='w-[60px]'></TableHead>
                                   <TableHead>Product</TableHead>
                                   <TableHead>Quantity</TableHead>
                                   <TableHead>Price</TableHead>
                               </TableRow>
                           </TableHeader>
                           <TableBody>
                               {order.items.map(item => (
                                   <TableRow key={item.productId}>
                                       <TableCell>
                                           <Image src={item.imageUrl} alt={item.title} width={40} height={40} className="rounded-md object-cover"/>
                                       </TableCell>
                                       <TableCell>{item.title}</TableCell>
                                       <TableCell>{item.quantity}</TableCell>
                                       <TableCell>₦{new Intl.NumberFormat('en-NG').format(item.price)}</TableCell>
                                   </TableRow>
                               ))}
                           </TableBody>
                       </Table>
                    </AccordionContent>
                </AccordionItem>
            ))}
            </Accordion>
        ) : (
          <div className="text-center py-10 border-2 border-dashed rounded-lg">
            <h3 className="text-sm font-semibold">You haven't placed any orders yet.</h3>
            <p className="mt-1 text-sm text-muted-foreground">Start shopping to see your orders here.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
