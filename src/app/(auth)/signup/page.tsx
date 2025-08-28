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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Logo } from '@/components/logo';
import { getSchools, type School } from '@/lib/schools';
import { useEffect, useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { 
  createUserWithEmailAndPassword, 
  updateProfile,
  auth, 
  db,
  doc,
  setDoc,
} from '@/lib/firebase';


export default function SignUpPage() {
  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);
  const [role, setRole] = useState('');
  const [school, setSchool] = useState('');

  useEffect(() => {
    const fetchSchools = async () => {
      setLoading(true);
      const schoolList = await getSchools();
      setSchools(schoolList);
      setLoading(false);
    };
    fetchSchools();
  }, []);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsPending(true);

    const formData = new FormData(event.currentTarget);
    const { fullName, email, password } = Object.fromEntries(formData.entries());

    try {
        if(!fullName || !email || !school || !role || !password){
            toast({ variant: 'destructive', title: 'Error', description: "All fields are required" });
            setIsPending(false);
            return;
        }

        const userCredential = await createUserWithEmailAndPassword(auth, email as string, password as string);
        const user = userCredential.user;

        await updateProfile(user, {
            displayName: fullName as string,
        });

        await setDoc(doc(db, "users", user.uid), {
            uid: user.uid,
            fullName,
            email,
            school,
            role,
            createdAt: new Date().toISOString()
        });
        
        toast({ title: 'Success!', description: "Account created successfully! Redirecting..." });
        router.push('/dashboard');
        router.refresh();

    } catch (error: any) {
        let message = "An unknown error occurred.";
        if (error.code === 'auth/email-already-in-use') {
            message = "This email is already registered. Please sign in.";
        } else if (error.message) {
            message = error.message;
        }
        toast({ variant: 'destructive', title: 'Error', description: message });
    } finally {
        setIsPending(false);
    }
  }

  return (
    <Card className="w-full max-w-sm">
      <CardHeader className="text-center">
        <div className="flex justify-center mb-4">
          <Logo />
        </div>
        <CardTitle className="text-2xl font-headline">
          Create an Account
        </CardTitle>
        <CardDescription>Join the campus marketplace today.</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="fullName">Full Name</Label>
            <Input name="fullName" id="fullName" placeholder="John Doe" required />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              name="email"
              id="email"
              type="email"
              placeholder="m@example.com"
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="school">University</Label>
            {loading ? (
              <Skeleton className="h-10 w-full" />
            ) : (
              <Select name="school" required onValueChange={setSchool}>
                <SelectTrigger>
                  <SelectValue placeholder="Select your university" />
                </SelectTrigger>
                <SelectContent>
                  {schools.map((school) => (
                    <SelectItem key={school.domain} value={school.domain}>
                      {school.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
          <div className="grid gap-2">
            <Label htmlFor="role">I am a...</Label>
            <Select name="role" required onValueChange={setRole}>
              <SelectTrigger>
                <SelectValue placeholder="Select your role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="buyer">Buyer</SelectItem>
                <SelectItem value="vendor">Vendor</SelectItem>
                <SelectItem value="rider">Rider</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="password">Password</Label>
            <Input name="password" id="password" type="password" required />
          </div>
          <SignUpButton pending={isPending} />
        </CardContent>
        <CardFooter className="flex-col text-center text-sm text-muted-foreground">
          <p>
            Already have an account?{' '}
            <Link href="/signin" className="underline">
              Sign In
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}

function SignUpButton({ pending }: { pending: boolean }) {
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? 'Creating Account...' : 'Create Account'}
    </Button>
  );
}
