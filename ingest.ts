import * as XLSX from "xlsx";

/* ------------------------------------------------------------------ */
/* Field definitions + fuzzy column detection                          */
/* ------------------------------------------------------------------ */

export type FieldKey =
  | "id"
  | "title"
  | "price"
  | "area"
  | "location"
  | "city"
  | "district"
  | "address"
  | "propertyType"
  | "bedrooms"
  | "bathrooms"
  | "floor"
  | "furnished"
  | "status"
  | "listingDate"
  | "latitude"
  | "longitude"
  | "description";

interface FieldDef {
  key: FieldKey;
  label: string;
  hint: string;
  synonyms: string[];
}

export const FIELDS: FieldDef[] = [
  { key: "id", label: "Property ID", hint: "Unique reference number", synonyms: ["id", "propertyid", "listingid", "ref", "reference", "code", "رقم", "رقم العقار", "المعرف"] },
  { key: "title", label: "Property name", hint: "Title or unit name", synonyms: ["title", "name", "propertyname", "property", "unit", "listing", "العقار", "اسم", "اسم العقار", "الوحدة", "العقارات"] },
  { key: "price", label: "Price", hint: "Total price (required)", synonyms: ["price", "propertyprice", "saleprice", "totalprice", "amount", "cost", "value", "sellingprice", "السعر", "السعر المطلوب", "سعر", "قيمة العقار", "priceegp"] },
  { key: "area", label: "Area", hint: "Size in m² (required)", synonyms: ["area", "size", "sqm", "sqmeters", "squaremeters", "surface", "areaqm", "المساحة", "مساحة", "المساحه", "المساحة بالمتر"] },
  { key: "location", label: "Location", hint: "Free-text location", synonyms: ["location", "region", "place", "الموقع", "المكان", "الموقع الجغرافي"] },
  { key: "city", label: "City", hint: "City name", synonyms: ["city", "governorate", "cityname", "المدينة", "المدينه", "محافظه", "المحافظة"] },
  { key: "district", label: "District", hint: "Neighborhood / area / compound", synonyms: ["district", "neighborhood", "zone", "compound", "area name", "الحي", "المنطقة", "المدينه الصغيره", "المجمع"] },
  { key: "address", label: "Address", hint: "Full street address", synonyms: ["address", "fulladdress", "street", "العنوان", "عنوان"] },
  { key: "propertyType", label: "Property type", hint: "Apartment, villa, office…", synonyms: ["type", "propertytype", "kind", "category", "unittype", "نوع", "النوع", "نوع العقار", "نوع الوحدة"] },
  { key: "bedrooms", label: "Bedrooms", hint: "Number of bedrooms", synonyms: ["bedrooms", "beds", "br", "bedcount", "غرف", "غرف نوم", "عدد الغرف", "عدد الغرفات"] },
  { key: "bathrooms", label: "Bathrooms", hint: "Number of bathrooms", synonyms: ["bathrooms", "baths", "ba", "bathcount", "حمامات", "دورات المياه", "عدد الحمامات", "حمام"] },
  { key: "floor", label: "Floor", hint: "Floor level", synonyms: ["floor", "level", "الدور", "الطابق", "الطبقه", "الدور المطلوب"] },
  { key: "furnished", label: "Furnished", hint: "Yes / No", synonyms: ["furnished", "furnishing", "furnishedyn", "مفروش", "مفروشة", "التجهيز"] },
  { key: "status", label: "Status", hint: "For sale, sold…", synonyms: ["status", "state", "listingstatus", "الحالة", "حالة", "حالة العقار"] },
  { key: "listingDate", label: "Listing date", hint: "When it was listed", synonyms: ["listingdate", "date", "created", "posted", "published", "datecreated", "تاريخ", "تاريخ النشر", "تاريخ الاضافة", "التاريخ"] },
  { key: "latitude", label: "Latitude", hint: "Decimal latitude", synonyms: ["latitude", "lat", "y", "خط العرض", "خط عرض"] },
  { key: "longitude", label: "Longitude", hint: "Decimal longitude", synonyms: ["longitude", "lng", "lon", "long", "x", "خط الطول", "خط طول"] },
  { key: "description", label: "Description", hint: "Free-text notes", synonyms: ["description", "notes", "details", "desc", "الوصف", "ملاحظات", "وصف"] },
];

