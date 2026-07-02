'use client';

import { Suspense, useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Eye, EyeOff } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

function LoginForm() {
  const router = useRouter();
  const supabase = createClient();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const searchParams = useSearchParams();

  // Show feedback toast when redirected from protected routes
  useEffect(() => {
    const reason = searchParams.get('reason');
    if (reason === 'unauthenticated') toast.error('يرجى تسجيل الدخول أولاً');
    if (reason === 'unauthorized') toast.error('ليس لديك صلاحية الوصول لهذا المطعم');
  }, [searchParams]);

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

    try {
      // Use the user from signInWithPassword response directly
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        // Session not ready yet — reload to pick up the cookie
        setTimeout(() => window.location.reload(), 1500);
        return;
      }

      // Check if super admin (maybeSingle = won't throw if not found)
      const { data: admin } = await supabase
        .from('super_admins')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (admin) {
        router.push('/admin');
        return;
      }

      // Fetch the user's restaurant slug (maybeSingle = won't throw if not found)
      const { data: restaurant } = await supabase
        .from('restaurants')
        .select('slug')
        .eq('owner_id', user.id)
        .maybeSingle();

      if (restaurant?.slug) {
        router.push(`/${restaurant.slug}/dashboard`);
      } else {
        router.push('/setup');
      }
    } catch (err) {
      console.error('Login redirect error:', err);
      toast.error('حدث خطأ أثناء التوجيه، يرجى المحاولة مرة أخرى');
      // Reload as fallback to let the auth state settle
      setTimeout(() => window.location.reload(), 2000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <div className="brand-icon !size-10 !rounded-xl">
              <span className="text-sm">د</span>
            </div>
            <span className="font-bold text-foreground text-xl">
              دكان
            </span>
          </Link>
          <h1 className="text-2xl font-black text-foreground">تسجيل الدخول</h1>
        </div>

        {/* Form */}
        <Card>
          <CardContent className="p-6">
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <Label>البريد الإلكتروني</Label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                autoComplete="email"
              />
            </div>

            <div>
              <Label>كلمة المرور</Label>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pr-11"
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full rounded-full text-white"
              style={{ backgroundColor: '#004956' }}
            >
              {loading ? 'جار التحميل...' : 'تسجيل الدخول'}
            </Button>
          </form>
          </CardContent>
        </Card>

        <p className="text-center text-sm text-muted-foreground mt-6">
          ليس لديك حساب؟{' '}
          <Link href="/register"
            className="text-primary hover:text-primary/80 font-bold">
            إنشاء حساب
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="text-muted-foreground">جاري التحميل...</div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
