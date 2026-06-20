'use client';

import { useState, useEffect } from 'react';
import { Star } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { formatDate } from '@/lib/utils';
import { cn } from '@/lib/utils';
import type { Review } from '@/types';
import toast from 'react-hot-toast';

// ── Star rating picker ─────────────────────────────────────
function StarPicker({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onMouseEnter={() => setHover(n)}
          onMouseLeave={() => setHover(0)}
          onClick={() => onChange(n)}
          className="transition-transform active:scale-90"
        >
          <Star
            size={28}
            className={cn(
              'transition-colors',
              (hover || value) >= n
                ? 'text-yellow-400 fill-yellow-400'
                : 'text-[#3a3835]'
            )}
          />
        </button>
      ))}
    </div>
  );
}

// ── Review submission form (shown after order is completed) ─
export function ReviewForm({
  restaurantId,
  orderId,
  locale,
  onSubmitted,
}: {
  restaurantId: string;
  orderId: string;
  locale: string;
  onSubmitted: () => void;
}) {
  const isAr = locale === 'ar';
  const supabase = createClient();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [name, setName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0) {
      toast.error(isAr ? 'يرجى اختيار تقييم' : 'Please select a rating');
      return;
    }
    setSubmitting(true);

    const { error } = await supabase.from('reviews').insert({
      restaurant_id: restaurantId,
      order_id: orderId,
      rating,
      comment: comment.trim() || null,
      reviewer_name: name.trim() || null,
      is_public: true,
    });

    if (!error) {
      setSubmitted(true);
      onSubmitted();
      toast.success(isAr ? 'شكراً على تقييمك! ⭐' : 'Thank you for your review! ⭐');
    } else {
      toast.error(isAr ? 'حدث خطأ' : 'Something went wrong');
    }
    setSubmitting(false);
  };

  if (submitted) {
    return (
      <div className="text-center py-6">
        <div className="text-4xl mb-2">🌟</div>
        <p className="font-bold text-[#fafaf9]">
          {isAr ? 'شكراً جزيلاً!' : 'Thank you!'}
        </p>
        <p className="text-sm text-[#a8a29e] mt-1">
          {isAr ? 'تقييمك يهمنا كثيراً' : 'Your feedback means a lot to us'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="text-center">
        <h3 className="font-bold text-[#fafaf9] text-lg mb-1">
          {isAr ? 'كيف كانت تجربتك؟' : 'How was your experience?'}
        </h3>
        <p className="text-sm text-[#57534e]">
          {isAr ? 'رأيك يساعدنا على التحسين' : 'Your feedback helps us improve'}
        </p>
      </div>

      <div className="flex justify-center">
        <StarPicker value={rating} onChange={setRating} />
      </div>

      {rating > 0 && (
        <div className="text-center text-sm text-brand-400 font-medium">
          {rating === 5 ? (isAr ? 'ممتاز! 🎉' : 'Excellent! 🎉') :
           rating === 4 ? (isAr ? 'جيد جداً 👍' : 'Very Good 👍') :
           rating === 3 ? (isAr ? 'مقبول 👌' : 'OK 👌') :
           rating === 2 ? (isAr ? 'يحتاج تحسين 😕' : 'Needs improvement 😕') :
           (isAr ? 'سيء 😞' : 'Poor 😞')}
        </div>
      )}

      <div>
        <label className="label">{isAr ? 'اسمك (اختياري)' : 'Your name (optional)'}</label>
        <input
          className="input text-sm"
          dir={isAr ? 'rtl' : 'ltr'}
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder={isAr ? 'محمد' : 'Mohammed'}
        />
      </div>

      <div>
        <label className="label">
          {isAr ? 'تعليقك (اختياري)' : 'Comment (optional)'}
        </label>
        <textarea
          className="input resize-none h-20 text-sm"
          dir={isAr ? 'rtl' : 'ltr'}
          value={comment}
          onChange={e => setComment(e.target.value)}
          placeholder={isAr ? 'أخبرنا عن تجربتك...' : 'Tell us about your experience...'}
        />
      </div>

      <button
        onClick={handleSubmit}
        disabled={submitting || rating === 0}
        className="btn-primary w-full"
      >
        {submitting ? '...' : (isAr ? 'إرسال التقييم ⭐' : 'Submit Review ⭐')}
      </button>
    </div>
  );
}

// ── Reviews display (storefront + dashboard) ───────────────
export function ReviewsList({
  restaurantId,
  locale,
  limit = 5,
}: {
  restaurantId: string;
  locale: string;
  limit?: number;
}) {
  const isAr = locale === 'ar';
  const supabase = createClient();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [stats, setStats] = useState({ avg: 0, total: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from('reviews')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .eq('is_public', true)
        .order('created_at', { ascending: false })
        .limit(limit);

      const all = data ?? [];
      setReviews(all as Review[]);

      // Stats
      const { data: statsData } = await supabase
        .from('reviews')
        .select('rating')
        .eq('restaurant_id', restaurantId)
        .eq('is_public', true);

      if (statsData && statsData.length > 0) {
        const avg = statsData.reduce((s: number, r: { rating: number }) => s + r.rating, 0) / statsData.length;
        setStats({ avg: Math.round(avg * 10) / 10, total: statsData.length });
      }
      setLoading(false);
    };
    load();
  }, [restaurantId, supabase, limit]);

  if (loading) return null;
  if (reviews.length === 0) return null;

  return (
    <div className="space-y-3">
      {/* Summary */}
      <div className="flex items-center gap-3">
        <div className="text-3xl font-black text-[#fafaf9]">{stats.avg}</div>
        <div>
          <div className="flex gap-0.5">
            {[1, 2, 3, 4, 5].map(n => (
              <Star
                key={n}
                size={14}
                className={cn(
                  n <= Math.round(stats.avg)
                    ? 'text-yellow-400 fill-yellow-400'
                    : 'text-[#3a3835]'
                )}
              />
            ))}
          </div>
          <div className="text-xs text-[#57534e] mt-0.5">
            {stats.total} {isAr ? 'تقييم' : 'reviews'}
          </div>
        </div>
      </div>

      {/* Individual reviews */}
      <div className="space-y-2">
        {reviews.map(review => (
          <div key={review.id} className="card py-3">
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="flex gap-0.5 mb-1">
                  {[1, 2, 3, 4, 5].map(n => (
                    <Star
                      key={n}
                      size={12}
                      className={cn(
                        n <= review.rating
                          ? 'text-yellow-400 fill-yellow-400'
                          : 'text-[#3a3835]'
                      )}
                    />
                  ))}
                </div>
                {review.comment && (
                  <p className="text-sm text-[#a8a29e] leading-relaxed">
                    {review.comment}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-xs text-[#57534e]">
                {(review as Review & { reviewer_name?: string }).reviewer_name || (isAr ? 'عميل' : 'Customer')}
              </span>
              <span className="text-[#3a3835]">·</span>
              <span className="text-xs text-[#3a3835]">
                {formatDate(review.created_at, locale as 'en' | 'ar')}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Dashboard reviews management ───────────────────────────
export function ReviewsDashboard({
  restaurantId,
  locale,
}: {
  restaurantId: string;
  locale: string;
}) {
  const isAr = locale === 'ar';
  const supabase = createClient();
  const [reviews, setReviews] = useState<(Review & { reviewer_name?: string })[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const { data } = await supabase
      .from('reviews')
      .select('*')
      .eq('restaurant_id', restaurantId)
      .order('created_at', { ascending: false });
    setReviews((data as (Review & { reviewer_name?: string })[]) ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [restaurantId]);

  const togglePublic = async (id: string, current: boolean) => {
    await supabase.from('reviews').update({ is_public: !current }).eq('id', id);
    load();
  };

  const deleteReview = async (id: string) => {
    if (!confirm(isAr ? 'حذف التقييم؟' : 'Delete review?')) return;
    await supabase.from('reviews').delete().eq('id', id);
    load();
  };

  if (loading) return <div className="text-[#57534e] text-sm">Loading...</div>;

  const avg = reviews.length
    ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
    : 0;

  return (
    <div className="space-y-4">
      {/* Stats header */}
      {reviews.length > 0 && (
        <div className="flex items-center gap-4">
          <div className="stat-card flex-1">
            <div className="flex items-center gap-1.5 mb-1">
              <Star size={14} className="text-yellow-400 fill-yellow-400" />
              <span className="stat-label">{isAr ? 'متوسط التقييم' : 'Avg Rating'}</span>
            </div>
            <div className="stat-value text-yellow-400">{avg.toFixed(1)}</div>
          </div>
          <div className="stat-card flex-1">
            <div className="stat-label mb-1">{isAr ? 'إجمالي التقييمات' : 'Total Reviews'}</div>
            <div className="stat-value">{reviews.length}</div>
          </div>
        </div>
      )}

      {/* Reviews list */}
      {reviews.length === 0 ? (
        <div className="card text-center py-12">
          <Star size={40} className="text-[#3a3835] mx-auto mb-3" />
          <p className="text-[#a8a29e]">
            {isAr ? 'لا توجد تقييمات بعد' : 'No reviews yet'}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {reviews.map(review => (
            <div key={review.id} className={cn(
              'card flex items-start gap-3',
              !review.is_public && 'opacity-50'
            )}>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <div className="flex gap-0.5">
                    {[1, 2, 3, 4, 5].map(n => (
                      <Star key={n} size={12} className={cn(
                        n <= review.rating
                          ? 'text-yellow-400 fill-yellow-400'
                          : 'text-[#3a3835]'
                      )} />
                    ))}
                  </div>
                  <span className="text-xs text-[#57534e]">
                    {review.reviewer_name || (isAr ? 'عميل' : 'Customer')}
                  </span>
                  {!review.is_public && (
                    <span className="text-xs bg-[#2a2825] text-[#57534e] px-1.5 py-0.5 rounded">
                      {isAr ? 'مخفي' : 'Hidden'}
                    </span>
                  )}
                </div>
                {review.comment && (
                  <p className="text-sm text-[#a8a29e]">{review.comment}</p>
                )}
                <p className="text-xs text-[#3a3835] mt-1">
                  {formatDate(review.created_at, locale as 'en' | 'ar')}
                </p>
              </div>
              <div className="flex gap-1 flex-shrink-0">
                <button
                  onClick={() => togglePublic(review.id, review.is_public)}
                  className="text-xs text-[#57534e] hover:text-[#a8a29e] px-2 py-1
                             bg-[#0f0e0c] border border-[#2a2825] rounded-lg transition-colors"
                >
                  {review.is_public ? (isAr ? 'إخفاء' : 'Hide') : (isAr ? 'إظهار' : 'Show')}
                </button>
                <button
                  onClick={() => deleteReview(review.id)}
                  className="text-xs text-red-400 hover:text-red-300 px-2 py-1
                             bg-red-950/30 border border-red-900/30 rounded-lg transition-colors"
                >
                  {isAr ? 'حذف' : 'Del'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
