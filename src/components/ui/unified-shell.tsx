'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import {
  SidebarProvider,
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarFooter,
  SidebarInset,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { CommandMenu } from '@/components/shared/CommandMenu';
import { Toaster } from '@/components/shared/Toaster';
import { Search } from 'lucide-react';

interface UnifiedShellProps {
  /** Main page content */
  children: React.ReactNode;
  /** Sidebar navigation content (desktop) */
  sidebar: React.ReactNode;
  /** Optional: content at the top of the sidebar */
  sidebarHeader?: React.ReactNode;
  /** Optional: content at the bottom of the sidebar (e.g. logout) */
  sidebarFooter?: React.ReactNode;
  /** Optional: content shown in the mobile top bar */
  headerContent?: React.ReactNode;
  /** Optional: extra content in the desktop shortcut bar */
  shortcutHint?: React.ReactNode;
  /** Optional: bottom navigation (mobile-only, dashboard variant) */
  bottomNav?: React.ReactNode;
  /** Base path for the command menu */
  basePath?: string;
  /** Sidebar side (default: 'right' for RTL) */
  side?: 'left' | 'right';
  /** Whether sidebar is collapsible to icon (default: true) */
  collapsible?: boolean;
  /** Sidebar collapsed width or variant */
  sidebarCollapsible?: 'icon' | 'none' | 'offcanvas';
  /** Default sidebar state (default: true = expanded) */
  defaultOpen?: boolean;
  /** Extra class on the root element */
  className?: string;
}

export function UnifiedShell({
  children,
  sidebar,
  sidebarHeader,
  sidebarFooter,
  headerContent,
  shortcutHint,
  bottomNav,
  basePath = '',
  side = 'right',
  collapsible = true,
  sidebarCollapsible = 'icon',
  defaultOpen = true,
  className,
}: UnifiedShellProps) {
  const resolvedCollapsible: 'icon' | 'offcanvas' | 'none' =
    !collapsible ? 'none' : sidebarCollapsible === 'offcanvas' ? 'offcanvas' : 'icon';

  return (
    <SidebarProvider defaultOpen={defaultOpen}>
      <div
        dir="rtl"
        className={cn('flex min-h-screen w-full bg-background', className)}
      >
        {/* ── Sidebar ── */}
        <Sidebar
          side={side}
          variant="sidebar"
          collapsible={resolvedCollapsible}
        >
          {sidebarHeader && (
            <SidebarHeader>
              {sidebarHeader}
            </SidebarHeader>
          )}

          <SidebarContent>
            {sidebar}
          </SidebarContent>

          {sidebarFooter && (
            <SidebarFooter>
              {sidebarFooter}
            </SidebarFooter>
          )}
        </Sidebar>

        {/* ── Main Content ── */}
        <SidebarInset>
          {/* Mobile header */}
          <header className="md:hidden flex items-center gap-3 px-4 h-14
            border-b border-border bg-background/95 backdrop-blur-sm
            sticky top-0 z-30 safe-top"
          >
            <SidebarTrigger className="flex-shrink-0" />
            {headerContent}
          </header>

          {/* Desktop shortcut hint */}
          <div className="hidden md:flex items-center justify-end gap-2 px-6 py-2 border-b border-border bg-sidebar/40">
            {shortcutHint ?? (
              <>
                <span className="text-[10px] text-muted-foreground font-medium">⌘K للبحث</span>
                <kbd className="inline-flex items-center gap-0.5 rounded border border-border bg-card px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                  <Search size={10} /> Ctrl+K
                </kbd>
              </>
            )}
          </div>

          {/* Page content */}
          <main className="flex-1">
            {children}
          </main>

          {/* Bottom nav (mobile only) */}
          {bottomNav}
        </SidebarInset>

        {/* ── Global Command Palette ── */}
        <CommandMenu basePath={basePath} />

        {/* ── Sonner Toaster ── */}
        <Toaster />
      </div>
    </SidebarProvider>
  );
}
