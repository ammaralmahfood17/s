'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { I18nProvider, LanguageToggle, useI18n } from '@/lib/i18n-landing';

function LandingInner() {
  const { t, lang } = useI18n();

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white">
      <header className="sticky top-0 z-30 border-b border-white/5 bg-[#0a0a0a]/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
          <Link href="/" className="flex items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-amber-400 to-rose-500 text-base font-black text-black">
              د
            </span>
            <span className="text-lg font-extrabold tracking-tight">{t('brand')}</span>
          </Link>
          <div className="flex items-center gap-2">
            <LanguageToggle />
            <Link href="/login" className="hidden sm:inline-block">
              <Button size="sm" variant="ghost" className="text-white hover:bg-white/10 hover:text-white">
                {t('sign_in')}
              </Button>
            </Link>
            <Link href="/register">
              <Button size="sm" className="bg-white text-black hover:bg-white/90">
                {t('get_started')}
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-60"
          style={{
            background:
              'radial-gradient(60% 50% at 50% 0%, rgba(251,191,36,0.18) 0%, rgba(244,63,94,0.08) 35%, transparent 70%)',
          }}
        />
        <div className="relative mx-auto max-w-6xl px-4 pt-16 pb-20 sm:px-6 sm:pt-24 sm:pb-28">
          <div className="mx-auto max-w-3xl text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-medium text-white/80">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              {t('tagline')} · 🇧🇭
            </span>
            <h1 className="mt-6 text-4xl font-black leading-[1.1] tracking-tight sm:text-6xl md:text-7xl">
              {lang === 'ar' ? (
                <>
                  نظام طلبات
                  <br />
                  <span className="bg-gradient-to-l from-amber-300 via-rose-400 to-fuchsia-500 bg-clip-text text-transparent">
                    لمطاعم البحرين
                  </span>
                </>
              ) : (
                <>
                  QR ordering
                  <br />
                  <span className="bg-gradient-to-r from-amber-300 via-rose-400 to-fuchsia-500 bg-clip-text text-transparent">
                    for Bahrain restaurants
                  </span>
                </>
              )}
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-white/70 sm:text-lg">
              {t('hero_sub')}
            </p>
            <div className="mt-8 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
              <Link href="/register">
                <Button size="lg" className="w-full bg-white text-black hover:bg-white/90 sm:w-auto">
                  {t('cta_start')} →
                </Button>
              </Link>
              <Link href="/register">
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full border-white/20 bg-transparent text-white hover:bg-white/10 hover:text-white sm:w-auto"
                >
                  {t('cta_demo')}
                </Button>
              </Link>
            </div>
          </div>

          <div className="mx-auto mt-16 max-w-sm">
            <div className="relative mx-auto aspect-[9/19] w-full max-w-[280px] rounded-[2.5rem] border-[10px] border-white/10 bg-gradient-to-b from-white to-zinc-100 p-3 shadow-[0_30px_80px_-20px_rgba(244,63,94,0.4)]">
              <div className="absolute inset-x-0 top-0 mx-auto mt-1 h-5 w-24 rounded-b-2xl bg-black/80" />
              <div className="flex h-full flex-col gap-2 overflow-hidden rounded-[1.8rem] bg-zinc-50 p-3 text-black">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] text-zinc-500">{t('table')} 3</p>
                    <p className="text-sm font-bold">{lang === 'ar' ? 'ديمو كافيه' : 'Demo Cafe'}</p>
                  </div>
                  <span className="rounded-full bg-black px-2 py-1 text-[10px] font-bold text-white">QR ✓</span>
                </div>
                {(lang === 'ar'
                  ? [
                      { n: 'كابتشينو', p: '1.500' },
                      { n: 'كرواسون لوز', p: '2.000' },
                      { n: 'كيك الشوكولاتة', p: '2.500' },
                    ]
                  : [
                      { n: 'Cappuccino', p: '1.500' },
                      { n: 'Almond Croissant', p: '2.000' },
                      { n: 'Chocolate Cake', p: '2.500' },
                    ]
                ).map((it) => (
                  <div key={it.n} className="flex items-center justify-between rounded-xl bg-white p-2.5 shadow-sm ring-1 ring-zinc-200/60">
                    <div className="min-w-0">
                      <p className="truncate text-xs font-semibold">{it.n}</p>
                      <p className="text-[10px] text-zinc-500">{it.p} د.ب</p>
                    </div>
                    <span className="grid h-7 w-7 place-items-center rounded-full bg-black text-sm font-bold text-white">+</span>
                  </div>
                ))}
                <div className="mt-auto rounded-xl bg-gradient-to-r from-amber-400 to-rose-500 p-3 text-center text-xs font-bold text-black">
                  {t('place_order')} · 6.000 د.ب
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-white/5 bg-[#0a0a0a]">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { t: t('feature_menu_t'), d: t('feature_menu_d'), icon: '🍽️', c: 'from-amber-400 to-orange-500' },
              { t: t('feature_qr_t'), d: t('feature_qr_d'), icon: '📱', c: 'from-rose-400 to-fuchsia-500' },
              { t: t('feature_kds_t'), d: t('feature_kds_d'), icon: '👨‍🍳', c: 'from-emerald-400 to-teal-500' },
              { t: t('feature_mobile_t'), d: t('feature_mobile_d'), icon: '📲', c: 'from-sky-400 to-indigo-500' },
              { t: t('feature_bhd_t'), d: t('feature_bhd_d'), icon: '💰', c: 'from-yellow-300 to-amber-500' },
              { t: t('feature_ar_t'), d: t('feature_ar_d'), icon: '🌐', c: 'from-violet-400 to-purple-500' },
            ].map((f) => (
              <div
                key={f.t}
                className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] p-6 transition hover:border-white/20 hover:bg-white/[0.06]"
              >
                <div className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${f.c} text-2xl shadow-lg`}>
                  {f.icon}
                </div>
                <h3 className="text-lg font-bold">{f.t}</h3>
                <p className="mt-2 text-sm leading-relaxed text-white/60">{f.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-white/5 bg-gradient-to-b from-[#0a0a0a] to-[#111]">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
          <h2 className="text-center text-3xl font-black tracking-tight sm:text-5xl">{t('steps_title')}</h2>
          <div className="mt-12 grid gap-6 sm:grid-cols-3">
            {[
              { n: '1', t: t('step1_t'), d: t('step1_d') },
              { n: '2', t: t('step2_t'), d: t('step2_d') },
              { n: '3', t: t('step3_t'), d: t('step3_d') },
            ].map((s) => (
              <div key={s.n} className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
                <span className="bg-gradient-to-br from-amber-300 to-rose-500 bg-clip-text text-5xl font-black text-transparent">
                  {s.n}
                </span>
                <h3 className="mt-3 text-xl font-bold">{s.t}</h3>
                <p className="mt-2 text-sm leading-relaxed text-white/60">{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-white/5">
        <div className="mx-auto max-w-4xl px-4 py-16 text-center sm:px-6 sm:py-24">
          <h2 className="text-3xl font-black tracking-tight sm:text-5xl">
            {t('ready_launch')}
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-white/60">{t('pricing_sub')}</p>
          <div className="mt-8 flex flex-col items-stretch justify-center gap-3 sm:flex-row">
            <Link href="/register">
              <Button size="lg" className="w-full bg-gradient-to-r from-amber-400 to-rose-500 text-black hover:opacity-90 sm:w-auto">
                {t('cta_start')} →
              </Button>
            </Link>
            <Link href="/register">
              <Button size="lg" variant="outline" className="w-full border-white/20 bg-transparent text-white hover:bg-white/10 hover:text-white sm:w-auto">
                {t('cta_demo')}
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-white/5 py-8 text-center text-xs text-white/40">
        © {new Date().getFullYear()} {t('brand')} · {t('footer_made')}
      </footer>
    </main>
  );
}

export default function LandingPage() {
  return (
    <I18nProvider>
      <LandingInner />
    </I18nProvider>
  );
}
