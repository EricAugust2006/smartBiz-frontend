"use client";

import * as React from "react";
import { Drawer as DrawerPrimitive } from "vaul";
import { ThemeScope } from "@/components/ui";
import { cn } from "@/lib/utils";

export const Drawer = DrawerPrimitive.Root;
export const DrawerClose = DrawerPrimitive.Close;
export const DrawerTitle = DrawerPrimitive.Title;
export const DrawerDescription = DrawerPrimitive.Description;

export const DrawerContent = React.forwardRef<
  React.ElementRef<typeof DrawerPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Content> & {
    brandHex?: string;
  }
>(({ className, children, brandHex, ...props }, ref) => (
  <DrawerPrimitive.Portal>
    <ThemeScope brandHex={brandHex} className="contents">
      <DrawerPrimitive.Overlay className="fixed inset-0 z-40 bg-overlay" />
      <DrawerPrimitive.Content
        ref={ref}
        className={cn(
          "fixed inset-x-0 bottom-0 z-50 mx-auto flex max-h-[calc(100dvh-env(safe-area-inset-top)-1rem)] w-full max-w-md flex-col rounded-t-3xl border border-border bg-card text-foreground shadow-overlay outline-none",
          className,
        )}
        {...props}
      >
        <div
          aria-hidden="true"
          className="mx-auto mt-3 h-1.5 w-10 shrink-0 rounded-full bg-input"
        />
        {children}
      </DrawerPrimitive.Content>
    </ThemeScope>
  </DrawerPrimitive.Portal>
));
DrawerContent.displayName = "DrawerContent";
