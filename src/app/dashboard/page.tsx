
'use client';

import { redirect } from 'next/navigation';
import {
  Card,
  CardContent,
} from '@/components/ui/card';
import VendorDashboard from './vendor-dashboard';
import BuyerDashboard from './buyer-dashboard';
import RiderDashboard from './rider-dashboard';
import { Loader2 } from 'lucide-react';
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

  const renderDashboard = () => {
    switch(userDetails.role) {
      case 'buyer':
        return <BuyerDashboard userId={user.uid} />;
      case 'vendor':
        return <VendorDashboard userId={user.uid} />;
      case 'rider':
        return <RiderDashboard userId={user.uid} university={userDetails.school} />;
      default:
        // Default to buyer dashboard if role is somehow not set or invalid
        return <BuyerDashboard userId={user.uid} />;
    }
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="mb-8">
        <h1 className="text-4xl font-bold font-headline">Welcome, {user.displayName}!</h1>
        <p className="text-muted-foreground text-lg">Here's what's happening in your world.</p>
      </div>

      <Card>
        <CardContent className="p-0">
          {renderDashboard()}
        </CardContent>
      </Card>
    </div>
  );
}
