import Link from "next/link";

const VILLA = "https://images.pexels.com/photos/16573669/pexels-photo-16573669.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200";
const APART = "https://images.pexels.com/photos/27459248/pexels-photo-27459248.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200";
const INTERIOR = "https://images.pexels.com/photos/8135496/pexels-photo-8135496.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200";

function Arrow({ className }: { className?: string }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path d="M4 12h16m0 0l-6-6m6 6l-6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CtaButton({ href, children, dark }: { href: string; children: React.ReactNode; dark?: boolean }) {
  return (
    <Link
      href={href}
      className={`group inline-flex h-12 items-center gap-2.5 rounded-md px-6 text-[15px] font-medium tracking-[-0.01em] transition-all duration-200 ${
        dark ? "bg-cream text-ink hover:bg-white" : "bg-pine text-cream hover:bg-pine-deep"
      }`}
    >
      {children}
      <Arrow className="transition-transform duration-200 group-hover:translate-x-0.5" />
    </Link>
  );
}

/* Crafted analytics preview for the hero */
function HeroPreview() {
  const bars = [
    { d: "Zamalek", v: 58, h: 168 },
    { d: "Maadi", v: 41, h: 120 },
    { d: "New Cairo", v: 32, h: 96 },
    { d: "Heliopolis", v: 33, h: 99 },
    { d: "Nasr City", v: 27, h: 81 },
    { d: "6th Oct", v: 21, h: 63 },
    { d: "Sheikh Z.", v: 16.5, h: 50 },
  ];
  return (
    <div className="relative">
      <div className="anim-rise overflow-hidden rounded-lg border border-line bg-cream shadow-pop" style={{ animationDelay: "150ms" }}>
        {/* window bar */}
        <div className="flex items-center justify-between border-b border-line px-4 py-2.5">
          <div className="flex items-center gap-2">
            <span className="flex h-5 w-5 items-center justify-center rounded bg-pine text-cream">
              <svg width="9" height="9" viewBox="0 0 24 24" fill="none">
                <path d="M4 21V9l6-5 6 5v12M16 21v-8l4-3v11M3 21h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </span>
            <span className="text-[11px] font-semibold tracking-[-0.01em]">PropertyIQ — Greater Cairo</span>
          </div>
          <div className="flex gap-1.5">
            <span className="rounded bg-ink/5 px-1.5 py-0.5 text-[9px] font-medium text-ink-3">All datasets</span>
            <span className="rounded bg-pine-tint px-1.5 py-0.5 text-[9px] font-medium text-pine-deep">1,284 properties</span>
          </div>
        </div>
        {/* metrics */}
        <div className="grid grid-cols-3 divide-x divide-line border-b border-line">
          {[
            ["Avg price", "EGP 3.4M"],
            ["Median", "EGP 2.9M"],
            ["Avg /m²", "EGP 28,900"],
          ].map(([l, v]) => (
            <div key={l} className="px-4 py-3">
              <div className="text-[9px] font-semibold uppercase tracking-[0.16em] text-ink-3">{l}</div>
              <div className="tnum mt-0.5 font-display text-[19px] leading-none tracking-[-0.02em]">{v}</div>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-[1.5fr_1fr]">
          {/* chart */}
          <div className="border-r border-line p-4">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-3">Avg price /m² by district</span>
              <span className="text-[9.5px] text-ink-3">EGP</span>
            </div>
            <div className="flex h-[150px] items-end gap-2">
              {bars.map((b, i) => (
                <div key={b.d} className="group flex flex-1 flex-col items-center gap-1.5">
                  <div className="relative flex w-full flex-1 items-end">
                    <div className="anim-growbar w-full rounded-t-[3px] bg-pine transition-colors group-hover:bg-gold" style={{ height: b.h, animationDelay: `${300 + i * 90}ms` }} />
                  </div>
                  <span className="text-[8px] font-medium text-ink-3">{b.d}</span>
                </div>
              ))}
            </div>
          </div>
          {/* property card */}
          <div className="p-4">
            <div className="overflow-hidden rounded-md border border-line bg-card">
              <div className="relative h-[86px]">
                <img src={APART} alt="Apartment listing" className="h-full w-full object-cover" />
                <span className="absolute left-1.5 top-1.5 rounded bg-cream/95 px-1.5 py-0.5 text-[8.5px] font-semibold">Apartment</span>
              </div>
              <div className="p-2.5">
                <div className="flex items-baseline justify-between">
                  <span className="tnum font-display text-[14px]">EGP 4.2M</span>
                  <span className="tnum text-[9px] font-medium text-pine">33,140/m²</span>
                </div>
                <div className="mt-1 truncate text-[10px] text-ink-2">Unit 14 — Laila Gardens, New Cairo</div>
                <div className="mt-1 text-[9px] text-ink-3">118 m² · 3 bd · 2 ba</div>
              </div>
            </div>
            <div className="anim-pop mt-3 rounded-md border border-pine/25 bg-pine-wash p-2.5" style={{ animationDelay: "900ms" }}>
              <div className="text-[9px] font-semibold uppercase tracking-[0.14em] text-pine-deep">Opportunity</div>
              <p className="mt-1 text-[10px] leading-snug text-ink-2">
                EGP 2.8M — <span className="font-semibold text-pine-deep">18% below</span> the average of similar villas in 6th of October.
              </p>
            </div>
          </div>
        </div>
      </div>
      {/* floating map chip */}
      <div className="anim-pop absolute -bottom-6 -left-4 hidden rounded-lg border border-line bg-card px-3.5 py-2.5 shadow-lift md:block" style={{ animationDelay: "600ms" }}>
        <div className="flex items-center gap-2.5">
          <span className="relative flex h-7 w-7 items-center justify-center rounded-full bg-pine-tint text-pine">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
              <path d="M12 21s-7-5.5-7-11a7 7 0 1114 0c0 5.5-7 11-7 11zm0-8.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z" stroke="currentColor" strokeWidth="1.6" />
            </svg>
          </span>
          <div>
            <div className="text-[10.5px] font-semibold">24 listings near you</div>
            <div className="tnum text-[9.5px] text-ink-3">Zamalek · EGP 41,200/m² avg</div>
          </div>
        </div>
      </div>
      <div className="absolute -right-3 -top-5 hidden rotate-2 md:block">
        <div className="anim-pop overflow-hidden rounded-lg border border-line shadow-lift" style={{ animationDelay: "450ms" }}>
          <img src={VILLA} alt="Villa" className="h-20 w-36 object-cover" />
        </div>
      </div>
    </div>
  );
}

const FEATURES = [
  {
    tag: "Property analytics",
    title: "A market view, not a data dump",
    body: "Totals, averages, medians and distributions computed the moment your spreadsheet lands. Every number traces back to your own rows.",
    span: "lg:col-span-7",
    art: (
      <div className="mt-5 flex h-40 items-end gap-2.5 rounded-md border border-line-2 bg-paper px-4 pb-4 pt-6">
        {[42, 68, 55, 90, 74, 61, 82, 48, 66, 58].map((h, i) => (
          <div key={i} className={`flex-1 rounded-t-[3px] ${i === 3 ? "bg-gold" : "bg-pine"}`} style={{ height: h, opacity: 0.35 + (h / 140) }} />
        ))}
      </div>
    ),
  },
  {
    tag: "Price per m²",
    title: "Compare apples to apples",
    body: "Every listing gets a computed price/m², benchmarked against its own district so you can spot cheap square meters — and expensive ones.",
    span: "lg:col-span-5",
    art: (
      <div className="mt-5 grid grid-cols-2 gap-3">
        <div className="rounded-md border border-line-2 bg-paper p-4">
          <div className="text-[9.5px] font-semibold uppercase tracking-[0.16em] text-ink-3">District median</div>
          <div className="tnum mt-1 font-display text-[24px] tracking-[-0.02em]">24,100</div>
          <div className="text-[10px] text-ink-3">EGP/m²</div>
        </div>
        <div className="rounded-md border border-pine/30 bg-pine-wash p-4">
          <div className="text-[9.5px] font-semibold uppercase tracking-[0.16em] text-pine-deep">This listing</div>
          <div className="tnum mt-1 font-display text-[24px] tracking-[-0.02em] text-pine-deep">19,800</div>
          <div className="text-[10px] font-medium text-pine-deep">−18% vs median</div>
        </div>
      </div>
    ),
  },
  {
    tag: "Location intelligence",
    title: "See the market geographically",
    body: "Interactive maps place every listing at its coordinates with price, area and /m² on tap. Missing coordinates fall back to honest district grouping.",
    span: "lg:col-span-5",
    art: (
      <div className="relative mt-5 h-44 overflow-hidden rounded-md border border-line-2 bg-[#e8e4d6]">
        <svg viewBox="0 0 300 176" className="h-full w-full" aria-hidden>
          <path d="M0 120 C60 90 120 140 300 100" stroke="#cfc8b2" strokeWidth="14" fill="none" />
          <path d="M40 0 C80 60 60 120 110 176" stroke="#cfc8b2" strokeWidth="8" fill="none" />
          <path d="M200 0 C190 60 240 100 300 130" stroke="#d8d2be" strokeWidth="10" fill="none" />
          <path d="M0 40 L120 60 L220 30 L300 50" stroke="#d8d2be" strokeWidth="6" fill="none" />
        </svg>
        {[
          { x: "22%", y: "34%", c: "bg-pine" },
          { x: "48%", y: "58%", c: "bg-gold" },
          { x: "68%", y: "30%", c: "bg-pine" },
          { x: "80%", y: "66%", c: "bg-pine" },
          { x: "35%", y: "74%", c: "bg-ink/60" },
        ].map((m, i) => (
          <span key={i} className={`absolute ${m.c} h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-cream shadow`} style={{ left: m.x, top: m.y }} />
        ))}
        <span className="absolute right-2 top-2 rounded bg-cream/95 px-2 py-1 text-[9.5px] font-medium shadow-card">6 of 8 districts mapped</span>
      </div>
    ),
  },
  {
    tag: "Market comparison",
    title: "New Cairo vs 6th of October, transparently",
    body: "Pick any two areas and get side-by-side averages, medians and /m² — with the calculation shown, never a vibe.",
    span: "lg:col-span-7",
    art: (
      <div className="mt-5 grid grid-cols-[auto_1fr_1fr] gap-x-4 gap-y-2 rounded-md border border-line-2 bg-paper p-4 text-[12px]">
        <span />
        <span className="font-display text-[13px]">New Cairo</span>
        <span className="font-display text-[13px]">6th of October</span>
        {[
          ["Listings", "284", "211"],
          ["Avg price", "EGP 4.1M", "EGP 2.7M"],
          ["Median", "EGP 3.6M", "EGP 2.4M"],
          ["Avg /m²", "32,140", "20,980"],
        ].map(([l, a, b]) => (
          <div key={l} className="contents">
            <span className="py-1 text-[10.5px] font-semibold uppercase tracking-[0.12em] text-ink-3">{l}</span>
            <span className={`tnum py-1 ${l === "Avg /m²" ? "font-semibold text-pine-deep" : "text-ink-2"}`}>{a}</span>
            <span className={`tnum py-1 ${l === "Avg /m²" ? "font-semibold text-gold" : "text-ink-2"}`}>{b}</span>
          </div>
        ))}
      </div>
    ),
  },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-paper">
      {/* NAV */}
      <header className="sticky top-0 z-50 border-b border-line bg-paper/92 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-md bg-pine text-cream">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                <path d="M4 21V9l6-5 6 5v12M16 21v-8l4-3v11M3 21h18" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
            <span className="leading-none">
              <span className="block font-display text-[18px] font-semibold tracking-[-0.02em]">PropertyIQ</span>
              <span className="mt-0.5 block text-[8.5px] font-semibold uppercase tracking-[0.22em] text-ink-3">Market Intelligence</span>
            </span>
          </Link>
          <nav className="hidden items-center gap-7 text-[13px] font-medium text-ink-2 md:flex">
            <a href="#how" className="transition-colors hover:text-ink">How it works</a>
            <a href="#features" className="transition-colors hover:text-ink">Capabilities</a>
            <a href="#ai" className="transition-colors hover:text-ink">Insights</a>
          </nav>
          <div className="flex items-center gap-2.5">
            <Link href="/login" className="hidden h-10 items-center rounded-md px-4 text-[13.5px] font-medium text-ink-2 transition-colors hover:bg-ink/5 hover:text-ink sm:flex">
              Sign in
            </Link>
            <Link href="/signup" className="inline-flex h-10 items-center gap-2 rounded-md bg-pine px-4 text-[13.5px] font-medium text-cream transition-colors hover:bg-pine-deep">
              Analyze your properties
            </Link>
          </div>
        </div>
      </header>

      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-5 pb-20 pt-14 lg:grid-cols-[1fr_1.1fr] lg:pt-20">
          <div className="anim-rise">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-line bg-cream px-3 py-1 text-[11px] font-medium text-ink-2">
              <span className="h-1.5 w-1.5 rounded-full bg-pine" /> Real-estate data intelligence — built for your spreadsheets
            </div>
            <h1 className="font-display text-[42px] leading-[1.04] tracking-[-0.03em] text-ink sm:text-[56px] lg:text-[60px]">
              Turn property data into <em className="not-italic text-pine">better decisions.</em>
            </h1>
            <p className="mt-5 max-w-lg text-[16px] leading-relaxed text-ink-2">
              Upload your property spreadsheet and instantly discover pricing trends, market opportunities, and property insights.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <CtaButton href="/signup">Analyze your properties</CtaButton>
              <a href="#how" className="inline-flex h-12 items-center gap-2 rounded-md border border-ink/20 px-6 text-[15px] font-medium text-ink transition-colors hover:border-ink hover:bg-ink/5">
                See how it works
              </a>
            </div>
            <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-[12.5px] text-ink-2">
              {["Excel · CSV · XLSX", "Arabic & English headers", "Your data stays in your workspace"].map((x) => (
                <li key={x} className="flex items-center gap-1.5">
                  <span className="text-pine">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                      <path d="M4 12.5l5 5L20 6.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                  {x}
                </li>
              ))}
            </ul>
          </div>
          <HeroPreview />
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how" className="border-y border-line bg-cream">
        <div className="mx-auto max-w-6xl px-5 py-20">
          <div className="mb-12 max-w-xl">
            <div className="mb-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-pine">How it works</div>
            <h2 className="font-display text-[32px] leading-tight tracking-[-0.02em] sm:text-[40px]">From spreadsheet to market intelligence in three steps</h2>
          </div>
          <div className="grid divide-y divide-line border-t border-line md:grid-cols-3 md:divide-x md:divide-y-0">
            {[
              ["01", "Upload your property data", "Drag in an Excel or CSV export. We auto-detect price, area, location, bedrooms and 15 other fields — even with Arabic column names."],
              ["02", "PropertyIQ analyzes the market", "Data is cleaned and normalized, price/m² is computed, and the engine benchmarks every listing against its district and property type."],
              ["03", "Explore prices, locations, opportunities", "Interactive dashboards, maps, comparisons and plain-language answers to your market questions — all from your own data."],
            ].map(([n, t, b], i) => (
              <div key={n} className="anim-rise py-8 pr-4 md:px-8 md:first:pl-0 md:last:pr-0" style={{ animationDelay: `${i * 100}ms` }}>
                <div className="font-display text-[44px] leading-none tracking-[-0.03em] text-pine">{n}</div>
                <h3 className="mt-4 font-display text-[19px] tracking-[-0.01em]">{t}</h3>
                <p className="mt-2.5 text-[13.5px] leading-relaxed text-ink-2">{b}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="mx-auto max-w-6xl px-5 py-20">
        <div className="mb-12 flex flex-wrap items-end justify-between gap-4">
          <div className="max-w-xl">
            <div className="mb-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-pine">Capabilities</div>
            <h2 className="font-display text-[32px] leading-tight tracking-[-0.02em] sm:text-[40px]">Everything a market analyst does — on your dataset</h2>
          </div>
          <p className="max-w-xs text-[13px] leading-relaxed text-ink-2">No estimates, no invented stats. If a number appears, your rows produced it.</p>
        </div>
        <div className="grid gap-px overflow-hidden rounded-lg border border-line bg-line lg:grid-cols-12">
          {FEATURES.map((f, i) => (
            <div key={f.tag} className={`anim-rise bg-card p-6 sm:p-7 ${f.span}`} style={{ animationDelay: `${i * 80}ms` }}>
              <div className="text-[10.5px] font-semibold uppercase tracking-[0.18em] text-pine">{f.tag}</div>
              <h3 className="mt-2 font-display text-[21px] leading-snug tracking-[-0.01em]">{f.title}</h3>
              <p className="mt-2 max-w-md text-[13.5px] leading-relaxed text-ink-2">{f.body}</p>
              {f.art}
            </div>
          ))}
        </div>
      </section>

      {/* AI INSIGHTS */}
      <section id="ai" className="border-y border-line bg-ink text-cream">
        <div className="mx-auto grid max-w-6xl gap-10 px-5 py-20 lg:grid-cols-2 lg:items-center">
          <div>
            <div className="mb-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-gold">AI market intelligence</div>
            <h2 className="font-display text-[32px] leading-tight tracking-[-0.02em] sm:text-[40px]">Ask your data questions in plain language</h2>
            <p className="mt-4 max-w-md text-[14.5px] leading-relaxed text-cream/70">
              The insight engine reads your uploaded dataset — and only your dataset — then answers with the calculation shown. No invented statistics, no generic market reports.
            </p>
            <div className="mt-7 grid grid-cols-1 gap-2 sm:grid-cols-2">
              {["What is the cheapest district?", "Which area has the lowest avg price/m²?", "Compare New Cairo with 6th of October", "Show properties below the district average"].map((q) => (
                <div key={q} className="rounded-md border border-cream/15 bg-cream/5 px-3.5 py-2.5 text-[12.5px] text-cream/85">
                  “{q}”
                </div>
              ))}
            </div>
          </div>
          <div className="anim-rise rounded-lg border border-cream/15 bg-[#2a251c] p-5 shadow-pop" style={{ animationDelay: "150ms" }}>
            <div className="flex items-start gap-3">
              <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-gold/20 text-gold">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                  <path d="M13 2L4.5 13.5H11L10 22l8.5-11.5H12L13 2z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
                </svg>
              </span>
              <div className="min-w-0">
                <div className="text-[12.5px] font-semibold">Which area has the lowest average price per square meter?</div>
                <p className="mt-2.5 text-[13px] leading-relaxed text-cream/80">
                  <span className="font-semibold text-cream">Sheikh Zayed</span> has the lowest average price/m² — <span className="tnum">EGP 16,540/m²</span> across 41 listings.
                </p>
                <div className="mt-3 space-y-1 rounded-md bg-ink/60 p-3 font-mono text-[11px] leading-relaxed text-cream/60">
                  <div>Σ price/m² of 41 listings ÷ 41 = 16,540</div>
                  <div>P10 = EGP 13,980/m² · median = EGP 15,720/m²</div>
                </div>
                <div className="mt-3 grid grid-cols-3 gap-2">
                  {[
                    ["Sheikh Z.", "16,540"],
                    ["6th of Oct.", "20,980"],
                    ["New Downtown", "24,310"],
                  ].map(([d, v]) => (
                    <div key={d} className="rounded-md border border-cream/10 bg-cream/5 p-2.5">
                      <div className="text-[9.5px] uppercase tracking-[0.12em] text-cream/50">{d}</div>
                      <div className="tnum mt-0.5 font-display text-[15px]">{v}</div>
                      <div className="text-[9px] text-cream/40">EGP/m²</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* DISCOVERY + CTA */}
      <section className="mx-auto max-w-6xl px-5 py-20">
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <div className="relative">
            <div className="overflow-hidden rounded-lg border border-line shadow-lift">
              <img src={INTERIOR} alt="Furnished apartment interior" className="aspect-[16/10] w-full object-cover" />
            </div>
            <div className="anim-pop absolute -bottom-5 left-4 w-[240px] rounded-lg border border-line bg-card p-3.5 shadow-lift" style={{ animationDelay: "300ms" }}>
              <div className="flex items-baseline justify-between">
                <span className="tnum font-display text-[18px]">EGP 3.1M</span>
                <span className="tnum text-[11px] font-medium text-pine">26,271/m²</span>
              </div>
              <div className="mt-1 truncate text-[12px] text-ink-2">Unit 3 — Al Rehamna, Sheikh Zayed</div>
              <div className="mt-1.5 flex items-center gap-2 text-[10.5px] text-ink-3">
                118 m² · 3 bd · 2 ba
                <span className="ml-auto rounded bg-pine-tint px-1.5 py-0.5 font-medium text-pine-deep">Below market</span>
              </div>
            </div>
          </div>
          <div>
            <div className="mb-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-pine">Property discovery</div>
            <h2 className="font-display text-[32px] leading-tight tracking-[-0.02em] sm:text-[40px]">Browse the listings behind the numbers</h2>
            <p className="mt-4 max-w-md text-[14.5px] leading-relaxed text-ink-2">
              Every insight links back to real properties. Search, filter, compare and bookmark the listings that matter — with financial context on every card: price, /m², area, bedrooms and location.
            </p>
            <ul className="mt-6 space-y-2.5 text-[13.5px] text-ink-2">
              {["Searchable directory with sorting by price, /m², area and age", "Side-by-side comparison with transparent best-value highlights", "Saved properties — bookmark deals to revisit later"].map((x) => (
                <li key={x} className="flex items-start gap-2.5">
                  <span className="mt-0.5 text-pine">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                      <path d="M4 12.5l5 5L20 6.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                  {x}
                </li>
              ))}
            </ul>
            <div className="mt-8">
              <CtaButton href="/signup">Analyze your properties</CtaButton>
            </div>
          </div>
        </div>
      </section>

      {/* CTA BAND */}
      <section className="border-t border-line bg-pine">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-6 px-5 py-16 md:flex-row md:items-center">
          <div>
            <h2 className="font-display text-[30px] leading-tight tracking-[-0.02em] text-cream sm:text-[38px]">Your market is already in a spreadsheet.</h2>
            <p className="mt-2 text-[14.5px] text-cream/70">Give it to PropertyIQ and see what it's been trying to tell you.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <CtaButton href="/signup" dark>
              Analyze your properties
            </CtaButton>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-line bg-cream">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-5 py-10 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-2.5">
            <span className="flex h-7 w-7 items-center justify-center rounded-md bg-pine text-cream">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                <path d="M4 21V9l6-5 6 5v12M16 21v-8l4-3v11M3 21h18" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
            <span className="font-display text-[15px] font-semibold tracking-[-0.01em]">PropertyIQ</span>
            <span className="ml-2 text-[11.5px] text-ink-3">Market intelligence for real-estate professionals</span>
          </div>
          <div className="flex items-center gap-5 text-[12.5px] text-ink-2">
            <Link href="/login" className="hover:text-ink">Sign in</Link>
            <Link href="/signup" className="hover:text-ink">Create account</Link>
            <a href="#how" className="hover:text-ink">How it works</a>
          </div>
        </div>
        <div className="border-t border-line-2">
          <div className="mx-auto flex max-w-6xl flex-col gap-1 px-5 py-4 text-[11px] text-ink-3 sm:flex-row sm:items-center sm:justify-between">
            <span>© {new Date().getFullYear()} PropertyIQ. All analytics are computed exclusively from data you upload.</span>
            <span>Signals and insights are data-based, not professional investment advice.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
