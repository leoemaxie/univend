import Link from 'next/link';
import { Logo } from '@/components/logo';

export default function Footer() {
  return (
    <footer className="border-t bg-foreground text-background">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="mb-4 md:mb-0">
            <Logo />
          </div>
          <nav className="flex gap-6 text-muted-foreground mb-4 md:mb-0">
            <Link href="#" className="hover:text-primary transition-colors">
              About
            </Link>
            <Link href="#" className="hover:text-primary transition-colors">
              Contact
            </Link>
            <Link href="/superadmin" className="hover:text-primary transition-colors">
              For Admins
            </Link>
            <Link href="/vendor/add-product" className="hover:text-primary transition-colors">
              For Vendors
            </Link>
          </nav>
        </div>
        <div className="mt-8 text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} Univend Inc. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
