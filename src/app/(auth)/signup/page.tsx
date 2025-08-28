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

export default function SignUpPage() {
  return (
    <Card className="w-full max-w-sm">
      <CardHeader className="text-center">
        <div className="flex justify-center mb-4">
          <Logo />
        </div>
        <CardTitle className="text-2xl font-headline">Create an Account</CardTitle>
        <CardDescription>
          Join the campus marketplace today.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="grid gap-2">
          <Label htmlFor="full-name">Full Name</Label>
          <Input id="full-name" placeholder="John Doe" required />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" placeholder="m@example.com" required />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="school">University</Label>
          <Select>
            <SelectTrigger>
              <SelectValue placeholder="Select your university" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="stanford">Stanford University</SelectItem>
              <SelectItem value="harvard">Harvard University</SelectItem>
              <SelectItem value="mit">MIT</SelectItem>
              <SelectItem value="yale">Yale University</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="role">I am a...</Label>
          <Select>
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
          <Input id="password" type="password" />
        </div>
        <Button type="submit" className="w-full bg-accent hover:bg-accent/90 text-accent-foreground">
          Create Account
        </Button>
      </CardContent>
      <CardFooter className="text-center text-sm text-muted-foreground">
        Already have an account?{' '}
        <Link href="/signin" className="underline">
          Sign In
        </Link>
      </CardFooter>
    </Card>
  );
}
