"use client";

import Link from "next/link";
import { useState } from "react";
import { Badge, Button, cn, Icon, paths } from "@/components/ui";
import { fmtArea, fmtMoney, fmtPpm2 } from "@/lib/format";
import { useCompare } from "@/components/CompareContext";

export interface PropItem {
  id: string;
  title: string;
  price: number | null;
  area: number | null;
  pricePerSqm: number | null;
  propertyType: string | null;
  city: string | null;
  district: string | null;
  bedrooms: number | null;
  bathrooms: number | null;
  furnished: boolean | null;
  status: string | null;
  image?: string | null;
  saved?: boolean;
}

function TypeArt({ type }: { type: string | null }) {
  const t = (type ?? "Other").toLowerCase();
  return (
    <div className="relative h-full w-full bg-pine-wash" aria-hidden>
      <svg viewBox="0 0 320 200" className="h-full w-full" preserveAspectRatio="xMidYMax slice">
        {t.includes("villa") || t.includes("penthouse") ? (
          <>
            <rect x="40" y="90" width="240" height="110" fill="#e0dac9" />
            <path d="M30 95L160 30l130 65" fill="none" stroke="#8b8272" strokeWidth="5" strokeLinecap="round" />
            <rect x="140" y="130" width="40" height="70" fill="#b5ad9c" />
            <rect x="65" y="115" width="34" height="34" fill="#faf8f2" stroke="#8b8272" strokeWidth="2" />
            <rect x="221" y="115" width="34" height="34" fill="#faf8f2" stroke="#8b8272" strokeWidth="2" />
          </>
        ) : t.includes("land") ? (
          <>
            <path d="M0 160 Q80 120 160 150 T320 140 V200 H0 Z" fill="#dfe3d3" />
            <path d="M0 175 Q100 145 200 170 T320 165" fill="none" stroke="#7d9b8a" strokeWidth="2.5" />
            <circle cx="250" cy="70" r="22" fill="#e6d9b8" />
          </>
        ) : t.includes("office") || t.includes("commercial") ? (
          <>
            <rect x="70" y="40" width="180" height="160" fill="#e0dac9" />
            {[0, 1, 2, 3].map((r) =>
              [0, 1, 2].map((c) => <rect key={`${r}${c}`} x={92 + c * 50} y={58 + r * 38} width="30" height="22" fill="#faf8f2" stroke="#8b8272" strokeWidth="1.5" />)
            )}
          </>
        ) : (
          <>
            <rect x="60" y="30" width="200" height="170" fill="#e0dac9" />
            {[0, 1, 2].map((r) =>
              [0, 1].map((c) => <rect key={`${r}${c}`} x={85 + c * 85} y={48 + r * 52} width="56" height="32" fill="#faf8f2" stroke="#8b8272" strokeWidth="2" />)
            )}
          </>
        )}
      </svg>
      <span className="absolute bottom-2 left-2 rounded bg-cream/90 px-1.5 py-0.5 text-[9.5px] font-semibold uppercase tracking-[0.14em] text-ink-3">
        {type ?? "Property"}
      </span>
    </div>
  );
}

export function PropertyCard({ p, compact, delay = 0, onSaved }: { p: PropItem; compact?: boolean; delay?: number; onSaved?: (saved: boolean) => void }) {
  const { has, toggle } = useCompare();
  const [saving, setSaving] = useState(false);
  const selected = has(p.id);

  const save = async () => {
    setSaving(true);
    const res = await fetch("/api/saved", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ propertyId: p.id }),
    });
    const json = await res.json();
    setSaving(false);
    if (json.ok) onSaved?.(json.saved);
  };

  return (
    <Link
      href={`/app/properties/${p.id}`}
      className="anim-rise group block"
      style={{ animationDelay: `${delay}ms` }}
    >
      <article
        className={cn(
          "overflow-hidden rounded-lg border border-line bg-card shadow-card transition-all duration-300",
          "group-hover:-translate-y-1 group-hover:shadow-lift group-hover:border-ink/20"
        )}
      >
        <div className={cn("relative overflow-hidden", compact ? "h-32" : "h-44 sm:h-48")}>
          {p.image ? (
            <img src={p.image} alt={p.title} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]" loading="lazy" />
          ) : (
            <TypeArt type={p.propertyType} />
          )}
          <div className="absolute left-2.5 top-2.5 flex gap-1.5">
            {p.propertyType ? <Badge tone="outline" className="border-0 bg-cream/95 text-ink shadow-card">{p.propertyType}</Badge> : null}
            {p.status && p.status !== "For Sale" ? <Badge tone="gold" className="shadow-card">{p.status}</Badge> : null}
          </div>
          <button
            aria-label={p.saved ? "Remove from saved" : "Save property"}
            onClick={(e) => {
              e.preventDefault();
              save();
            }}
            disabled={saving}
            className={cn(
              "absolute right-2.5 top-2.5 flex h-8 w-8 items-center justify-center rounded-md backdrop-blur transition-all",
              p.saved ? "bg-pine text-cream" : "bg-cream/90 text-ink hover:bg-cream"
            )}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill={p.saved ? "currentColor" : "none"}>
              <path d={paths.bookmark} stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
            </svg>
          </button>
        </div>

        <div className={cn("p-4", compact && "p-3.5")}>
          <div className="flex items-baseline justify-between gap-3">
            <div className="font-display text-[21px] leading-none tracking-[-0.02em]">
              {p.price != null ? fmtMoney(p.price) : <span className="text-ink-3 text-[15px]">Price n/a</span>}
            </div>
            {p.pricePerSqm != null ? <span className="tnum text-[12px] font-medium text-pine">{fmtPpm2(p.pricePerSqm)}</span> : null}
          </div>
          <h3 className={cn("mt-2 truncate text-[13px] font-medium text-ink-2", compact ? "line-clamp-1" : "line-clamp-1")}>{p.title}</h3>
          <div className="mt-0.5 truncate text-[12px] text-ink-3">
            {p.district ?? "Location not specified"}
            {p.city ? ` · ${p.city}` : ""}
          </div>

          <div className="mt-3 flex items-center justify-between border-t border-line-2 pt-3">
            <div className="flex items-center gap-3 text-[11.5px] text-ink-2">
              <span className="tnum">{fmtArea(p.area)}</span>
              {p.bedrooms != null ? <span>{p.bedrooms === 0 ? "Studio" : `${p.bedrooms} bd`}</span> : null}
              {p.bathrooms != null ? <span>{p.bathrooms} ba</span> : null}
              {p.furnished ? <span className="text-pine">Furnished</span> : null}
            </div>
            <button
              aria-label={selected ? "Remove from comparison" : "Add to comparison"}
              onClick={(e) => {
                e.preventDefault();
                toggle(p.id);
              }}
              className={cn(
                "flex h-7 items-center gap-1.5 rounded-md border px-2 text-[11px] font-medium transition-all",
                selected ? "border-pine bg-pine text-cream" : "border-line text-ink-2 hover:border-ink/40 hover:text-ink"
              )}
            >
              {selected ? <Icon d={paths.check} size={11} /> : <Icon d={paths.compare} size={11} />}
              {selected ? "Added" : "Compare"}
            </button>
          </div>
        </div>
      </article>
    </Link>
  );
}
