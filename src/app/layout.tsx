import type { Metadata, Viewport } from 'next';
import { Cairo } from 'next/font/google';
import './globals.css';
import { Toaster } from '@/components/shared/Toaster';
import { ServiceWorkerRegister } from '@/components/shared/ServiceWorkerRegister';
import QueryProvider from '@/components/shared/QueryProvider';

const cairo = Cairo({
  subsets: ['arabic'],
  variable: '--font-cairo',
  weight: ['400', '500', '600', '700', '800'],
});

export const metadata: Metadata = {
  title: 'دكان — نظام طلبات QR للمطاعم في البحرين',
  description: 'دع العملاء يمسحون رمز QR ويطلبون من هواتفهم. الدفع عند الكاشير.',
  keywords: 'QR menu Bahrain, restaurant ordering system Bahrain, قائمة QR البحرين',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'دكان',
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#0f0e0c',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ar" dir="rtl" className="dark" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="mobile-web-app-capable" content="yes" />
        {/* ── Hydrate .dark class before paint (prevents flash) ── */}
        <script dangerouslySetInnerHTML={{
          __html: `(function(){if(localStorage.getItem('dokan-theme')==='light')document.documentElement.classList.remove('dark')})();`,
        }} />
      </head>
      <body className={`${cairo.variable} antialiased`}>
        <QueryProvider>
          <ServiceWorkerRegister />
          {children}
          <Toaster />
        </QueryProvider>
      </body>
    </html>
  );
}
