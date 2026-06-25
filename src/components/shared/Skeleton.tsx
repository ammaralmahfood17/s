'use client';

import { cn } from '@/lib/utils';

// ── Base Skeleton ──────────────────────────────────────────
export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-xl bg-[#1a1916]/80',
        className
      )}
    />
  );
}

// ── Card Skeleton ──────────────────────────────────────────
export function CardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('bg-[#1a1916] border border-[#2a2825] rounded-2xl p-4 space-y-3', className)}>
      <Skeleton className="h-4 w-1/3" />
      <Skeleton className="h-8 w-2/3" />
      <Skeleton className="h-3 w-1/2" />
    </div>
  );
}

// ── Table Row Skeleton ──────────────────────────────────────
export function TableRowSkeleton({ cols = 4 }: { cols?: number }) {
  return (
    <div className="flex items-center gap-3 py-3 border-b border-[#1a1916]">
      {Array.from({ length: cols }).map((_, i) => (
        <Skeleton key={i} className={cn('h-4', i === 0 ? 'w-1/3' : 'w-1/6')} />
      ))}
    </div>
  );
}

// ── Dashboard Stats Skeleton ────────────────────────────────
export function StatsGridSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  );
}

// ── Menu Item Skeleton ──────────────────────────────────────
export function MenuItemSkeleton() {
  return (
    <div className="card-hover flex items-center gap-3 py-3">
      <Skeleton className="w-20 h-20 rounded-xl flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-3 w-1/2" />
        <Skeleton className="h-4 w-1/4" />
      </div>
    </div>
  );
}

// ── Page Header Skeleton ────────────────────────────────────
export function PageHeaderSkeleton() {
  return (
    <div className="space-y-2 mb-6">
      <Skeleton className="h-8 w-1/2" />
      <Skeleton className="h-4 w-1/3" />
    </div>
  );
}

// ── Order Card Skeleton (Kitchen/Orders) ────────────────────
export function OrderCardSkeleton() {
  return (
    <div className="bg-[#1a1916] border-2 border-[#2a2825] rounded-2xl p-4 space-y-3">
      <div className="flex justify-between">
        <Skeleton className="h-5 w-16" />
        <Skeleton className="h-5 w-20" />
      </div>
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-4 w-1/2" />
      <div className="flex gap-2 pt-2">
        <Skeleton className="h-10 flex-1 rounded-xl" />
        <Skeleton className="h-10 w-10 rounded-xl" />
      </div>
    </div>
  );
}

// ── Full Page Skeleton ──────────────────────────────────────
export function PageSkeleton() {
  return (
    <div className="p-4 sm:p-6 space-y-6">
      <PageHeaderSkeleton />
      <StatsGridSkeleton />
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <TableRowSkeleton key={i} cols={4} />
        ))}
      </div>
    </div>
  );
}
