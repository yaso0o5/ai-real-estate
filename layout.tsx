import Link from "next/link";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-paper">
      {/* Left editorial panel */}
      <div className="relative hidden w-[46%] flex-col justify-between overflow-hidden bg-pine p-10 text-cream lg:flex">
        <div className="absolute inset-0 opacity-[0.14]" aria-hidden>
          <svg viewBox="0 0 600 900" className="h-full w-full" preserveAspectRatio="xMidYMid slice">
            <path d="M0 640 L120 640 L120 480 L200 480 L200 560 L300 560 L300 400 L400 400 L400 520 L520 520 L520 640 L600 640" fill="none" stroke="#faf8f2" strokeWidth="2" />
            <path d="M60 720 L600 720" stroke="#faf8f2" strokeWidth="1" opacity="0.5" />
          </svg>
        </div>
        <Link href="/" className="relative z-10 flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-md bg-cream text-pine">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M4 21V9l6-5 6 5v12M16 21v-8l4-3v11M3 21h18" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
          <span className="leading-none">
            <span className="block font-display text-[19px] font-semibold tracking-[-0.02em]">PropertyIQ</span>
            <span className="mt-0.5 block text-[9px] font-semibold uppercase tracking-[0.22em] text-cream/60">Market Intelligence</span>
          </span>
        </Link>
        <div className="relative z-10 max-w-md">
          <h2 className="font-display text-[34px] leading-[1.12] tracking-[-0.02em]">
            “The market leaves a trail in your spreadsheet. We read it for you.”
          </h2>
          <p className="mt-4 text-[14px] leading-relaxed text-cream/70">
            Upload an Excel or CSV export and get pricing trends, district benchmarks, outlier detection and plain-language answers — computed only from your own listings.
          </p>
          <div className="mt-8 grid grid-cols-3 gap-px overflow-hidden rounded-lg border border-cream/15 bg-cream/15">
            {[
              ["8", "fields auto-detected"],
              ["3", "steps to insight"],
              ["100%", "your data, isolated"],
            ].map(([n, l]) => (
              <div key={l} className="bg-pine-deep/60 px-3 py-3">
                <div className="tnum font-display text-[22px] leading-none">{n}</div>
                <div className="mt-1 text-[10px] leading-tight text-cream/60">{l}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="relative z-10 text-[11.5px] text-cream/50">Data-based signals only — never financial advice.</div>
      </div>

      {/* Form column */}
      <div className="flex flex-1 flex-col">
        <div className="flex items-center justify-between px-6 py-4 lg:hidden">
          <Link href="/" className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-md bg-pine text-cream">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                <path d="M4 21V9l6-5 6 5v12M16 21v-8l4-3v11M3 21h18" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
            <span className="font-display text-[16px] font-semibold">PropertyIQ</span>
          </Link>
          <Link href="/" className="text-[12.5px] font-medium text-ink-2 hover:text-ink">
            ← Back to site
          </Link>
        </div>
        <div className="flex flex-1 items-center justify-center px-5 pb-16 pt-4 sm:px-10">{children}</div>
      </div>
    </div>
  );
}
