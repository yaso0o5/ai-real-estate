"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Button, cn, Icon, paths, Select, Input } from "@/components/ui";
import { useDebounced } from "@/lib/hooks";

export interface Facets {
  cities: string[];
  districts: string[];
  types: string[];
  statuses: string[];
  datasets: { id: string; name: string; count: number }[];
}

const FILTER_KEYS = ["ds", "city", "district", "type", "pmin", "pmax", "amin", "amax", "beds", "baths", "furn", "status", "from", "to"];

export function filterToParams(f: Record<string, string | undefined | null>): URLSearchParams {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(f)) if (v != null && v !== "") sp.set(k, v);
  return sp;
}

export function useFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();

  const get = (k: string) => sp.get(k) ?? "";

  const set = (patch: Record<string, string | null>) => {
    const next = new URLSearchParams(sp.toString());
    for (const [k, v] of Object.entries(patch)) {
      if (v == null || v === "") next.delete(k);
      else next.set(k, v);
    }
    const q = next.toString();
    router.replace(q ? `${pathname}?${q}` : pathname, { scroll: false });
  };

  const clear = () => {
    const next = new URLSearchParams(sp.toString());
    FILTER_KEYS.forEach((k) => next.delete(k));
    const q = next.toString();
    router.replace(q ? `${pathname}?${q}` : pathname, { scroll: false });
  };

  const activeCount = FILTER_KEYS.filter((k) => sp.get(k)).length;
  return { get, set, clear, activeCount, pathname, sp };
}

