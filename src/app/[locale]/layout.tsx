import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { Toaster } from 'react-hot-toast';
import { ServiceWorkerRegister } from '@/components/shared/ServiceWorkerRegister';

const locales = ['en', 'ar'] as const;

export default async function LocaleLayout({
  children,
  params: { locale },
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  if (!locales.includes(locale as 'en' | 'ar')) {
    notFound();
  }

  const messages = await getMessages();
  const dir = locale === 'ar' ? 'rtl' : 'ltr';

  return (
    <html lang={locale} dir={dir}>
      <body>
        <NextIntlClientProvider messages={messages} locale={locale}>
          <ServiceWorkerRegister />
          {children}
          <Toaster
            position={locale === 'ar' ? 'bottom-left' : 'bottom-right'}
            toastOptions={{
              style: {
                background: '#1a1916',
                color: '#fafaf9',
                border: '1px solid #2a2825',
                borderRadius: '12px',
                fontFamily: locale === 'ar'
                  ? "'Cairo', system-ui, sans-serif"
                  : "'Inter', system-ui, sans-serif",
              },
              success: {
                iconTheme: { primary: '#f59e0b', secondary: '#0f0e0c' },
              },
            }}
          />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
