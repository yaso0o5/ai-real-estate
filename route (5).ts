import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { datasets, imports, properties } from "@/db/schema";
import { getSessionUser } from "@/lib/auth";
import { inspectWorkbook, IngestError, computeRowIssues, normalizeRow, FIELDS, type Mapping, type FieldKey } from "@/lib/ingest";

const MAX_SIZE = 8 * 1024 * 1024;
const MAX_ROWS = 20000;

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Please sign in to upload data." }, { status: 401 });

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "The upload was not a valid file upload." }, { status: 400 });
  }
  const file = form.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "No file received." }, { status: 400 });
  if (file.size > MAX_SIZE) return NextResponse.json({ error: "File is too large (max 8 MB)." }, { status: 400 });

  const rawMapping = form.get("mapping");
  let mapping: Mapping;
  try {
    const parsed = JSON.parse(String(rawMapping ?? "{}")) as Partial<Record<FieldKey, number>>;
    mapping = {} as Mapping;
    for (const f of FIELDS) mapping[f.key] = Number.isInteger(parsed[f.key]) ? (parsed[f.key] as number) : -1;
  } catch {
    return NextResponse.json({ error: "Column mapping is invalid." }, { status: 400 });
  }
  if (mapping.price < 0) return NextResponse.json({ error: "The Price column is required — map at least the price field." }, { status: 400 });
  if (mapping.area < 0) return NextResponse.json({ error: "The Area column is required for price/m² analysis — map the area field." }, { status: 400 });

  const name = typeof form.get("name") === "string" ? String(form.get("name")).trim().slice(0, 120) : "";
  const datasetName = name || file.name.replace(/\.(xlsx|xls|csv|txt)$/i, "");

  let buffer: ArrayBuffer;
  try {
    buffer = await file.arrayBuffer();
  } catch {
    return NextResponse.json({ error: "Could not read the uploaded file." }, { status: 400 });
  }

  let inspected;
  try {
    inspected = await inspectWorkbook(buffer, file.name);
  } catch (e) {
    if (e instanceof IngestError) return NextResponse.json({ error: e.message }, { status: 422 });
    console.error("import", e);
    return NextResponse.json({ error: "We couldn't read this file." }, { status: 500 });
  }
  if (inspected.rowCount > MAX_ROWS) {
    return NextResponse.json({ error: `This file has ${inspected.rowCount.toLocaleString()} rows — the limit is ${MAX_ROWS.toLocaleString()}. Export a subset and retry.` }, { status: 422 });
  }
  // Ensure mapped indices are within header range
  for (const f of FIELDS) {
    if (mapping[f.key] >= inspected.headers.length) mapping[f.key] = -1;
  }

  const flags = computeRowIssues(inspected.rows, mapping);
  const propRows: {
    userId: string;
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
    sourceFile: string;
  }[] = [];
  const warnings = { missingPrice: 0, duplicates: 0, invalidArea: 0, missingLocation: 0, invalidCoords: 0, invalidPrice: 0 };
  inspected.rows.forEach((row, i) => {
    const fl = flags[i];
    if (fl.invalidPrice) {
      warnings.invalidPrice++;
      return;
    }
    if (fl.duplicate) {
      warnings.duplicates++;
      return;
    }
    if (fl.missingPrice) {
      warnings.missingPrice++;
      return;
    }
    if (fl.invalidArea) warnings.invalidArea++;
    if (fl.missingLocation) warnings.missingLocation++;
    if (fl.invalidCoords) warnings.invalidCoords++;
    const n = normalizeRow(row, mapping);
    propRows.push({ userId: user.id, ...n, sourceFile: file.name });
  });

  if (!propRows.length) {
    return NextResponse.json({ error: "No valid rows to import — every row is missing a usable price or is a duplicate. Check your mapping and try again." }, { status: 422 });
  }

  const [ds] = await db
    .insert(datasets)
    .values({ userId: user.id, name: datasetName, sourceFile: file.name, fileSize: file.size, rowCount: propRows.length, status: "completed", isDemo: false })
    .returning({ id: datasets.id });

  await db.insert(properties).values(propRows.map((p) => ({ ...p, datasetId: ds.id })));
  await db.insert(imports).values({
    userId: user.id,
    datasetId: ds.id,
    fileName: file.name,
    fileSize: file.size,
    rowsDetected: inspected.rowCount,
    rowsImported: propRows.length,
    rowsSkipped: inspected.rowCount - propRows.length,
    status: "completed",
    summary: warnings,
  });

  return NextResponse.json({ ok: true, datasetId: ds.id, imported: propRows.length, skipped: inspected.rowCount - propRows.length, warnings });
}
