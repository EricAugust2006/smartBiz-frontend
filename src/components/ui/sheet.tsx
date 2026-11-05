"use client";

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { ThemeScope } from "@/components/ui";

export const Sheet = DialogPrimitive.Root;
export const SheetTrigger = DialogPrimitive.Trigger;
export const SheetTitle = DialogPrimitive.Title;
export const SheetDescription = DialogPrimitive.Description;

export const SheetContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> & {
    side?: "left" | "right";
    closeLabel?: string;
    closeDisabled?: boolean;
  }
>(
  (
    {
      className,
      children,
      side = "left",
      closeLabel = "Fechar menu",
      closeDisabled = false,
      ...props
    },
    ref,
  ) => (
    <DialogPrimitive.Portal>
      <ThemeScope className="contents">
        <DialogPrimitive.Overlay className="fixed inset-0 z-40 bg-overlay data-[state=open]:animate-fade-in" />
        <DialogPrimitive.Content
          ref={ref}
          className={cn(
            "fixed z-50 border border-border bg-card p-4 text-foreground shadow-overlay outline-none",
            side === "left"
              ? "inset-y-3 left-3 w-72 max-w-[calc(100vw-1.5rem)] rounded-2xl data-[state=open]:animate-sheet-left"
              : "inset-y-0 right-0 w-full sm:max-w-lg data-[state=open]:animate-sheet-right",
            className,
          )}
          {...props}
        >
          {children}
          <DialogPrimitive.Close
            aria-label={closeLabel}
            disabled={closeDisabled}
            className="absolute right-3 top-3 rounded-lg p-2 text-muted-foreground hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
          >
            <X size={18} aria-hidden="true" />
          </DialogPrimitive.Close>
        </DialogPrimitive.Content>
      </ThemeScope>
    </DialogPrimitive.Portal>
  ),
);
SheetContent.displayName = "SheetContent";
