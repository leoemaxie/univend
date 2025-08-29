
'use client';

import type { Product, Order } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { PlusCircle, Package } from 'lucide-react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
  } from "@/components/ui/table"
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useEffect, useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

async function getVendorData(vendorId: string) {
  const productsQuery = query(collection(db, 'products'), where('vendorId', '==', vendorId), orderBy('createdAt', 'desc'));
  const ordersQuery = query(collection(db, 'orders'), where('vendorId', '==', vendorId), orderBy('createdAt', 'desc'));

  const [productsSnapshot, ordersSnapshot] = await Promise.all([getDocs(productsQuery), getDocs(ordersQuery)]);

  const products = productsSnapshot.docs.map(doc => doc.data() as Product);
  const orders = ordersSnapshot.docs.map(doc => doc.data() as Order);

  return { products, orders };
}

export default function VendorDashboard({ userId }: { userId: string }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
        setLoading(true);
        const { products, orders } = await getVendorData(userId);
        setProducts(products);
        setOrders(orders);
        setLoading(false);
    }
    fetchData();
  }, [userId]);

  return (
    <div className="space-y-8 p-6">
      <Card className='overflow-hidden'>
        <CardHeader className="flex flex-row items-center justify-between bg-muted/30">
            <div>
                <CardTitle className="text-xl font-headline">Your Products</CardTitle>
                <CardDescription>Manage your product listings.</CardDescription>
            </div>
          <Button asChild>
            <Link href="/vendor/add-product"><PlusCircle className="mr-2"/> Add New Product</Link>
          </Button>
        </CardHeader>
        <CardContent className="p-0">
            {loading ? (
                <div className='space-y-px p-6'>
                    <Skeleton className='h-10 w-full' />
                    <Skeleton className='h-10 w-full' />
                </div>
            ) : products.length > 0 ? (
                 <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className='w-[80px]'>Image</TableHead>
                        <TableHead>Title</TableHead>
                        <TableHead>Price</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Created At</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {products.map((product) => (
                        <TableRow key={product.id}>
                          <TableCell>
                            <Image src={product.imageUrl} alt={product.title} width={40} height={40} className="rounded-md object-cover"/>
                          </TableCell>
                          <TableCell>{product.title}</TableCell>
                          <TableCell>₦{new Intl.NumberFormat('en-NG').format(product.price)}</TableCell>
                          <TableCell>
                            <Badge variant={product.status === 'available' ? 'default' : 'secondary'}>{product.status}</Badge>
                          </TableCell>
                          <TableCell>{new Date(product.createdAt).toLocaleDateString()}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
            ) : (
                <div className="text-center py-10">
                    <Package className="mx-auto h-12 w-12 text-muted-foreground" />
                    <h3 className="mt-2 text-sm font-semibold">No products yet</h3>
                    <p className="mt-1 text-sm text-muted-foreground">Get started by adding your first product.</p>
                </div>
            )}
        </CardContent>
      </Card>

      <Card className="overflow-hidden">
        <CardHeader className="bg-muted/30">
          <CardTitle className="text-xl font-headline">Received Orders</CardTitle>
          <CardDescription>Keep track of orders for your products.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
        {loading ? (
             <div className='space-y-px p-6'>
                <Skeleton className='h-10 w-full' />
                <Skeleton className='h-10 w-full' />
            </div>
        ) : orders.length > 0 ? (
                 <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Order ID</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead>Total</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {orders.map((order) => (
                        <TableRow key={order.id}>
                          <TableCell className="font-mono text-xs">{order.id.substring(0, 8)}...</TableCell>
                          <TableCell>{order.buyerName}</TableCell>
                          <TableCell>₦{new Intl.NumberFormat('en-NG').format(order.total)}</TableCell>
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
                    <h3 className="text-sm font-semibold">No orders received yet</h3>
                    <p className="mt-1 text-sm text-muted-foreground">New orders for your products will appear here.</p>
                </div>
            )}
        </CardContent>
      </Card>
    </div>
  );
}
