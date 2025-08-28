import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Package } from 'lucide-react';

type LogoProps = {
  className?: string;
  isTextVisible?: boolean;
};

export function Logo({ className, isTextVisible = true }: LogoProps) {
  return (
    <Link href="/" className={cn('flex items-center gap-2', className)}>
      <div className="bg-primary rounded-md p-2">
        <Package className="h-6 w-6 text-primary-foreground" />
      </div>
      {isTextVisible && (
        <span className="text-2xl font-bold font-headline text-slate-800">
          Univend
        </span>
      )}
    </Link>
  );
}
