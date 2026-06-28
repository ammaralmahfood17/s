'use client';

import { AlertTriangle } from 'lucide-react';

interface ErrorFallbackProps {
  error: Error;
  resetErrorBoundary: () => void;
}

export function ErrorFallback({ error, resetErrorBoundary }: ErrorFallbackProps) {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 safe-top safe-bottom">
      <div className="max-w-md w-full text-center">
        {/* Icon */}
        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-destructive/10 border border-destructive/30
                        flex items-center justify-center">
          <AlertTriangle className="w-10 h-10 text-destructive" />
        </div>

        <h1 className="text-2xl font-black text-foreground mb-2">
          حدث خطأ غير متوقع
        </h1>
        <p className="text-muted-foreground text-sm mb-8 leading-relaxed">
          عذراً، حدث خطأ في تحميل هذه الصفحة. يمكنك المحاولة مرة أخرى أو العودة للصفحة الرئيسية.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={resetErrorBoundary}
            className="btn-primary"
          >
            حاول مرة أخرى
          </button>
        </div>

        {error && (
          <details className="mt-6 text-left rtl:text-right">
            <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground">
              تفاصيل الخطأ
            </summary>
            <pre className="mt-2 text-xs text-destructive bg-muted p-4 rounded-xl overflow-auto max-h-48 leading-relaxed font-mono">
              {error.message}
            </pre>
          </details>
        )}

        {process.env.NODE_ENV === 'development' && (
          <details className="mt-6 text-left rtl:text-right">
            <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground select-none">
              تفاصيل تقنية (dev)
            </summary>
            <pre className="mt-2 text-xs text-destructive bg-muted p-4 rounded-xl overflow-auto max-h-48 leading-relaxed font-mono">
              {error.message}
              {'\n\n'}
              {error.stack}
            </pre>
          </details>
        )}
      </div>
    </div>
  );
}
