"use client";

import { useEffect, type ReactNode, type ButtonHTMLAttributes, type InputHTMLAttributes, type SelectHTMLAttributes } from "react";
import { useAnimatedNumber } from "@/lib/hooks";

export function cn(...parts: (string | false | null | undefined)[]): string {
  return parts.filter(Boolean).join(" ");
}

/* ------------------------------- Button ------------------------------- */

type BtnVariant = "primary" | "dark" | "outline" | "ghost" | "danger" | "gold";
export function Button({
  variant = "primary",
  size = "md",
  className,
  children,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: BtnVariant; size?: "sm" | "md" | "lg" }) {
  const styles: Record<BtnVariant, string> = {
    primary: "bg-pine text-cream hover:bg-pine-deep shadow-card",
    dark: "bg-ink text-cream hover:bg-pine-deep",
    outline: "border border-ink/25 text-ink hover:border-ink hover:bg-ink/5 bg-transparent",
    ghost: "text-ink-2 hover:text-ink hover:bg-ink/5",
    danger: "border border-rust/40 text-rust hover:bg-rust-tint",
    gold: "bg-gold text-cream hover:brightness-95",
  };
  const sizes = { sm: "h-8 px-3 text-[12.5px] gap-1.5", md: "h-10 px-4 text-[13.5px] gap-2", lg: "h-12 px-6 text-[15px] gap-2.5" };
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center rounded-md font-medium tracking-[-0.01em] transition-all duration-200 disabled:opacity-50 disabled:pointer-events-none select-none cursor-pointer",
        styles[variant],
        sizes[size],
        className
      )}
      {...rest}
    >
      {children}
    </button>
  );
}

/* ------------------------------- Fields ------------------------------- */

export function Field({ label, hint, children, className }: { label: string; hint?: string; children: ReactNode; className?: string }) {
  return (
    <label className={cn("block", className)}>
      <span className="mb-1.5 flex items-baseline justify-between text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-3">
        {label}
        {hint ? <span className="normal-case tracking-normal font-normal text-ink-3/80">{hint}</span> : null}
      </span>
      {children}
    </label>
  );
}

export function Input({ className, ...rest }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "h-10 w-full rounded-md border border-line bg-card px-3 text-[13.5px] text-ink placeholder:text-ink-3/70 transition-colors focus:border-pine focus:outline-none",
        className
      )}
      {...rest}
    />
  );
}

export function Select({ className, children, ...rest }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className="relative">
      <select
        className={cn(
          "h-10 w-full appearance-none rounded-md border border-line bg-card pl-3 pr-8 text-[13px] text-ink transition-colors focus:border-pine focus:outline-none cursor-pointer",
          className
        )}
        {...rest}
      >
        {children}
      </select>
      <svg className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-3" width="10" height="10" viewBox="0 0 10 10" fill="none">
        <path d="M2 3.5L5 6.5L8 3.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      </svg>
    </div>
  );
}

/* ------------------------------- Surfaces ------------------------------- */

export function Card({ className, children, hover }: { className?: string; children: ReactNode; hover?: boolean }) {
  return (
    <div className={cn("rounded-lg border border-line bg-card shadow-card", hover && "transition-all duration-300 hover:shadow-lift hover:-translate-y-0.5", className)}>
      {children}
    </div>
  );
}

type BadgeTone = "neutral" | "pine" | "gold" | "rust" | "amber" | "outline";
export function Badge({ tone = "neutral", children, className }: { tone?: BadgeTone; children: ReactNode; className?: string }) {
  const tones: Record<BadgeTone, string> = {
    neutral: "bg-ink/6 text-ink-2",
    pine: "bg-pine-tint text-pine-deep",
    gold: "bg-gold/12 text-gold",
    rust: "bg-rust-tint text-rust",
    amber: "bg-amberx-tint text-amberx",
    outline: "border border-line text-ink-2 bg-transparent",
  };
  return <span className={cn("inline-flex items-center gap-1 rounded px-2 py-0.5 text-[11px] font-medium tracking-wide whitespace-nowrap", tones[tone], className)}>{children}</span>;
}

