import {
  useEffect,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type InputHTMLAttributes,
  type ReactNode,
} from "react";
import { AlertCircle, RotateCw, X } from "lucide-react";
import { useThemeStore } from "../store/useThemeStore";
import { deriveBrand } from "../theme/color";
import { tenant } from "../data";

export const cn = (...c: (string | false | null | undefined)[]) =>
  c.filter(Boolean).join(" ");

/* ThemeScope: injects the tenant's brand tokens as CSS variables */
export function ThemeScope({
  children,
  className,
  brandHex,
}: {
  children: ReactNode;
  className?: string;
  brandHex?: string;
}) {
  const tenantTokens = useThemeStore((s) => s.tokens);
  const t = brandHex ? deriveBrand(brandHex) : tenantTokens;
  const vars = {
    "--brand": t.brand,
    "--brand-fg": t.fg,
    "--brand-hover": t.hover,
    "--brand-border": t.border,
    "--brand-soft": t.soft,
    "--brand-text": t.text,
    "--brand-ring": t.ring,
  } as React.CSSProperties;
  return (
    <div
      style={vars}
      className={cn(
        "min-h-screen bg-background font-sans text-foreground",
        className,
      )}
    >
      {children}
    </div>
  );
}

/* Button */
type Variant =
  | "primary"
  | "secondary"
  | "outline"
  | "ghost"
  | "destructive"
  | "link";
type Size = "sm" | "md" | "lg" | "icon";
const variants: Record<Variant, string> = {
  primary:
    "bg-primary text-primary-foreground border border-primary-border hover:bg-primary-hover shadow-xs",
  secondary:
    "bg-secondary text-secondary-foreground border border-transparent hover:bg-input",
  outline:
    "bg-card text-foreground border border-input hover:bg-muted shadow-xs",
  ghost: "text-foreground border border-transparent hover:bg-muted",
  destructive:
    "bg-destructive text-white border border-destructive hover:opacity-90",
  link: "text-primary-text underline-offset-4 hover:underline border border-transparent px-0",
};
const sizes: Record<Size, string> = {
  sm: "h-8 px-3 text-[13px] gap-1.5 rounded-md",
  md: "h-10 px-4 text-sm gap-2 rounded-lg",
  lg: "h-12 px-5 text-[15px] gap-2 rounded-xl",
  icon: "h-9 w-9 rounded-lg",
};

export function Button({
  variant = "primary",
  size = "md",
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
}) {
  return (
    <button
      {...props}
      className={cn(
        "inline-flex shrink-0 items-center justify-center font-medium whitespace-nowrap transition-colors duration-150 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 cursor-pointer",
        variants[variant],
        sizes[size],
        className,
      )}
    />
  );
}

/* Card */
export function Card({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "rounded-xl border border-border bg-card shadow-card",
        className,
      )}
    >
      {children}
    </section>
  );
}
export function CardHeader({
  title,
  meta,
  action,
}: {
  title: ReactNode;
  meta?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4 px-6 pt-5 pb-4">
      <div className="flex min-w-0 items-baseline gap-3">
        <h2 className="text-[15px] font-semibold tracking-tight">{title}</h2>
        {meta && (
          <span className="text-[13px] text-muted-foreground">{meta}</span>
        )}
      </div>
      {action}
    </div>
  );
}

