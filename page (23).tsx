"use client";

import Link from "next/link";
import { useState } from "react";
import { useParams } from "next/navigation";
import { useFetch } from "@/lib/hooks";
import { Badge, Button, Card, EmptyState, ErrorState, Icon, paths, Skeleton, Spinner } from "@/components/ui";
import { PropertyCard, type PropItem } from "@/components/PropertyCard";
import { useCompare } from "@/components/CompareContext";
import { fmtArea, fmtDate, fmtMoney, fmtMoneyFull, fmtPpm2, titleCase } from "@/lib/format";

interface DetailResp {
  ok: boolean;
  property: PropItem & { images: string[]; listingDate: string | null; floor: number | null; address: string | null; description: string | null; sourceFile: string | null; createdAt: string };
  similar: PropItem[];
  market: { district: string | null; count: number; avgPrice: number | null; medianPpm2: number | null; avgPpm2: number | null };
}

export default function PropertyDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data, loading, error, reload } = useFetch<DetailResp>(`/api/properties/${id}`);
  const [imgIdx, setImgIdx] = useState(0);
  const [saving, setSaving] = useState(false);
  const { has, toggle } = useCompare();

  if (loading) {
    return (
      <div className="space-y-5">
        <Skeleton className="h-6 w-40" />
        <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
          <Skeleton className="h-[420px]" />
          <div className="space-y-4">
            <Skeleton className="h-24" />
            <Skeleton className="h-64" />
          </div>
        </div>
      </div>
    );
  }
  if (error || !data) {
    return (
      <EmptyState
        title="Property not found"
        desc={error ?? "It may have been removed with its dataset."}
        actions={
          <Link href="/app/properties">
            <Button>Back to directory</Button>
          </Link>
        }
      />
    );
  }

  const p = data.property;
  const m = data.market;
  const isDemo = p.sourceFile === "demo-dataset.xlsx";
  const priceVsDistrict = m.avgPrice && p.price ? ((p.price - m.avgPrice) / m.avgPrice) * 100 : null;
  const ppm2VsDistrict = m.medianPpm2 && p.pricePerSqm ? ((p.pricePerSqm - m.medianPpm2) / m.medianPpm2) * 100 : null;

  const save = async () => {
    setSaving(true);
    const res = await fetch("/api/saved", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ propertyId: p.id }) });
    const json = await res.json();
    setSaving(false);
    if (json.ok) reload();
  };

  const specs: [string, string][] = [
    ["Area", fmtArea(p.area)],
    ["Bedrooms", p.bedrooms != null ? (p.bedrooms === 0 ? "Studio" : String(p.bedrooms)) : "—"],
    ["Bathrooms", p.bathrooms != null ? String(p.bathrooms) : "—"],
    ["Floor", p.floor != null ? String(p.floor) : "—"],
    ["Furnishing", p.furnished == null ? "—" : p.furnished ? "Furnished" : "Not furnished"],
    ["Status", titleCase(p.status)],
    ["Listed", fmtDate(p.listingDate)],
    ["Source", p.sourceFile ?? "—"],
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link href="/app/properties" className="flex items-center gap-1.5 text-[13px] font-medium text-ink-2 transition-colors hover:text-ink">
          <Icon d={paths.arrow} size={13} className="rotate-180" /> Directory
        </Link>
        {isDemo ? <Badge tone="gold">Demo Dataset — Fictional Data</Badge> : null}
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.45fr_1fr]">
        {/* Gallery */}
        <div className="space-y-3">
          <div className="anim-rise overflow-hidden rounded-lg border border-line bg-card shadow-card">
            {p.images.length ? (
              <img src={p.images[imgIdx]} alt={p.title} className="aspect-[16/10] w-full object-cover" />
            ) : (
              <div className="flex aspect-[16/10] w-full flex-col items-center justify-center bg-pine-wash text-ink-3">
                <Icon d={paths.building} size={36} strokeWidth={1.1} />
                <span className="mt-3 text-[12px]">No image in source file</span>
              </div>
            )}
          </div>
          {p.images.length > 1 ? (
            <div className="flex gap-2">
              {p.images.map((src, i) => (
                <button key={i} onClick={() => setImgIdx(i)} className={`h-16 w-24 overflow-hidden rounded-md border-2 transition-all ${i === imgIdx ? "border-pine" : "border-transparent opacity-70 hover:opacity-100"}`}>
                  <img src={src} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          ) : null}

          {/* Market metrics */}
          <Card className="anim-rise" >
            <div className="border-b border-line px-5 py-3.5">
              <h3 className="font-display text-[15.5px]">Financial & market context</h3>
              <p className="text-[11.5px] text-ink-3">Computed from the {m.count} listings in {m.district ?? "the same district"}</p>
            </div>
            <div className="grid grid-cols-2 gap-px bg-line sm:grid-cols-4">
              <Metric label="Your price" value={fmtMoney(p.price)} />
              <Metric label="District avg" value={fmtMoney(m.avgPrice)} />
              <Metric
                label="vs district avg"
                value={priceVsDistrict == null ? "—" : `${priceVsDistrict > 0 ? "+" : ""}${Math.round(priceVsDistrict)}%`}
                tone={priceVsDistrict != null ? (priceVsDistrict < 0 ? "good" : "bad") : "flat"}
              />
              <Metric
                label="Price/m² vs median"
                value={ppm2VsDistrict == null ? "—" : `${ppm2VsDistrict > 0 ? "+" : ""}${Math.round(ppm2VsDistrict)}%`}
                tone={ppm2VsDistrict != null ? (ppm2VsDistrict < 0 ? "good" : "bad") : "flat"}
              />
            </div>
            <p className="px-5 py-3 text-[11.5px] leading-relaxed text-ink-3">
              {p.pricePerSqm != null ? `This listing trades at ${fmtPpm2(p.pricePerSqm)} against a ${m.district ?? "district"} median of ${fmtPpm2(m.medianPpm2)}. ` : ""}
              Negative values mean cheaper than the local benchmark — a data-based signal, not investment advice.
            </p>
          </Card>
        </div>

        {/* Info column */}
        <div className="space-y-4">
          <Card className="anim-rise p-5">
            <div className="flex items-center gap-2">
              {p.propertyType ? <Badge tone="pine">{p.propertyType}</Badge> : null}
              {p.status ? <Badge tone="outline">{titleCase(p.status)}</Badge> : null}
              {p.furnished ? <Badge tone="gold">Furnished</Badge> : null}
            </div>
            <h1 className="mt-3 font-display text-[24px] leading-snug tracking-[-0.02em]">{p.title}</h1>
            <p className="mt-1 text-[13px] text-ink-2">
              {[p.address, p.district, p.city].filter(Boolean).join(" · ") || "Location not specified in source"}
            </p>
            <div className="mt-4 flex items-baseline gap-4 border-b border-line-2 pb-4">
              <div>
                <div className="font-display text-[34px] leading-none tracking-[-0.03em]">{fmtMoney(p.price)}</div>
                <div className="mt-1 text-[11px] text-ink-3">{fmtMoneyFull(p.price)}</div>
              </div>
              {p.pricePerSqm != null ? (
                <div className="ml-auto text-right">
                  <div className="tnum text-[19px] font-semibold text-pine">{fmtPpm2(p.pricePerSqm)}</div>
                  <div className="text-[11px] text-ink-3">price per m²</div>
                </div>
              ) : null}
            </div>
            <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3">
              {specs.map(([l, v]) => (
                <div key={l}>
                  <dt className="text-[10.5px] font-semibold uppercase tracking-[0.12em] text-ink-3">{l}</dt>
                  <dd className="mt-0.5 truncate text-[13px] text-ink">{v}</dd>
                </div>
              ))}
            </dl>
            <div className="mt-5 flex flex-wrap gap-2.5">
              <Button onClick={save} disabled={saving} variant={p.saved ? "primary" : "outline"}>
                {saving ? <Spinner /> : <svg width="13" height="13" viewBox="0 0 24 24" fill={p.saved ? "currentColor" : "none"}>
                  <path d={paths.bookmark} stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
                </svg>}
                {p.saved ? "Saved" : "Save property"}
              </Button>
              <Button variant={has(p.id) ? "primary" : "outline"} onClick={() => toggle(p.id)}>
                <Icon d={paths.compare} size={13} /> {has(p.id) ? "In comparison" : "Compare"}
              </Button>
            </div>
          </Card>

          {p.description ? (
            <Card className="anim-rise p-5" >
              <h3 className="font-display text-[15.5px]">Description</h3>
              <p className="mt-2 text-[13px] leading-relaxed text-ink-2">{p.description}</p>
            </Card>
          ) : (
            <Card className="anim-rise p-5">
              <h3 className="font-display text-[15.5px]">Description</h3>
              <p className="mt-2 text-[13px] leading-relaxed text-ink-3">No description column was found in the source file for this listing.</p>
            </Card>
          )}
        </div>
      </div>

      {data.similar.length > 0 ? (
        <div>
          <div className="mb-4 flex items-end justify-between">
            <div>
              <h2 className="font-display text-[20px] tracking-[-0.02em]">Similar properties</h2>
              <p className="mt-0.5 text-[12.5px] text-ink-3">Same district or type, ranked by price proximity</p>
            </div>
            <Link href="/app/properties" className="text-[12.5px] font-medium text-pine hover:text-pine-deep">
              View all →
            </Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {data.similar.map((s, i) => (
              <PropertyCard key={s.id} p={s} compact delay={i * 60} />
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function Metric({ label, value, tone = "flat" }: { label: string; value: string; tone?: "good" | "bad" | "flat" }) {
  return (
    <div className="bg-card px-4 py-3">
      <div className="text-[9.5px] font-semibold uppercase tracking-[0.14em] text-ink-3">{label}</div>
      <div className={`tnum mt-1 font-display text-[18px] ${tone === "good" ? "text-pine" : tone === "bad" ? "text-gold" : ""}`}>{value}</div>
    </div>
  );
}
