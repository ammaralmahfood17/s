'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { QrCode, Eye, EyeOff } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      toast.error('البريد الإلكتروني أو كلمة المرور غير صحيحة');
      setLoading(false);
      return;
    }

    toast.success('مرحباً بعودتك!');

    // Redirect based on role
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: admin } = await supabase
        .from('super_admins')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (admin) {
        router.push('/admin');
        return;
      }

      // Fetch the user's restaurant slug
      const { data: restaurant } = await supabase
        .from('restaurants')
        .select('slug')
        .eq('owner_id', user.id)
        .single();

      if (restaurant?.slug) {
        router.push(`/${restaurant.slug}/dashboard`);
      } else {
        // No restaurant yet — go to onboarding
        router.push('/setup');
      }
    } else {
      router.push('/');
    }
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

          <h1 className="text-2xl font-bold text-[#fafaf9]">تسجيل الدخول</h1>
          <p className="text-sm text-[#a8a29e] mt-1">أهلاً بعودتك إلى دكان</p>
        </div>

        {/* Form */}
        <div className="card border-[#2a2825] shadow-[0_0_15px_rgba(245,158,11,0.06)]">
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="label">البريد الإلكتروني</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input transition-all duration-200 hover:border-[#3a3835] focus:shadow-[0_0_12px_rgba(245,158,11,0.08)]"
                placeholder="you@example.com"
                required
                autoComplete="email"
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
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#57534e] hover:text-[#a8a29e] transition-colors duration-200 p-1"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3 shadow-[0_0_15px_rgba(245,158,11,0.15)] hover:shadow-[0_0_25px_rgba(245,158,11,0.25)] transition-shadow duration-300"
            >
              {loading ? 'جار التحميل...' : 'تسجيل الدخول'}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-[#a8a29e] mt-6">
          ليس لديك حساب؟{' '}
          <Link href="/register"
            className="text-brand-400 hover:text-brand-300 font-medium transition-colors">
            إنشاء حساب
          </Link>
        </p>
      </div>
    </div>
  );
}
