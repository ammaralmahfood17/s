'use client';

import { useEffect } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export default function AdminError({
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
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="max-w-sm w-full text-center">
        <div className="w-14 h-14 rounded-2xl bg-red-950 border border-red-900
                        flex items-center justify-center mx-auto mb-5">
          <AlertTriangle size={24} className="text-red-400" />
        </div>
        <h2 className="text-xl font-bold text-[#fafaf9] mb-2">خطأ في لوحة الإدارة</h2>
        <p className="text-[#a8a29e] text-sm mb-6">حدث خطأ غير متوقع.</p>
        <button onClick={reset} className="btn-primary">
          <RefreshCw size={15} />
          حاول مجدداً
        </button>
        {error.digest && (
          <p className="text-xs text-[#57534e] mt-5 font-mono">ref: {error.digest}</p>
        )}
      </div>
    </div>
  );
}
