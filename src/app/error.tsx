'use client';

import { useEffect } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import Link from 'next/link';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen bg-[#0f0e0c] flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="w-16 h-16 rounded-2xl bg-red-950 border border-red-900
                        flex items-center justify-center mx-auto mb-6">
          <AlertTriangle size={28} className="text-red-400" />
        </div>
        <h1 className="text-2xl font-bold text-[#fafaf9] mb-2">حدث خطأ ما</h1>
        <p className="text-[#a8a29e] text-sm mb-8 leading-relaxed">
          عذراً، واجهنا مشكلة غير متوقعة. يمكنك المحاولة مجدداً أو العودة للصفحة الرئيسية.
        </p>
        <div className="flex items-center justify-center gap-3">
          <button onClick={reset} className="btn-primary">
            <RefreshCw size={16} />
            حاول مجدداً
          </button>
          <Link href="/" className="btn-secondary">
            <Home size={16} />
            الرئيسية
          </Link>
        </div>
        {error.digest && (
          <p className="text-xs text-[#57534e] mt-6 font-mono">ref: {error.digest}</p>
        )}
      </div>
    </div>
  );
}
