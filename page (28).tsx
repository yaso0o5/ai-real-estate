"use client";

import Link from "next/link";
import { Suspense, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { useFetch } from "@/lib/hooks";
import { Badge, Card, EmptyState, ErrorState, Icon, paths, Skeleton } from "@/components/ui";
import { FilterBar, type Facets } from "@/components/Filters";
import { fmtMoney, fmtPpm2 } from "@/lib/format";
import type { StatsResult } from "@/lib/stats";

const OPP_LABEL: Record<string, { label: string; tone: "pine" | "gold" | "rust" }> = {
  "below-market": { label: "Below market average", tone: "pine" },
  "low-ppm2": { label: "Low price / m²", tone: "pine" },
  "high-ppm2": { label: "High price / m²", tone: "gold" },
};

const OUT_LABEL: Record<string, { label: string; tone: "rust" | "gold" }> = {
  "extreme-price": { label: "Extreme price", tone: "gold" },
  "extreme-ppm2": { label: "Unusual price/m²", tone: "rust" },
  "unusual-ppm2": { label: "Unusually low price/m²", tone: "gold" },
  "extreme-area": { label: "Unusual area", tone: "gold" },
};

function SignalsInner() {
  const sp = useSearchParams();
  const url = useMemo(() => {
    const qs = new URLSearchParams([...sp.entries()]).toString();
    return `/api/stats${qs ? `?${qs}` : ""}`;
  }, [sp]);
  const { data, loading, error, reload } = useFetch<{ ok: boolean; stats: StatsResult }>(url);
  const stats = data?.stats ?? null;
  const facets: Facets = stats?.facet ?? { cities: [], districts: [], types: [], statuses: [], datasets: [] };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-[26px] tracking-[-0.02em]">Signals</h1>
        <p className="text-[13px] text-ink-2">Market opportunities and outliers, detected statistically from your listings.</p>
      </div>

      <div className="flex items-start gap-3 rounded-lg border border-gold/30 bg-amberx-tint/60 px-4 py-3">
        <Icon d={paths.spark} size={15} className="mt-0.5 shrink-0 text-gold" />
        <p className="text-[12.5px] leading-relaxed text-ink-2">
          <b className="text-ink">These are data-based signals, not professional investment advice.</b> Each one cites the benchmark it's measured against — open a property to see the full district context.
        </p>
      </div>

      {error ? (
        <ErrorState message={error} retry={reload} />
      ) : (
        <>
          <FilterBar facets={facets} total={stats?.total ?? null} />
          {loading || !stats ? (
            <div className="space-y-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-28" />
              ))}
            </div>
          ) : (
            <div className="space-y-6">
              <section>
                <div className="mb-3 flex items-center gap-2.5">
                  <h2 className="font-display text-[19px] tracking-[-0.01em]">Market opportunities</h2>
                  <Badge tone="pine">{stats.opportunities.length}</Badge>
                </div>
                {stats.opportunities.length ? (
                  <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                    {stats.opportunities.map((o, i) => {
                      const meta = OPP_LABEL[o.kind] ?? { label: o.kind, tone: "pine" as const };
                      return (
                        <Link key={o.id + o.kind} href={`/app/properties/${o.id}`} className="anim-rise group" style={{ animationDelay: `${i * 40}ms` }}>
                          <Card hover className="h-full p-4">
                            <div className="flex items-center justify-between gap-2">
                              <Badge tone={meta.tone}>{meta.label}</Badge>
                              <span className="tnum font-display text-[18px] tracking-[-0.02em]">{fmtMoney(o.price)}</span>
                            </div>
                            <h3 className="mt-2.5 line-clamp-1 text-[13px] font-semibold text-ink group-hover:text-pine">{o.title}</h3>
                            <p className="mt-1.5 line-clamp-3 text-[12px] leading-relaxed text-ink-2">{o.detail}</p>
                            <div className="mt-3 flex items-center justify-between border-t border-line-2 pt-2.5 text-[11px] text-ink-3">
                              <span>{o.district}</span>
                              {o.pricePerSqm != null ? <span className="tnum text-pine-deep">{fmtPpm2(o.pricePerSqm)}</span> : null}
                            </div>
                          </Card>
                        </Link>
                      );
                    })}
                  </div>
                ) : (
                  <EmptyState compact title="No opportunity signals" desc="No listing in the current selection deviates below-market by 15%+ or into the bottom 10% of district price/m². Tighten or widen filters to explore." />
                )}
              </section>

              <section>
                <div className="mb-3 flex items-center gap-2.5">
                  <h2 className="font-display text-[19px] tracking-[-0.01em]">Outliers</h2>
                  <Badge tone="rust">{stats.outliers.length}</Badge>
                </div>
                {stats.outliers.length ? (
                  <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                    {stats.outliers.map((o, i) => {
                      const meta = OUT_LABEL[o.kind] ?? { label: o.kind, tone: "gold" as const };
                      return (
                        <Link key={o.id + o.kind} href={`/app/properties/${o.id}`} className="anim-rise group" style={{ animationDelay: `${i * 40}ms` }}>
                          <Card hover className="h-full p-4">
                            <div className="flex items-center justify-between gap-2">
                              <Badge tone={meta.tone}>{meta.label}</Badge>
                              <span className="tnum font-display text-[18px] tracking-[-0.02em]">{fmtMoney(o.price)}</span>
                            </div>
                            <h3 className="mt-2.5 line-clamp-1 text-[13px] font-semibold text-ink group-hover:text-pine">{o.title}</h3>
                            <p className="mt-1.5 line-clamp-3 text-[12px] leading-relaxed text-ink-2">{o.detail}</p>
                            <div className="mt-3 flex items-center justify-between border-t border-line-2 pt-2.5 text-[11px] text-ink-3">
                              <span>{o.district}</span>
                              {o.pricePerSqm != null ? <span className="tnum">{fmtPpm2(o.pricePerSqm)}</span> : null}
                            </div>
                          </Card>
                        </Link>
                      );
                    })}
                  </div>
                ) : (
                  <EmptyState compact title="No outliers detected" desc="No listing deviates more than 2× from its district's price/m² median, or beyond the 2nd/98th area percentile. A quiet, consistent market." />
                )}
              </section>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default function SignalsPage() {
  return (
    <Suspense fallback={<div className="space-y-4"><Skeleton className="h-8 w-64" /><Skeleton className="h-28" /><Skeleton className="h-96" /></div>}>
      <SignalsInner />
    </Suspense>
  );
}
