import Link from 'next/link';
import { cn } from '@/lib/utils';
import Image from 'next/image';

type LogoProps = {
  className?: string;
  isTextVisible?: boolean;
};

export function Logo({ className, isTextVisible = true }: LogoProps) {
  return (
    <Link href="/" className={cn('flex items-center gap-2', className)}>
      <Image src="/images/logo.png" alt="Univend Logo" width={40} height={40} />
      {isTextVisible && (
        <span className="text-2xl font-bold font-headline text-slate-800">
          Univend
        </span>
      )}
    </Link>
  );
}
