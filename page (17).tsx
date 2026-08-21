"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Badge, Button, Card, EmptyState, Icon, paths, Skeleton } from "@/components/ui";
import { fmtArea, fmtMoney, fmtPpm2, titleCase } from "@/lib/format";

interface PropDetail {
  id: string;
  title: string;
  price: number | null;
  area: number | null;
  pricePerSqm: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  floor: number | null;
  furnished: boolean | null;
  status: string | null;
  district: string | null;
  city: string | null;
  propertyType: string | null;
  image: string | null;
}

function useCompareList(ids: string[]) {
  const [items, setItems] = useState<(PropDetail | null)[]>([]);
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    let alive = true;
    setLoaded(false);
    Promise.all(
      ids.map(
        (id) =>
          fetch(`/api/properties/${id}`)
            .then(async (r) => {
              const j = await r.json();
              if (!r.ok) throw new Error(j.error ?? "not found");
              const p = j.property as Omit<PropDetail, "image"> & { images: string[] };
              return { ...p, image: p.images[0] ?? null };
            })
            .catch(() => null)
      )
    ).then((res) => {
      if (alive) {
        setItems(res);
        setLoaded(true);
      }
    });
    return () => {
      alive = false;
    };
  }, [ids.join(",")]);
  return { items, loaded };
}

interface RowDef {
  label: string;
  render: (p: PropDetail) => string;
  value?: (p: PropDetail) => number | null;
  bestMode?: "min" | "max";
  bestLabel?: string;
}

function bestIds(items: PropDetail[], row: RowDef): string[] {
  if (!row.value || !row.bestMode) return [];
  const valid = items.filter((p) => row.value!(p) != null);
  if (!valid.length) return [];
  const target = valid.reduce((a, b) => (row.bestMode === "min" ? (row.value!(a) as number) <= (row.value!(b) as number) ? a : b : (row.value!(a) as number) >= (row.value!(b) as number) ? a : b), valid[0]);
  const targetVal = row.value(target);
  return valid.filter((p) => row.value!(p) === targetVal).map((p) => p.id);
}

function CompareInner() {
  const sp = useSearchParams();
  const ids = (sp.get("ids") ?? "").split(",").filter((x) => /^[0-9a-f-]{36}$/i.test(x)).slice(0, 4);
  const list = useCompareList(ids);
  const items = list.items.filter((x): x is PropDetail => !!x);

  const ROWS: RowDef[] = [
    { label: "Price", render: (p) => fmtMoney(p.price), value: (p) => p.price, bestMode: "min", bestLabel: "Lowest price" },
    { label: "Area", render: (p) => fmtArea(p.area), value: (p) => p.area, bestMode: "max", bestLabel: "Largest area" },
    { label: "Price / m²", render: (p) => fmtPpm2(p.pricePerSqm), value: (p) => p.pricePerSqm, bestMode: "min", bestLabel: "Best price/m²" },
    { label: "Bedrooms", render: (p) => (p.bedrooms == null ? "—" : p.bedrooms === 0 ? "Studio" : String(p.bedrooms)) },
    { label: "Bathrooms", render: (p) => (p.bathrooms == null ? "—" : String(p.bathrooms)) },
    { label: "Floor", render: (p) => (p.floor == null ? "—" : String(p.floor)) },
    { label: "Location", render: (p) => [p.district, p.city].filter(Boolean).join(", ") || "—" },
    { label: "Property type", render: (p) => p.propertyType ?? "—" },
    { label: "Furnishing", render: (p) => (p.furnished == null ? "—" : p.furnished ? "Furnished" : "Not furnished") },
    { label: "Status", render: (p) => titleCase(p.status) },
  ];

  if (ids.length < 2) {
    return (
      <EmptyState
        icon={<Icon d={paths.compare} size={26} />}
        title="Select properties to compare"
        desc="Use the “Compare” button on any property card or detail page to pick up to 4 listings, then come back here for a transparent side-by-side."
        actions={
          <Link href="/app/properties">
            <Button>
              <Icon d={paths.building} size={14} /> Browse properties
            </Button>
          </Link>
        }
      />
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-[26px] tracking-[-0.02em]">Property comparison</h1>
          <p className="text-[13px] text-ink-2">Side-by-side values with transparent best-value highlights.</p>
        </div>
        <Link href="/app/properties" className="text-[12.5px] font-medium text-pine hover:text-pine-deep">
          + Add more from directory
        </Link>
      </div>

      {!list.loaded ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {ids.map((i) => (
            <Skeleton key={i} className="h-40" />
          ))}
        </div>
      ) : items.length < 2 ? (
        <EmptyState
          title="Not enough properties found"
          desc="One or more of the selected properties were removed with their dataset."
          actions={
            <Link href="/app/properties">
              <Button>Browse properties</Button>
            </Link>
          }
        />
      ) : (
        <Card className="anim-rise overflow-hidden">
          <div className="thin-scroll overflow-x-auto">
            <table className="w-full min-w-[640px] border-collapse text-[13px]">
              <thead>
                <tr className="border-b border-line">
                  <th className="w-44 bg-cream px-4 py-3 text-left text-[10.5px] font-semibold uppercase tracking-[0.12em] text-ink-3">Attribute</th>
                  {items.map((p) => (
                    <th key={p.id} className="min-w-[180px] px-4 py-3 text-left align-top">
                      {p.image ? (
                        <img src={p.image} alt="" className="mb-2.5 h-24 w-full rounded-md border border-line object-cover" />
                      ) : (
                        <div className="mb-2.5 flex h-24 w-full items-center justify-center rounded-md border border-line bg-pine-wash text-ink-3">
                          <Icon d={paths.building} size={22} />
                        </div>
                      )}
                      <Link href={`/app/properties/${p.id}`} className="line-clamp-2 text-[12.5px] font-semibold leading-snug text-ink hover:text-pine">
                        {p.title}
                      </Link>
                      <div className="mt-0.5 text-[11px] font-normal text-ink-3">
                        {p.district ?? "Location n/a"}
                        {p.city ? `, ${p.city}` : ""}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ROWS.map((r, ri) => {
                  const ids2 = bestIds(items, r);
                  return (
                    <tr key={r.label} className={`border-b border-line-2 last:border-0 ${ri % 2 ? "bg-cream/40" : ""}`}>
                      <td className="bg-cream/70 px-4 py-2.5 text-[11.5px] font-semibold text-ink-2">{r.label}</td>
                      {items.map((p) => (
                        <td key={p.id + r.label} className="px-4 py-2.5">
                          <span className={`tnum inline-flex flex-wrap items-center gap-2 ${ids2.includes(p.id) ? "font-semibold text-pine-deep" : "text-ink"}`}>
                            {r.render(p)}
                            {ids2.includes(p.id) && r.bestLabel ? <Badge tone="pine">{r.bestLabel}</Badge> : null}
                          </span>
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="border-t border-line-2 px-5 py-3 text-[11.5px] leading-relaxed text-ink-3">
            Highlights are computed directly from the table above: <b className="text-ink-2">lowest price</b>, <b className="text-ink-2">best price/m²</b> (lowest) and <b className="text-ink-2">largest area</b>. Ties are all highlighted. No composite “best property” score is applied.
          </div>
        </Card>
      )}
    </div>
  );
}

export default function ComparePage() {
  return (
    <Suspense fallback={<Skeleton className="h-96" />}>
      <CompareInner />
    </Suspense>
  );
}
