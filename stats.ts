import { and, eq, gte, lte, sql } from "drizzle-orm";
import { db } from "@/db";
import { properties, datasets } from "@/db/schema";

export interface Filters {
  ds: string | null;
  city: string | null;
  district: string | null;
  type: string | null;
  priceMin: number | null;
  priceMax: number | null;
  areaMin: number | null;
  areaMax: number | null;
  bedsMin: number | null;
  bathsMin: number | null;
  furnished: string | null; // "yes" | "no"
  status: string | null;
  dateFrom: string | null;
  dateTo: string | null;
}

export function parseFilters(sp: URLSearchParams): Filters {
  const num = (k: string) => {
    const v = sp.get(k);
    if (!v) return null;
    const n = parseFloat(v);
    return Number.isFinite(n) ? n : null;
  };
  const str = (k: string) => {
    const v = sp.get(k);
    return v && v.length <= 120 ? v : null;
  };
  return {
    ds: str("ds"),
    city: str("city"),
    district: str("district"),
    type: str("type"),
    priceMin: num("pmin"),
    priceMax: num("pmax"),
    areaMin: num("amin"),
    areaMax: num("amax"),
    bedsMin: num("beds"),
    bathsMin: num("baths"),
    furnished: str("furn"),
    status: str("status"),
    dateFrom: str("from"),
    dateTo: str("to"),
  };
}

export function buildWhere(userId: string, f: Filters) {
  const conds = [eq(properties.userId, userId)];
  if (f.ds) conds.push(eq(properties.datasetId, f.ds));
  if (f.city) conds.push(eq(properties.city, f.city));
  if (f.district) conds.push(eq(properties.district, f.district));
  if (f.type) conds.push(eq(properties.propertyType, f.type));
  if (f.priceMin != null) conds.push(gte(properties.price, Math.round(f.priceMin)));
  if (f.priceMax != null) conds.push(lte(properties.price, Math.round(f.priceMax)));
  if (f.areaMin != null) conds.push(gte(properties.area, f.areaMin));
  if (f.areaMax != null) conds.push(lte(properties.area, f.areaMax));
  if (f.bedsMin != null) conds.push(gte(properties.bedrooms, Math.round(f.bedsMin)));
  if (f.bathsMin != null) conds.push(gte(properties.bathrooms, Math.round(f.bathsMin)));
  if (f.furnished === "yes") conds.push(eq(properties.furnished, true));
  if (f.furnished === "no") conds.push(eq(properties.furnished, false));
  if (f.status) conds.push(eq(properties.status, f.status));
  if (f.dateFrom) conds.push(gte(properties.listingDate, f.dateFrom));
  if (f.dateTo) conds.push(lte(properties.listingDate, f.dateTo));
  return conds.length === 1 ? conds[0] : and(...conds);
}

export interface StatRow {
  id: string;
  title: string;
  price: number | null;
  area: number | null;
  pricePerSqm: number | null;
  propertyType: string | null;
  city: string | null;
  district: string | null;
  address: string | null;
  bedrooms: number | null;
  bathrooms: number | null;
  floor: number | null;
  furnished: boolean | null;
  status: string | null;
  listingDate: string | null;
  latitude: number | null;
  longitude: number | null;
  datasetId: string | null;
}

export async function fetchStatRows(userId: string, f: Filters, limit = 5000): Promise<StatRow[]> {
  const rows = await db
    .select({
      id: properties.id,
      title: properties.title,
      price: properties.price,
      area: properties.area,
      pricePerSqm: properties.pricePerSqm,
      propertyType: properties.propertyType,
      city: properties.city,
      district: properties.district,
      address: properties.address,
      bedrooms: properties.bedrooms,
      bathrooms: properties.bathrooms,
      floor: properties.floor,
      furnished: properties.furnished,
      status: properties.status,
      listingDate: properties.listingDate,
      latitude: properties.latitude,
      longitude: properties.longitude,
      datasetId: properties.datasetId,
    })
    .from(properties)
    .where(buildWhere(userId, f))
    .limit(limit);
  return rows as unknown as StatRow[];
}

/* ------------------------------- math helpers ------------------------------- */

