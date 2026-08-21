import { parseDate } from "@/lib/ingest";

/* Deterministic pseudo-random generator (mulberry32) so demo data is stable */
function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export interface DemoProperty {
  title: string;
  price: number;
  area: number;
  propertyType: string;
  city: string;
  district: string;
  address: string;
  bedrooms: number | null;
  bathrooms: number | null;
  floor: number | null;
  furnished: boolean | null;
  status: string;
  listingDate: string | null;
  latitude: number | null;
  longitude: number | null;
  description: string;
}

interface DistrictSpec {
  name: string;
  city: string;
  lat: number;
  lng: number;
  basePpm2: number; // EGP per m² baseline
  spread: number; // relative noise
  types: string[];
  weight: number;
}

const DISTRICTS: DistrictSpec[] = [
  { name: "New Cairo", city: "Cairo", lat: 30.03, lng: 31.47, basePpm2: 32000, spread: 0.28, types: ["Apartment", "Villa", "Studio", "Office"], weight: 22 },
  { name: "6th of October", city: "Giza", lat: 29.97, lng: 30.77, basePpm2: 21000, spread: 0.24, types: ["Apartment", "Villa", "Office"], weight: 18 },
  { name: "Zamalek", city: "Cairo", lat: 30.042, lng: 31.226, basePpm2: 58000, spread: 0.3, types: ["Apartment", "Villa"], weight: 9 },
  { name: "Maadi", city: "Cairo", lat: 30.008, lng: 31.213, basePpm2: 41000, spread: 0.26, types: ["Apartment", "Villa"], weight: 9 },
  { name: "Nasr City", city: "Cairo", lat: 30.062, lng: 31.262, basePpm2: 27000, spread: 0.22, types: ["Apartment", "Office", "Commercial"], weight: 14 },
  { name: "Heliopolis", city: "Cairo", lat: 30.052, lng: 31.324, basePpm2: 33000, spread: 0.25, types: ["Apartment", "Commercial"], weight: 10 },
  { name: "Sheikh Zayed", city: "Giza", lat: 29.993, lng: 31.052, basePpm2: 16500, spread: 0.2, types: ["Apartment", "Villa", "Studio"], weight: 12 },
  { name: "New Downtown", city: "Giza", lat: 29.978, lng: 31.172, basePpm2: 24500, spread: 0.26, types: ["Apartment", "Studio", "Office"], weight: 10 },
];

const COMPOUNDS: Record<string, string[]> = {
  "New Cairo": ["Laila Gardens", "Primo", "Al Morada", "Bella Vista", "Coral Residences"],
  "6th of October": ["Al Rehab Park", "DowNTown Gate", "Sami Residence", "Al Safa", "North Tower"],
  Zamalek: ["El Thawra District", "Agha Khan", "Mandara", "Amin Street"],
  Maadi: ["Dar El Maadi", "Hadaiq Al Ahram", "Nobar", "Kobba"],
  "Nasr City": ["Tahrir Square", "Makades", "Al Shorouk", "Fals"],
  Heliopolis: ["Sidi Gaber", "Ferdan", "Al Raml", "Zamalek El Gadeyda"],
  "Sheikh Zayed": ["Al Ahram 2", "Al Rehamna", "West City", "Al Olaya"],
  "New Downtown": ["Al Haneen", "Al Rehab 1", "North Cairo", "Al Masr"],
};

const TYPE_AREA: Record<string, [number, number]> = {
  Apartment: [85, 220],
  Villa: [200, 520],
  Studio: [35, 65],
  Office: [60, 260],
  Commercial: [50, 320],
  Land: [250, 1200],
};

function pick<T>(rng: () => number, arr: T[]): T {
  return arr[Math.floor(rng() * arr.length)];
}