export function normalizeHeader(h: unknown): string {
  return String(h ?? "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u064b-\u065f\u0670]/g, "")
    .replace(/[^a-z0-9\u0600-\u06ff]+/g, "");
}

function scoreFor(header: string, synonyms: string[]): number {
  if (!header) return 0;
  let best = 0;
  for (const syn of synonyms) {
    if (header === syn) return 3;
    if (header.length >= 3 && syn.length >= 3) {
      if (header.startsWith(syn) || syn.startsWith(header)) best = Math.max(best, 2);
      if (header.includes(syn) || syn.includes(header)) best = Math.max(best, 1);
    }
  }
  return best;
}

export function detectColumns(headers: string[]): Record<FieldKey, number> {
  const norm = headers.map(normalizeHeader);
  const result = {} as Record<FieldKey, number>;
  const taken = new Set<number>();
  for (const f of FIELDS) {
    let bestIdx = -1;
    let bestScore = 0;
    norm.forEach((h, i) => {
      const s = scoreFor(h, f.synonyms);
      if (s > bestScore || (s === bestScore && s > 0 && i < bestIdx)) {
        bestScore = s;
        bestIdx = i;
      }
    });
    if (bestScore >= 2 && !taken.has(bestIdx)) {
      result[f.key] = bestIdx;
      taken.add(bestIdx);
    } else {
      result[f.key] = -1;
    }
  }
  return result;
}

/* ------------------------------------------------------------------ */
/* Value parsers                                                       */
/* ------------------------------------------------------------------ */

export function parseNumber(v: unknown): number | null {
  if (v == null || v === "") return null;
  if (typeof v === "number") return Number.isFinite(v) ? v : null;
  let s = String(v)
    .toLowerCase()
    .replace(/egp|e\.g\.p|g\.e\.p|ل\.م|ج\.م|ر\.س|aed|usd|gbp|د\.إ|gns|\s|,/g, "")
    .replace(/[£$€]/g, "");
  if (!s) return null;
  let mult = 1;
  const m = s.match(/^([0-9.]+)\s*(m|k)$/);
  if (m) {
    mult = m[2] === "m" ? 1_000_000 : 1_000;
    s = m[1];
  }
  if (s.includes(".") && s.includes(",")) s = s.replace(/,/g, "");
  const n = parseFloat(s);
  if (!Number.isFinite(n)) return null;
  return n * mult;
}

export function parsePositiveNumber(v: unknown): number | null {
  const n = parseNumber(v);
  return n != null && n > 0 ? n : null;
}

export function parseBool(v: unknown): boolean | null {
  if (typeof v === "boolean") return v;
  if (v == null || v === "") return null;
  const s = String(v).toLowerCase().trim();
  if (["yes", "y", "true", "1", "ف", "نعم", "مفروش", "مفروشة", "furnished"].includes(s)) return true;
  if (["no", "n", "false", "0", "لا", "غير مفروش", "غير مفروشة", "unfurnished"].includes(s)) return false;
  return null;
}

export function parseDate(v: unknown): string | null {
  if (v == null || v === "") return null;
  if (v instanceof Date) {
    if (Number.isNaN(v.getTime())) return null;
    return v.toISOString().slice(0, 10);
  }
  const s = String(v).trim();
  const iso = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (iso) {
    return `${iso[1]}-${iso[2].padStart(2, "0")}-${iso[3].padStart(2, "0")}`;
  }
  const dmy = s.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})$/);
  if (dmy) {
    let [a, b, c] = [dmy[1], dmy[2], dmy[3]];
    if (c.length === 2) c = `20${c}`;
    // Assume DD/MM/YYYY if first part > 12
    if (parseInt(a, 10) > 12) return `${c}-${b.padStart(2, "0")}-${a.padStart(2, "0")}`;
    return `${c}-${a.padStart(2, "0")}-${b.padStart(2, "0")}`;
  }
  const t = Date.parse(s);
  if (Number.isNaN(t)) return null;
  return new Date(t).toISOString().slice(0, 10);
}

export function parseLat(v: unknown): number | null {
  const n = parseNumber(v);
  if (n == null || n < -90 || n > 90) return null;
  if (n === 0) return null;
  return n;
}

export function parseLng(v: unknown): number | null {
  const n = parseNumber(v);
  if (n == null || n < -180 || n > 180) return null;
  if (n === 0) return null;
  return n;
}

const TYPE_RULES: Array<[RegExp, string]> = [
  [/apart|شقة|شقه/, "Apartment"],
  [/villa|فيلا|قصر|house|دار|منزل/, "Villa"],
  [/studio|استوديو/, "Studio"],
  [/office|مكتب|مكاتب|commercial office/, "Office"],
  [/commercial|تجار|محل|shop|market|store|مخزن/, "Commercial"],
  [/land|أرض|ارض|قطعة|قطعه|plot|زمالة|فدان/, "Land"],
  [/penthouse|بنتهاوس/, "Penthouse"],
];

