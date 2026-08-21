import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { inspectWorkbook, IngestError, cell, computeRowIssues, FIELDS, type Mapping, type FieldKey } from "@/lib/ingest";

const MAX_SIZE = 8 * 1024 * 1024; // 8 MB

/* Re-validate a file with a user-supplied column mapping. */
export async function PUT(req: NextRequest) {
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

  let mapping: Mapping;
  try {
    const parsed = JSON.parse(String(form.get("mapping") ?? "{}")) as Partial<Record<FieldKey, number>>;
    mapping = {} as Mapping;
    for (const f of FIELDS) mapping[f.key] = Number.isInteger(parsed[f.key]) ? (parsed[f.key] as number) : -1;
  } catch {
    return NextResponse.json({ error: "Column mapping is invalid." }, { status: 400 });
  }

  try {
    const buffer = await file.arrayBuffer();
    const inspected = await inspectWorkbook(buffer, file.name);
    const flags = computeRowIssues(inspected.rows, mapping);
    const issues = {
      invalidPrice: 0,
      invalidArea: 0,
      duplicates: 0,
      missingLocation: 0,
      invalidCoords: 0,
      missingPrice: 0,
    };
    flags.forEach((fl) => {
      if (fl.invalidPrice) issues.invalidPrice++;
      if (fl.invalidArea) issues.invalidArea++;
      if (fl.duplicate) issues.duplicates++;
      if (fl.missingLocation) issues.missingLocation++;
      if (fl.invalidCoords) issues.invalidCoords++;
      if (fl.missingPrice) issues.missingPrice++;
    });
    const willImport = flags.filter((f) => !f.invalidPrice && !f.duplicate && !f.missingPrice).length;
    return NextResponse.json({ ok: true, issues, willImport, rowCount: inspected.rowCount, headers: inspected.headers });
  } catch (e) {
    if (e instanceof IngestError) return NextResponse.json({ error: e.message }, { status: 422 });
    console.error("recheck", e);
    return NextResponse.json({ error: "We couldn't read this file." }, { status: 500 });
  }
}

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
  if (file.size > MAX_SIZE) return NextResponse.json({ error: "File is too large (max 8 MB). Export a smaller subset and retry." }, { status: 400 });
  if (file.size === 0) return NextResponse.json({ error: "The file is empty (0 bytes)." }, { status: 400 });

  try {
    const buffer = await file.arrayBuffer();
    const inspected = await inspectWorkbook(buffer, file.name);
    const sample = inspected.rows.slice(0, 10).map((row) =>
      inspected.headers.map((_, i) => {
        const v = cell(row, i);
        if (v == null) return "";
        if (v instanceof Date) return v.toISOString().slice(0, 10);
        return String(v).slice(0, 60);
      })
    );
    return NextResponse.json({
      ok: true,
      fileName: file.name,
      fileSize: file.size,
      sheetName: inspected.sheetName,
      rowCount: inspected.rowCount,
      headers: inspected.headers,
      suggestions: inspected.suggestions,
      issues: inspected.issues,
      sample,
    });
  } catch (e) {
    if (e instanceof IngestError) return NextResponse.json({ error: e.message }, { status: 422 });
    console.error("upload", e);
    return NextResponse.json({ error: "We couldn't read this file. Please check it and try again." }, { status: 500 });
  }
}