export function generateDemoProperties(count = 160): DemoProperty[] {
  const rng = mulberry32(20260214);
  const pool: DistrictSpec[] = [];
  for (const d of DISTRICTS) for (let i = 0; i < d.weight; i++) pool.push(d);
  const out: DemoProperty[] = [];
  const now = new Date("2026-02-10");

  for (let i = 0; i < count; i++) {
    const d = pick(rng, pool);
    const type = pick(rng, d.types);
    const [aMin, aMax] = TYPE_AREA[type] ?? [80, 300];
    let area = Math.round(aMin + rng() * (aMax - aMin));
    let ppm2 = d.basePpm2 * (1 + (rng() * 2 - 1) * d.spread);

    // Inject a controlled number of outliers & interesting signals
    const roll = rng();
    if (roll < 0.05) ppm2 *= 2.2 + rng(); // overpriced
    else if (roll > 0.94) ppm2 *= 0.45 + rng() * 0.2; // below market

    let price = Math.round((area * ppm2) / 5000) * 5000;
    if (price < 350_000) price = 350_000 + Math.round(rng() * 50) * 5000;

    const bedrooms =
      type === "Studio" ? 0 : type === "Office" || type === "Commercial" || type === "Land" ? null : Math.max(1, Math.round(area / 65) + Math.floor(rng() * 2));
    const bathrooms = bedrooms != null ? Math.max(1, Math.round(bedrooms * 0.75) + (rng() > 0.7 ? 1 : 0)) : null;
    const floor = type === "Apartment" || type === "Studio" ? Math.floor(rng() * 22) + 1 : type === "Office" ? Math.floor(rng() * 30) + 1 : null;
    const furnished = type === "Land" ? null : rng() > 0.45;
    const status = rng() > 0.12 ? "For Sale" : "Sold";
    const monthsAgo = Math.floor(rng() * 26);
    const listing = new Date(now);
    listing.setMonth(listing.getMonth() - monthsAgo);
    const hasCoords = rng() > 0.08;
    const compound = pick(rng, COMPOUNDS[d.name]);
    const block = Math.floor(rng() * 40) + 1;

    out.push({
      title: `${type === "Land" ? "Plot" : "Unit"} ${block} — ${compound}, ${d.name}`,
      price,
      area,
      propertyType: type,
      city: d.city,
      district: d.name,
      address: `${block} ${compound}, ${d.name}, ${d.city}`,
      bedrooms,
      bathrooms,
      floor,
      furnished,
      status,
      listingDate: listing.toISOString().slice(0, 10),
      latitude: hasCoords ? Math.round((d.lat + (rng() - 0.5) * 0.05) * 100000) / 100000 : null,
      longitude: hasCoords ? Math.round((d.lng + (rng() - 0.5) * 0.06) * 100000) / 100000 : null,
      description: `${type} in ${compound}, ${d.name} — ${area} m²${bedrooms && bathrooms ? ` with ${bedrooms} bedroom${bedrooms > 1 ? "s" : ""} and ${bathrooms} bathroom${bathrooms > 1 ? "s" : ""}` : ""}${furnished ? ", fully furnished" : ""}. Listed ${parseDate(listing.toISOString().slice(0, 10))} in a ${d.name} market averaging ≈ EGP ${Math.round(d.basePpm2 / 1000)}K/m². Demo listing — fictional data.`,
    });
  }
  return out;
}

export const DEMO_IMAGES: Record<string, string[]> = {
  Villa: [
    "https://images.pexels.com/photos/16573669/pexels-photo-16573669.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
    "https://images.pexels.com/photos/7031594/pexels-photo-7031594.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
    "https://images.pexels.com/photos/8134745/pexels-photo-8134745.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
    "https://images.pexels.com/photos/29560257/pexels-photo-29560257.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
    "https://images.pexels.com/photos/7031602/pexels-photo-7031602.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
  ],
  Apartment: [
    "https://images.pexels.com/photos/27459248/pexels-photo-27459248.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
    "https://images.pexels.com/photos/37224965/pexels-photo-37224965.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
    "https://images.pexels.com/photos/5674684/pexels-photo-5674684.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
    "https://images.pexels.com/photos/16285020/pexels-photo-16285020.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
    "https://images.pexels.com/photos/24259313/pexels-photo-24259313.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
    "https://images.pexels.com/photos/29174530/pexels-photo-29174530.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
    "https://images.pexels.com/photos/19748927/pexels-photo-19748927.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
  ],
  Studio: [
    "https://images.pexels.com/photos/6920439/pexels-photo-6920439.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
    "https://images.pexels.com/photos/7167073/pexels-photo-7167073.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
    "https://images.pexels.com/photos/6489117/pexels-photo-6489117.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
  ],
  Office: [
    "https://images.pexels.com/photos/19748927/pexels-photo-19748927.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
    "https://images.pexels.com/photos/29174530/pexels-photo-29174530.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
    "https://images.pexels.com/photos/5674684/pexels-photo-5674684.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
  ],
  Commercial: [
    "https://images.pexels.com/photos/5674684/pexels-photo-5674684.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
    "https://images.pexels.com/photos/24259313/pexels-photo-24259313.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
  ],
  Penthouse: [
    "https://images.pexels.com/photos/8134745/pexels-photo-8134745.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
    "https://images.pexels.com/photos/7031602/pexels-photo-7031602.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
  ],
  Land: [
    "https://images.pexels.com/photos/7031600/pexels-photo-7031600.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
  ],
};

export function demoImageFor(type: string | null, seed: number): string[] {
  const t = type && DEMO_IMAGES[type] ? type : "Other";
  const list = DEMO_IMAGES[t] ?? DEMO_IMAGES.Apartment;
  const n = 2 + (seed % 2);
  const out: string[] = [];
  for (let i = 0; i < n; i++) out.push(list[(seed + i) % list.length]);
  return out;
}