export function normalizeType(v: unknown): string | null {
  if (v == null || v === "") return null;
  const s = String(v).toLowerCase().trim();
  for (const [re, name] of TYPE_RULES) if (re.test(s)) return name;
  return "Other";
}

export function normalizeStatus(v: unknown): string | null {
  if (v == null || String(v).trim() === "") return null;
  const s = String(v).trim();
  const map: Record<string, string> = {
    "for sale": "For Sale",
    "لبيع": "For Sale",
    "للبيع": "For Sale",
    available: "For Sale",
    active: "For Sale",
    sold: "Sold",
    "تم البيع": "Sold",
    rented: "Rented",
    "للايجار": "Rented",
    "for rent": "Rented",
    pending: "Pending",
  };
  return map[s.toLowerCase()] ?? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
}

/* ------------------------------------------------------------------ */
/* Workbook inspection                                                 */
/* ------------------------------------------------------------------ */

export interface InspectedWorkbook {
  sheetName: string;
  headers: string[];
  rows: unknown[][];
  rowCount: number;
  suggestions: Record<FieldKey, number>;
  issues: {
    invalidPrice: number;
    invalidArea: number;
    duplicates: number;
    missingLocation: number;
    invalidCoords: number;
    missingPrice: number;
  };
}

export async function inspectWorkbook(buffer: ArrayBuffer, fileName: string): Promise<InspectedWorkbook> {
  const ext = fileName.split(".").pop()?.toLowerCase();
  if (!["xlsx", "xls", "csv", "txt"].includes(ext ?? "")) {
    throw new IngestError(`Unsupported file type ".${ext}". Please upload an .xlsx, .xls or .csv file.`);
  }
  let wb: XLSX.WorkBook;
  try {
    // codepage 65001 = UTF-8 (SheetJS defaults CSV decoding to cp1252 otherwise)
    wb = XLSX.read(buffer, { type: "array", cellDates: true, codepage: 65001 });
  } catch {
    throw new IngestError("This file could not be read — it may be corrupted or password-protected. Try re-exporting it from Excel.");
  }
  const sheetName = wb.SheetNames[0];
  if (!sheetName) throw new IngestError("The workbook contains no sheets.");
  const ws = wb.Sheets[sheetName];
  const raw = XLSX.utils.sheet_to_json<unknown[]>(ws, { header: 1, defval: null, raw: true });
  const dataRows = raw.filter((r) => Array.isArray(r) && r.some((c) => c != null && String(c).trim() !== ""));
  if (dataRows.length < 2) {
    throw new IngestError("The spreadsheet appears to be empty — at least a header row and one data row are required.");
  }
  const headerRow = dataRows[0].map((h) => (h == null ? "" : String(h).trim()));
  const used = headerRow.filter((h) => h !== "").length;
  if (used < 2) throw new IngestError("We couldn't find a usable header row. Make sure the first row contains column names.");
  const body = dataRows.slice(1);
  const headers = headerRow.map((h, i) => h || `Column ${i + 1}`);
  const suggestions = detectColumns(headers);

  const issues = { invalidPrice: 0, invalidArea: 0, duplicates: 0, missingLocation: 0, invalidCoords: 0, missingPrice: 0 };
  const pi = suggestions.price;
  const ai = suggestions.area;
  const seen = new Set<string>();
  for (const row of body) {
    const p = pi >= 0 ? parsePositiveNumber(row[pi]) : null;
    if (p == null) issues.missingPrice++;
    else if (p > 1e10) issues.invalidPrice++;
    const a = ai >= 0 ? parsePositiveNumber(row[ai]) : null;
    if (a == null || a > 1e7) issues.invalidArea++;
    const key = [pi >= 0 ? row[pi] : "", ai >= 0 ? row[ai] : "", suggestions.district >= 0 ? row[suggestions.district] ?? "" : "", suggestions.title >= 0 ? row[suggestions.title] ?? "" : ""]
      .map(String)
      .join("|");
    if (key !== "|||") {
      if (seen.has(key)) issues.duplicates++;
      seen.add(key);
    }
    if ((suggestions.district < 0 || !row[suggestions.district]) && (suggestions.city < 0 || !row[suggestions.city]) && (suggestions.location < 0 || !row[suggestions.location])) {
      issues.missingLocation++;
    }
    if (suggestions.latitude >= 0 || suggestions.longitude >= 0) {
      const lat = parseLat(row[suggestions.latitude]);
      const lng = parseLng(row[suggestions.longitude]);
      if ((suggestions.latitude >= 0 && row[suggestions.latitude] != null) !== (suggestions.longitude >= 0 && row[suggestions.longitude] != null) || (row[suggestions.latitude] != null && (lat == null || lng == null))) issues.invalidCoords++;
    }
  }
  return { sheetName, headers, rows: body, rowCount: body.length, suggestions, issues };
}

