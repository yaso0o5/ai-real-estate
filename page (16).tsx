"use client";

import { Suspense, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { useFetch } from "@/lib/hooks";
import { ErrorState, Skeleton } from "@/components/ui";
import { FilterBar, type Facets } from "@/components/Filters";
import { BedChart, ChartCard, DistrictBars, HistChart, LineSeries, ScatterAP, TrendChart, TypeDonut } from "@/components/charts";
import { fmtMoney, fmtMoneyFull, fmtPpm2 } from "@/lib/format";
import type { StatsResult } from "@/lib/stats";

function AnalyticsInner() {
  const sp = useSearchParams();
  const url = useMemo(() => {
    const qs = new URLSearchParams([...sp.entries()]).toString();
    return `/api/stats${qs ? `?${qs}` : ""}`;
  }, [sp]);
  const { data, loading, error, reload } = useFetch<{ ok: boolean; stats: StatsResult }>(url);
  const stats = data?.stats ?? null;
  const facets: Facets = stats?.facet ?? { cities: [], districts: [], types: [], statuses: [], datasets: [] };
  const short = (s: string) => (s.length > 12 ? s.slice(0, 11) + "…" : s);
  const districts = stats?.byDistrict ?? [];

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-[26px] tracking-[-0.02em]">Advanced analytics</h1>
        <p className="text-[13px] text-ink-2">Eight lenses on your market — every chart reacts to the filters above.</p>
      </div>

      <FilterBar facets={facets} total={stats?.total ?? null} />

      {error ? (
        <ErrorState message={error} retry={reload} />
      ) : loading || !stats ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-72" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          <ChartCard title="Average price by district" sub="Mean listing price per district (EGP)" h={300}>
            {districts.length ? (
              <DistrictBars data={districts.slice(0, 8).map((d) => ({ district: short(d.district), price: d.avgPrice ?? 0 }))} dataKey="price" name="Avg price" fmt={fmtMoneyFull} />
            ) : (
              <div className="flex h-full items-center justify-center text-[12.5px] text-ink-3">No district data in selection</div>
            )}
          </ChartCard>
          <ChartCard title="Price / m² by district" sub="Mean price per square meter (EGP/m²)" h={300}>
            {districts.length ? (
              <DistrictBars data={districts.slice(0, 8).map((d) => ({ district: short(d.district), ppm2: d.avgPpm2 ?? 0 }))} dataKey="ppm2" name="Avg /m²" fmt={fmtPpm2} color="#a07a3f" />
            ) : (
              <div className="flex h-full items-center justify-center text-[12.5px] text-ink-3">No /m² data in selection</div>
            )}
          </ChartCard>
          <ChartCard title="Price trend over time" sub="Average listing price (line) and volume (bars) by listing month" h={300}>
            {stats.byMonth.length >= 2 ? (
              <TrendChart data={stats.byMonth} fmt={fmtMoneyFull} />
            ) : (
              <div className="flex h-full items-center justify-center text-[12.5px] text-ink-3">Need at least two months of listing dates</div>
            )}
          </ChartCard>
          <ChartCard title="Listing volume & price/m² trend" sub="Average price per m² by listing month" h={300}>
            {stats.byMonth.length >= 2 ? (
              <LineSeries data={stats.byMonth.map((m) => ({ month: m.month, ppm2: m.avgPpm2 }))} dataKey="ppm2" name="Avg /m²" fmt={fmtPpm2} />
            ) : (
              <div className="flex h-full items-center justify-center text-[12.5px] text-ink-3">Not enough dated listings</div>
            )}
          </ChartCard>
          <ChartCard title="Property type distribution" sub={`${stats.total} listings by type`} h={300}>
            {stats.byType.length ? <TypeDonut data={stats.byType} /> : <div className="flex h-full items-center justify-center text-[12.5px] text-ink-3">No type data</div>}
          </ChartCard>
          <ChartCard title="Area vs price" sub="Each dot is a listing, colored by property type" h={300}>
            {stats.scatter.length ? <ScatterAP data={stats.scatter} /> : <div className="flex h-full items-center justify-center text-[12.5px] text-ink-3">No area/price pairs in selection</div>}
          </ChartCard>
          <ChartCard title="Bedroom count vs average price" sub="Mean price by bedroom count" h={300}>
            {stats.byBedrooms.length ? <BedChart data={stats.byBedrooms} fmt={fmtMoneyFull} /> : <div className="flex h-full items-center justify-center text-[12.5px] text-ink-3">No bedroom data</div>}
          </ChartCard>
          <ChartCard title="Price distribution" sub="Histogram of listing prices" h={300}>
            {stats.histogram.length ? <HistChart data={stats.histogram} fmt={fmtMoneyFull} /> : <div className="flex h-full items-center justify-center text-[12.5px] text-ink-3">Not enough price data</div>}
          </ChartCard>
        </div>
      )}
    </div>
  );
}

export default function AnalyticsPage() {
  return (
    <Suspense fallback={<div className="space-y-4"><Skeleton className="h-8 w-64" /><Skeleton className="h-28" /><Skeleton className="h-96" /></div>}>
      <AnalyticsInner />
    </Suspense>
  );
}
