'use client';

import { Toaster as SonnerToaster } from 'sonner';

export function Toaster() {
  return (
    <SonnerToaster
      richColors
      closeButton
      position="bottom-left"
      gap={10}
      className="group"
    />
  );
}
