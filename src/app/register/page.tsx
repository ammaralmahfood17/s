'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { QrCode, Eye, EyeOff, Check, X } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import toast from 'react-hot-toast';

export default function RegisterPage() {
  const router = useRouter();
  const supabase = createClient();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const passwordMinLength = 8;
  const hasMinLength = password.length >= passwordMinLength;
  const hasLowerCase = /[a-z]/.test(password);
  const hasUpperCase = /[A-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < passwordMinLength) {
      toast.error('كلمة المرور يجب أن تكون 8 أحرف على الأقل');
      return;
    }
    setLoading(true);

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: name },
      },
    });

    if (error) {
      toast.error('تعذر إنشاء الحساب');
      setLoading(false);
      return;
    }

    toast.success('تم إنشاء الحساب! تحقق من بريدك الإلكتروني.');
    router.push('/login');
  };

  return (
    <div className="min-h-screen bg-[#0f0e0c] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-10">
          <Link href="/" className="inline-flex flex-col items-center gap-3 mb-6 group">
            <div className="w-16 h-16 rounded-2xl bg-brand-500 flex items-center justify-center
                            shadow-[0_0_20px_rgba(245,158,11,0.15)] group-hover:shadow-[0_0_30px_rgba(245,158,11,0.25)]
                            transition-all duration-300">
              <QrCode size={32} className="text-[#0f0e0c]" />
            </div>
            <span className="font-bold text-[#fafaf9] text-2xl">
              دكان
            </span>
          </Link>

          {/* Decorative QR dots */}
          <div className="flex items-center justify-center gap-1.5 mb-4">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="w-1.5 h-1.5 rounded-full bg-brand-500/40"
                style={{ animationDelay: `${i * 0.2}s` }}
              />
            ))}
          </div>

          <h1 className="text-2xl font-bold text-[#fafaf9]">إنشاء حساب</h1>
          <p className="text-sm text-[#a8a29e] mt-1">ابدأ رحلتك مع دكان اليوم</p>
        </div>

        {/* Form */}
        <div className="card border-[#2a2825] shadow-[0_0_15px_rgba(245,158,11,0.06)]">
          <form onSubmit={handleRegister} className="space-y-5">
            <div>
              <label className="label">الاسم الكامل</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="input transition-all duration-200 hover:border-[#3a3835] focus:shadow-[0_0_12px_rgba(245,158,11,0.08)]"
                placeholder="محمد أحمد"
                required
              />
            </div>

            <div>
              <label className="label">البريد الإلكتروني</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input transition-all duration-200 hover:border-[#3a3835] focus:shadow-[0_0_12px_rgba(245,158,11,0.08)]"
                placeholder="you@example.com"
                required
              />
            </div>

            <div>
              <label className="label">كلمة المرور</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input pr-11 transition-all duration-200 hover:border-[#3a3835] focus:shadow-[0_0_12px_rgba(245,158,11,0.08)]"
                  placeholder="••••••••"
                  required
                  minLength={passwordMinLength}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#57534e] hover:text-[#a8a29e] transition-colors duration-200 p-1"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              {/* Password requirements badges */}
              <div className="flex flex-wrap gap-2 mt-3">
                <span
                  className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full border transition-all duration-200 ${
                    hasMinLength
                      ? 'bg-[#1a2e1a] text-[#86efac] border-[#14532d]'
                      : 'bg-[#1c1917] text-[#a8a29e] border-[#292524]'
                  }`}
                >
                  {hasMinLength ? <Check size={10} /> : <X size={10} />}
                  ٨ أحرف أو أكثر
                </span>
                <span
                  className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full border transition-all duration-200 ${
                    hasLowerCase
                      ? 'bg-[#1a2e1a] text-[#86efac] border-[#14532d]'
                      : 'bg-[#1c1917] text-[#a8a29e] border-[#292524]'
                  }`}
                >
                  {hasLowerCase ? <Check size={10} /> : <X size={10} />}
                  حرف صغير
                </span>
                <span
                  className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full border transition-all duration-200 ${
                    hasUpperCase
                      ? 'bg-[#1a2e1a] text-[#86efac] border-[#14532d]'
                      : 'bg-[#1c1917] text-[#a8a29e] border-[#292524]'
                  }`}
                >
                  {hasUpperCase ? <Check size={10} /> : <X size={10} />}
                  حرف كبير
                </span>
                <span
                  className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full border transition-all duration-200 ${
                    hasNumber
                      ? 'bg-[#1a2e1a] text-[#86efac] border-[#14532d]'
                      : 'bg-[#1c1917] text-[#a8a29e] border-[#292524]'
                  }`}
                >
                  {hasNumber ? <Check size={10} /> : <X size={10} />}
                  رقم
                </span>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3 shadow-[0_0_15px_rgba(245,158,11,0.15)] hover:shadow-[0_0_25px_rgba(245,158,11,0.25)] transition-shadow duration-300"
            >
              {loading ? 'جار التحميل...' : 'إنشاء حساب'}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-[#a8a29e] mt-6">
          لديك حساب بالفعل؟{' '}
          <Link href="/login"
            className="text-brand-400 hover:text-brand-300 font-medium transition-colors">
            تسجيل الدخول
          </Link>
        </p>
      </div>
    </div>
  );
}