export function FilterBar({ facets, total }: { facets: Facets; total?: number | null }) {
  const { get, set, clear, activeCount, sp } = useFilters();
  const [refine, setRefine] = useState(activeCount > 4);
  const [pmin, setPmin] = useState(get("pmin"));
  const [pmax, setPmax] = useState(get("pmax"));
  const [amin, setAmin] = useState(get("amin"));
  const [amax, setAmax] = useState(get("amax"));
  const dpmin = useDebounced(pmin, 500);
  const dpmax = useDebounced(pmax, 500);
  const damn = useDebounced(amin, 500);
  const damax = useDebounced(amax, 500);

  const synced = useMemo(() => [dpmin, dpmax, damn, damax].join("|"), [dpmin, dpmax, damn, damax]);
  const curSynced = useMemo(() => [get("pmin") ?? "", get("pmax") ?? "", get("amin") ?? "", get("amax") ?? ""].join("|"), [sp]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (synced !== curSynced) set({ pmin: dpmin || null, pmax: dpmax || null, amin: damn || null, amax: damax || null });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [synced, curSynced]);

  const sel = (key: string, value: string) => set({ [key]: value || null });

  return (
    <div className="rounded-lg border border-line bg-card shadow-card">
      <div className="flex flex-wrap items-center gap-2 border-b border-line-2 px-4 py-3">
        <span className="mr-1 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-3">
          <Icon d={paths.filter} size={12} /> Filters
        </span>
        <Select aria-label="Dataset" className="h-9 w-auto min-w-[130px] text-[12.5px]" value={get("ds")} onChange={(e) => sel("ds", e.target.value)}>
          <option value="">All datasets</option>
          {facets.datasets.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name} ({d.count})
            </option>
          ))}
        </Select>
        <Select aria-label="City" className="h-9 w-auto min-w-[110px] text-[12.5px]" value={get("city")} onChange={(e) => sel("city", e.target.value)}>
          <option value="">City</option>
          {facets.cities.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </Select>
        <Select aria-label="District" className="h-9 w-auto min-w-[130px] text-[12.5px]" value={get("district")} onChange={(e) => sel("district", e.target.value)}>
          <option value="">District</option>
          {facets.districts.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </Select>
        <Select aria-label="Type" className="h-9 w-auto min-w-[110px] text-[12.5px]" value={get("type")} onChange={(e) => sel("type", e.target.value)}>
          <option value="">Type</option>
          {facets.types.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </Select>
        <Select aria-label="Status" className="h-9 w-auto min-w-[100px] text-[12.5px]" value={get("status")} onChange={(e) => sel("status", e.target.value)}>
          <option value="">Status</option>
          {facets.statuses.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </Select>
        <Select aria-label="Furnished" className="h-9 w-auto min-w-[100px] text-[12.5px]" value={get("furn")} onChange={(e) => sel("furn", e.target.value)}>
          <option value="">Furnished</option>
          <option value="yes">Furnished</option>
          <option value="no">Not furnished</option>
        </Select>
        <div className="ml-auto flex items-center gap-2">
          {typeof total === "number" ? (
            <span className="tnum hidden text-[12px] text-ink-3 sm:block">
              {total.toLocaleString()} propert{total === 1 ? "y" : "ies"}
            </span>
          ) : null}
          {activeCount > 0 ? (
            <Button variant="ghost" size="sm" onClick={clear}>
              Clear ({activeCount})
            </Button>
          ) : null}
          <Button variant="outline" size="sm" onClick={() => setRefine((v) => !v)}>
            Refine {refine ? "▲" : "▼"}
          </Button>
        </div>
      </div>

      {refine ? (
        <div className="anim-fade grid grid-cols-2 gap-3 px-4 py-3 sm:grid-cols-3 lg:grid-cols-6">
          <div>
            <span className="mb-1 block text-[10.5px] font-semibold uppercase tracking-[0.1em] text-ink-3">Price from (EGP)</span>
            <Input className="h-9 text-[12.5px]" inputMode="numeric" placeholder="0" value={pmin} onChange={(e) => setPmin(e.target.value.replace(/[^\d]/g, ""))} onBlur={() => set({ pmin: pmin || null })} />
          </div>
          <div>
            <span className="mb-1 block text-[10.5px] font-semibold uppercase tracking-[0.1em] text-ink-3">Price to (EGP)</span>
            <Input className="h-9 text-[12.5px]" inputMode="numeric" placeholder="No max" value={pmax} onChange={(e) => setPmax(e.target.value.replace(/[^\d]/g, ""))} onBlur={() => set({ pmax: pmax || null })} />
          </div>
          <div>
            <span className="mb-1 block text-[10.5px] font-semibold uppercase tracking-[0.1em] text-ink-3">Area from (m²)</span>
            <Input className="h-9 text-[12.5px]" inputMode="numeric" placeholder="0" value={amin} onChange={(e) => setAmin(e.target.value.replace(/[^\d]/g, ""))} onBlur={() => set({ amin: amin || null })} />
          </div>
          <div>
            <span className="mb-1 block text-[10.5px] font-semibold uppercase tracking-[0.1em] text-ink-3">Area to (m²)</span>
            <Input className="h-9 text-[12.5px]" inputMode="numeric" placeholder="No max" value={amax} onChange={(e) => setAmax(e.target.value.replace(/[^\d]/g, ""))} onBlur={() => set({ amax: amax || null })} />
          </div>
          <div>
            <span className="mb-1 block text-[10.5px] font-semibold uppercase tracking-[0.1em] text-ink-3">Bedrooms</span>
            <Select className="h-9 text-[12.5px]" value={get("beds")} onChange={(e) => sel("beds", e.target.value)}>
              <option value="">Any</option>
              {[1, 2, 3, 4, 5].map((n) => (
                <option key={n} value={n}>
                  {n}+
                </option>
              ))}
            </Select>
          </div>
          <div>
            <span className="mb-1 block text-[10.5px] font-semibold uppercase tracking-[0.1em] text-ink-3">Bathrooms</span>
            <Select className="h-9 text-[12.5px]" value={get("baths")} onChange={(e) => sel("baths", e.target.value)}>
              <option value="">Any</option>
              {[1, 2, 3].map((n) => (
                <option key={n} value={n}>
                  {n}+
                </option>
              ))}
            </Select>
          </div>
          <div>
            <span className="mb-1 block text-[10.5px] font-semibold uppercase tracking-[0.1em] text-ink-3">Listed from</span>
            <Input className="h-9 text-[12.5px]" type="date" value={get("from")} onChange={(e) => sel("from", e.target.value)} />
          </div>
          <div>
            <span className="mb-1 block text-[10.5px] font-semibold uppercase tracking-[0.1em] text-ink-3">Listed to</span>
            <Input className="h-9 text-[12.5px]" type="date" value={get("to")} onChange={(e) => sel("to", e.target.value)} />
          </div>
          <div className="col-span-2 flex items-end justify-end sm:col-span-3 lg:col-span-6">
            <span className={cn("text-[11.5px] text-ink-3")}>Filters apply across every chart, map and table on this page.</span>
          </div>
        </div>
      ) : null}
    </div>
  );
}
