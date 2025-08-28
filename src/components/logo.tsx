import Link from 'next/link';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import LogoImage from '@/app/logo.svg'

type LogoProps = {
  className?: string;
  isTextVisible?: boolean;
};

export function Logo({ className, isTextVisible = true }: LogoProps) {
  return (
    <Link href="/" className={cn('flex items-center gap-2', className)}>
      <Image src={LogoImage} alt="Univend Logo" width={40} height={40} />
      {isTextVisible && (
        <span className="text-2xl font-bold font-headline text-foreground">
          Univend
        </span>
      )}
    </Link>
  );
}