/* Badge */
type Tone = "neutral" | "brand" | "success" | "warning" | "danger";
const tones: Record<Tone, string> = {
  neutral: "bg-muted text-muted-foreground",
  brand: "bg-primary-soft text-primary-text",
  success: "bg-success-soft text-success",
  warning: "bg-warning-soft text-warning",
  danger: "bg-destructive-soft text-destructive",
};
export function Badge({
  tone = "neutral",
  children,
  className,
}: {
  tone?: Tone;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex h-6 items-center gap-1 rounded-md px-2 text-xs font-medium whitespace-nowrap",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

/* Form */
export function Label({
  htmlFor,
  children,
}: {
  htmlFor: string;
  children: ReactNode;
}) {
  return (
    <label
      htmlFor={htmlFor}
      className="text-[13px] font-medium text-foreground"
    >
      {children}
    </label>
  );
}
export function Input({
  className,
  invalid,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean }) {
  return (
    <input
      {...props}
      aria-invalid={invalid || undefined}
      className={cn(
        "h-10 w-full rounded-lg border bg-card px-3 text-sm text-foreground shadow-xs outline-none placeholder:text-subtle-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
        invalid ? "border-destructive" : "border-input",
        className,
      )}
    />
  );
}
export function Field({
  id,
  label,
  error,
  hint,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      {children}
      {error ? (
        <p className="text-[13px] text-destructive">{error}</p>
      ) : hint ? (
        <p className="text-[13px] text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}

/* Dialog (desktop) / bottom sheet (mobile) */
export function Dialog({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  variant = "center",
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children?: ReactNode;
  footer?: ReactNode;
  variant?: "center" | "sheet";
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [anim, setAnim] = useState(true);
  useEffect(() => {
    if (!open) return;
    setAnim(true);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    ref.current?.querySelector<HTMLElement>("input,button")?.focus();
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);
  if (!open) return null;
  const sheet = variant === "sheet";
  return (
    <div
      className={cn(
        "fixed inset-0 z-50 flex",
        sheet ? "items-end" : "items-center justify-center p-4",
      )}
    >
      <div
        className="absolute inset-0 animate-fade-in bg-overlay"
        onClick={onClose}
      />
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onAnimationEnd={() => setAnim(false)}
        className={cn(
          "relative w-full bg-popover shadow-overlay",
          sheet ? "rounded-t-2xl px-5 pt-3 pb-6" : "max-w-md rounded-2xl p-6",
          anim && (sheet ? "animate-sheet-up" : "animate-pop-in"),
        )}
      >
        {sheet && (
          <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-input" />
        )}
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-1">
            <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
            {description && (
              <p className="text-sm text-muted-foreground">{description}</p>
            )}
          </div>
          {!sheet && (
            <Button
              variant="ghost"
              size="icon"
              aria-label="Fechar"
              onClick={onClose}
              className="-mt-1 -mr-2"
            >
              <X size={18} strokeWidth={1.75} />
            </Button>
          )}
        </div>
        {children && <div className="mt-5">{children}</div>}
        {footer && (
          <div
            className={cn(
              "mt-6 flex gap-3",
              sheet ? "flex-col-reverse" : "justify-end",
            )}
          >
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

export function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-md bg-border ${className}`}
      aria-hidden="true"
    />
  );
}

export function ErrorState({
  title,
  onRetry,
}: {
  title: string;
  onRetry?: () => void;
}) {
  return (
    <div className="flex flex-col items-center gap-3 px-6 py-12 text-center">
      <p className="text-[15px] font-medium tracking-tight">{title}</p>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry}>
          Tentar novamente
        </Button>
      )}
    </div>
  );
}

/* Toast: one at a time, bottom centre */
type ToastMsg = { id: number; text: string; undo?: () => void };
let pushToast: (t: Omit<ToastMsg, "id">) => void = () => {};
export const toast = (text: string, undo?: () => void) =>
  pushToast({ text, undo });


export function Toaster({ bottomOffset = "bottom-6" }: { bottomOffset?: string }) {
  const [msg, setMsg] = useState<ToastMsg | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    pushToast = (t) => {
      setMsg({ id: Date.now(), ...t });
      clearTimeout(timer.current);
      timer.current = setTimeout(() => setMsg(null), 5000);
    };
    return () => {
      pushToast = () => {};
      clearTimeout(timer.current);
    };
  }, []);

  if (!msg) return null;
  return (
    <div className={cn("pointer-events-none fixed inset-x-0 z-[60] flex justify-center px-4", bottomOffset)}>
      <div
        key={msg.id}
        role="status"
        className="pointer-events-auto flex animate-fade-in items-center gap-3 rounded-xl bg-foreground px-4 py-3 text-sm text-background shadow-overlay"
      >
        <span>{msg.text}</span>
        {msg.undo && (
          <button
            onClick={() => {
              msg.undo?.();
              setMsg(null);
            }}
            className="cursor-pointer font-medium underline underline-offset-2 outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Desfazer
          </button>
        )}
        <button
          aria-label="Fechar"
          onClick={() => setMsg(null)}
          className="cursor-pointer opacity-70 outline-none hover:opacity-100"
        >
          <X size={16} strokeWidth={1.75} />
        </button>
      </div>
    </div>
  );
}

export function Avatar({ initials, className }: { initials: string; className?: string }) {
  return (
    <span
      className={cn(
        "flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold text-muted-foreground",
        className,
      )}
    >
      {initials}
    </span>
  );
}

export function TenantMark({ size = "md" }: { size?: "sm" | "md" }) {
  return (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center bg-primary font-semibold text-primary-foreground",
        size === "sm" ? "h-8 w-8 rounded-lg text-sm" : "h-10 w-10 rounded-xl text-base",
      )}
    >
      {tenant.name.charAt(0)}
    </span>
  );
}

export function Progress({ value, max = 100, className }: { value: number; max?: number; className?: string }) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={max}
      className={cn("h-2 w-full overflow-hidden rounded-full bg-muted", className)}
    >
      <div className="h-full rounded-full bg-primary transition-all duration-300" style={{ width: `${pct}%` }} />
    </div>
  );
}

export function SegmentTabs<T extends string>({
  options,
  value,
  onChange,
  ariaLabel,
}: {
  options: { value: T; label: ReactNode }[];
  value: T;
  onChange: (v: T) => void;
  ariaLabel?: string;
}) {
  return (
    <div role="tablist" aria-label={ariaLabel} className="inline-flex gap-1 rounded-lg bg-muted p-1">
      {options.map((o) => (
        <button
          key={o.value}
          role="tab"
          aria-selected={o.value === value}
          onClick={() => onChange(o.value)}
          className={cn(
            "h-8 cursor-pointer rounded-md px-3 text-[13px] font-medium outline-none focus-visible:ring-2 focus-visible:ring-ring",
            o.value === value ? "bg-card text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Switch({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label?: string;
}) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative h-6 w-11 shrink-0 cursor-pointer rounded-full outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        checked ? "bg-primary" : "bg-input",
      )}
    >
      <span
        className={cn(
          "absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow-xs transition-transform",
          checked && "translate-x-5",
        )}
      />
    </button>
  );
}

export function TableSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="flex flex-col divide-y divide-border px-6" aria-busy="true">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 py-4">
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="ml-auto h-4 w-16" />
          <Skeleton className="h-5 w-20 rounded-full" />
        </div>
      ))}
    </div>
  );
}