'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Logo } from '@/components/logo';
import { useToast } from '@/hooks/use-toast';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';

export default function SignInPage() {
  const { toast } = useToast();
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsPending(true);

    const formData = new FormData(event.currentTarget);
    const { email, password } = Object.fromEntries(formData.entries());

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false, // Important to handle redirect manually
      });

      if (result?.error) {
        // Handle authentication error
        toast({
          variant: 'destructive',
          title: 'Authentication Failed',
          description: result.error === "CredentialsSignin" ? "Invalid email or password." : result.error,
        });
      } else if (result?.ok) {
        // Authentication successful
        toast({
          title: 'Signed In!',
          description: "You've successfully signed in.",
        });
        router.push(result.url || '/'); // Redirect to dashboard or intended URL
      }

    } catch (error: any) {
        let message = "An unknown error occurred.";
        if (error.message){
          message = error.message;
        }
        toast({
            variant: 'destructive',
            title: 'Authentication Failed',
            description: message,
          });
    } finally {
      setIsPending(false);
    }
  };


  return (
    <Card className="w-full max-w-sm">
      <CardHeader className="text-center">
        <div className="flex justify-center mb-4">
          <Logo />
        </div>
        <CardTitle className="text-2xl font-headline">Welcome Back</CardTitle>
        <CardDescription>
          Enter your credentials to access your account.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="m@example.com"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" name="password" type="password" required />
          </div>
          <LoginButton pending={isPending} />
        </form>
      </CardContent>
      <CardFooter className="flex-col gap-2">
        <div className="text-sm text-muted-foreground">
          <Link href="#" className="underline">
            Forgot your password?
          </Link>
        </div>
        <div className="text-center text-sm text-muted-foreground">
          Don&apos;t have an account?{' '}
          <Link href="/signup" className="underline">
            Sign up
          </Link>
        </div>
      </CardFooter>
    </Card>
  );
}

function LoginButton({ pending }: { pending: boolean }) {
  return (
    <Button type="submit" className="w-full" aria-disabled={pending} disabled={pending}>
      {pending ? 'Signing In...' : 'Sign In'}
    </Button>
  );
}
