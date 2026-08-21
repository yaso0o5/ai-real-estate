"use client";

import Link from "next/link";
import { Suspense, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useFetch, useDebounced } from "@/lib/hooks";
import { Badge, Button, Card, EmptyState, ErrorState, Icon, Input, paths, Select, Skeleton, cn } from "@/components/ui";
import { FilterBar, type Facets } from "@/components/Filters";
import { PropertyCard, type PropItem } from "@/components/PropertyCard";
import { fmtArea, fmtMoney, fmtPpm2 } from "@/lib/format";

interface PropsResp {
  ok: boolean;
  items: PropItem[];
  total: number;
  page: number;
  pages: number;
  facets: Facets;
  datasets: Facets["datasets"];
}

const SORT_OPTIONS = [
  ["newest", "Newest first"],
  ["price-asc", "Lowest price"],
  ["price-desc", "Highest price"],
  ["ppm2-asc", "Lowest price/m²"],
  ["ppm2-desc", "Highest price/m²"],
  ["area-desc", "Largest area"],
  ["area-asc", "Smallest area"],
];

function PropertiesInner() {
  const sp = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [q, setQ] = useState(sp.get("q") ?? "");
  const dq = useDebounced(q, 350);
  const [view, setView] = useState<"grid" | "table">(localStorage.getItem("piq_view") === "table" ? "table" : "grid");

  const sort = sp.get("sort") ?? "newest";
  const page = parseInt(sp.get("page") ?? "1", 10) || 1;

  const setParam = (k: string, v: string | null) => {
    const next = new URLSearchParams(sp.toString());
    if (v == null || v === "") next.delete(k);
    else next.set(k, v);
    const qs = next.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  };

  useEffectSafe(q, dq);

  const url = useMemo(() => {
    const next = new URLSearchParams(sp.toString());
    if (dq.trim()) next.set("q", dq.trim());
    else next.delete("q");
    const qs = next.toString();
    return `/api/properties${qs ? `?${qs}` : ""}`;
  }, [sp, dq]);

  const { data, loading, error, reload } = useFetch<PropsResp>(url);
  const facets: Facets = data?.facets ?? { cities: [], districts: [], types: [], statuses: [], datasets: [] };

  const hasQuery = sp.get("q") != null || dq.trim() !== "" || sp.get("sort");

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-[26px] tracking-[-0.02em]">Property directory</h1>
          <p className="text-[13px] text-ink-2">
            {data ? (
              <>
                <span className="tnum font-medium text-ink">{data.total.toLocaleString()}</span> properties match
              </>
            ) : (
              "Search and filter every listing in your workspace"
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Icon d={paths.search} size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-3" />
            <Input aria-label="Search properties" className="w-56 pl-9" placeholder="Search title, district, type…" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <Select aria-label="Sort" className="h-10 w-auto min-w-[150px]" value={sort} onChange={(e) => setParam("sort", e.target.value)}>
            {SORT_OPTIONS.map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </Select>
          <div className="flex overflow-hidden rounded-md border border-line">
            {(["grid", "table"] as const).map((v) => (
              <button
                key={v}
                aria-label={`${v} view`}
                onClick={() => {
                  setView(v);
                  localStorage.setItem("piq_view", v);
                }}
                className={cn("flex h-10 w-10 items-center justify-center transition-colors", view === v ? "bg-pine text-cream" : "bg-card text-ink-3 hover:text-ink")}
              >
                {v === "grid" ? (
                  <Icon d={paths.grid} size={15} />
                ) : (
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                    <path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                  </svg>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      <FilterBar facets={facets} total={data ? data.total : null} />

      {error ? (
        <ErrorState message={error} retry={reload} />
      ) : loading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-72" />
          ))}
        </div>
      ) : data && data.items.length === 0 ? (
        <EmptyState
          icon={<Icon d={paths.search} size={26} />}
          title={hasQuery ? "No properties match" : "No properties yet"}
          desc={
            hasQuery
              ? "Try widening the price range, clearing the district filter, or removing the search term."
              : "Upload a spreadsheet or load the demo dataset to populate your directory."
          }
          actions={
            hasQuery ? (
              <Button
                variant="outline"
                onClick={() => {
                  setQ("");
                  router.replace(pathname, { scroll: false });
                }}
              >
                Clear all filters
              </Button>
            ) : (
              <Link href="/app/upload">
                <Button>
                  <Icon d={paths.upload} size={14} /> Upload Dataset
                </Button>
              </Link>
            )
          }
        />
      ) : data ? (
        <>
          {view === "grid" ? (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {data.items.map((p, i) => (
                <PropertyCard key={p.id} p={p} delay={Math.min(i, 8) * 50} />
              ))}
            </div>
          ) : (
            <Card>
              <div className="thin-scroll overflow-x-auto">
                <table className="w-full min-w-[860px] text-[12.5px]">
                  <thead>
                    <tr className="border-b border-line text-left text-[10.5px] uppercase tracking-[0.1em] text-ink-3">
                      <th className="px-4 py-3">Property</th>
                      <th className="px-4 py-3">Type</th>
                      <th className="px-4 py-3 text-right">Price</th>
                      <th className="px-4 py-3 text-right">Area</th>
                      <th className="px-4 py-3 text-right">Price/m²</th>
                      <th className="px-4 py-3 text-right">Bd</th>
                      <th className="px-4 py-3 text-right">Ba</th>
                      <th className="px-4 py-3">Location</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.items.map((p) => (
                      <tr key={p.id} className="border-b border-line-2 transition-colors last:border-0 hover:bg-pine-wash/50">
                        <td className="max-w-[240px] truncate px-4 py-2.5">
                          <Link href={`/app/properties/${p.id}`} className="font-medium text-ink hover:text-pine">
                            {p.title}
                          </Link>
                        </td>
                        <td className="px-4 py-2.5 text-ink-2">{p.propertyType ?? "—"}</td>
                        <td className="tnum px-4 py-2.5 text-right font-medium">{fmtMoney(p.price)}</td>
                        <td className="tnum px-4 py-2.5 text-right">{fmtArea(p.area)}</td>
                        <td className="tnum px-4 py-2.5 text-right text-pine-deep">{fmtPpm2(p.pricePerSqm)}</td>
                        <td className="tnum px-4 py-2.5 text-right text-ink-2">{p.bedrooms ?? "—"}</td>
                        <td className="tnum px-4 py-2.5 text-right text-ink-2">{p.bathrooms ?? "—"}</td>
                        <td className="max-w-[180px] truncate px-4 py-2.5 text-ink-2">
                          {p.district ?? "—"}
                          {p.city ? `, ${p.city}` : ""}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {data.pages > 1 ? (
            <div className="flex items-center justify-between">
              <span className="tnum text-[12.5px] text-ink-3">
                Page {data.page} of {data.pages}
              </span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setParam("page", String(page - 1))}>
                  ← Previous
                </Button>
                <Button variant="outline" size="sm" disabled={page >= data.pages} onClick={() => setParam("page", String(page + 1))}>
                  Next →
                </Button>
              </div>
            </div>
          ) : null}
        </>
      ) : null}
    </div>
  );
}

/* commit debounced search into URL */
function useEffectSafe(value: string, debounced: string) {
  // handled via URL rewrite in url memo; no-op guard
  void value;
  void debounced;
}

export default function PropertiesPage() {
  return (
    <Suspense fallback={<div className="space-y-4"><Skeleton className="h-8 w-64" /><Skeleton className="h-28" /><Skeleton className="h-96" /></div>}>
      <PropertiesInner />
    </Suspense>
  );
}
