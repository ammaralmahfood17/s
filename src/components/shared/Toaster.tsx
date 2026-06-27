'use client';

import { Toaster as SonnerToaster } from 'sonner';

export function Toaster() {
  return (
    <SonnerToaster
      richColors
      closeButton
      position="bottom-left"
      gap={10}
      toastOptions={{
        style: {
          fontFamily: "'Cairo', system-ui, sans-serif",
          borderRadius: '12px',
          border: '1px solid #2a2825',
          background: '#1a1916',
          color: '#fafaf9',
        },
      }}
      className="group"
    />
  );
}
