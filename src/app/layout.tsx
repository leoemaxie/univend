import type { Metadata } from 'next';
import './globals.css';
import { cn } from '@/lib/utils';
import { Toaster } from '@/components/ui/toaster';
import Header from '@/components/layout/header';
import Footer from '@/components/layout/footer';

export const metadata: Metadata = {
  title: 'Univend - Your Campus Marketplace',
  description: 'Buy and sell products within your university campus.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=PT+Sans:wght@400;700&display=swap"
          rel="stylesheet"
        />
        <link rel="apple-touch-icon" sizes="57x57" href="/images/apple-icon-57x57.png" />
        <link rel="apple-touch-icon" sizes="60x60" href="/images/apple-icon-60x60.png" />
        <link rel="apple-touch-icon" sizes="72x72" href="/images/apple-icon-72x72.png" />
        <link rel="apple-touch-icon" sizes="76x76" href="/images/apple-icon-76x76.png" />
        <link rel="apple-touch-icon" sizes="114x114" href="/images/apple-icon-114x114.png" />
        <link rel="apple-touch-icon" sizes="120x120" href="/images/apple-icon-120x120.png" />
        <link rel="apple-touch-icon" sizes="144x144" href="/images/apple-icon-144x144.png" />
        <link rel="apple-touch-icon" sizes="152x152" href="/images/apple-icon-152x152.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/images/apple-icon-180x180.png" />
        <link rel="icon" type="image/png" sizes="192x192" href="/images/android-icon-192x192.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/images/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="96x96" href="/images/favicon-96x96.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/images/favicon-16x16.png" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="msapplication-TileColor" content="#ffffff" />
        <meta name="msapplication-TileImage" content="/images/ms-icon-144x144.png" />
        <meta name="theme-color" content="#ffffff"></meta>
      </head>
      
      <body className={cn('min-h-screen bg-background font-body antialiased')}>
        <div className="relative flex min-h-screen flex-col">
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
        </div>
        <Toaster />
      </body>
    </html>
  );
}
