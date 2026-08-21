"use client";

import { Suspense, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useFetch } from "@/lib/hooks";
import { Badge, Card, EmptyState, ErrorState, Icon, paths, Skeleton } from "@/components/ui";
import { FilterBar, type Facets } from "@/components/Filters";
import { fmtArea, fmtMoney, fmtPpm2 } from "@/lib/format";

interface Point {
  id: string;
  title: string;
  price: number | null;
  area: number | null;
  pricePerSqm: number | null;
  propertyType: string | null;
  district: string | null;
  latitude: number;
  longitude: number;
}
interface DistrictGroup {
  district: string;
  count: number;
  avgPrice: number | null;
  avgPpm2: number | null;
}

function MapInner() {
  const sp = useSearchParams();
  const url = useMemo(() => {
    const qs = new URLSearchParams([...sp.entries()]).toString();
    return `/api/map${qs ? `?${qs}` : ""}`;
  }, [sp]);
  const { data, loading, error, reload } = useFetch<{ ok: boolean; points: Point[]; totals: { withCoords: number; withoutCoords: number }; districts: DistrictGroup[] }>(url);
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletRef = useRef<L.Map | null>(null);
  const layerRef = useRef<L.LayerGroup | null>(null);

  useEffect(() => {
    if (!mapRef.current || leafletRef.current) return;
    const map = L.map(mapRef.current, { zoomControl: true, attributionControl: true }).setView([30.01, 31.25], 11);
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 18,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);
    layerRef.current = L.layerGroup().addTo(map);
    leafletRef.current = map;
    return () => {
      map.remove();
      leafletRef.current = null;
      layerRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = leafletRef.current;
    const layer = layerRef.current;
    if (!map || !layer || !data) return;
    layer.clearLayers();
    if (!data.points.length) return;
    const bounds: L.LatLngBounds[] = [];
    for (const p of data.points) {
      const label = p.price != null ? (p.price >= 1e6 ? `${(p.price / 1e6).toFixed(1)}M` : `${Math.round(p.price / 1e3)}K`) : "n/a";
      const icon = L.divIcon({
        className: "",
        html: `<div class="piq-marker" style="width:52px;height:24px;margin:-12px 0 0 -26px;">${label}</div>`,
        iconSize: [52, 24],
        iconAnchor: [26, 12],
      });
      const m = L.marker([p.latitude, p.longitude], { icon });
      m.bindPopup(
        `<div style="min-width:200px">
          <div style="padding:12px 14px">
            <div style="font-size:12px;font-weight:600;color:#211d15;margin-bottom:6px">${p.title.slice(0, 48)}</div>
            <div style="display:flex;justify-content:space-between;font-size:11.5px;margin-bottom:3px"><span style="color:#8b8272">Price</span><b style="font-variant-numeric:tabular-nums">${p.price != null ? `EGP ${Math.round(p.price).toLocaleString()}` : "—"}</b></div>
            <div style="display:flex;justify-content:space-between;font-size:11.5px;margin-bottom:3px"><span style="color:#8b8272">Area</span><b style="font-variant-numeric:tabular-nums">${p.area ? `${Math.round(p.area)} m²` : "—"}</b></div>
            <div style="display:flex;justify-content:space-between;font-size:11.5px;margin-bottom:3px"><span style="color:#8b8272">Price/m²</span><b style="font-variant-numeric:tabular-nums">${p.pricePerSqm ? `EGP ${Math.round(p.pricePerSqm).toLocaleString()}` : "—"}</b></div>
            <div style="display:flex;justify-content:space-between;font-size:11.5px;margin-bottom:8px"><span style="color:#8b8272">Type</span><b>${p.propertyType ?? "—"}</b></div>
            <a href="/app/properties/${p.id}" style="display:inline-block;background:#274d3b;color:#faf8f2;border-radius:5px;padding:5px 10px;font-size:11.5px;font-weight:600;text-decoration:none">View property →</a>
          </div>
        </div>`
      );
      m.addTo(layer);
      bounds.push(L.latLngBounds([p.latitude, p.longitude], [p.latitude, p.longitude]));
    }
    const all = L.latLngBounds(data.points.map((p) => [p.latitude, p.longitude] as [number, number]));
    map.fitBounds(all.pad(0.25), { maxZoom: 14 });
    void bounds;
  }, [data]);

  const facets: Facets = { cities: [], districts: data?.districts.map((d) => d.district) ?? [], types: [], statuses: [], datasets: [] };
  const districts = data?.districts ?? [];
  const showGroups = !loading && !error && data != null && data.points.length === 0 && districts.length > 0;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-[26px] tracking-[-0.02em]">Location intelligence</h1>
          <p className="text-[13px] text-ink-2">
            {data ? (
              <>
                <span className="tnum font-medium text-ink">{data.totals.withCoords.toLocaleString()}</span> mapped listings
                {data.totals.withoutCoords > 0 ? (
                  <>
                    {" · "}
                    <span className="tnum font-medium text-ink">{data.totals.withoutCoords.toLocaleString()}</span> grouped by district (no coordinates in source)
                  </>
                ) : null}
              </>
            ) : (
              "Every listing placed at its real coordinates — no guessed positions."
            )}
          </p>
        </div>
      </div>

      {error ? (
        <ErrorState message={error} retry={reload} />
      ) : (
        <FilterBar facets={facets} total={data ? data.points.length + data.totals.withoutCoords : null} />
      )}

      {loading ? (
        <Skeleton className="h-[460px]" />
      ) : showGroups ? (
        <Card>
          <div className="border-b border-line px-5 py-4">
            <h3 className="font-display text-[16.5px]">District grouping</h3>
            <p className="mt-0.5 text-[12px] text-ink-3">No usable coordinates in this selection — showing location-based grouping instead of a map.</p>
          </div>
          <div className="grid gap-px bg-line sm:grid-cols-2 lg:grid-cols-4">
            {districts.map((d) => (
              <div key={d.district} className="bg-card p-4">
                <div className="text-[13px] font-semibold">{d.district}</div>
                <div className="tnum mt-2 font-display text-[22px]">{d.count}</div>
                <div className="text-[10.5px] uppercase tracking-[0.12em] text-ink-3">listings</div>
                <div className="mt-2 flex justify-between border-t border-line-2 pt-2 text-[11.5px] text-ink-2">
                  <span>{fmtMoney(d.avgPrice)}</span>
                  <span className="text-pine-deep">{fmtPpm2(d.avgPpm2)}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      ) : data && data.points.length > 0 ? (
        <Card className="overflow-hidden">
          <div ref={mapRef} className="h-[440px] w-full md:h-[560px]" />
          <div className="flex flex-wrap items-center gap-3 border-t border-line-2 px-4 py-2.5 text-[11.5px] text-ink-3">
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-2.5 w-2.5 rounded-full border-2 border-cream bg-pine shadow" /> Marker = listing (price label)
            </span>
            <span>Click a marker for price, area, /m² and type.</span>
          </div>
        </Card>
      ) : data ? (
        <EmptyState
          compact
          icon={<Icon d={paths.pin} size={26} />}
          title="Nothing to place on the map"
          desc="No properties with coordinates match the current filters. Adjust filters, or the data may not include latitude/longitude — we'll fall back to district grouping instead of guessing locations."
          actions={
            <Link href="/app/properties">
              <BrowseLink />
            </Link>
          }
        />
      ) : null}
    </div>
  );
}

function BrowseLink() {
  return (
    <span className="inline-flex h-9 items-center gap-1.5 rounded-md bg-pine px-3.5 text-[12.5px] font-medium text-cream">
      Browse properties <Icon d={paths.arrow} size={12} />
    </span>
  );
}

export default function MapPage() {
  return (
    <Suspense fallback={<Skeleton className="h-[460px]" />}>
      <MapInner />
    </Suspense>
  );
}
