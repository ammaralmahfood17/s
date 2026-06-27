'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="ar" dir="rtl">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>دكان — خطأ</title>
        <style>{`
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            font-family: system-ui, -apple-system, sans-serif;
            background: #0f0e0c;
            color: #fafaf9;
            display: grid;
            place-items: center;
            min-height: 100vh;
            padding: 1.5rem;
            direction: rtl;
          }
          .card { max-width: 28rem; width: 100%; text-align: center; }
          h1 { font-size: 1.5rem; margin: 0 0 0.75rem; font-weight: 700; }
          p { color: #a8a29e; margin: 0 0 1.5rem; line-height: 1.6; font-size: 0.9rem; }
          .actions { display: flex; gap: 0.75rem; justify-content: center; flex-wrap: wrap; }
          a, button {
            display: inline-flex; align-items: center; justify-content: center;
            min-height: 44px; padding: 0.75rem 1.5rem; border-radius: 12px;
            font: inherit; font-size: 0.9rem; font-weight: 600; cursor: pointer;
            text-decoration: none; border: 1px solid transparent;
            transition: all 0.15s;
          }
          .primary { background: #f59e0b; color: #0f0e0c; }
          .primary:hover { background: #d97706; }
          .secondary { background: transparent; color: #a8a29e; border-color: #2a2825; }
          .secondary:hover { color: #fafaf9; border-color: #3a3835; }
          .icon { margin: 0 auto 1.5rem; width: 5rem; height: 5rem;
                  background: #2a1010; border: 1px solid #7f1d1d;
                  border-radius: 9999px; display: grid; place-items: center; }
        `}</style>
      </head>
      <body>
        <div className="card">
          <div className="icon">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#fca5a5" strokeWidth="1.5"
                 strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
          </div>
          <h1>حدث خطأ غير متوقع</h1>
          <p>عذراً، حدث خطأ في تحميل الصفحة. يرجى المحاولة مرة أخرى.</p>
          <div className="actions">
            <button className="primary" onClick={() => reset()}>إعادة المحاولة</button>
            <a className="secondary" href="/">العودة للرئيسية</a>
          </div>
        </div>
      </body>
    </html>
  );
}