export class IngestError extends Error {
  constructor(msg: string) {
    super(msg);
    this.name = "IngestError";
  }
}

/* ------------------------------------------------------------------ */
/* Row normalization + row-level issue flags                           */
/* ------------------------------------------------------------------ */

export type Mapping = Record<FieldKey, number>;

export interface RowFlags {
  invalidPrice: boolean;
  invalidArea: boolean;
  duplicate: boolean;
  missingLocation: boolean;
  invalidCoords: boolean;
  missingPrice: boolean;
}

export interface NormalizedRow {
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
  description: string | null;
}

export function cell(row: unknown[], idx: number): unknown {
  if (idx < 0) return null;
  return row[idx] ?? null;
}

export function computeRowIssues(rows: unknown[][], mapping: Mapping): RowFlags[] {
  const seen = new Map<string, number>();
  return rows.map((row) => {
    const price = parsePositiveNumber(cell(row, mapping.price));
    const area = parsePositiveNumber(cell(row, mapping.area));
    const lat = parseLat(cell(row, mapping.latitude));
    const lng = parseLng(cell(row, mapping.longitude));
    const latRaw = cell(row, mapping.latitude);
    const lngRaw = cell(row, mapping.longitude);
    const coordsPresent = latRaw != null || lngRaw != null;
    const key = [cell(row, mapping.price), cell(row, mapping.area), cell(row, mapping.district), cell(row, mapping.title), cell(row, mapping.id)]
      .filter((v) => v != null && String(v).trim() !== "")
      .map(String)
      .join("|");
    const dupCount = seen.get(key) ?? 0;
    seen.set(key, dupCount + 1);
    return {
      invalidPrice: price != null && price > 1e10,
      invalidArea: area == null || area > 1e7,
      duplicate: key !== "" && dupCount > 0,
      missingLocation: !cell(row, mapping.district) && !cell(row, mapping.city) && !cell(row, mapping.location) && !cell(row, mapping.address),
      invalidCoords: coordsPresent && (lat == null || lng == null),
      missingPrice: price == null,
    };
  });
}

export function normalizeRow(row: unknown[], mapping: Mapping): NormalizedRow {
  const g = <T extends FieldKey>(k: T) => cell(row, mapping[k]);
  const price = parsePositiveNumber(g("price"));
  const area = parsePositiveNumber(g("area"));
  const rawTitle = g("title");
  const rawId = g("id");
  const title =
    rawTitle != null && String(rawTitle).trim() !== ""
      ? String(rawTitle).trim().slice(0, 140)
      : rawId != null && String(rawId).trim() !== ""
        ? `Property ${String(rawId).trim()}`
        : "Untitled property";
  const beds = parseNumber(g("bedrooms"));
  const baths = parseNumber(g("bathrooms"));
  const fl = parseNumber(g("floor"));
  return {
    title,
    price: price != null ? Math.round(price) : null,
    area: area != null ? Math.round(area * 100) / 100 : null,
    pricePerSqm: price != null && area != null && area > 0 ? Math.round(price / area) : null,
    propertyType: normalizeType(g("propertyType")),
    city: g("city") != null ? String(g("city")).trim().slice(0, 80) : null,
    district:
      g("district") != null && String(g("district")).trim() !== ""
        ? String(g("district")).trim().slice(0, 80)
        : g("location") != null && String(g("location")).trim() !== ""
          ? String(g("location")).trim().slice(0, 80)
          : null,
    address: g("address") != null ? String(g("address")).trim().slice(0, 200) : null,
    bedrooms: beds != null && Number.isInteger(beds) && beds >= 0 && beds <= 20 ? beds : null,
    bathrooms: baths != null && Number.isInteger(baths) && baths >= 0 && baths <= 20 ? baths : null,
    floor: fl != null && fl >= -10 && fl <= 200 ? Math.round(fl) : null,
    furnished: parseBool(g("furnished")),
    status: normalizeStatus(g("status")),
    listingDate: parseDate(g("listingDate")),
    latitude: parseLat(g("latitude")),
    longitude: parseLng(g("longitude")),
    description: g("description") != null ? String(g("description")).trim().slice(0, 2000) : null,
  };
}


