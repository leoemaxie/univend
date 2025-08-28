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

export default function Header() {
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
                  href="/vendor/add-product"
                  className="text-muted-foreground hover:text-foreground"
                >
                  Sell a Product
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
            <Select defaultValue="stanford">
              <SelectTrigger className="w-[200px]">
                <School className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Select University" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="stanford">Stanford University</SelectItem>
                <SelectItem value="harvard">Harvard University</SelectItem>
                <SelectItem value="mit">MIT</SelectItem>
                <SelectItem value="yale">Yale University</SelectItem>
              </SelectContent>
            </Select>

            <Button asChild variant="outline">
              <Link href="/vendor/add-product">Sell a Product</Link>
            </Button>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarImage
                    src="https://picsum.photos/100/100"
                    alt="User"
                    data-ai-hint="user avatar"
                  />
                  <AvatarFallback>U</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">
                    Test User
                  </p>
                  <p className="text-xs leading-none text-muted-foreground">
                    buyer@univend.com
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem>
                  <LayoutDashboard className="mr-2 h-4 w-4" />
                  <span>Dashboard</span>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Wallet className="mr-2 h-4 w-4" />
                  <span>Wallet</span>
                  <span className="ml-auto text-sm font-bold">$52.50</span>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <User className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuLabel>Roles</DropdownMenuLabel>
                 <DropdownMenuItem asChild>
                    <Link href="/vendor/add-product">
                        <BookUser className="mr-2 h-4 w-4" />
                        <span>Vendor</span>
                    </Link>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <DollarSign className="mr-2 h-4 w-4" />
                  <span>Rider</span>
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/signin">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
