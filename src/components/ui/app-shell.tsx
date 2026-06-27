'use client';

import * as React from 'react';
import { Menu, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { CommandMenu } from '@/components/shared/CommandMenu';
import { Toaster } from '@/components/shared/Toaster';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';

interface AppShellProps {
  children: React.ReactNode;
  sidebar: React.ReactNode;
  basePath?: string;
  /** Optional top bar content (mobile) */
  topBarContent?: React.ReactNode;
}

export function AppShell({ children, sidebar, basePath = '', topBarContent }: AppShellProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = React.useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = React.useState(false);

  return (
    <div className="min-h-screen bg-[#0f0e0c] flex" dir="rtl">
      {/* ── Desktop Sidebar ─────────────────────────────────── */}
      <aside
        className={cn(
          'hidden lg:flex flex-col flex-shrink-0 bg-[#0a0a08] border-e border-[#1a1916] transition-all duration-300',
          sidebarCollapsed ? 'w-16' : 'w-56',
        )}
      >
        {/* Collapse toggle */}
        <button
          onClick={() => setSidebarCollapsed((v) => !v)}
          className="flex items-center justify-center h-12 border-b border-[#1a1916] text-[#57534e] hover:text-[#fafaf9] transition-colors"
          aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <Menu size={18} className={cn('transition-transform', sidebarCollapsed && 'rotate-180')} />
        </button>

        <div className={cn('flex-1 overflow-y-auto', sidebarCollapsed ? 'px-2 py-3' : '')}>
          {sidebarCollapsed ? (
            <div className="flex flex-col items-center gap-2">{sidebar}</div>
          ) : (
            sidebar
          )}
        </div>
      </aside>

      {/* ── Mobile Sidebar (Sheet) ──────────────────────────── */}
      <Sheet open={mobileSidebarOpen} onOpenChange={setMobileSidebarOpen}>
        <SheetTrigger asChild>
          <button
            className="lg:hidden fixed top-3 right-3 z-40 w-11 h-11 flex items-center justify-center
                       text-[#a8a29e] active:text-[#fafaf9] touch-manipulation"
            aria-label="Open menu"
          >
            <Menu size={22} />
          </button>
        </SheetTrigger>
        <SheetContent side="right" className="w-64 max-w-[80vw] bg-[#0a0a08] border-e border-[#1a1916] p-0">
          <VisuallyHidden>
            <SheetTitle>القائمة — Menu</SheetTitle>
          </VisuallyHidden>
          <div className="flex flex-col h-full safe-top safe-bottom">
            <div className="flex items-center justify-between px-4 h-12 border-b border-[#1a1916]">
              <span className="text-sm font-bold text-[#fafaf9]">دكان</span>
              <button
                onClick={() => setMobileSidebarOpen(false)}
                className="w-11 h-11 flex items-center justify-center text-[#57534e] hover:text-[#fafaf9]"
              >
                <X size={20} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto" onClick={() => setMobileSidebarOpen(false)}>
              {sidebar}
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* ── Main Content Area ───────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile top bar */}
        <header className="lg:hidden flex items-center gap-3 px-4 h-14
                           border-b border-[#1a1916] bg-[#0a0a08]/95 backdrop-blur-sm
                           sticky top-0 z-30 safe-top">
          <button
            onClick={() => setMobileSidebarOpen(true)}
            className="w-11 h-11 -ms-2 flex items-center justify-center text-[#a8a29e]
                       active:text-[#fafaf9] touch-manipulation flex-shrink-0"
            aria-label="Open menu"
          >
            <Menu size={22} />
          </button>
          {topBarContent}
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>

      {/* ── Global Command Palette (Ctrl+K / ⌘+K) ──────────── */}
      <CommandMenu basePath={basePath} />

      {/* ── Sonner Toaster ──────────────────────────────────── */}
      <Toaster />
    </div>
  );
}
