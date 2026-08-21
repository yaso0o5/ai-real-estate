"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useMemo, useState } from "react";
import { useFetch } from "@/lib/hooks";
import { Badge, Button, Card, EmptyState, ErrorState, Icon, paths, Skeleton, Stat, Skyline } from "@/components/ui";
import { FilterBar, type Facets } from "@/components/Filters";
import { ChartCard, DistrictBars, HistChart, TypeDonut } from "@/components/charts";
import { fmtMoney, fmtMoneyFull, fmtPpm2 } from "@/lib/format";
import type { StatsResult } from "@/lib/stats";

function DashboardInner() {
  const sp = useSearchParams();
  const url = useMemo(() => {
    const params = [...sp.entries()].filter(([k]) => !["page"].includes(k));
    const qs = new URLSearchParams(params).toString();
    return `/api/stats${qs ? `?${qs}` : ""}`;
  }, [sp]);
  const { data, loading, error, reload } = useFetch<{ ok: boolean; stats: StatsResult }>(url);
  const stats = data?.stats ?? null;
  const [sortKey, setSortKey] = useState<string>("count");
  const [sortDir, setSortDir] = useState<1 | -1>(-1);

  const facets: Facets = stats?.facet ?? { cities: [], districts: [], types: [], statuses: [], datasets: [] };
  const hasData = stats != null && stats.total > 0;

  const sortedDistricts = useMemo(() => {
    if (!stats) return [];
    const rows = stats.byDistrict;
    return [...rows].sort((a, b) => {
      const get = (d: (typeof rows)[0]) => (sortKey === "count" ? d.count : sortKey === "avgPrice" ? d.avgPrice ?? -1 : sortKey === "median" ? d.medianPrice ?? -1 : sortKey === "ppm2" ? d.avgPpm2 ?? -1 : sortKey === "min" ? d.minPrice ?? -1 : d.maxPrice ?? -1);
      return (get(a) - get(b)) * sortDir;
    });
  }, [stats, sortKey, sortDir]);

  const toggleSort = (k: string) => {
    if (k === sortKey) setSortDir((d) => (d === 1 ? -1 : 1));
    else {
      setSortKey(k);
      setSortDir(-1);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="mb-1 flex items-center gap-2.5">
            <h1 className="font-display text-[26px] tracking-[-0.02em]">Market overview</h1>
            {facets.datasets.some((d) => d.name.startsWith("Demo")) ? <Badge tone="gold">Demo Dataset — Fictional Data</Badge> : null}
          </div>
          <p className="text-[13px] text-ink-2">Pricing trends, distribution and district benchmarks for your workspace.</p>
        </div>
        <div className="flex gap-2.5">
          <Link href="/app/upload">
            <Button variant="outline">
              <Icon d={paths.upload} size={14} /> Upload
            </Button>
          </Link>
          <Link href="/app/analytics">
            <Button>
              Full analytics <Icon d={paths.arrowUpRight} size={14} />
            </Button>
          </Link>
        </div>
      </div>

      {error ? (
        <ErrorState message={error} retry={reload} />
      ) : !hasData ? (
        loading ? (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={<Skyline className="h-12 w-32" />}
            title="No property data yet"
            desc="Upload an Excel or CSV file to start analyzing your market — or load the demo dataset to explore the platform with fictional Greater Cairo data."
            actions={
              <>
                <Link href="/app/upload">
                  <Button size="lg">
                    <Icon d={paths.upload} size={15} /> Upload Dataset
                  </Button>
                </Link>
                <Link href="/app/upload">
                  <Button variant="outline" size="lg">
                    <Icon d={paths.spark} size={14} /> Load demo data
                  </Button>
                </Link>
              </>
            }
          />
        )
      ) : (
        <>
          <FilterBar facets={facets} total={stats.total} />

          {loading ? (
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-24" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
              <Stat label="Total properties" value={stats.metrics.total} format={(v) => Math.round(v).toLocaleString()} />
              <Stat label="Average price" value={stats.metrics.avgPrice} format={fmtMoney} sub={fmtMoneyFull(stats.metrics.avgPrice)} delay={40} />
              <Stat label="Median price" value={stats.metrics.medianPrice} format={fmtMoney} sub="Middle of sorted prices" delay={80} />
              <Stat label="Avg price /m²" value={stats.metrics.avgPpm2} format={fmtPpm2} sub={`Median ${fmtPpm2(stats.metrics.medianPpm2)}`} delay={120} />
              <Stat label="Lowest price" value={stats.metrics.minPrice} format={fmtMoney} sub={fmtMoneyFull(stats.metrics.minPrice)} delay={160} />
              <Stat label="Highest price" value={stats.metrics.maxPrice} format={fmtMoney} sub={fmtMoneyFull(stats.metrics.maxPrice)} delay={200} />
            </div>
          )}

          {/* Market overview charts */}
          <div className="grid gap-4 lg:grid-cols-3">
            <ChartCard title="Property distribution" sub="Listings by property type" h={260}>
              {stats.byType.length ? (
                <TypeDonut data={stats.byType} />
              ) : (
                <div className="flex h-full items-center justify-center text-[12.5px] text-ink-3">No type data in selection</div>
              )}
            </ChartCard>
            <ChartCard title="Price distribution" sub="How listings spread across price ranges" h={260}>
              {stats.histogram.length ? <HistChart data={stats.histogram} fmt={fmtMoneyFull} /> : <div className="flex h-full items-center justify-center text-[12.5px] text-ink-3">Not enough price data</div>}
            </ChartCard>
            <ChartCard title="Average price /m² by district" sub="EGP per square meter" h={260}>
              {stats.byDistrict.length ? (
                <DistrictBars data={stats.byDistrict.slice(0, 7).map((d) => ({ district: d.district.length > 12 ? d.district.slice(0, 11) + "…" : d.district, ppm2: d.avgPpm2 ?? 0 }))} dataKey="ppm2" name="Avg /m²" fmt={fmtPpm2} color="#a07a3f" />
              ) : (
                <div className="flex h-full items-center justify-center text-[12.5px] text-ink-3">No district data</div>
              )}
            </ChartCard>
          </div>

          {/* Area analytics table */}
          <Card>
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-5 py-4">
              <div>
                <h3 className="font-display text-[16.5px] tracking-[-0.01em]">Area analytics</h3>
                <p className="mt-0.5 text-[12px] text-ink-3">Compare districts — click a column to sort</p>
              </div>
              <Link href="/app/analytics" className="flex items-center gap-1 text-[12.5px] font-medium text-pine hover:text-pine-deep">
                Advanced analytics <Icon d={paths.arrow} size={12} />
              </Link>
            </div>
            <div className="thin-scroll overflow-x-auto">
              <table className="w-full min-w-[760px] text-[12.5px]">
                <thead>
                  <tr className="border-b border-line text-left text-[10.5px] uppercase tracking-[0.1em] text-ink-3">
                    {(
                      [
                        ["district", "District"],
                        ["count", "Properties"],
                        ["avgPrice", "Avg price"],
                        ["median", "Median"],
                        ["ppm2", "Avg /m²"],
                        ["min", "Cheapest"],
                        ["max", "Most expensive"],
                      ] as const
                    ).map(([k, label]) => (
                      <th key={k} className="px-4 py-2.5">
                        <button onClick={() => toggleSort(k)} className={`flex items-center gap-1 uppercase tracking-[0.1em] transition-colors hover:text-ink ${sortKey === k ? "text-pine" : ""}`}>
                          {label}
                          {sortKey === k ? <span className="text-[9px]">{sortDir === -1 ? "▼" : "▲"}</span> : null}
                        </button>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sortedDistricts.map((d) => (
                    <tr key={d.district} className="border-b border-line-2 transition-colors last:border-0 hover:bg-pine-wash/60">
                      <td className="px-4 py-3 font-medium text-ink">
                        {d.district}
                        <span className="ml-1.5 text-[10.5px] text-ink-3">{d.city ?? ""}</span>
                      </td>
                      <td className="tnum px-4 py-3">{d.count}</td>
                      <td className="tnum px-4 py-3">{fmtMoney(d.avgPrice)}</td>
                      <td className="tnum px-4 py-3 text-ink-2">{fmtMoney(d.medianPrice)}</td>
                      <td className="tnum px-4 py-3 font-medium text-pine-deep">{fmtPpm2(d.avgPpm2)}</td>
                      <td className="tnum px-4 py-3 text-ink-2">{fmtMoney(d.minPrice)}</td>
                      <td className="tnum px-4 py-3 text-ink-2">{fmtMoney(d.maxPrice)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Opportunities preview */}
          {stats.opportunities.length > 0 ? (
            <Card>
              <div className="flex items-center justify-between border-b border-line px-5 py-4">
                <div>
                  <h3 className="font-display text-[16.5px] tracking-[-0.01em]">Market opportunities</h3>
                  <p className="mt-0.5 text-[12px] text-ink-3">Data-based signals from your current selection — not investment advice</p>
                </div>
                <Link href="/app/signals" className="flex items-center gap-1 text-[12.5px] font-medium text-pine hover:text-pine-deep">
                  All signals <Icon d={paths.arrow} size={12} />
                </Link>
              </div>
              <div className="grid gap-px bg-line sm:grid-cols-3">
                {stats.opportunities.slice(0, 3).map((o) => (
                  <Link key={o.id + o.kind} href={`/app/properties/${o.id}`} className="group bg-card p-4 transition-colors hover:bg-pine-wash/50">
                    <div className="flex items-center justify-between">
                      <Badge tone={o.kind === "high-ppm2" ? "gold" : "pine"}>{o.kind === "below-market" ? "Below market" : o.kind === "low-ppm2" ? "Low /m²" : "Premium"}</Badge>
                      <span className="tnum font-display text-[17px]">{fmtMoney(o.price)}</span>
                    </div>
                    <p className="mt-2 line-clamp-2 text-[12.5px] font-medium text-ink">{o.title}</p>
                    <p className="mt-1 line-clamp-2 text-[11.5px] leading-relaxed text-ink-2">{o.detail}</p>
                  </Link>
                ))}
              </div>
            </Card>
          ) : null}
        </>
      )}
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<div className="space-y-4"><Skeleton className="h-8 w-64" /><Skeleton className="h-28" /><Skeleton className="h-64" /></div>}>
      <DashboardInner />
    </Suspense>
  );
}