/* ------------------------------- Numbers ------------------------------- */

export function Ticker({ value, format, className }: { value: number | null | undefined; format: (v: number) => string; className?: string }) {
  const v = useAnimatedNumber(value ?? 0);
  return <span className={cn("tnum", className)}>{value == null ? "—" : format(v)}</span>;
}

export function Stat({
  label,
  value,
  format,
  sub,
  delay = 0,
}: {
  label: string;
  value: number | null | undefined;
  format: (v: number) => string;
  sub?: string;
  delay?: number;
}) {
  return (
    <div className="anim-rise rounded-lg border border-line bg-card p-4 md:p-5 shadow-card" style={{ animationDelay: `${delay}ms` }}>
      <div className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-ink-3">{label}</div>
      <div className="mt-1.5 font-display text-[26px] md:text-[30px] leading-none tracking-[-0.02em] text-ink">
        <Ticker value={value} format={format} />
      </div>
      {sub ? <div className="mt-1.5 text-[11.5px] text-ink-3">{sub}</div> : null}
    </div>
  );
}

/* ------------------------------- States ------------------------------- */

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("skeleton rounded-md", className)} />;
}

export function Spinner({ className }: { className?: string }) {
  return (
    <svg className={cn("animate-spin", className)} width="16" height="16" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeOpacity="0.2" strokeWidth="2" />
      <path d="M14.5 8a6.5 6.5 0 00-6.5-6.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function EmptyState({
  icon,
  title,
  desc,
  actions,
  compact,
}: {
  icon?: ReactNode;
  title: string;
  desc: string;
  actions?: ReactNode;
  compact?: boolean;
}) {
  return (
    <div className={cn("anim-fade flex flex-col items-center justify-center rounded-lg border border-dashed border-line bg-cream/60 text-center", compact ? "px-6 py-10" : "px-6 py-16")}>
      {icon ? <div className="mb-4 text-ink-3">{icon}</div> : null}
      <h3 className="font-display text-xl tracking-[-0.01em]">{title}</h3>
      <p className="mt-2 max-w-sm text-[13.5px] leading-relaxed text-ink-2">{desc}</p>
      {actions ? <div className="mt-5 flex flex-wrap items-center justify-center gap-3">{actions}</div> : null}
    </div>
  );
}

export function ErrorState({ message, retry }: { message: string; retry?: () => void }) {
  return (
    <div className="anim-fade flex flex-col items-center rounded-lg border border-rust/25 bg-rust-tint/50 px-6 py-10 text-center">
      <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-full bg-rust/10 text-rust">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M8 5v4M8 11.5v.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M13.7 12.2L9.9 6.6a2.5 2.5 0 10-3.8 0l-3.8 5.6A1 1 0 004 14h8a1 1 0 00.7-1.8z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
        </svg>
      </div>
      <p className="max-w-sm text-[13.5px] text-rust">{message}</p>
      {retry ? (
        <Button variant="outline" size="sm" className="mt-4" onClick={retry}>
          Try again
        </Button>
      ) : null}
    </div>
  );
}

/* ------------------------------- Modal ------------------------------- */

