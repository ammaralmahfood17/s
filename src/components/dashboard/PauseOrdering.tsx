'use client';

import { useState } from 'react';
import { PauseCircle, PlayCircle, AlertTriangle } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';

interface Props {
  restaurantId: string;
  isPaused: boolean;
  pauseReasonEn?: string | null;
  pauseReasonAr?: string | null;
  onUpdate: () => void;
}

export function PauseOrderingControl({
  restaurantId,
  isPaused,
  pauseReasonEn,
  pauseReasonAr,
  onUpdate,
}: Props) {
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
      toast.success('تم إيقاف الطلبات مؤقتاً');
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
      toast.success('تم استئناف الطلبات');
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
            الطلبات موقوفة
          </div>
          <Button
            onClick={handleResume}
            disabled={loading}
            variant="outline"
            className="border-green-700 text-green-400 hover:bg-green-900 hover:text-green-300"
          >
            <PlayCircle size={16} />
            استئناف
          </Button>
        </div>
      ) : (
        <Button
          onClick={handlePause}
          disabled={loading}
          variant="outline"
          className="border-orange-900 text-orange-400 hover:bg-orange-950/70"
        >
          <PauseCircle size={16} />
          إيقاف الطلبات مؤقتاً
        </Button>
      )}

      {/* Reason modal */}
      {showReasonModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setShowReasonModal(false)}
          />
          <Card className="relative w-full max-w-sm shadow-2xl animate-slide-up">
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <AlertTriangle size={20} className="text-orange-400" />
                <h2 className="font-bold text-[#fafaf9]">
                  سبب الإيقاف
                </h2>
              </div>

              <p className="text-xs text-[#57534e] mb-4">
                سيظهر هذا للعملاء عند محاولة الطلب
              </p>

              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label>السبب (عربي)</Label>
                  <Input
                    dir="rtl"
                    value={reasonAr}
                    onChange={e => setReasonAr(e.target.value)}
                    placeholder="المطبخ مشغول مؤقتاً، شكراً لصبركم"
                    className="font-cairo"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>السبب (إنجليزي)</Label>
                  <Input
                    value={reasonEn}
                    onChange={e => setReasonEn(e.target.value)}
                    placeholder="Kitchen is busy, please try again shortly"
                  />
                </div>
              </div>

              <div className="flex gap-2 mt-4">
                <Button
                  variant="secondary"
                  className="flex-1"
                  onClick={() => setShowReasonModal(false)}
                >
                  إلغاء
                </Button>
                <Button
                  onClick={confirmPause}
                  disabled={loading}
                  className="flex-1 bg-orange-900 hover:bg-orange-800 text-orange-300 border border-orange-800"
                >
                  {loading ? '...' : 'إيقاف الطلبات'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}

// ── Customer-facing pause banner ───────────────────────────
export function PausedBanner({
  reasonEn,
  reasonAr,
}: {
  reasonEn?: string | null;
  reasonAr?: string | null;
}) {
  const reason = reasonAr || reasonEn;

  return (
    <div className="mx-4 mb-4 bg-orange-950/60 border border-orange-800
                    rounded-2xl p-4 flex items-start gap-3">
      <PauseCircle size={20} className="text-orange-400 flex-shrink-0 mt-0.5" />
      <div>
        <p className="text-sm font-semibold text-orange-400">
          الطلبات متوقفة مؤقتاً
        </p>
        {reason && (
          <p className="text-xs text-orange-600 mt-0.5">{reason}</p>
        )}
        <p className="text-xs text-orange-700 mt-1">
          يرجى المحاولة مرة أخرى قريباً
        </p>
      </div>
    </div>
  );
}