export function median(arr: number[]): number | null {
  if (!arr.length) return null;
  const s = [...arr].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

export function quantile(arr: number[], q: number): number | null {
  if (!arr.length) return null;
  const s = [...arr].sort((a, b) => a - b);
  const pos = (s.length - 1) * q;
  const base = Math.floor(pos);
  const rest = pos - base;
  return s[base + 1] != null ? s[base] + rest * (s[base + 1] - s[base]) : s[base];
}

export function avg(arr: number[]): number | null {
  if (!arr.length) return null;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

function groupBy<T>(arr: T[], key: (t: T) => string | null): Map<string, T[]> {
  const m = new Map<string, T[]>();
  for (const item of arr) {
    const k = key(item);
    if (k == null) continue;
    const list = m.get(k) ?? [];
    list.push(item);
    m.set(k, list);
  }
  return m;
}

/* ------------------------------- aggregates ------------------------------- */

export interface DistrictStat {
  district: string;
  city: string | null;
  count: number;
  avgPrice: number | null;
  medianPrice: number | null;
  avgPpm2: number | null;
  medianPpm2: number | null;
  minPrice: number | null;
  maxPrice: number | null;
}

export interface TypeStat {
  type: string;
  count: number;
  share: number;
  avgPrice: number | null;
  avgPpm2: number | null;
}

export interface Opportunity {
  id: string;
  title: string;
  kind: "below-market" | "low-ppm2" | "high-ppm2";
  price: number | null;
  pricePerSqm: number | null;
  district: string | null;
  detail: string;
  strength: number;
}

export interface Outlier {
  id: string;
  title: string;
  kind: "extreme-price" | "extreme-ppm2" | "extreme-area" | "unusual-ppm2";
  detail: string;
  price: number | null;
  pricePerSqm: number | null;
  area: number | null;
  district: string | null;
  strength: number;
}

export interface StatsResult {
  total: number;
  truncated: boolean;
  metrics: {
    total: number;
    avgPrice: number | null;
    medianPrice: number | null;
    avgPpm2: number | null;
    medianPpm2: number | null;
    minPrice: number | null;
    maxPrice: number | null;
    minPpm2: number | null;
    maxPpm2: number | null;
    avgArea: number | null;
  };
  byType: TypeStat[];
  histogram: { label: string; from: number; to: number; count: number }[];
  byDistrict: DistrictStat[];
  byMonth: { month: string; count: number; avgPrice: number | null; avgPpm2: number | null }[];
  byBedrooms: { bedrooms: number; count: number; avgPrice: number | null; avgPpm2: number | null }[];
  scatter: { id: string; area: number; price: number; ppm2: number | null; type: string }[];
  opportunities: Opportunity[];
  outliers: Outlier[];
  facet: {
    cities: string[];
    districts: string[];
    types: string[];
    statuses: string[];
    datasets: { id: string; name: string; count: number }[];
  };
}

export function computeStats(rows: StatRow[], truncated: boolean): StatsResult {
  const priced = rows.filter((r) => r.price != null && r.price > 0);
  const prices = priced.map((r) => r.price as number);
  const withPpm2 = rows.filter((r) => r.pricePerSqm != null && r.pricePerSqm > 0);
  const ppm2s = withPpm2.map((r) => r.pricePerSqm as number);
  const areas = rows.filter((r) => r.area != null && r.area > 0).map((r) => r.area as number);

  const metrics = {
    total: rows.length,
    avgPrice: avg(prices),
    medianPrice: median(prices),
    avgPpm2: avg(ppm2s),
    medianPpm2: median(ppm2s),
    minPrice: prices.length ? Math.min(...prices) : null,
    maxPrice: prices.length ? Math.max(...prices) : null,
    minPpm2: ppm2s.length ? Math.min(...ppm2s) : null,
    maxPpm2: ppm2s.length ? Math.max(...ppm2s) : null,
    avgArea: avg(areas),
  };

  /* by type */
  const typeMap = groupBy(rows, (r) => r.propertyType ?? "Other");
  const byType: TypeStat[] = [...typeMap.entries()]
    .map(([type, list]) => ({
      type,
      count: list.length,
      share: rows.length ? list.length / rows.length : 0,
      avgPrice: avg(list.filter((r) => r.price != null).map((r) => r.price as number)),
      avgPpm2: avg(list.filter((r) => r.pricePerSqm != null).map((r) => r.pricePerSqm as number)),
    }))
    .sort((a, b) => b.count - a.count);

  /* histogram */
  let histogram: StatsResult["histogram"] = [];
  if (prices.length >= 3) {
    const lo = Math.min(...prices);
    const hi = Math.max(...prices);
    const binCount = 8;
    const step = Math.max(1, Math.ceil((hi - lo) / binCount / 50000) * 50000 || 50000);
    const start = Math.floor(lo / step) * step;
    const bins: { from: number; to: number; count: number }[] = [];
    for (let b = start; b < hi + step; b += step) bins.push({ from: b, to: b + step, count: 0 });
    if (bins.length > 14) bins.length = 14;
    for (const p of prices) {
      const i = bins.findIndex((b) => p >= b.from && p < b.to);
      if (i >= 0) bins[i].count++;
      else bins[bins.length - 1].count++;
    }
    histogram = bins.map((b) => ({
      from: b.from,
      to: b.to,
      count: b.count,
      label:
        b.from >= 1_000_000 || b.to >= 1_000_000
          ? `${(b.from / 1e6).toFixed(1)}–${(b.to / 1e6).toFixed(1)}M`
          : `${Math.round(b.from / 1e3)}–${Math.round(b.to / 1e3)}K`,
    }));
  }

  /* by district */
  const distMap = groupBy(rows, (r) => r.district ?? "Unspecified");
  const byDistrict: DistrictStat[] = [...distMap.entries()]
    .map(([district, list]) => {
      const ps = list.filter((r) => r.price != null).map((r) => r.price as number);
      const pp = list.filter((r) => r.pricePerSqm != null).map((r) => r.pricePerSqm as number);
      return {
        district,
        city: list.find((r) => r.city)?.city ?? null,
        count: list.length,
        avgPrice: avg(ps),
        medianPrice: median(ps),
        avgPpm2: avg(pp),
        medianPpm2: median(pp),
        minPrice: ps.length ? Math.min(...ps) : null,
        maxPrice: ps.length ? Math.max(...ps) : null,
      };
    })
    .sort((a, b) => b.count - a.count);

  /* by month */
  const monthMap = groupBy(
    rows.filter((r) => r.listingDate),
    (r) => (r.listingDate as string).slice(0, 7)
  );
  const byMonth = [...monthMap.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([month, list]) => ({
      month,
      count: list.length,
      avgPrice: avg(list.filter((r) => r.price != null).map((r) => r.price as number)),
      avgPpm2: avg(list.filter((r) => r.pricePerSqm != null).map((r) => r.pricePerSqm as number)),
    }));

  /* by bedrooms */
  const bedMap = groupBy(
    rows.filter((r) => r.bedrooms != null && r.bedrooms > 0),
    (r) => String(Math.min(r.bedrooms as number, 6))
  );
  const byBedrooms = [...bedMap.entries()]
    .map(([b, list]) => ({
      bedrooms: Number(b) === 6 ? 5 : Number(b),
      count: list.length,
      avgPrice: avg(list.filter((r) => r.price != null).map((r) => r.price as number)),
      avgPpm2: avg(list.filter((r) => r.pricePerSqm != null).map((r) => r.pricePerSqm as number)),
    }))
    .sort((a, b) => a.bedrooms - b.bedrooms);

  const scatter = rows
    .filter((r) => r.area != null && r.price != null && r.area < 2000)
    .slice(0, 600)
    .map((r) => ({ id: r.id, area: r.area as number, price: r.price as number, ppm2: r.pricePerSqm, type: r.propertyType ?? "Other" }));

  /* opportunities */
  const opportunities: Opportunity[] = [];
  for (const r of rows) {
    if (r.price == null) continue;
    const district = r.district ?? "Unspecified";
    const similar = rows.filter((x) => (x.district ?? "Unspecified") === district && (x.propertyType ?? "Other") === (r.propertyType ?? "Other") && x.price != null);
    const districtAll = rows.filter((x) => (x.district ?? "Unspecified") === district && x.pricePerSqm != null);
    if (similar.length >= 3) {
      const a = avg(similar.map((x) => x.price as number)) as number;
      if (r.price < a * 0.85) {
        const pct = Math.round((1 - r.price / a) * 100);
        opportunities.push({
          id: r.id,
          title: r.title,
          kind: "below-market",
          price: r.price,
          pricePerSqm: r.pricePerSqm,
          district,
          detail: `Priced ${pct}% below the average of ${similar.length - 1} similar ${r.propertyType ?? "property"} listing${similar.length > 2 ? "s" : ""} in ${district}.`,
          strength: pct,
        });
      }
    }
    const ppm2sDistrict = districtAll.map((x) => x.pricePerSqm as number);
    if (r.pricePerSqm != null && ppm2sDistrict.length >= 5) {
      const p10 = quantile(ppm2sDistrict, 0.1) as number;
      const med = median(ppm2sDistrict) as number;
      if (r.pricePerSqm <= p10) {
        opportunities.push({
          id: r.id,
          title: r.title,
          kind: "low-ppm2",
          price: r.price,
          pricePerSqm: r.pricePerSqm,
          district,
          detail: `Among the lowest 10% of price/m² in ${district} (P10 ≈ EGP ${Math.round(p10).toLocaleString()}/m²).`,
          strength: Math.round((1 - r.pricePerSqm / med) * 100),
        });
      } else if (r.pricePerSqm > med * 1.3) {
        const pct = Math.round(((r.pricePerSqm - med) / med) * 100);
        opportunities.push({
          id: r.id,
          title: r.title,
          kind: "high-ppm2",
          price: r.price,
          pricePerSqm: r.pricePerSqm,
          district,
          detail: `${pct}% above the ${district} median price/m² — priced at a premium.`,
          strength: pct,
        });
      }
    }
  }
  const seenOpp = new Set<string>();
  const opportunitiesSorted = opportunities
    .sort((a, b) => b.strength - a.strength)
    .filter((o) => (seenOpp.has(o.id + o.kind) ? false : (seenOpp.add(o.id + o.kind), true)))
    .slice(0, 12);

  /* outliers */
  const outliers: Outlier[] = [];
  const allMed = median(prices);
  for (const r of rows) {
    if (r.price == null) continue;
    const district = r.district ?? "Unspecified";
    const dPpm2 = rows.filter((x) => (x.district ?? "Unspecified") === district && x.pricePerSqm != null).map((x) => x.pricePerSqm as number);
    const dMedPpm2 = median(dPpm2);
    if (r.pricePerSqm != null && dMedPpm2 && dPpm2.length >= 4) {
      const ratio = r.pricePerSqm / dMedPpm2;
      if (ratio >= 2 || ratio <= 0.45) {
        const times = ratio >= 1 ? ratio : 1 / ratio;
        outliers.push({
          id: r.id,
          title: r.title,
          kind: ratio >= 1 ? "extreme-ppm2" : "unusual-ppm2",
          detail: `Price/m² is ${times.toFixed(1)}× ${ratio >= 1 ? "higher" : "lower"} than the ${district} median (EGP ${Math.round(dMedPpm2).toLocaleString()}/m²).`,
          price: r.price,
          pricePerSqm: r.pricePerSqm,
          area: r.area,
          district,
          strength: times,
        });
      }
    }
    if (allMed && r.price >= allMed * 3) {
      outliers.push({
        id: r.id,
        title: r.title,
        kind: "extreme-price",
        detail: `(EGP ${Math.round((r.price as number) / 1e6 * 100) / 100}M) is ${(r.price / allMed).toFixed(1)}× the dataset median price — an extreme price point.`,
        price: r.price,
        pricePerSqm: r.pricePerSqm,
        area: r.area,
        district,
        strength: r.price / allMed,
      });
    }
    const dAreas = rows.filter((x) => (x.district ?? "Unspecified") === district && x.area != null).map((x) => x.area as number);
    if (r.area != null && dAreas.length >= 8) {
      const p2 = quantile(dAreas, 0.02) as number;
      const p98 = quantile(dAreas, 0.98) as number;
      if (r.area <= p2) {
        outliers.push({ id: r.id, title: r.title, kind: "extreme-area", detail: `Very small area — within the bottom 2% of ${district} (≤ ${Math.round(p2)} m²).`, price: r.price, pricePerSqm: r.pricePerSqm, area: r.area, district, strength: 2 });
      } else if (r.area >= p98 && r.area > p2 * 4) {
        outliers.push({ id: r.id, title: r.title, kind: "extreme-area", detail: `Very large area — within the top 2% of ${district} (≥ ${Math.round(p98)} m²).`, price: r.price, pricePerSqm: r.pricePerSqm, area: r.area, district, strength: 2 });
      }
    }
  }
  const seenOut = new Set<string>();
  const outliersSorted = outliers
    .sort((a, b) => b.strength - a.strength)
    .filter((o) => (seenOut.has(o.id + o.kind) ? false : (seenOut.add(o.id + o.kind), true)))
    .slice(0, 10);

  /* facets */
  const uniq = (arr: (string | null)[]) => [...new Set(arr.filter((x): x is string => !!x && x.length < 80))].sort();

  return {
    total: rows.length,
    truncated,
    metrics,
    byType,
    histogram,
    byDistrict,
    byMonth,
    byBedrooms,
    scatter,
    opportunities: opportunitiesSorted,
    outliers: outliersSorted,
    facet: {
      cities: uniq(rows.map((r) => r.city)),
      districts: uniq(rows.map((r) => r.district)),
      types: uniq(rows.map((r) => r.propertyType)),
      statuses: uniq(rows.map((r) => r.status)),
      datasets: [],
    },
  };
}

export async function fetchFacetDatasets(userId: string) {
  const [dsList, counts] = await Promise.all([
    db.select({ id: datasets.id, name: datasets.name }).from(datasets).where(eq(datasets.userId, userId)),
    db
      .select({ datasetId: properties.datasetId, count: sql<number>`count(*)::int` })
      .from(properties)
      .where(eq(properties.userId, userId))
      .groupBy(properties.datasetId),
  ]);
  const countMap = new Map(counts.map((c) => [c.datasetId, c.count]));
  return dsList.map((d) => ({ id: d.id, name: d.name, count: d.id ? (countMap.get(d.id) ?? 0) : 0 }));
}

