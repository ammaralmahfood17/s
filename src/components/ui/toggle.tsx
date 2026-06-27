"use client"

import * as React from "react"
import * as TogglePrimitive from "@radix-ui/react-toggle"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const toggleVariants = cva(
  "inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-oklch(1 0 0) transition-colors hover:bg-oklch(0.97 0 0) hover:text-oklch(0.556 0 0) focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-oklch(0.708 0 0) focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=on]:bg-oklch(0.97 0 0) data-[state=on]:text-oklch(0.205 0 0) [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 gap-2 dark:ring-offset-oklch(0.145 0 0) dark:hover:bg-oklch(0.269 0 0) dark:hover:text-oklch(0.708 0 0) dark:focus-visible:ring-oklch(0.556 0 0) dark:data-[state=on]:bg-oklch(0.269 0 0) dark:data-[state=on]:text-oklch(0.985 0 0)",
  {
    variants: {
      variant: {
        default: "bg-transparent",
        outline:
          "border border-oklch(0.922 0 0) bg-transparent hover:bg-oklch(0.97 0 0) hover:text-oklch(0.205 0 0) dark:border-oklch(1 0 0 / 15%) dark:hover:bg-oklch(0.269 0 0) dark:hover:text-oklch(0.985 0 0)",
      },
      size: {
        default: "h-10 px-3 min-w-10",
        sm: "h-9 px-2.5 min-w-9",
        lg: "h-11 px-5 min-w-11",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

const Toggle = React.forwardRef<
  React.ElementRef<typeof TogglePrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof TogglePrimitive.Root> &
    VariantProps<typeof toggleVariants>
>(({ className, variant, size, ...props }, ref) => (
  <TogglePrimitive.Root
    ref={ref}
    className={cn(toggleVariants({ variant, size, className }))}
    {...props}
  />
))

Toggle.displayName = TogglePrimitive.Root.displayName

export { Toggle, toggleVariants }
