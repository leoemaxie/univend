
'use client';

import Link from 'next/link';
import {
  Search,
  Wallet,
  User,
  LogOut,
  School,
  Menu,
  BookUser,
  LayoutDashboard,
  DollarSign,
  LogIn,
  ShoppingCart,
} from 'lucide-react';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuGroup,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Logo } from '@/components/logo';
import { ThemeToggle } from '@/components/theme-toggle';
import { getSchools, type School as SchoolType } from '@/lib/schools';
import React from 'react';
import { Skeleton } from '../ui/skeleton';
import { useAuth } from '@/auth/provider';
import { useCart } from '@/hooks/use-cart';
import { useRouter } from 'next/navigation';

export default function Header() {
  const [schools, setSchools] = React.useState<SchoolType[]>([]);
  const [loadingSchools, setLoadingSchools] = React.useState(true);
  const { user, userDetails, signOut } = useAuth();
  const { cart } = useCart();
  const router = useRouter();


  React.useEffect(() => {
    const fetchSchools = async () => {
      setLoadingSchools(true);
      const schoolList = await getSchools();
      setSchools(schoolList);
      setLoadingSchools(false);
    };
    fetchSchools();
  }, []);

  const handleSignOut = () => {
    signOut();
    router.push('/');
  };
  
  const getUserSchoolName = () => {
    if (!userDetails || !schools.length) return '';
    const school = schools.find(s => s.domain === userDetails.school);
    return school ? school.name : 'Unknown University';
  };


  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center">
        <div className="mr-4 hidden md:flex">
          <Logo />
        </div>

        <div className="md:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Open Menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left">
              <nav className="grid gap-6 text-lg font-medium mt-8">
                <Logo />
                <Link
                  href="/products"
                  className="text-muted-foreground hover:text-foreground"
                >
                  Browse Products
                </Link>
                <Link
                  href="/dashboard"
                  className="text-muted-foreground hover:text-foreground"
                >
                  Dashboard
                </Link>
                <Link
                  href="/wallet"
                  className="text-muted-foreground hover:text-foreground"
                >
                  Wallet
                </Link>
              </nav>
            </SheetContent>
          </Sheet>
        </div>

        <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
          <div className="w-full flex-1 md:w-auto md:flex-none">
            <form>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search products..."
                  className="w-full bg-muted pl-8 md:w-[200px] lg:w-[320px]"
                />
              </div>
            </form>
          </div>
          <div className="hidden md:flex items-center gap-4">
            {user && userDetails ? (
                 <Button variant="outline" className="w-[200px] justify-start text-left font-normal">
                    <School className="mr-2 h-4 w-4" />
                    <span className='truncate'>{getUserSchoolName()}</span>
                 </Button>
            ) : loadingSchools ? (
              <Skeleton className="h-10 w-[200px]" />
            ) : (
              <Select defaultValue={schools[0]?.domain}>
                <SelectTrigger className="w-[200px]">
                  <School className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Select University" />
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
           <Button asChild variant="ghost" size="icon">
                <Link href="/cart">
                    <ShoppingCart />
                    {cart.length > 0 && (
                        <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center">{cart.length}</span>
                    )}
                    <span className="sr-only">Cart</span>
                </Link>
            </Button>
          <ThemeToggle />
          {user && userDetails ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="relative h-8 w-8 rounded-full"
                >
                  <Avatar className="h-8 w-8">
                    <AvatarImage
                      src={user.photoURL || `https://avatar.vercel.sh/${user.email}.png`}
                      alt={user.displayName || 'User'}
                      data-ai-hint="user avatar"
                    />
                    <AvatarFallback>
                      {user.displayName?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {user.displayName}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                 <DropdownMenuItem asChild>
                    <Link href="/dashboard">
                        <LayoutDashboard className="mr-2 h-4 w-4" />
                        <span>Dashboard</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                     <Link href="/wallet">
                        <Wallet className="mr-2 h-4 w-4" />
                        <span>Wallet</span>
                     </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/profile">
                      <User className="mr-2 h-4 w-4" />
                      <span>Profile</span>
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuLabel>Your Role: {userDetails.role}</DropdownMenuLabel>
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard">
                      <BookUser className="mr-2 h-4 w-4" />
                      <span>{userDetails.role === 'vendor' ? 'Vendor Dashboard' : 'Become a Vendor'}</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                     <Link href="/dashboard">
                        <DollarSign className="mr-2 h-4 w-4" />
                        <span>{userDetails.role === 'rider' ? 'Rider Dashboard' : 'Become a Rider'}</span>
                     </Link>
                  </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button asChild>
              <Link href="/signin">
                <LogIn className="mr-2" />
                Sign In
              </Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
