import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function LoadingFeedback({
  label = "Carregando...",
  className,
}: {
  label?: string;
  className?: string;
}) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      className={cn(
        "flex min-h-6 items-center gap-2 text-sm text-muted-foreground",
        className,
      )}
    >
      <Loader2
        size={16}
        className="shrink-0 animate-spin text-primary"
        aria-hidden="true"
      />
      <span>{label}</span>
    </div>
  );
}
