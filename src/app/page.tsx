import Link from 'next/link';
import type { Metadata } from 'next';
import {
  QrCode, Zap, CreditCard, Globe, BarChart3,
  ChevronRight, Check, Star, ArrowRight
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'دكان — نظام طلبات QR للمطاعم في البحرين',
  description: 'دع العملاء يمسحون رمز QR ويطلبون من هواتفهم. الدفع عند الكاشير.',
};

function FeatureCard({
  icon: Icon,
  title,
  desc,
}: {
  icon: React.ElementType;
  title: string;
  desc: string;
}) {
  return (
    <div className="card group hover:border-[#3a3835] transition-all duration-300">
      <div className="w-10 h-10 rounded-xl bg-brand-500/10 border border-brand-500/20
                      flex items-center justify-center mb-4
                      group-hover:bg-brand-500/20 transition-colors">
        <Icon size={20} className="text-brand-400" />
      </div>
      <h3 className="font-semibold text-[#fafaf9] mb-2">{title}</h3>
      <p className="text-sm text-[#a8a29e] leading-relaxed">{desc}</p>
    </div>
  );
}

function StepCard({
  number,
  title,
  desc,
}: {
  number: string;
  title: string;
  desc: string;
}) {
  return (
    <div className="flex gap-4">
      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-brand-500
                      flex items-center justify-center
                      text-[#0f0e0c] font-bold text-sm">
        {number}
      </div>
      <div>
        <h3 className="font-semibold text-[#fafaf9] mb-1">{title}</h3>
        <p className="text-sm text-[#a8a29e]">{desc}</p>
      </div>
    </div>
  );
}

export default function LandingPage() {
  const features = [
    { icon: QrCode,    title: 'امسح واطلب', desc: 'يمسح العملاء رمز QR على الطاولة ويطلبون مباشرة من هواتفهم. بدون تحميل تطبيق.' },
    { icon: Zap,       title: 'مطبخ في الوقت الفعلي', desc: 'تظهر الطلبات فوراً على شاشة المطبخ. حدّث الحالة وأخبر العملاء عند جاهزية طلبهم.' },
    { icon: CreditCard,title: 'الدفع عند الكاشير', desc: 'لا حاجة لبوابة دفع إلكتروني. يدفع العملاء مباشرة عند الكاونتر نقداً أو ببطاقة.' },
    { icon: Globe,     title: 'عربي أولاً', desc: 'مصمم للبحرين مع دعم كامل للغة العربية وتخطيط RTL وعملة البحرين (د.ب.).' },
    { icon: QrCode,    title: 'توليد رموز QR', desc: 'أنشئ واطبع رموز QR لكل طاولة في ثوانٍ.' },
    { icon: BarChart3, title: 'التحليلات', desc: 'تتبع الإيرادات والعناصر الأكثر طلباً وساعات الذروة بلوحة تحكم في الوقت الفعلي.' },
  ];

  const steps = [
    { title: 'أنشئ قائمتك', desc: 'أضف الأصناف والعناصر والصور والأسعار بالعربي والإنجليزي.' },
    { title: 'اطبع رموز QR', desc: 'أنشئ رموز QR فريدة لكل طاولة واطبعها.' },
    { title: 'العملاء يطلبون', desc: 'يمسحون ويتصفحون ويقدمون طلباتهم من هواتفهم.' },
    { title: 'تحضّر وتستلم', desc: 'تظهر الطلبات على شاشة المطبخ. يدفع العملاء عند الكاشير.' },
  ];

  const plans = [
    {
      name: 'مجاني',
      nameEn: 'Free',
      price: '0',
      period: 'للأبد',
      highlight: false,
      features: [
        'طاولة واحدة',
        'قائمة غير محدودة',
        'شاشة المطبخ',
        'تحليلات أساسية',
      ],
      cta: 'ابدأ مجاناً',
      href: '/register',
    },
    {
      name: 'احترافي',
      nameEn: 'Pro',
      price: '15',
      period: 'شهرياً',
      highlight: true,
      features: [
        'طاولات غير محدودة',
        'إشعارات فورية (Push)',
        'طلبات يدوية',
        'تصدير التقارير',
        'دعم أولوية',
      ],
      cta: 'ابدأ الآن',
      href: '/register',
    },
  ];

  return (
    <div className="min-h-screen bg-[#0f0e0c]">
      {/* Navigation */}
      <header className="border-b border-[#1a1916] sticky top-0 z-50 backdrop-blur-md bg-[#0f0e0c]/90">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-brand-500 flex items-center justify-center">
              <QrCode size={18} className="text-[#0f0e0c]" />
            </div>
            <span className="font-bold text-[#fafaf9] text-lg">دكان</span>
          </Link>

          <nav className="hidden md:flex items-center gap-6">
            <Link href="/#features" className="text-sm text-[#a8a29e] hover:text-[#fafaf9] transition-colors">المميزات</Link>
            <Link href="/#pricing" className="text-sm text-[#a8a29e] hover:text-[#fafaf9] transition-colors">الأسعار</Link>
            <Link href="/login" className="text-sm text-[#a8a29e] hover:text-[#fafaf9] transition-colors">تسجيل الدخول</Link>
            <Link href="/register" className="btn-primary text-sm py-2 px-4">ابدأ الآن</Link>
          </nav>

          <div className="flex md:hidden items-center gap-2">
            <Link href="/login" className="text-sm text-[#a8a29e] hover:text-[#fafaf9]">تسجيل الدخول</Link>
            <Link href="/register" className="btn-primary text-sm py-2 px-3">ابدأ الآن</Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-4 pt-20 pb-24 text-center">
        <div className="inline-flex items-center gap-2 bg-[#1a1916] border border-[#2a2825]
                        rounded-full px-4 py-2 text-sm text-[#a8a29e] mb-8">
          <span>🇧🇭</span>
          <span>Bahrain · البحرين</span>
        </div>

        <h1 className="text-4xl md:text-6xl font-bold text-[#fafaf9] leading-tight
                       max-w-4xl mx-auto mb-6">
          <span className="text-brand-400">نظام QR للطلبات</span>
          {' '}في مطاعم البحرين
        </h1>

        <p className="text-lg text-[#a8a29e] max-w-2xl mx-auto mb-10 leading-relaxed">
          دعِ العملاء يمسحون الرمز ويطلبون من هواتفهم. الدفع عند الكاشير. بدون تطبيقات أو رسوم دفع إلكتروني.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link href="/register" className="btn-primary text-base px-6 py-3 w-full sm:w-auto">
            ابدأ مجاناً
            <ArrowRight size={18} className="rtl:rotate-180" />
          </Link>
        </div>

        <p className="text-sm text-[#57534e] mt-4">لا يلزم وجود بطاقة ائتمانية</p>

        {/* Hero visual */}
        <div className="mt-16 relative">
          <div className="absolute inset-0 bg-brand-500/5 rounded-3xl blur-3xl" />
          <div className="relative bg-[#1a1916] border border-[#2a2825] rounded-3xl p-6 max-w-3xl mx-auto">
            <div className="grid grid-cols-3 gap-4 text-left">
              {['D-001', 'D-002', 'D-003'].map((num, i) => (
                <div key={num} className={`rounded-xl p-3 border-2 ${
                  i === 0 ? 'border-yellow-700 bg-[#1c1406]' :
                  i === 1 ? 'border-teal-700 bg-[#0f2d2d]' :
                  'border-[#2a2825] bg-[#0f0e0c]'
                }`}>
                  <div className="text-xs text-[#57534e] mb-1">
                    {i === 0 ? '🍳 يتم التحضير' : i === 1 ? '✅ جاهز' : '⏳ في الانتظار'}
                  </div>
                  <div className="font-bold text-[#fafaf9] text-lg">{num}</div>
                  <div className="text-xs text-[#a8a29e] mt-1">طاولة {i + 1}</div>
                </div>
              ))}
            </div>
            <div className="mt-4 text-center text-xs text-[#57534e]">
              شاشة المطبخ — الطلبات في الوقت الفعلي
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="max-w-6xl mx-auto px-4 py-20">
        <div className="text-center mb-12">
          <span className="section-title">المميزات</span>
          <h2 className="text-3xl font-bold text-[#fafaf9]">دكان — كل ما تحتاجه</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map((f, i) => (
            <FeatureCard key={i} icon={f.icon} title={f.title} desc={f.desc} />
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="max-w-6xl mx-auto px-4 py-20 border-t border-[#1a1916]">
        <div className="text-center mb-12">
          <span className="section-title">الخطوات</span>
          <h2 className="text-3xl font-bold text-[#fafaf9]">كيف يعمل</h2>
        </div>
        <div className="max-w-xl mx-auto grid grid-cols-1 gap-8">
          {steps.map((s, i) => (
            <StepCard key={i} number={String(i + 1)} title={s.title} desc={s.desc} />
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="max-w-6xl mx-auto px-4 py-20 border-t border-[#1a1916]">
        <div className="text-center mb-12">
          <span className="section-title">الأسعار</span>
          <h2 className="text-3xl font-bold text-[#fafaf9]">بسيط وشفاف</h2>
          <p className="text-[#a8a29e] mt-3">ابدأ مجاناً. ارقَّ عندما تحتاج.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`card flex flex-col ${
                plan.highlight
                  ? 'border-brand-500/60 bg-[#1a1a0f]'
                  : 'border-[#2a2825]'
              }`}
            >
              {plan.highlight && (
                <div className="text-xs font-semibold text-brand-400 bg-brand-500/10
                                border border-brand-500/20 rounded-full px-3 py-1
                                self-start mb-4">
                  ⭐ الأكثر شيوعاً
                </div>
              )}
              <div className="mb-1">
                <span className="font-bold text-[#fafaf9] text-lg">{plan.name}</span>
                <span className="text-[#57534e] text-sm mr-1">· {plan.nameEn}</span>
              </div>
              <div className="flex items-baseline gap-1 mb-6">
                <span className="text-4xl font-bold text-[#fafaf9]">{plan.price}</span>
                <span className="text-[#a8a29e] text-sm">د.ب. / {plan.period}</span>
              </div>
              <ul className="space-y-3 flex-1 mb-6">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-[#a8a29e]">
                    <Check size={15} className="text-brand-400 flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                href={plan.href}
                className={plan.highlight ? 'btn-primary' : 'btn-secondary'}
              >
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* Bahrain features highlight */}
      <section className="max-w-6xl mx-auto px-4 py-20 border-t border-[#1a1916]">
        <div className="bg-[#1a1916] border border-[#2a2825] rounded-3xl p-8 md:p-12
                        flex flex-col md:flex-row items-center gap-8">
          <div className="flex-1">
            <div className="text-4xl mb-4">🇧🇭</div>
            <h2 className="text-2xl font-bold text-[#fafaf9] mb-4">Built for Bahrain</h2>
            <div className="space-y-3">
              {[
                { en: 'BHD currency with 3 decimal precision', ar: 'عملة البحرين (د.ب.) بدقة 3 خانات عشرية' },
                { en: 'Full Arabic RTL interface', ar: 'واجهة عربية كاملة من اليمين لليسار' },
                { en: 'All 4 Bahrain governorates supported', ar: 'دعم المحافظات الأربع في البحرين' },
                { en: 'Pay at cashier — no payment gateway', ar: 'الدفع عند الكاشير — بدون بوابة دفع إلكتروني' },
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-3">
                  <Check size={16} className="text-brand-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="text-[#fafaf9] text-sm">{item.en}</span>
                    <span className="text-[#57534e] text-sm mx-2">·</span>
                    <span className="text-[#a8a29e] text-sm font-cairo">{item.ar}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex-shrink-0 bg-[#0f0e0c] border border-[#2a2825] rounded-2xl p-4 w-full md:w-64">
            <div className="text-center mb-3">
              <div className="text-xs text-[#57534e]">واجهة العميل</div>
              <div className="font-bold text-[#fafaf9]">مطعم الدوحة</div>
              <div className="text-xs text-[#a8a29e]">Doha Restaurant · طاولة 5</div>
            </div>
            <div className="space-y-2">
              {[
                { name: 'مچبوس', price: '3.500', tag: '🌶️' },
                { name: 'هريس', price: '1.800', tag: '⭐' },
                { name: 'قهوة عربية', price: '0.500', tag: '☕' },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between
                                        bg-[#1a1916] rounded-xl px-3 py-2">
                  <div>
                    <div className="text-sm text-[#fafaf9] font-cairo">{item.tag} {item.name}</div>
                    <div className="text-xs text-brand-400">{item.price} د.ب.</div>
                  </div>
                  <button className="w-7 h-7 rounded-lg bg-brand-500
                                     flex items-center justify-center text-[#0f0e0c] font-bold text-sm">+</button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-6xl mx-auto px-4 py-20 text-center border-t border-[#1a1916]">
        <h2 className="text-3xl md:text-4xl font-bold text-[#fafaf9] mb-4">
          هل أنت مستعد لتحديث مطعمك؟
        </h2>
        <p className="text-[#a8a29e] mb-8 max-w-xl mx-auto">انضم إلى المطاعم في البحرين التي تستخدم دكان لطلبات QR أكثر ذكاءً.</p>
        <Link href="/register" className="btn-primary text-base px-8 py-3 inline-flex">
          ابدأ مجاناً
          <ArrowRight size={18} className="rtl:rotate-180" />
        </Link>
        <p className="text-sm text-[#57534e] mt-4">لا يلزم وجود بطاقة ائتمانية</p>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#1a1916]">
        <div className="max-w-6xl mx-auto px-4 py-8 flex flex-col md:flex-row
                        items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-brand-500 flex items-center justify-center">
              <QrCode size={14} className="text-[#0f0e0c]" />
            </div>
            <span className="text-[#fafaf9] font-bold">دكان</span>
          </div>
          <p className="text-sm text-[#57534e]">© 2026 دكان. البحرين 🇧🇭</p>
        </div>
      </footer>
    </div>
  );
}
