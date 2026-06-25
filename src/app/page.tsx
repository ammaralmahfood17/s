import Link from 'next/link';
import type { Metadata } from 'next';
import {
  QrCode, Zap, CreditCard, Globe, BarChart3,
  ChevronRight, Check, Star, ArrowRight, Shield,
  Smartphone, Users, Coffee, Sparkles
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'دكان — نظام طلبات QR للمطاعم في البحرين',
  description: 'دع العملاء يمسحون رمز QR ويطلبون من هواتفهم. الدفع عند الكاشير.',
};

const features = [
  { icon: QrCode,     title: 'امسح واطلب',      desc: 'يمسح العملاء رمز QR على الطاولة ويطلبون مباشرة من هواتفهم. بدون تحميل تطبيق.' },
  { icon: Zap,        title: 'مطبخ فوري',        desc: 'تظهر الطلبات فوراً على شاشة المطبخ. حدّث الحالة وأخبر العملاء عند جاهزية طلبهم.' },
  { icon: CreditCard, title: 'الدفع عند الكاشير', desc: 'لا حاجة لبوابة دفع إلكتروني. يدفع العملاء مباشرة عند الكاونتر نقداً أو ببطاقة.' },
  { icon: Globe,      title: 'عربي أولاً',        desc: 'مصمم للبحرين مع دعم كامل للغة العربية وتخطيط RTL وعملة البحرين (د.ب.).' },
  { icon: Smartphone, title: 'توليد رموز QR',    desc: 'أنشئ واطبع رموز QR لكل طاولة في ثوانٍ. سهلة وسريعة.' },
  { icon: BarChart3,  title: 'التحليلات',        desc: 'تتبع الإيرادات والعناصر الأكثر طلباً وساعات الذروة بلوحة تحكم في الوقت الفعلي.' },
];

const steps = [
  { title: 'أنشئ قائمتك',      desc: 'أضف الأصناف والعناصر والصور والأسعار بالعربي والإنجليزي.' },
  { title: 'اطبع رموز QR',     desc: 'أنشئ رموز QR فريدة لكل طاولة واطبعها.' },
  { title: 'العملاء يطلبون',   desc: 'يمسحون ويتصفحون ويقدمون طلباتهم من هواتفهم.' },
  { title: 'تحضّر وتستلم',     desc: 'تظهر الطلبات على شاشة المطبخ. يدفع العملاء عند الكاشير.' },
];

const testimonials = [
  {
    name: 'عبدالله العلي',
    role: 'صاحب مطعم الدوحة',
    text: 'منذ استخدام دكان، زادت طلباتنا بنسبة ٤٠٪. العملاء يحبون سهولة المسح والطلب.',
    rating: 5,
  },
  {
    name: 'فاطمة بن سلمان',
    role: 'مديرة مطعم كرز',
    text: 'شاشة المطبخ الفورية وفّرت علينا الوقت والجهد. نظام رائع للمطاعم في البحرين.',
    rating: 5,
  },
  {
    name: 'حسن محمد',
    role: 'صاحب مقهى السيف',
    text: 'الدفع عند الكاشير هو الحل الأمثل لعملائنا. دكان سهل الاستخدام وموثوق.',
    rating: 5,
  },
];

const plans = [
  {
    name: 'مجاني',
    price: '0',
    currency: 'د.ب.',
    period: '/شهر',
    desc: 'للمطاعم الصغيرة التي تبدأ رحلتها الرقمية',
    popular: false,
    features: [
      'ما يصل إلى ١٠ طاولات',
      'قائمة طعام غير محدودة',
      'شاشة مطبخ في الوقت الفعلي',
      'رموز QR قابلة للطباعة',
      'دعم عبر البريد الإلكتروني',
    ],
  },
  {
    name: 'مميز',
    price: '9.99',
    currency: 'د.ب.',
    period: '/شهر',
    desc: 'للمطاعم النشطة التي تحتاج تحليلات متقدمة',
    popular: true,
    features: [
      'ما يصل إلى ٥٠ طاولة',
      'قائمة طعام غير محدودة',
      'شاشة مطبخ + تحليلات متقدمة',
      'رموز QR مخصصة',
      'تصدير التقارير',
      'دعم فوري عبر الواتساب',
    ],
  },
  {
    name: 'غير محدود',
    price: '19.99',
    currency: 'د.ب.',
    period: '/شهر',
    desc: 'للمطاعم الكبيرة والسلاسل المتعددة',
    popular: false,
    features: [
      'عدد غير محدود من الطاولات',
      'قائمة طعام غير محدودة',
      'جميع التحليلات والتقارير',
      'موظفون غير محدودين',
      'إدارة الفروع (قريباً)',
      'دعم VIP على مدار الساعة',
    ],
  },
];

