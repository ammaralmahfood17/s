"use client";

import { Toaster as SonnerToaster } from "sonner";

type ToasterProps = React.ComponentProps<typeof SonnerToaster>;

const Sonner = ({ ...props }: ToasterProps) => {
  return (
    <SonnerToaster
      theme="dark"
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-[#0f0e0c] group-[.toaster]:text-[#fafaf9] group-[.toaster]:border-[#2a2825] group-[.toaster]:shadow-lg",
          description: "group-[.toast]:text-[#a8a29e]",
          actionButton:
            "group-[.toast]:bg-brand-500 group-[.toast]:text-[#0f0e0c]",
          cancelButton:
            "group-[.toast]:bg-[#1a1916] group-[.toast]:text-[#a8a29e]",
        },
      }}
      {...props}
    />
  );
};

export { Sonner };
