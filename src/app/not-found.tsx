import Link from 'next/link';
import type { Metadata } from 'next';
import { QrCode, Home } from 'lucide-react';

export const metadata: Metadata = {
  title: 'الصفحة غير موجودة — دكان',
  description: 'الصفحة التي تبحث عنها غير موجودة',
};

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-[#0f0e0c] flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 rounded-xl bg-brand-500/10 border border-brand-500/20
                        flex items-center justify-center mx-auto mb-6">
          <QrCode size={32} className="text-brand-400" />
        </div>
        <h1 className="text-6xl font-bold text-[#fafaf9] mb-4">404</h1>
        <h2 className="text-2xl font-bold text-[#fafaf9] mb-2">الصفحة غير موجودة</h2>
        <p className="text-[#a8a29e] mb-8">
          عذراً، الصفحة التي تبحث عنها غير موجودة أو تم نقلها.
        </p>
        <Link
          href="/"
          className="btn-primary text-base px-8 py-3 inline-flex items-center gap-2"
        >
          <Home size={18} />
          العودة إلى الرئيسية
        </Link>
      </div>
    </div>
  );
}