export function Modal({ open, onClose, title, children, wide }: { open: boolean; onClose: () => void; title?: string; children: ReactNode; wide?: boolean }) {
  useEffect(() => {
    if (!open) return;
    const h = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", h);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", h);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[1200] flex items-end justify-center sm:items-center">
      <div className="anim-fade absolute inset-0 bg-ink/40" onClick={onClose} />
      <div className={cn("anim-pop relative z-10 max-h-[88vh] w-full overflow-y-auto thin-scroll rounded-t-xl border border-line bg-cream shadow-pop sm:rounded-lg", wide ? "sm:max-w-3xl" : "sm:max-w-lg")}>
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-line bg-cream/95 px-5 py-3.5 backdrop-blur">
          <h3 className="font-display text-[17px] tracking-[-0.01em]">{title}</h3>
          <button onClick={onClose} aria-label="Close" className="flex h-7 w-7 items-center justify-center rounded-md text-ink-3 transition-colors hover:bg-ink/5 hover:text-ink">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M2 2l8 8M10 2l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

/* ------------------------------- Icons ------------------------------- */

export function Icon({ d, size = 15, className, strokeWidth = 1.5 }: { d: string; size?: number; className?: string; strokeWidth?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path d={d} stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export const paths = {
  upload: "M12 16V4m0 0L7 9m5-5l5 5M4 20h16",
  download: "M12 4v12m0 0l5-5m-5 5l-5-5M4 20h16",
  pin: "M12 21s-7-5.5-7-11a7 7 0 1114 0c0 5.5-7 11-7 11zm0-8.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z",
  grid: "M4 4h7v7H4V4zm9 0h7v7h-7V4zM4 13h7v7H4v-7zm9 0h7v7h-7v-7z",
  chart: "M4 20V10m5.5 10V4M15 20v-7m5 7V8",
  compare: "M9 4v16M15 4v16M4 9h5M15 15h5",
  spark: "M13 2L4.5 13.5H11L10 22l8.5-11.5H12L13 2z",
  doc: "M7 3h7l4 4v14H7V3zm7 0v4h4M10 12h5m-5 4h5",
  bookmark: "M7 4h10a1 1 0 011 1v16l-6-4-6 4V5a1 1 0 011-1z",
  search: "M10.5 17.5a7 7 0 100-14 7 7 0 000 14zM21 21l-5-5",
  check: "M4 12.5l5 5L20 6.5",
  x: "M5 5l14 14M19 5L5 19",
  arrow: "M4 12h16m0 0l-6-6m6 6l-6 6",
  arrowUpRight: "M7 17L17 7m0 0H9m8 0v8",
  building: "M4 21V5a1 1 0 011-1h9a1 1 0 011 1v16M15 9h4a1 1 0 011 1v11M3 21h18M7.5 8h2m-2 4h2m-2 4h2m4-8h1m-1 4h1",
  key: "M15 9a6 6 0 10-5.7 6L10 15h2v2h2v2h3v-3l1.2-1.2A6 6 0 0015 9zm2-2a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z",
  filter: "M4 5h16l-6 7v6l-4 2v-8L4 5z",
  trash: "M5 7h14M10 7V5h4v2m-7 0l1 13h8l1-13M10 11v6m4-6v6",
  eye: "M2 12s3.5-6.5 10-6.5S22 12 22 12s-3.5 6.5-10 6.5S2 12 2 12zm10 3a3 3 0 100-6 3 3 0 000 6z",
  user: "M12 11a4 4 0 100-8 4 4 0 000 8zm-7 10a7 7 0 0114 0",
  logout: "M15 12H4m0 0l4-4m-4 4l4 4M15 4h4a1 1 0 011 1v14a1 1 0 01-1 1h-4",
  home: "M4 11l8-7 8 7v9a1 1 0 01-1 1h-5v-6h-4v6H5a1 1 0 01-1-1v-9z",
  layers: "M12 3l9 5-9 5-9-5 9-5zm-9 9.5l9 5 9-5M3 17l9 5 9-5",
};

/* Skyline illustration for empty states */
export function Skyline({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 44" className={className} fill="none" aria-hidden>
      <path d="M2 42V26h9v16H2zm13 0V18h7v24h-7zm11 0V10h8v32h-8zm12 0V22h7v20h-7zm11 0V14h8v28h-8zm12 0V24h7v18h-7zm11 0V8h8v34h-8zm12 0V20h7v22h-7zm11 0V28h8v14h-8z" stroke="currentColor" strokeWidth="1" strokeLinejoin="round" opacity="0.55" />
      <path d="M0 42h120" stroke="currentColor" strokeWidth="1" opacity="0.7" />
      <circle cx="104" cy="14" r="2" fill="currentColor" opacity="0.35" />
    </svg>
  );
}
