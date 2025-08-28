'use client';

import { redirect } from 'next/navigation';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import VendorDashboard from './vendor-dashboard';
import BuyerDashboard from './buyer-dashboard';
import RiderDashboard from './rider-dashboard';
import { Package, ShoppingBag, Bike, Loader2 } from 'lucide-react';
import { useAuth } from '@/auth/provider';

export default function DashboardPage() {
  const { user, userDetails, loading } = useAuth();

  if (loading) {
    return (
        <div className="container mx-auto px-4 py-12 text-center">
            <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary" />
            <p className="mt-4 text-muted-foreground">Loading your dashboard...</p>
        </div>
    )
  }

  if (!user || !userDetails) {
    redirect('/signin?callbackUrl=/dashboard');
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="mb-8">
        <h1 className="text-4xl font-bold font-headline">Welcome, {user.displayName}!</h1>
        <p className="text-muted-foreground text-lg">Here's your personal dashboard.</p>
      </div>

      <Tabs defaultValue={userDetails.role} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="buyer">
            <ShoppingBag className="mr-2" /> My Purchases
          </TabsTrigger>
          <TabsTrigger value="vendor">
            <Package className="mr-2" /> Vendor Zone
          </TabsTrigger>
          <TabsTrigger value="rider">
            <Bike className="mr-2" /> Rider Hub
          </TabsTrigger>
        </TabsList>
        <TabsContent value="buyer">
            <BuyerDashboard userId={user.uid} />
        </TabsContent>
        <TabsContent value="vendor">
            <VendorDashboard userId={user.uid} />
        </TabsContent>
        <TabsContent value="rider">
            <RiderDashboard userId={user.uid} university={userDetails.school} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
