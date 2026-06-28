'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { QrCode, Eye, EyeOff } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

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
              className="w-full rounded-full"
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
