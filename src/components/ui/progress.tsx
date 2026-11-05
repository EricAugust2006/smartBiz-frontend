"use client";

import * as React from "react";
import * as ProgressPrimitive from "@radix-ui/react-progress";
import { cn } from "@/lib/utils";

export const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root>
>(({ className, value = 0, max = 100, ...props }, ref) => {
  const limit = Number.isFinite(max) && max > 0 ? max : 100;
  const current =
    typeof value === "number" && Number.isFinite(value)
      ? Math.min(limit, Math.max(0, value))
      : 0;

  return (
    <ProgressPrimitive.Root
      ref={ref}
      max={limit}
      value={current}
      className={cn(
        "relative h-2.5 w-full overflow-hidden rounded-full bg-muted",
        className,
      )}
      {...props}
    >
      <ProgressPrimitive.Indicator
        className="h-full w-full rounded-full bg-primary transition-transform duration-500 motion-reduce:transition-none"
        style={{ transform: `translateX(-${100 - (current / limit) * 100}%)` }}
      />
    </ProgressPrimitive.Root>
  );
});
Progress.displayName = "Progress";
