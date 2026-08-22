import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode } from "react";

export function cn(...classes: Array<string | false | null | undefined>) { return classes.filter(Boolean).join(" "); }

export const paths = {
  home: "M3 10.5L12 3l9 7.5M5.5 9.5V21h13V9.5M9 21v-6h6v6", chart: "M4 19V5M4 19h16M8 16v-4M12 16V8M16 16v-6", spark: "M12 2l1.8 6.2L20 10l-6.2 1.8L12 18l-1.8-6.2L4 10l6.2-1.8L12 2z", building: "M4 21V5h10v16M14 9h6v12M7 8h4M7 12h4M7 16h4M17 13h1M17 17h1", pin: "M12 21s-7-5.5-7-11a7 7 0 1114 0c0 5.5-7 11-7 11zm0-8.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z", compare: "M7 4v16M7 4l-3 3M7 4l3 3M17 20V4M17 20l-3-3M17 20l3-3", upload: "M12 16V4m0 0L7 9m5-5l5 5M4 14v5h16v-5", layers: "M12 3l8 4-8 4-8-4 8-4zm-8 9l8 4 8-4M4 17l8 4 8-4", doc: "M6 3h8l4 4v14H6V3zm8 0v5h4M9 12h6M9 16h6", bookmark: "M6 4h12v17l-6-3-6 3V4z", user: "M12 12a4 4 0 100-8 4 4 0 000 8zm-7 9a7 7 0 0114 0", logout: "M10 5H5v14h5M14 8l4 4-4 4M18 12H9", x: "M6 6l12 12M18 6L6 18",
};

export function Icon({ d, size = 16, className }: { d: string; size?: number; className?: string }) { return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} aria-hidden><path d={d} stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" /></svg>; }
export function Spinner() { return <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" aria-label="Loading" />; }

type ButtonVariant = "default" | "gold";
export function Button({ className, size = "md", variant = "default", ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { size?: "sm" | "md" | "lg"; variant?: ButtonVariant }) {
  return <button {...props} className={cn("inline-flex items-center justify-center gap-2 rounded-md px-4 font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50", variant === "default" && "bg-pine text-cream hover:bg-pine-deep", variant === "gold" && "bg-gold text-ink hover:bg-gold/90", size === "sm" && "h-9 text-[12px]", size === "md" && "h-10 text-[13px]", size === "lg" && "h-12 text-[14px]", className)} />;
}
export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) { return <input {...props} className={cn("h-11 w-full rounded-md border border-line bg-card px-3 text-[13.5px] text-ink outline-none placeholder:text-ink-3 focus:border-pine/50 focus:ring-2 focus:ring-pine/10", className)} />; }
export function Field({ label, children, className }: { label: string; children: ReactNode; className?: string }) { return <label className={cn("block", className)}><span className="mb-1.5 block text-[12px] font-medium text-ink-2">{label}</span>{children}</label>; }