function FeatureCard({
  icon: Icon,
  title,
  desc,
  delay,
}: {
  icon: React.ElementType;
  title: string;
  desc: string;
  delay: number;
}) {
  return (
    <div
      className="card group hover:border-brand-500/30 transition-all duration-300 opacity-0 animate-slide-up"
      style={{ animationDelay: `${delay}s` }}
    >
      <div className="w-10 h-10 rounded-xl bg-brand-500/10 border border-brand-500/20
                      flex items-center justify-center mb-4
                      group-hover:bg-brand-500/20 group-hover:scale-110 transition-all duration-300">
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
    <div className="flex gap-4 opacity-0 animate-slide-up">
      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-brand-500
                      flex items-center justify-center
                      text-[#0f0e0c] font-bold text-sm
                      shadow-[0_0_12px_rgba(245,158,11,0.3)]">
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
  return (
    <div className="min-h-screen bg-[#0f0e0c]">
      {/* Navigation */}
      <header className="border-b border-[#1a1916] sticky top-0 z-50 backdrop-blur-md bg-[#0f0e0c]/90">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-brand-500 flex items-center justify-center">
              <QrCode size={18} className="text-[#0f0e0c]" />
            </div>
            <span className="font-bold text-[#fafaf9] text-lg">
              دكان
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-6">
            <Link href="/#features"
              className="text-sm text-[#a8a29e] hover:text-[#fafaf9] transition-colors">
              المميزات
            </Link>
            <Link href="/#pricing"
              className="text-sm text-[#a8a29e] hover:text-[#fafaf9] transition-colors">
              الأسعار
            </Link>
            <Link href="/login"
              className="text-sm text-[#a8a29e] hover:text-[#fafaf9] transition-colors">
              تسجيل الدخول
            </Link>
            <Link href="/register" className="btn-primary text-sm py-2 px-4">
              ابدأ الآن
            </Link>
          </nav>

          {/* Mobile nav */}
          <div className="flex md:hidden items-center gap-2">
            <Link href="/login"
              className="text-sm text-[#a8a29e] hover:text-[#fafaf9]">
              تسجيل الدخول
            </Link>
            <Link href="/register" className="btn-primary text-sm py-2 px-3">
              ابدأ الآن
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-brand-500/5 via-transparent to-transparent" />
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-brand-500/3 rounded-full blur-3xl" />

        {/* Floating food emojis */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <span className="absolute top-20 left-[10%] text-2xl opacity-20 animate-pulse-soft" style={{ animationDelay: '0s', animationDuration: '3s' }}>🍽️</span>
          <span className="absolute top-32 right-[15%] text-3xl opacity-20 animate-pulse-soft" style={{ animationDelay: '0.5s', animationDuration: '4s' }}>🫘</span>
          <span className="absolute bottom-40 left-[20%] text-2xl opacity-20 animate-pulse-soft" style={{ animationDelay: '1s', animationDuration: '3.5s' }}>☕</span>
          <span className="absolute bottom-60 right-[8%] text-3xl opacity-20 animate-pulse-soft" style={{ animationDelay: '1.5s', animationDuration: '4.5s' }}>🧆</span>
          <span className="absolute top-1/2 left-[5%] text-xl opacity-15 animate-pulse-soft" style={{ animationDelay: '0.8s', animationDuration: '5s' }}>🥘</span>
          <span className="absolute top-1/3 right-[5%] text-xl opacity-15 animate-pulse-soft" style={{ animationDelay: '1.2s', animationDuration: '3.8s' }}>🫓</span>
        </div>

        <div className="max-w-6xl mx-auto px-4 pt-20 pb-24 text-center relative z-10">
          {/* Bahrain badge */}
          <div className="inline-flex items-center gap-2 bg-[#1a1916] border border-[#2a2825]
                          rounded-full px-4 py-2 text-sm text-[#a8a29e] mb-8
                          opacity-0 animate-fade-in">
            <span>🇧🇭</span>
            <span>Bahrain · البحرين</span>
          </div>

          <h1 className="text-4xl md:text-6xl font-bold text-[#fafaf9] leading-tight
                         max-w-4xl mx-auto mb-6 opacity-0 animate-slide-up">
            <span className="text-brand-400 animate-pulse-soft inline-block" style={{ animationDuration: '3s' }}>
              نظام QR للطلبات
            </span>
            {' '}في مطاعم البحرين
          </h1>

          <p className="text-lg text-[#a8a29e] max-w-2xl mx-auto mb-10 leading-relaxed
                        opacity-0 animate-slide-up" style={{ animationDelay: '0.1s' }}>
            دعِ العملاء يمسحون الرمز ويطلبون من هواتفهم. الدفع عند الكاشير. بدون تطبيقات أو رسوم دفع إلكتروني.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3
                          opacity-0 animate-slide-up" style={{ animationDelay: '0.2s' }}>
            <Link href="/register"
              className="btn-primary text-base px-8 py-3.5 w-full sm:w-auto text-lg
                         shadow-[0_0_20px_rgba(245,158,11,0.25)] hover:shadow-[0_0_30px_rgba(245,158,11,0.4)]
                         transition-shadow duration-300">
              ابدأ مجاناً
              <ArrowRight size={18} className="rtl:rotate-180" />
            </Link>
            <Link href="/#features"
              className="btn-secondary text-base px-8 py-3.5 w-full sm:w-auto">
              اكتشف المزيد
            </Link>
          </div>

          <p className="text-sm text-[#57534e] mt-4 opacity-0 animate-fade-in" style={{ animationDelay: '0.3s' }}>
            لا يلزم وجود بطاقة ائتمانية
          </p>

          {/* Hero visual */}
          <div className="mt-16 relative opacity-0 animate-slide-up" style={{ animationDelay: '0.3s' }}>
            <div className="absolute inset-0 bg-brand-500/5 rounded-3xl blur-3xl" />
            <div className="relative bg-[#1a1916] border border-[#2a2825] rounded-3xl p-6 max-w-3xl mx-auto">
              <div className="grid grid-cols-3 gap-4 text-left">
                {/* Mock order card */}
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
        </div>
      </section>

      {/* Features */}
      <section id="features" className="max-w-6xl mx-auto px-4 py-20">
        <div className="text-center mb-12">
          <span className="section-title">المميزات</span>
          <h2 className="text-3xl font-bold text-[#fafaf9]">
            دكان — كل ما تحتاجه
          </h2>
          <p className="text-[#a8a29e] mt-2 max-w-lg mx-auto text-sm">
            كل ما يحتاجه مطعمك للتحول الرقمي في البحرين
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map((f, i) => (
            <FeatureCard key={i} icon={f.icon} title={f.title} desc={f.desc} delay={i * 0.08} />
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="max-w-6xl mx-auto px-4 py-20 border-t border-[#1a1916]">
        <div className="text-center mb-12">
          <span className="section-title">الخطوات</span>
          <h2 className="text-3xl font-bold text-[#fafaf9]">كيف يعمل</h2>
          <p className="text-[#a8a29e] mt-2 max-w-lg mx-auto text-sm">
            أربع خطوات بسيطة لبدء استخدام دكان
          </p>
        </div>

        <div className="max-w-xl mx-auto grid grid-cols-1 gap-8">
          {steps.map((s, i) => (
            <StepCard
              key={i}
              number={String(i + 1)}
              title={s.title}
              desc={s.desc}
            />
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section className="max-w-6xl mx-auto px-4 py-20 border-t border-[#1a1916]">
        <div className="text-center mb-12">
          <span className="section-title">آراء العملاء</span>
          <h2 className="text-3xl font-bold text-[#fafaf9]">
            ماذا يقول أصحاب المطاعم
          </h2>
          <p className="text-[#a8a29e] mt-2 max-w-lg mx-auto text-sm">
            انضم إلى أكثر من ١٠٠ مطعم في البحرين
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {testimonials.map((t, i) => (
            <div
              key={i}
              className="card relative opacity-0 animate-slide-up"
              style={{ animationDelay: `${i * 0.1}s` }}
            >
              {/* Quote mark */}
              <div className="absolute -top-2 -right-2 text-4xl text-brand-500/20 leading-none">
                &ldquo;
              </div>
              {/* Stars */}
              <div className="flex items-center gap-0.5 mb-3" dir="ltr">
                {Array.from({ length: t.rating }).map((_, s) => (
                  <Star key={s} size={14} className="text-brand-400 fill-brand-400" />
                ))}
              </div>
              <p className="text-sm text-[#a8a29e] leading-relaxed mb-4">
                {t.text}
              </p>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-brand-500/20 border border-brand-500/30
                                flex items-center justify-center text-brand-400 font-bold text-sm">
                  {t.name.charAt(0)}
                </div>
                <div>
                  <div className="text-sm font-medium text-[#fafaf9]">{t.name}</div>
                  <div className="text-xs text-[#57534e]">{t.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="max-w-6xl mx-auto px-4 py-20 border-t border-[#1a1916]">
        <div className="text-center mb-12">
          <span className="section-title">الأسعار</span>
          <h2 className="text-3xl font-bold text-[#fafaf9]">
            خطط بسيطة تناسب مطعمك
          </h2>
          <p className="text-[#a8a29e] mt-2 max-w-lg mx-auto text-sm">
            ابدأ مجاناً ورقّ لاحقاً عندما تحتاج المزيد
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-5xl mx-auto">
          {plans.map((plan, i) => (
            <div
              key={i}
              className={`relative rounded-2xl p-6 transition-all duration-300 opacity-0 animate-slide-up ${
                plan.popular
                  ? 'bg-[#1c1406] border-2 border-brand-500/40 shadow-[0_0_25px_rgba(245,158,11,0.12)]'
                  : 'bg-[#1a1916] border border-[#2a2825] hover:border-[#3a3835]'
              }`}
              style={{ animationDelay: `${i * 0.1}s` }}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-brand-500 text-[#0f0e0c]
                                text-xs font-bold px-4 py-1 rounded-full">
                  الأكثر طلباً
                </div>
              )}

              <div className="text-center mb-6 mt-1">
                <h3 className="text-lg font-bold text-[#fafaf9] mb-1">{plan.name}</h3>
                <p className="text-xs text-[#a8a29e] mb-4">{plan.desc}</p>
                <div className="flex items-baseline justify-center gap-0.5">
                  <span className="text-sm text-[#a8a29e]">{plan.currency}</span>
                  <span className="text-4xl font-bold text-[#fafaf9]">{plan.price}</span>
                  <span className="text-sm text-[#57534e]">{plan.period}</span>
                </div>
              </div>

              <ul className="space-y-3 mb-6">
                {plan.features.map((feat, j) => (
                  <li key={j} className="flex items-center gap-2 text-sm text-[#a8a29e]">
                    <Check size={14} className="text-brand-400 flex-shrink-0" />
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>

              <Link
                href="/register"
                className={`block text-center py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                  plan.popular
                    ? 'bg-brand-500 text-[#0f0e0c] hover:bg-brand-600 shadow-[0_0_15px_rgba(245,158,11,0.2)]'
                    : 'bg-[#0f0e0c] border border-[#2a2825] text-[#fafaf9] hover:border-[#3a3835]'
                }`}
              >
                {plan.price === '0' ? 'ابدأ مجاناً' : 'اشترك الآن'}
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="relative overflow-hidden max-w-6xl mx-auto px-4 py-24 text-center">
        {/* Background glow */}
        <div className="absolute inset-0 bg-gradient-to-b from-brand-500/5 via-transparent to-transparent" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-brand-500/5 rounded-full blur-3xl" />

        <div className="relative z-10">
          <h2 className="text-3xl md:text-4xl font-bold text-[#fafaf9] mb-4 animate-pulse-soft" style={{ animationDuration: '3s' }}>
            هل أنت مستعد لتحديث مطعمك؟
          </h2>
          <p className="text-[#a8a29e] mb-8 max-w-xl mx-auto">
            انضم إلى المطاعم في البحرين التي تستخدم دكان لطلبات QR أكثر ذكاءً.
          </p>
          <Link href="/register"
            className="btn-primary text-base px-10 py-3.5 inline-flex text-lg
                       shadow-[0_0_25px_rgba(245,158,11,0.3)] hover:shadow-[0_0_40px_rgba(245,158,11,0.5)]
                       transition-all duration-300">
            ابدأ مجاناً
            <Sparkles size={18} />
          </Link>
          <p className="text-sm text-[#57534e] mt-4">لا يلزم وجود بطاقة ائتمانية</p>
        </div>
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
          <p className="text-sm text-[#57534e]">
            © 2024 دكان. البحرين 🇧🇭
          </p>
        </div>
      </footer>
    </div>
  );
}
