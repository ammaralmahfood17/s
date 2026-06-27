'use client';

import { useEffect, useState } from 'react';
import { Sun, Moon } from 'lucide-react';
import { cn } from '@/lib/utils';

type Theme = 'dark' | 'light';

const STORAGE_KEY = 'dokan-theme';

/**
 * Theme toggle button.
 *
 * Persists to localStorage under `dokan-theme`.
 * Default is `dark`.
 *
 * When toggled, it adds/removes the `.dark` class on `<html>` and
 * stores the preference so it survives page reloads.
 */
export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>('dark');
  const [mounted, setMounted] = useState(false);

  // Hydrate from localStorage on mount (avoids SSR mismatch)
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as Theme | null;
    const initial = stored === 'light' || stored === 'dark' ? stored : 'dark';
    setTheme(initial);
    document.documentElement.classList.toggle('dark', initial === 'dark');
    setMounted(true);
  }, []);

  const toggle = () => {
    const next: Theme = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    localStorage.setItem(STORAGE_KEY, next);
    document.documentElement.classList.toggle('dark', next === 'dark');
  };

  // Prevent hydration flash — render nothing until mounted
  if (!mounted) {
    return (
      <button
        type="button"
        aria-label="تبديل الثيم"
        className="w-9 h-9 rounded-full border border-[#2a2825] bg-[#1a1916]"
        tabIndex={-1}
        style={{ visibility: 'hidden' }}
      />
    );
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={theme === 'dark' ? 'تفعيل الثيم الفاتح' : 'تفعيل الثيم الداكن'}
      className={cn(
        'w-9 h-9 rounded-full border transition-all duration-200',
        'flex items-center justify-center',
        'active:scale-95 select-none touch-manipulation',
        theme === 'dark'
          ? 'border-[#2a2825] bg-[#1a1916] text-[#f59e0b] hover:bg-[#2a2825]'
          : 'border-[#e5e7eb] bg-white text-[#d97706] hover:bg-[#f3f4f6]',
      )}
    >
      {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
    </button>
  );
}
