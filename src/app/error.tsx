'use client';

import { useEffect } from 'react';
import { Cairo } from 'next/font/google';

const cairo = Cairo({
  subsets: ['arabic'],
  variable: '--font-cairo',
  weight: ['400', '500', '600', '700', '800'],
});

// ── Capture errors for debugging ────────────────────────────
let lastCapturedError: { error: Error; digest?: string; at: number } | undefined;
const TTL_MS = 10_000;

function captureError(error: Error, digest?: string) {
  lastCapturedError = { error, digest, at: Date.now() };
  console.error('[Dokan Error Boundary]', error, digest);
}

export function getLastCapturedError() {
  if (!lastCapturedError) return undefined;
  if (Date.now() - lastCapturedError.at > TTL_MS) {
    lastCapturedError = undefined;
    return undefined;
  }
  return lastCapturedError.error;
}

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    captureError(error, error.digest);
  }, [error]);

  return (
    <html lang="ar" dir="rtl">
      <body className={`${cairo.variable} antialiased`}>
        <div className="min-h-screen bg-background flex items-center justify-center p-4 safe-top safe-bottom">
          <div className="max-w-md w-full text-center">
            {/* Icon */}
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-red-950/60 border border-red-800
                            flex items-center justify-center">
              <svg className="w-10 h-10 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
              </svg>
            </div>

            <h1 className="text-2xl font-bold text-foreground mb-2">
              حدث خطأ غير متوقع
            </h1>
            <p className="text-muted-foreground text-sm mb-8 leading-relaxed">
              عذراً، حدث خطأ في تحميل هذه الصفحة. يمكنك المحاولة مرة أخرى أو العودة للصفحة الرئيسية.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={() => reset()}
                className="btn-primary min-w-[140px]"
              >
                إعادة المحاولة
              </button>
              <a
                href="/"
                className="btn-secondary min-w-[140px] text-center"
              >
                العودة للرئيسية
              </a>
            </div>

            {/* Silent error detail for debugging — only shows in dev */}
            {process.env.NODE_ENV === 'development' && (
              <details className="mt-8 text-left">
                <summary className="text-xs text-muted-foreground cursor-pointer hover:text-muted-foreground">
                  تفاصيل التقني (dev)
                </summary>
                <pre className="mt-2 text-xs text-red-300 bg-card p-4 rounded-xl overflow-auto max-h-48 leading-relaxed font-mono">
                  {error.message}
                  {'\n\n'}
                  {error.stack}
                </pre>
              </details>
            )}
          </div>
        </div>
      </body>
    </html>
  );
}