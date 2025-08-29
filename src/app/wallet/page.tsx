
'use client';

import { useAuth } from "@/auth/provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import type { Wallet, WalletTransaction } from "@/lib/types";
import { Loader2, Plus, ArrowUpRight, ArrowDownLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { getWallet, fundWallet, getWalletTransactions } from "./actions";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export default function WalletPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const [wallet, setWallet] = useState<Wallet | null>(null);
    const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [fundAmount, setFundAmount] = useState('');
    const [isFunding, startFunding] = useTransition();
    const { toast } = useToast();

    useEffect(() => {
        if (!authLoading && user) {
            setLoading(true);
            Promise.all([
                getWallet(user.uid),
                getWalletTransactions(user.uid)
            ]).then(([walletData, transactionsData]) => {
                setWallet(walletData);
                // Sort transactions by date descending (newest first)
                const sortedTransactions = transactionsData.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
                setTransactions(sortedTransactions);
            }).catch(error => {
                console.error("Failed to fetch wallet data:", error);
                toast({ variant: 'destructive', title: 'Error', description: 'Could not fetch wallet details.' });
            }).finally(() => {
                setLoading(false);
            });
        }
    }, [user, authLoading, toast]);

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
                // Manually update state for instant UI feedback
                setWallet(prev => prev ? {...prev, balance: result.newBalance!} : null)
                setTransactions(prev => [{
                    id: 'temp-' + Date.now(),
                    userId: user.uid,
                    type: 'credit',
                    amount,
                    description: 'Wallet top-up',
                    createdAt: new Date().toISOString(),
                }, ...prev]);

                toast({ title: 'Wallet Funded!', description: `Your new balance is ₦${result.newBalance.toLocaleString()}`})
                setFundAmount('');
            } else {
                toast({ variant: 'destructive', title: 'Funding Failed', description: result.error })
            }
        });
    }

    if (authLoading || (loading && !wallet)) {
        return <WalletSkeleton />;
    }

    if (!user) {
        router.push('/signin?callbackUrl=/wallet');
        return null;
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="grid md:grid-cols-3 gap-8">
                <div className="md:col-span-1 space-y-8">
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
                <div className="md:col-span-2">
                    <Card>
                        <CardHeader>
                            <CardTitle>Transaction History</CardTitle>
                            <CardDescription>A record of all your wallet activities.</CardDescription>
                        </CardHeader>
                        <CardContent>
                           <TransactionHistory transactions={transactions} loading={loading} />
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}

function TransactionHistory({ transactions, loading }: { transactions: WalletTransaction[], loading: boolean }) {
    if (loading) {
        return (
            <div className="space-y-2">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
            </div>
        );
    }
    if (transactions.length === 0) {
      return <p className="text-center text-muted-foreground py-10">No transactions yet.</p>;
    }
  
    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="text-right">Date</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {transactions.map(tx => (
                    <TableRow key={tx.id}>
                        <TableCell>
                            <Badge variant={tx.type === 'credit' ? 'default' : 'secondary'} className="capitalize flex-shrink-0">
                                {tx.type === 'credit' ? <ArrowUpRight className="mr-1 h-3 w-3"/> : <ArrowDownLeft className="mr-1 h-3 w-3" />}
                                {tx.type}
                            </Badge>
                        </TableCell>
                        <TableCell className="truncate">{tx.description}</TableCell>
                        <TableCell className={cn("text-right font-medium", tx.type === 'credit' ? 'text-green-600' : 'text-red-600')}>
                            {tx.type === 'credit' ? '+' : '-'}₦{new Intl.NumberFormat('en-NG').format(tx.amount)}
                        </TableCell>
                        <TableCell className="text-right text-xs text-muted-foreground">
                            {new Date(tx.createdAt).toLocaleDateString()}
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );
}


function WalletSkeleton() {
    return (
        <div className="container mx-auto px-4 py-8">
            <div className="grid md:grid-cols-3 gap-8">
                <div className="md:col-span-1 space-y-8">
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
                <div className="md:col-span-2">
                    <Card>
                        <CardHeader>
                            <Skeleton className="h-8 w-56" />
                            <Skeleton className="h-4 w-80 mt-2" />
                        </CardHeader>
                        <CardContent className="space-y-2">
                            <Skeleton className="h-10 w-full" />
                            <Skeleton className="h-10 w-full" />
                            <Skeleton className="h-10 w-full" />
                            <Skeleton className="h-10 w-full" />
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
