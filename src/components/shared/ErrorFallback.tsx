'use client';

import { AlertTriangle } from 'lucide-react';

interface ErrorFallbackProps {
  error: Error;
  resetErrorBoundary: () => void;
}

export function ErrorFallback({ error, resetErrorBoundary }: ErrorFallbackProps) {
  return (
    <div className="min-h-screen bg-[#0f0e0c] flex items-center justify-center p-4 safe-top safe-bottom">
      <div className="max-w-md w-full text-center">
        {/* Icon */}
        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-red-950/60 border border-red-800
                        flex items-center justify-center">
          <AlertTriangle className="w-10 h-10 text-red-400" />
        </div>

        <h1 className="text-2xl font-bold text-[#fafaf9] mb-2">
          حدث خطأ غير متوقع
        </h1>
        <p className="text-[#a8a29e] text-sm mb-8 leading-relaxed">
          عذراً، حدث خطأ في تحميل هذه الصفحة. يمكنك المحاولة مرة أخرى أو العودة للصفحة الرئيسية.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={resetErrorBoundary}
            className="inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3 text-sm font-medium
                       min-w-[140px] bg-[#fafaf9] text-[#0f0e0c] hover:bg-[#e7e5e4]
                       transition-colors focus-visible:outline-none focus-visible:ring-2
                       focus-visible:ring-[#a8a29e] focus-visible:ring-offset-2
                       focus-visible:ring-offset-[#0f0e0c]"
          >
            إعادة المحاولة
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3 text-sm font-medium
                       min-w-[140px] text-center border border-[#2a2825] text-[#a8a29e]
                       hover:bg-[#1a1916] hover:text-[#fafaf9]
                       transition-colors focus-visible:outline-none focus-visible:ring-2
                       focus-visible:ring-[#a8a29e] focus-visible:ring-offset-2
                       focus-visible:ring-offset-[#0f0e0c]"
          >
            العودة للرئيسية
          </a>
        </div>

        {/* Debug details — only in development */}
        {process.env.NODE_ENV === 'development' && (
          <details className="mt-8 text-left">
            <summary className="text-xs text-[#57534e] cursor-pointer hover:text-[#a8a29e] select-none">
              تفاصيل تقنية (dev)
            </summary>
            <pre className="mt-2 text-xs text-red-300 bg-[#1a1916] p-4 rounded-xl overflow-auto max-h-48 leading-relaxed font-mono">
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
