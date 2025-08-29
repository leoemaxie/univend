
'use client';

import { useAuth } from "@/auth/provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import type { Wallet } from "@/lib/types";
import { Loader2, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { getWallet, fundWallet } from "./actions";

export default function WalletPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const [wallet, setWallet] = useState<Wallet | null>(null);
    const [loadingWallet, setLoadingWallet] = useState(true);
    const [fundAmount, setFundAmount] = useState('');
    const [isFunding, startFunding] = useTransition();
    const { toast } = useToast();

    useEffect(() => {
        if (!authLoading && user) {
            setLoadingWallet(true);
            getWallet(user.uid).then(walletData => {
                setWallet(walletData);
                setLoadingWallet(false);
            });
        }
    }, [user, authLoading]);

    const handleFundWallet = () => {
        if(!user) return;
        const amount = parseFloat(fundAmount);
        if(isNaN(amount) || amount <= 0) {
            toast({ variant: 'destructive', title: 'Invalid Amount', description: 'Please enter a valid amount to fund.' });
            return;
        }

        startFunding(async () => {
            const result = await fundWallet(user.uid, amount);
            if(result.success && result.newBalance !== undefined) {
                setWallet(prev => prev ? {...prev, balance: result.newBalance!} : null)
                toast({ title: 'Wallet Funded!', description: `Your new balance is ₦${result.newBalance.toLocaleString()}`})
                setFundAmount('');
            } else {
                toast({ variant: 'destructive', title: 'Funding Failed', description: result.error })
            }
        });
    }

    if (authLoading || loadingWallet) {
        return <WalletSkeleton />;
    }

    if (!user) {
        router.push('/signin?callbackUrl=/wallet');
        return null;
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="max-w-2xl mx-auto space-y-8">
                <Card>
                    <CardHeader>
                        <CardTitle className="font-headline text-3xl">My Wallet</CardTitle>
                        <CardDescription>View your balance and add funds.</CardDescription>
                    </CardHeader>
                    <CardContent className="text-center">
                        <p className="text-sm text-muted-foreground">Current Balance</p>
                        <p className="text-5xl font-bold font-headline tracking-tight text-primary">
                            ₦{wallet ? new Intl.NumberFormat('en-NG').format(wallet.balance) : '0.00'}
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Add Funds</CardTitle>
                        <CardDescription>Enter the amount you want to add to your wallet.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            <Label htmlFor="amount">Amount (₦)</Label>
                            <Input 
                                id="amount" 
                                type="number" 
                                placeholder="e.g., 5000" 
                                value={fundAmount}
                                onChange={(e) => setFundAmount(e.target.value)}
                            />
                        </div>
                    </CardContent>
                    <CardFooter>
                        <Button className="w-full" disabled={isFunding} onClick={handleFundWallet}>
                            {isFunding ? <Loader2 className="mr-2 animate-spin"/> : <Plus className="mr-2" />}
                            Fund Wallet
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        </div>
    );
}


function WalletSkeleton() {
    return (
        <div className="container mx-auto px-4 py-8">
            <div className="max-w-2xl mx-auto space-y-8">
                <Card>
                    <CardHeader>
                        <Skeleton className="h-8 w-48" />
                        <Skeleton className="h-4 w-64 mt-2" />
                    </CardHeader>
                    <CardContent className="text-center">
                        <Skeleton className="h-4 w-32 mx-auto" />
                        <Skeleton className="h-14 w-64 mx-auto mt-2" />
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <Skeleton className="h-7 w-32" />
                        <Skeleton className="h-4 w-72 mt-2" />
                    </CardHeader>
                    <CardContent>
                        <Skeleton className="h-10 w-full" />
                    </CardContent>
                    <CardFooter>
                        <Skeleton className="h-11 w-full" />
                    </CardFooter>
                </Card>
            </div>
        </div>
    )
}
