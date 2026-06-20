'use client';

import { useState } from 'react';
import { PauseCircle, PlayCircle, AlertTriangle } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';

interface Props {
  restaurantId: string;
  isPaused: boolean;
  pauseReasonEn?: string | null;
  pauseReasonAr?: string | null;
  locale: string;
  onUpdate: () => void;
}

export function PauseOrderingControl({
  restaurantId,
  isPaused,
  pauseReasonEn,
  pauseReasonAr,
  locale,
  onUpdate,
}: Props) {
  const isAr = locale === 'ar';
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [showReasonModal, setShowReasonModal] = useState(false);
  const [reasonEn, setReasonEn] = useState(pauseReasonEn ?? '');
  const [reasonAr, setReasonAr] = useState(pauseReasonAr ?? '');

  const handlePause = async () => {
    setShowReasonModal(true);
  };

  const confirmPause = async () => {
    setLoading(true);
    const { error } = await supabase
      .from('restaurants')
      .update({
        ordering_paused: true,
        pause_reason_en: reasonEn || 'Orders temporarily paused',
        pause_reason_ar: reasonAr || 'الطلبات متوقفة مؤقتاً',
      })
      .eq('id', restaurantId);

    if (!error) {
      toast.success(isAr ? 'تم إيقاف الطلبات مؤقتاً' : 'Ordering paused');
      setShowReasonModal(false);
      onUpdate();
    }
    setLoading(false);
  };

  const handleResume = async () => {
    setLoading(true);
    const { error } = await supabase
      .from('restaurants')
      .update({
        ordering_paused: false,
        pause_reason_en: null,
        pause_reason_ar: null,
      })
      .eq('id', restaurantId);

    if (!error) {
      toast.success(isAr ? 'تم استئناف الطلبات' : 'Ordering resumed');
      onUpdate();
    }
    setLoading(false);
  };

  return (
    <>
      {/* Pause/Resume button */}
      {isPaused ? (
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 bg-orange-950/60 border border-orange-800
                          rounded-xl px-3 py-2 text-sm text-orange-400">
            <PauseCircle size={16} className="animate-pulse" />
            {isAr ? 'الطلبات موقوفة' : 'Ordering Paused'}
          </div>
          <button
            onClick={handleResume}
            disabled={loading}
            className="flex items-center gap-1.5 bg-green-900 hover:bg-green-800
                       border border-green-700 text-green-400
                       text-sm px-3 py-2 rounded-xl transition-all"
          >
            <PlayCircle size={16} />
            {isAr ? 'استئناف' : 'Resume'}
          </button>
        </div>
      ) : (
        <button
          onClick={handlePause}
          disabled={loading}
          className="flex items-center gap-1.5 bg-orange-950/40 hover:bg-orange-950/70
                     border border-orange-900 text-orange-400
                     text-sm px-3 py-2 rounded-xl transition-all"
        >
          <PauseCircle size={16} />
          {isAr ? 'إيقاف الطلبات مؤقتاً' : 'Pause Ordering'}
        </button>
      )}

      {/* Reason modal */}
      {showReasonModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setShowReasonModal(false)}
          />
          <div className="relative bg-[#1a1916] border border-[#2a2825] rounded-2xl p-6
                          w-full max-w-sm shadow-2xl animate-slide-up">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle size={20} className="text-orange-400" />
              <h2 className="font-bold text-[#fafaf9]">
                {isAr ? 'سبب الإيقاف' : 'Reason for pausing'}
              </h2>
            </div>

            <p className="text-xs text-[#57534e] mb-4">
              {isAr
                ? 'سيظهر هذا للعملاء عند محاولة الطلب'
                : 'This will be shown to customers when they try to order'}
            </p>

            <div className="space-y-3">
              <div>
                <label className="label">{isAr ? 'السبب (عربي)' : 'Reason (Arabic)'}</label>
                <input
                  className="input text-right font-cairo text-sm"
                  dir="rtl"
                  value={reasonAr}
                  onChange={e => setReasonAr(e.target.value)}
                  placeholder="المطبخ مشغول مؤقتاً، شكراً لصبركم"
                />
              </div>
              <div>
                <label className="label">{isAr ? 'السبب (إنجليزي)' : 'Reason (English)'}</label>
                <input
                  className="input text-sm"
                  value={reasonEn}
                  onChange={e => setReasonEn(e.target.value)}
                  placeholder="Kitchen is busy, please try again shortly"
                />
              </div>
            </div>

            <div className="flex gap-2 mt-4">
              <button
                onClick={() => setShowReasonModal(false)}
                className="btn-secondary flex-1 text-sm"
              >
                {isAr ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                onClick={confirmPause}
                disabled={loading}
                className="flex-1 text-sm py-2.5 rounded-xl font-semibold
                           bg-orange-900 hover:bg-orange-800 text-orange-300
                           border border-orange-800 transition-all"
              >
                {loading ? '...' : (isAr ? 'إيقاف الطلبات' : 'Pause Ordering')}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ── Customer-facing pause banner ───────────────────────────
export function PausedBanner({
  reasonEn,
  reasonAr,
  locale,
}: {
  reasonEn?: string | null;
  reasonAr?: string | null;
  locale: string;
}) {
  const isAr = locale === 'ar';
  const reason = isAr ? reasonAr : reasonEn;

  return (
    <div className="mx-4 mb-4 bg-orange-950/60 border border-orange-800
                    rounded-2xl p-4 flex items-start gap-3">
      <PauseCircle size={20} className="text-orange-400 flex-shrink-0 mt-0.5" />
      <div>
        <p className="text-sm font-semibold text-orange-400">
          {isAr ? 'الطلبات متوقفة مؤقتاً' : 'Ordering temporarily paused'}
        </p>
        {reason && (
          <p className="text-xs text-orange-600 mt-0.5">{reason}</p>
        )}
        <p className="text-xs text-orange-700 mt-1">
          {isAr ? 'يرجى المحاولة مرة أخرى قريباً' : 'Please try again shortly'}
        </p>
      </div>
    </div>
  );
}
