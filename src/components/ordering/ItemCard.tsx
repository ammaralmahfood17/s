'use client';

import NextImage from 'next/image';
import { Plus, Star, ImageIcon } from 'lucide-react';
import { formatBHD, getPublicImageUrl } from '@/lib/utils';
import type { Item } from '@/types';

interface ItemCardProps {
  item: Item;
  onClick: () => void;
  /**
   * 'full' = wide card with large hero image on top (used in table ordering)
   * 'compact' = horizontal card with large side image (used in car/external)
   */
  variant?: 'full' | 'compact';
}

export default function ItemCard({ item, onClick, variant = 'compact' }: ItemCardProps) {
  if (variant === 'full') {
    return (
      <button
        onClick={onClick}
        className="card-hover flex w-full flex-col overflow-hidden p-0 text-start"
        style={{ direction: 'rtl' }}
      >
        {/* ── Hero image area (60%+ of the card) ────────── */}
        {item.image_url ? (
          <div className="relative aspect-[4/3] w-full overflow-hidden bg-card">
            <NextImage
              src={getPublicImageUrl(item.image_url)}
              alt={item.name_en}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              sizes="(max-width: 640px) 100vw, 50vw"
            />
          </div>
        ) : (
          <div className="flex aspect-[4/3] w-full items-center justify-center bg-card">
            <div className="flex flex-col items-center gap-1 text-muted-foreground/40">
              <ImageIcon size={32} />
              <span className="text-xs">🍴</span>
            </div>
          </div>
        )}

        {/* ── Content area ────────────────────────────── */}
        <div className="flex flex-1 flex-col gap-2 p-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="font-bold text-foreground leading-tight">
                {item.name_ar}
              </span>
              {item.is_featured && (
                <Star size={14} className="shrink-0 fill-yellow-500 text-yellow-500" />
              )}
            </div>
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground touch-manipulation">
              <Plus size={16} />
            </div>
          </div>

          {item.description_ar && (
            <p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground">
              {item.description_ar}
            </p>
          )}

          <div className="mt-auto">
            <span className="text-base font-black text-primary">
              {formatBHD(item.price, 'ar')}
            </span>
          </div>
        </div>
      </button>
    );
  }

  // ── Compact variant (used in car / external pages) ─────
  return (
    <button
      onClick={onClick}
      className="card flex w-full items-center gap-3 overflow-hidden p-0 text-start active:scale-[0.98] transition-transform"
      style={{ direction: 'rtl' }}
    >
      {item.image_url ? (
        <div className="relative h-28 w-28 shrink-0 overflow-hidden bg-card sm:h-32 sm:w-32">
          <NextImage
            src={getPublicImageUrl(item.image_url)}
            alt={item.name_ar}
            fill
            className="object-cover"
            sizes="128px"
          />
        </div>
      ) : (
        <div className="flex h-28 w-28 shrink-0 items-center justify-center bg-card text-3xl text-muted-foreground/40 sm:h-32 sm:w-32">
          <ImageIcon size={28} />
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col gap-1.5 py-3 pl-3">
        <div className="flex items-center gap-1.5">
          <span className="font-bold text-foreground">{item.name_ar}</span>
          {item.is_featured && (
            <Star size={12} className="shrink-0 fill-yellow-500 text-yellow-500" />
          )}
        </div>

        {item.description_ar && (
          <p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground">
            {item.description_ar}
          </p>
        )}

        <div className="flex items-center gap-2">
          <span className="text-base font-black text-primary">
            {formatBHD(item.price, 'ar')}
          </span>
        </div>
      </div>

      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground touch-manipulation">
        <Plus size={18} />
      </div>
    </button>
  );
}
