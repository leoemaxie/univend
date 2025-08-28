import { auth } from '@/auth/auth';
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
import { Package, ShoppingBag, Bike } from 'lucide-react';

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/signin?callbackUrl=/dashboard');
  }

  const { user } = session;

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="mb-8">
        <h1 className="text-4xl font-bold font-headline">Welcome, {user.name}!</h1>
        <p className="text-muted-foreground text-lg">Here's your personal dashboard.</p>
      </div>

      <Tabs defaultValue={user.role} className="w-full">
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
            <BuyerDashboard userId={user.id} />
        </TabsContent>
        <TabsContent value="vendor">
            <VendorDashboard userId={user.id} />
        </TabsContent>
        <TabsContent value="rider">
            <RiderDashboard userId={user.id} university={user.school} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
