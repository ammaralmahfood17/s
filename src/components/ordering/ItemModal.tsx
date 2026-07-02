'use client';

import { useState } from 'react';
import NextImage from 'next/image';
import { ShoppingCart, Plus, Minus, X } from 'lucide-react';
import { formatBHD, getPublicImageUrl } from '@/lib/utils';
import { cn } from '@/lib/utils';
import type { Item, Variation, Addon } from '@/types';
import { toast } from 'sonner';

interface ItemModalProps {
  item: Item;
  variations: Variation[];
  addons: Addon[];
  onClose: () => void;
  onAdd: (item: Item, variation: Variation | null, selectedAddons: Addon[], qty: number, notes: string) => void;
}

const TAG_LABELS: Record<string, string> = {
  spicy: '🌶 حار',
  vegan: '🌱 نباتي صرف',
  vegetarian: '🥗 نباتي',
  'gluten-free': '🌾 خالٍ من الغلوتين',
  halal: '✅ حلال',
};

export default function ItemModal({ item, variations, addons, onClose, onAdd }: ItemModalProps) {
  const [selectedVariation, setSelectedVariation] = useState<Variation | null>(variations[0] ?? null);
  const [selectedAddons, setSelectedAddons] = useState<Addon[]>([]);
  const [qty, setQty] = useState(1);
  const [notes, setNotes] = useState('');

  const unitPrice = item.price + (selectedVariation?.price_modifier ?? 0);
  const addonsTotal = selectedAddons.reduce((s, a) => s + a.price, 0);
  const lineTotal = (unitPrice + addonsTotal) * qty;

  const toggleAddon = (addon: Addon) => {
    setSelectedAddons(prev =>
      prev.find(a => a.id === addon.id)
        ? prev.filter(a => a.id !== addon.id)
        : [...prev, addon]
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-card w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl
                      max-h-[92dvh] sm:max-h-[90vh] flex flex-col shadow-2xl animate-slide-up overflow-hidden">
        {/* Image */}
        {item.image_url && (
          <div className="relative h-40 sm:h-48 flex-shrink-0">
            <NextImage
              src={getPublicImageUrl(item.image_url)}
              alt={item.name_ar}
              fill
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-card to-transparent" />
          </div>
        )}

        {/* Close button — 44px touch target */}
        <button
          onClick={onClose}
          className="absolute top-3 end-3 w-11 h-11 bg-black/50 backdrop-blur-sm
                     rounded-full flex items-center justify-center text-white z-10
                     active:scale-90 transition-transform touch-manipulation"
        >
          <X size={18} />
        </button>

        <div className="overflow-y-auto flex-1 px-5 py-4 space-y-4 overscroll-contain">
          {/* Item info */}
          <div>
            <h2 className="text-xl font-bold text-foreground">{item.name_ar}</h2>
            {item.description_ar && (
              <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                {item.description_ar}
              </p>
            )}
            {item.tags?.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {item.tags.map(tag => (
                  <span key={tag} className="text-xs bg-background text-muted-foreground
                                             px-2 py-0.5 rounded-full border border-border">
                    {TAG_LABELS[tag] ?? tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Variations */}
          {variations.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-2">اختر الحجم *</h3>
              <div className="grid grid-cols-2 gap-2">
                {variations.map(v => {
                  const vPrice = item.price + v.price_modifier;
                  const isSelected = selectedVariation?.id === v.id;
                  return (
                    <button
                      key={v.id}
                      onClick={() => setSelectedVariation(v)}
                      className={cn(
                        'p-3 rounded-xl border text-start transition-all',
                        isSelected
                          ? 'border-primary bg-primary/10'
                          : 'border-border bg-background hover:border-muted-foreground/30'
                      )}
                    >
                      <div className={cn('text-sm font-medium', isSelected ? 'text-primary' : 'text-foreground')}>
                        {v.name_ar}
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {formatBHD(vPrice, 'ar')}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Addons */}
          {addons.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-2">إضافات</h3>
              <div className="space-y-2">
                {addons.map(addon => {
                  const isSelected = selectedAddons.some(a => a.id === addon.id);
                  return (
                    <button
                      key={addon.id}
                      onClick={() => toggleAddon(addon)}
                      className={cn(
                        'w-full flex items-center justify-between p-3 rounded-xl border transition-all',
                        isSelected
                          ? 'border-primary bg-primary/10'
                          : 'border-border bg-background hover:border-muted-foreground/30'
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <div className={cn(
                          'w-4 h-4 rounded border-2 flex items-center justify-center transition-all',
                          isSelected ? 'border-primary bg-primary' : 'border-muted-foreground/30'
                        )}>
                          {isSelected && <span className="text-primary-foreground text-xs font-bold">✓</span>}
                        </div>
                        <span className="text-sm text-foreground">{addon.name_ar}</span>
                      </div>
                      <span className="text-sm text-primary font-medium">
                        {addon.price > 0 ? `+${formatBHD(addon.price, 'ar')}` : 'مجاني'}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="label text-xs">ملاحظات خاصة (اختياري)</label>
            <textarea
              className="input resize-none h-16 text-sm"
              dir="rtl"
              placeholder="حساسية؟ طلبات خاصة..."
              value={notes}
              onChange={e => setNotes(e.target.value)}
            />
          </div>
        </div>

        {/* Footer: quantity + add to cart */}
        <div className="px-5 pt-4 border-t border-border bg-card flex-shrink-0 safe-bottom">
          <div className="flex items-center gap-3">
            {/* Quantity controls — 44px touch targets */}
            <div className="flex items-center gap-1 bg-background border border-border rounded-xl p-1 flex-shrink-0">
              <button
                onClick={() => setQty(q => Math.max(1, q - 1))}
                className="w-11 h-11 flex items-center justify-center text-muted-foreground
                           active:text-foreground active:bg-card rounded-lg
                           transition-colors touch-manipulation"
              >
                <Minus size={16} />
              </button>
              <span className="font-bold text-foreground w-6 text-center text-sm">{qty}</span>
              <button
                onClick={() => setQty(q => q + 1)}
                className="w-11 h-11 flex items-center justify-center text-muted-foreground
                           active:text-foreground active:bg-card rounded-lg
                           transition-colors touch-manipulation"
              >
                <Plus size={16} />
              </button>
            </div>

            {/* Add to cart */}
            <button
              onClick={() => {
                if (variations.length > 0 && !selectedVariation) {
                  toast.error('يرجى اختيار الحجم');
                  return;
                }
                onAdd(item, selectedVariation, selectedAddons, qty, notes);
                onClose();
              }}
              className="btn-primary flex-1 min-w-0"
            >
              <ShoppingCart size={16} className="flex-shrink-0" />
              <span className="truncate">
                {`إضافة — ${formatBHD(lineTotal, 'ar')}`}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
