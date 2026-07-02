'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { I18nProvider, LanguageToggle, useI18n } from '@/lib/i18n-landing';
import { useEffect, useState } from 'react';
import { Menu, X, Check, Star, ArrowLeft, ChevronDown } from 'lucide-react';

function Navbar() {
  const { t, lang } = useI18n();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const navItems = [
    { label: { ar: 'المميزات', en: 'Features' }, href: '#features' },
    { label: { ar: 'الأسعار', en: 'Pricing' }, href: '#pricing' },
    { label: { ar: 'المطورين', en: 'Developers' }, href: '#developers' },
  ];

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-white/95 backdrop-blur-xl shadow-[0_1px_3px_rgba(0,0,0,0.06)]'
          : 'bg-[#CFF7EE]'
      }`}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-[#004956] text-sm font-black text-white">
            د
          </span>
          <span className="text-lg font-black tracking-tight text-[#004956]">
            دكان
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden lg:flex items-center gap-1">
          {navItems.map((item) => (
            <Link
              key={item.label[lang]}
              href={item.href}
              className="px-3 py-2 text-sm font-semibold text-[#004956]/70 hover:text-[#004956] rounded-lg hover:bg-white/40 transition-colors"
            >
              {item.label[lang]}
            </Link>
          ))}
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <LanguageToggle />
          <Link href="/login" className="hidden sm:block text-sm font-semibold text-[#004956] hover:text-[#003a45] transition-colors">
            {t('sign_in')}
          </Link>
          <Link href="/register">
            <Button size="sm" className="bg-[#004956] text-white hover:bg-[#003a45] shadow-sm">
              {t('get_started')}
            </Button>
          </Link>
          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="lg:hidden p-2 rounded-lg hover:bg-white/40 transition-colors text-[#004956]"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="lg:hidden border-t border-[#004956]/10 bg-white px-4 py-4 space-y-2">
          {navItems.map((item) => (
            <Link
              key={item.label[lang]}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className="block px-3 py-2.5 text-sm font-semibold text-[#004956]/70 hover:text-[#004956] rounded-lg hover:bg-[#CFF7EE]/50 transition-colors"
            >
              {item.label[lang]}
            </Link>
          ))}
          <Link
            href="/login"
            onClick={() => setMobileOpen(false)}
            className="block px-3 py-2.5 text-sm font-semibold text-[#004956]/70 rounded-lg"
          >
            {t('sign_in')}
          </Link>
        </div>
      )}
    </header>
  );
}

function Hero() {
  const { t, lang } = useI18n();

  return (
    <section className="relative overflow-hidden bg-[#CFF7EE] pt-28 pb-20 sm:pt-36 sm:pb-28">
      {/* Decorative grid pattern */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            'radial-gradient(circle, #004956 1px, transparent 1px)',
          backgroundSize: '32px 32px',
        }}
      />

      <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mx-auto max-w-3xl text-center">
          {/* Tagline */}
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[#004956]/10 bg-white/60 px-3 py-1 text-xs font-semibold text-[#004956]">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            {t('tagline')} · 🇧🇭
          </span>

          {/* Heading */}
          <h1 className="mt-6 text-4xl font-black leading-[1.1] tracking-tight text-[#004956] sm:text-6xl md:text-7xl">
            {lang === 'ar' ? (
              <>
                دكان
                <br />
                <span className="text-[#004956]/70">أسهل نظام طلبات للمطاعم</span>
              </>
            ) : (
              <>
                Dokan
                <br />
                <span className="text-[#004956]/70">Simplest ordering for restaurants</span>
              </>
            )}
          </h1>

          <p className="mx-auto mt-4 max-w-xl text-base text-[#004956]/60 sm:text-lg">
            {t('hero_sub')}
          </p>

          {/* CTA Buttons */}
          <div className="mt-8 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
            <Link href="/register">
              <Button size="lg" className="w-full bg-[#004956] text-white hover:bg-[#003a45] shadow-sm sm:w-auto px-8 text-base">
                {t('cta_start')} ←
              </Button>
            </Link>
            <Link href="/register">
              <Button
                size="lg"
                variant="outline"
                className="w-full border-[#004956]/30 text-[#004956] hover:bg-[#004956]/5 sm:w-auto text-base"
              >
                {t('cta_demo')}
              </Button>
            </Link>
          </div>
        </div>

        {/* Mockup previews */}
        <div className="mx-auto mt-16 grid max-w-4xl gap-4 sm:grid-cols-2">
          {/* Menu preview */}
          <div className="rounded-2xl bg-white shadow-[0_8px_32px_rgba(0,73,86,0.12)] p-4 transition-all duration-200 hover:shadow-[0_12px_40px_rgba(0,73,86,0.18)]">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-[#CFF7EE] flex items-center justify-center text-sm">
                  ☕
                </div>
                <div>
                  <p className="text-sm font-bold text-[#1A1A1A]">
                    {lang === 'ar' ? 'ديمو كافيه' : 'Demo Cafe'}
                  </p>
                  <p className="text-xs text-gray-400">
                    {t('table')} 3
                  </p>
                </div>
              </div>
              <span className="text-xs font-bold bg-[#004956] text-white px-2 py-1 rounded-md">QR ✓</span>
            </div>
            <div className="space-y-2">
              {(lang === 'ar'
                ? [
                    { name: 'كابتشينو', price: '1.500' },
                    { name: 'كرواسون لوز', price: '2.000' },
                    { name: 'كيك شوكولاتة', price: '2.500' },
                  ]
                : [
                    { name: 'Cappuccino', price: '1.500' },
                    { name: 'Almond Croissant', price: '2.000' },
                    { name: 'Chocolate Cake', price: '2.500' },
                  ]
              ).map((item) => (
                <div
                  key={item.name}
                  className="flex items-center justify-between rounded-xl bg-gray-50 p-2.5"
                >
                  <div>
                    <p className="text-xs font-semibold text-[#1A1A1A]">{item.name}</p>
                    <p className="text-[10px] text-gray-400">{item.price} د.ب</p>
                  </div>
                  <span className="grid h-7 w-7 place-items-center rounded-full bg-[#004956] text-xs font-bold text-white">
                    +
                  </span>
                </div>
              ))}
              <div className="mt-2 rounded-xl bg-[#004956] p-3 text-center text-xs font-bold text-white">
                {t('place_order')} · 6.000 د.ب
              </div>
            </div>
          </div>

          {/* Dashboard preview */}
          <div className="rounded-2xl bg-white shadow-[0_8px_32px_rgba(0,73,86,0.12)] p-4 transition-all duration-200 hover:shadow-[0_12px_40px_rgba(0,73,86,0.18)]">
            <div className="flex items-center justify-between mb-4">
              <div className="flex gap-1">
                <div className="h-3 w-3 rounded-full bg-red-400" />
                <div className="h-3 w-3 rounded-full bg-yellow-400" />
                <div className="h-3 w-3 rounded-full bg-green-400" />
              </div>
              <span className="text-xs font-bold text-[#004956] bg-[#CFF7EE] px-2 py-0.5 rounded-full">
                {lang === 'ar' ? 'لوحة التحكم' : 'Dashboard'}
              </span>
            </div>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-xl bg-gray-50 p-3">
                  <p className="text-lg font-black text-[#004956]">١٢</p>
                  <p className="text-xs text-gray-400">{lang === 'ar' ? 'طلب جديد' : 'New orders'}</p>
                </div>
                <div className="rounded-xl bg-gray-50 p-3">
                  <p className="text-lg font-black text-[#004956]">٤</p>
                  <p className="text-xs text-gray-400">{lang === 'ar' ? 'قيد التحضير' : 'Preparing'}</p>
                </div>
              </div>
              <div className="rounded-xl bg-gray-50 p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold">{lang === 'ar' ? 'طاولة ٥ - كابتشينو ×٢' : 'Table 5 - Cappuccino ×2'}</p>
                    <p className="text-[10px] text-gray-400">{lang === 'ar' ? 'منذ دقيقتين' : '2 min ago'}</p>
                  </div>
                  <span className="badge-pending text-[10px] px-2 py-0.5">
                    {lang === 'ar' ? 'جديد' : 'New'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Stats() {
  const { lang } = useI18n();

  const stats = lang === 'ar'
    ? [
        { value: '+200', label: 'مطعم نشط' },
        { value: '٥٠ ألف+', label: 'طلب منشأ' },
        { value: '٤', label: 'محافظات' },
      ]
    : [
        { value: '+200', label: 'Active restaurants' },
        { value: '50K+', label: 'Orders placed' },
        { value: '4', label: 'Governorates' },
      ];

  return (
    <section className="bg-white border-b border-gray-100">
      <div className="mx-auto max-w-4xl px-4 py-12 sm:py-16">
        <div className="grid grid-cols-3 gap-8">
          {stats.map((stat) => (
            <div key={stat.label} className="text-center">
              <p className="text-3xl font-black text-[#004956] sm:text-4xl">{stat.value}</p>
              <p className="mt-1 text-sm text-gray-500">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Features() {
  const { t, lang } = useI18n();

  const features = [
    { key: 'menu', icon: '🍽️', t: t('feature_menu_t'), d: t('feature_menu_d') },
    { key: 'qr', icon: '📱', t: t('feature_qr_t'), d: t('feature_qr_d') },
    { key: 'kds', icon: '👨‍🍳', t: t('feature_kds_t'), d: t('feature_kds_d') },
    { key: 'mobile', icon: '📲', t: t('feature_mobile_t'), d: t('feature_mobile_d') },
    { key: 'bhd', icon: '💰', t: t('feature_bhd_t'), d: t('feature_bhd_d') },
    { key: 'ar', icon: '🌐', t: t('feature_ar_t'), d: t('feature_ar_d') },
  ];

  return (
    <section id="features" className="bg-white border-t border-gray-100">
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-black text-[#004956] sm:text-4xl">
            {lang === 'ar' ? 'كل ما تحتاجه لإدارة مطعمك' : 'Everything to run your restaurant'}
          </h2>
          <p className="mt-3 text-gray-500">
            {lang === 'ar'
              ? 'أدوات بسيطة وقوية صممت خصيصاً للمطاعم في البحرين'
              : 'Simple, powerful tools built for Bahrain restaurants'}
          </p>
        </div>

        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <div
              key={f.key}
              className="group rounded-2xl border border-gray-100 bg-white p-6 transition-all duration-200 hover:border-[#CFF7EE] hover:shadow-[0_4px_16px_rgba(0,73,86,0.08)]"
            >
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-[#CFF7EE] text-2xl transition-all duration-200 group-hover:bg-[#BAF3E6]">
                {f.icon}
              </div>
              <h3 className="text-lg font-bold text-[#004956]">{f.t}</h3>
              <p className="mt-2 text-sm leading-relaxed text-gray-500">{f.d}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function PartnerLogos() {
  const { lang } = useI18n();

  return (
    <section className="border-t border-gray-100 bg-gray-50/50 overflow-hidden py-10">
      <p className="text-center text-xs font-bold text-gray-400 uppercase tracking-widest mb-6">
        {lang === 'ar' ? 'يثق بنا' : 'Trusted by'}
      </p>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 w-20 bg-gradient-to-r from-gray-50/50 to-transparent z-10 pointer-events-none" />
        <div className="absolute inset-y-0 right-0 w-20 bg-gradient-to-l from-gray-50/50 to-transparent z-10 pointer-events-none" />

        <div className="flex animate-scroll gap-16 whitespace-nowrap" style={{ width: 'max-content' }}>
          {[...Array(8)].map((_, i) => (
            <span
              key={i}
              className="inline-flex items-center justify-center h-12 px-4 text-lg font-black text-gray-300 bg-gray-100/50 rounded-xl"
            >
              {lang === 'ar' ? 'مطعم' : 'RESTAURANT'} {i + 1}
            </span>
          ))}
          {[...Array(8)].map((_, i) => (
            <span
              key={`dup-${i}`}
              className="inline-flex items-center justify-center h-12 px-4 text-lg font-black text-gray-300 bg-gray-100/50 rounded-xl"
            >
              {lang === 'ar' ? 'مطعم' : 'RESTAURANT'} {i + 1}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

function HowItWorks() {
  const { t, lang } = useI18n();

  const steps = [
    { n: '1', t: t('step1_t'), d: t('step1_d') },
    { n: '2', t: t('step2_t'), d: t('step2_d') },
    { n: '3', t: t('step3_t'), d: t('step3_d') },
  ];

  return (
    <section className="bg-white border-t border-gray-100">
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
        <h2 className="text-center text-3xl font-black text-[#004956] sm:text-4xl">
          {t('steps_title')}
        </h2>
        <div className="mt-12 grid gap-6 sm:grid-cols-3">
          {steps.map((s) => (
            <div key={s.n} className="relative rounded-2xl border border-gray-100 bg-white p-6 text-center">
              <span className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-[#CFF7EE] text-[#004956] text-xl font-black mb-4">
                {s.n}
              </span>
              <h3 className="text-xl font-bold text-[#004956]">{s.t}</h3>
              <p className="mt-2 text-sm leading-relaxed text-gray-500">{s.d}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function CTASection() {
  const { t, lang } = useI18n();

  return (
    <section id="pricing" className="border-t border-gray-100 bg-white">
      <div className="mx-auto max-w-4xl px-4 py-20 text-center sm:py-28">
        <h2 className="text-3xl font-black text-[#004956] sm:text-5xl">
          {t('ready_launch')}
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-gray-500">
          {t('pricing_sub')}
        </p>
        <div className="mt-8 flex flex-col items-stretch justify-center gap-3 sm:flex-row">
          <Link href="/register">
            <Button size="lg" className="w-full bg-[#004956] text-white hover:bg-[#003a45] shadow-sm sm:w-auto px-8 text-base">
              {t('cta_start')} ←
            </Button>
          </Link>
          <Link href="/register">
            <Button size="lg" variant="outline" className="w-full border-[#004956]/30 text-[#004956] hover:bg-[#004956]/5 sm:w-auto text-base">
              {t('cta_demo')}
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  const { t, lang } = useI18n();

  const columns = lang === 'ar'
    ? [
        { t: 'المنتج', links: ['المميزات', 'الأسعار', 'المطورين'] },
        { t: 'الدعم', links: ['المساعدة', 'التعليمات', 'تواصل معنا'] },
        { t: 'قانوني', links: ['الشروط', 'الخصوصية'] },
      ]
    : [
        { t: 'Product', links: ['Features', 'Pricing', 'Developers'] },
        { t: 'Support', links: ['Help', 'Docs', 'Contact'] },
        { t: 'Legal', links: ['Terms', 'Privacy'] },
      ];

  return (
    <footer className="bg-[#004956]">
      <div className="mx-auto max-w-6xl px-4 pt-14 pb-8 sm:px-6">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <span className="flex items-center gap-2 text-white font-black text-lg">دكان</span>
            <p className="mt-3 text-sm text-white/60 leading-relaxed max-w-xs">
              {lang === 'ar'
                ? 'نظام طلبات QR للمطاعم في البحرين — بدون تطبيقات، بدون أجهزة.'
                : 'QR ordering system for Bahrain restaurants — no apps, no hardware.'}
            </p>
          </div>
          {columns.map((col) => (
            <div key={col.t}>
              <p className="text-white font-bold text-sm mb-3">{col.t}</p>
              <ul className="space-y-2">
                {col.links.map((link) => (
                  <li key={link}>
                    <Link href="#" className="text-sm text-white/60 hover:text-white transition-colors">
                      {link}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-10 border-t border-white/10 pt-6 text-center text-sm text-white/40">
          © {new Date().getFullYear()} {t('brand')} · {t('footer_made')}
        </div>
      </div>
    </footer>
  );
}

function LandingInner() {
  return (
    <main className="min-h-screen bg-white text-[#1A1A1A]">
      <Navbar />
      <Hero />
      <Stats />
      <Features />
      <PartnerLogos />
      <HowItWorks />
      <CTASection />
      <Footer />
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
