'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

export type Lang = 'ar' | 'en';

type Dict = Record<string, { ar: string; en: string }>;

export const T: Dict = {
  brand: { ar: 'دكان', en: 'Dokan' },
  tagline: { ar: 'اطلب من طاولتك بمسح رمز QR', en: 'Order from your table with a QR scan' },
  hero_sub: {
    ar: 'ضيوفك يمسحون الرمز، يتصفحون القائمة، ويرسلون الطلب مباشرة إلى المطبخ — بدون تطبيقات ولا أجهزة. الدفع عند الطاولة.',
    en: 'Your guests scan, browse the menu, and send orders straight to the kitchen — no apps, no hardware. Pay at the table.',
  },
  cta_start: { ar: 'افتح مطعمك الآن', en: 'Open your restaurant' },
  cta_demo: { ar: 'جرّب القائمة التجريبية', en: 'Try the demo menu' },
  sign_in: { ar: 'تسجيل الدخول', en: 'Sign in' },
  get_started: { ar: 'ابدأ مجاناً', en: 'Get started' },
  feature_menu_t: { ar: 'قائمة في دقائق', en: 'Menu in minutes' },
  feature_menu_d: { ar: 'أضف الأقسام والأصناف، حدّد الأسعار، وارفع صور جذابة.', en: 'Add categories and items, set prices, upload photos.' },
  feature_qr_t: { ar: 'كل طاولة لها QR', en: 'A QR for every table' },
  feature_qr_d: { ar: 'الطلب يصل إلى المطبخ مرتبطاً بالطاولة تلقائياً.', en: 'Each QR knows its table — orders arrive tagged.' },
  feature_kds_t: { ar: 'شاشة المطبخ المباشرة', en: 'Live kitchen display' },
  feature_kds_d: { ar: 'تابع الطلبات لحظياً وحدّث حالتها بضغطة.', en: 'Track orders live and update status in one tap.' },
  feature_mobile_t: { ar: 'مصمم للجوال أولاً', en: 'Mobile-first' },
  feature_mobile_d: { ar: 'كل الأدوار تدخل النظام من الهاتف — كاشير، ويتر، مدير.', en: 'Every role runs the system from a phone — cashier, server, manager.' },
  feature_bhd_t: { ar: 'دينار بحريني', en: 'Bahraini Dinar' },
  feature_bhd_d: { ar: 'العملة الافتراضية BHD مع دقّة ثلاثة أرقام عشرية.', en: 'BHD by default with 3-decimal precision.' },
  feature_ar_t: { ar: 'عربي + إنجليزي', en: 'Arabic + English' },
  feature_ar_d: { ar: 'واجهة بالعربية الكاملة مع دعم RTL ولغة إنجليزية ثانوية.', en: 'Full Arabic UI with RTL, plus a secondary English mode.' },
  steps_title: { ar: 'كيف يعمل؟', en: 'How it works' },
  step1_t: { ar: 'أنشئ مطعمك', en: 'Create your restaurant' },
  step1_d: { ar: 'سجّل، أضف قائمتك، وأنشئ طاولاتك خلال دقائق.', en: 'Sign up, add your menu, and create tables in minutes.' },
  step2_t: { ar: 'اطبع رموز QR', en: 'Print QR codes' },
  step2_d: { ar: 'اطبع رمز QR لكل طاولة وضعه على الطاولة.', en: 'Print a QR for each table and place it on the table.' },
  step3_t: { ar: 'استقبل الطلبات', en: 'Receive orders' },
  step3_d: { ar: 'تظهر الطلبات لحظياً على شاشة المطبخ.', en: 'Orders pop up live on the kitchen screen.' },
  pricing_sub: { ar: 'ادفع عند الطاولة الآن. الدفع الإلكتروني قريباً.', en: 'Pay-at-table today. Online payments coming soon.' },
  footer_made: { ar: 'صُنع في البحرين 🇧🇭', en: 'Made in Bahrain 🇧🇭' },
  lang_switch: { ar: 'English', en: 'العربية' },
  table: { ar: 'طاولة', en: 'Table' },
  place_order: { ar: 'إرسال الطلب', en: 'Place order' },
  ready_launch: { ar: 'جاهز تبدأ خلال ٥ دقائق؟', en: 'Ready to launch in 5 minutes?' },
};

type I18nCtx = {
  lang: Lang;
  dir: 'rtl' | 'ltr';
  setLang: (l: Lang) => void;
  t: (key: keyof typeof T) => string;
};

const Ctx = createContext<I18nCtx | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>('ar');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('lang') as Lang | null;
    if (stored === 'ar' || stored === 'en') setLangState(stored);
    setMounted(true);
  }, []);

  function setLang(l: Lang) {
    setLangState(l);
    localStorage.setItem('lang', l);
  }

  return (
    <Ctx.Provider
      value={{
        lang,
        dir: lang === 'ar' ? 'rtl' : 'ltr',
        setLang,
        t: (key) => T[key]?.[lang] ?? String(key),
      }}
    >
      {mounted ? children : <div style={{ visibility: 'hidden' }}>{children}</div>}
    </Ctx.Provider>
  );
}

export function useI18n() {
  const v = useContext(Ctx);
  if (!v) throw new Error('useI18n must be used inside <I18nProvider>');
  return v;
}

export function LanguageToggle({ className }: { className?: string }) {
  const { lang, setLang, t } = useI18n();
  return (
    <button
      type="button"
      onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')}
      className={
        'inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-medium text-white/80 transition hover:bg-white/10 ' +
        (className ?? '')
      }
      aria-label="Switch language"
    >
      <span aria-hidden>🌐</span>
      <span>{t('lang_switch')}</span>
    </button>
  );
}
