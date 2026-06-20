import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: 'Dokan — QR Ordering for Bahrain Restaurants',
  description: 'Let customers scan, browse, and order from their phones. Pay at the cashier.',
  keywords: 'QR menu Bahrain, restaurant ordering system Bahrain, قائمة QR البحرين',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Dokan',
  },
  formatDetection: {
    telephone: false, // prevent iOS auto-linking phone-like numbers (e.g. order numbers)
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,        // prevents pinch-zoom from breaking layout
  userScalable: false,    // app-like feel; inputs already use 16px to avoid auto-zoom
  viewportFit: 'cover',   // allows safe-area-inset-* to work on iPhone notch
  themeColor: '#0f0e0c',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body className={`${inter.variable} antialiased`}>{children}</body>
    </html>
  );
}
