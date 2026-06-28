'use client';

import { useEffect } from 'react';
import { AlertTriangle, RefreshCw, ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="max-w-sm w-full text-center">
        <div className="w-14 h-14 rounded-2xl bg-red-950 border border-red-900
                        flex items-center justify-center mx-auto mb-5">
          <AlertTriangle size={24} className="text-red-400" />
        </div>
        <h2 className="text-xl font-bold text-foreground mb-2">خطأ في لوحة التحكم</h2>
        <p className="text-muted-foreground text-sm mb-6 leading-relaxed">
          حدث خطأ أثناء تحميل هذه الصفحة.
        </p>
        <div className="flex items-center justify-center gap-3">
          <button onClick={reset} className="btn-primary">
            <RefreshCw size={15} />
            حاول مجدداً
          </button>
          <button onClick={() => router.back()} className="btn-secondary">
            <ArrowRight size={15} className="rotate-180" />
            رجوع
          </button>
        </div>
        {error.digest && (
          <p className="text-xs text-muted-foreground mt-5 font-mono">ref: {error.digest}</p>
        )}
      </div>
    </div>
  );
}
