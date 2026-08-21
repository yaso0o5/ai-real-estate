"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Badge, Button, cn, Field, Icon, Input, paths, Select, Spinner } from "@/components/ui";
import { FIELDS, computeRowIssues, type FieldKey, type Mapping } from "@/lib/ingest";
import { fmtBytes } from "@/lib/format";

type Step = "upload" | "map" | "importing" | "done";

interface Inspected {
  fileName: string;
  fileSize: number;
  sheetName: string;
  rowCount: number;
  headers: string[];
  suggestions: Record<FieldKey, number>;
  issues: Record<string, number>;
  sample: string[][];
}

interface Issues {
  invalidPrice: number;
  invalidArea: number;
  duplicates: number;
  missingLocation: number;
  invalidCoords: number;
  missingPrice: number;
}

const STAGES = ["Uploading file", "Parsing workbook", "Validating rows", "Importing properties"];
const CORE_FIELDS: FieldKey[] = ["price", "area", "title", "district", "city", "propertyType"];
const MORE_FIELDS: FieldKey[] = ["bedrooms", "bathrooms", "floor", "furnished", "status", "listingDate", "address", "latitude", "longitude", "id", "description", "location"];

export function UploadFlow() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("upload");
  const [drag, setDrag] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [inspected, setInspected] = useState<Inspected | null>(null);
  const [mapping, setMapping] = useState<Mapping | null>(null);
  const [issues, setIssues] = useState<Issues | null>(null);
  const [willImport, setWillImport] = useState<number | null>(null);
  const [checking, setChecking] = useState(false);
  const [name, setName] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [stage, setStage] = useState(0);
  const [demoBusy, setDemoBusy] = useState(false);
  const [result, setResult] = useState<{ imported: number; skipped: number; warnings: Record<string, number>; demo?: boolean } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const recheckRef = useRef(0);

  const handleFile = useCallback(async (f: File) => {
    setError(null);
    setBusy(true);
    const fd = new FormData();
    fd.append("file", f);
    try {
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Upload failed.");
      setInspected(json);
      const m = {} as Mapping;
      for (const fdef of FIELDS) m[fdef.key] = json.suggestions[fdef.key] ?? -1;
      setMapping(m);
      setIssues(json.issues);
      setWillImport(json.rowCount - (json.issues.missingPrice ?? 0) - (json.issues.duplicates ?? 0) - (json.issues.invalidPrice ?? 0));
      setName(f.name.replace(/\.(xlsx|xls|csv|txt)$/i, ""));
      setFile(f);
      setStep("map");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }, []);

  /* re-validate on the server whenever the mapping changes */
  useEffect(() => {
    if (step !== "map" || !file || !mapping) return;
    const id = ++recheckRef.current;
    setChecking(true);
    const t = setTimeout(async () => {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("mapping", JSON.stringify(mapping));
      try {
        const res = await fetch("/api/upload", { method: "PUT", body: fd });
        const json = await res.json();
        if (id !== recheckRef.current) return;
        if (res.ok) {
          setIssues(json.issues);
          setWillImport(json.willImport);
        }
      } finally {
        if (id === recheckRef.current) setChecking(false);
      }
    }, 400);
    return () => clearTimeout(t);
  }, [mapping, step, file]);

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDrag(false);
    const f = e.dataTransfer.files?.[0];
    if (f) handleFile(f);
  };

  const confirmImport = async () => {
    if (!file || !mapping) return;
    setStep("importing");
    setStage(0);
    setError(null);
    const t = setInterval(() => setStage((s) => Math.min(s + 1, STAGES.length - 1)), 550);
    const fd = new FormData();
    fd.append("file", file);
    fd.append("mapping", JSON.stringify(mapping));
    fd.append("name", name);
    try {
      const res = await fetch("/api/datasets/import", { method: "POST", body: fd });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Import failed.");
      setResult({ imported: json.imported, skipped: json.skipped, warnings: json.warnings ?? {} });
      setStep("done");
      router.refresh();
    } catch (e) {
      setError((e as Error).message);
      setStep("map");
    } finally {
      clearInterval(t);
    }
  };

  const loadDemo = async () => {
    setDemoBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/datasets", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "demo" }) });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Could not load demo data.");
      setResult({ imported: json.count ?? 160, skipped: 0, warnings: {}, demo: true });
      setStep("done");
      router.refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setDemoBusy(false);
    }
  };

  const reset = () => {
    setStep("upload");
    setInspected(null);
    setMapping(null);
    setResult(null);
    setError(null);
    setFile(null);
  };

  /* ------------------------------ upload ------------------------------ */
  if (step === "upload") {
    return (
      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div>
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDrag(true);
            }}
            onDragLeave={() => setDrag(false)}
            onDrop={onDrop}
            className={cn(
              "anim-rise relative flex min-h-[320px] flex-col items-center justify-center rounded-lg border-2 border-dashed bg-card px-6 py-12 text-center transition-all duration-200",
              drag ? "scale-[1.005] border-pine bg-pine-wash" : "border-line"
            )}
          >
            {busy ? (
              <>
                <Spinner className="mb-4 h-6 w-6 text-pine" />
                <p className="text-[14px] font-medium text-ink-2">Reading your spreadsheet…</p>
                <p className="mt-1 text-[12.5px] text-ink-3">Detecting columns and validating values</p>
              </>
            ) : (
              <>
                <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-pine-tint text-pine">
                  <Icon d={paths.upload} size={22} strokeWidth={1.4} />
                </div>
                <h3 className="font-display text-xl tracking-[-0.01em]">Drop your property file here</h3>
                <p className="mt-2 max-w-sm text-[13px] leading-relaxed text-ink-2">
                  We'll auto-detect price, area, location and 15 other fields — even when column names are in Arabic or free-form.
                </p>
                <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
                  <Button onClick={() => inputRef.current?.click()}>
                    <Icon d={paths.upload} size={14} /> Choose file
                  </Button>
                  <span className="text-[11.5px] text-ink-3">.xlsx · .xls · .csv — up to 8 MB, 20,000 rows</span>
                </div>
                <input
                  ref={inputRef}
                  type="file"
                  accept=".xlsx,.xls,.csv,.txt"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleFile(f);
                    e.target.value = "";
                  }}
                />
              </>
            )}
          </div>
          {error ? (
            <div className="anim-pop mt-4 flex items-start gap-3 rounded-lg border border-rust/30 bg-rust-tint px-4 py-3">
              <span className="mt-0.5 text-rust">
                <Icon d={paths.x} size={14} />
              </span>
              <div>
                <p className="text-[13px] font-semibold text-rust">Upload problem</p>
                <p className="mt-0.5 text-[12.5px] text-rust/90">{error}</p>
              </div>
            </div>
          ) : null}
        </div>

        <div className="anim-rise space-y-4" style={{ animationDelay: "80ms" }}>
          <div className="rounded-lg border border-line bg-card p-5 shadow-card">
            <h4 className="font-display text-[16px]">No file handy?</h4>
            <p className="mt-1.5 text-[13px] leading-relaxed text-ink-2">
              Explore the full platform with a realistic fictional market — 160 listings across 8 Greater Cairo districts, with coordinates, price spreads and embedded outliers.
            </p>
            <div className="mt-4">
              <Button variant="dark" onClick={loadDemo} disabled={demoBusy}>
                {demoBusy ? <Spinner /> : <Icon d={paths.spark} size={14} />} Load demo dataset
              </Button>
            </div>
            <div className="mt-3">
              <Badge tone="gold">Demo Dataset — Fictional Data</Badge>
            </div>
          </div>
          <div className="rounded-lg border border-line bg-pine-wash p-5">
            <h4 className="font-display text-[16px] text-pine-deep">What we detect automatically</h4>
            <ul className="mt-3 grid grid-cols-1 gap-x-4 gap-y-1.5 text-[12.5px] text-ink-2 sm:grid-cols-2">
              {["Price — السعر, Sale Price…", "Area — المساحة, Sqm…", "Location — المنطقة…", "Bedrooms — غرف…", "Furnished — مفروش…", "Latitude / Longitude", "Listing date — تاريخ", "Property type — النوع"].map((x) => (
                <li key={x} className="flex items-center gap-1.5">
                  <span className="text-pine">
                    <Icon d={paths.check} size={11} />
                  </span>{" "}
                  {x}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    );
  }

  /* ------------------------------ map ------------------------------ */
  if (step === "map" && inspected && mapping) {
    const sampleFlags = computeRowIssues(inspected.sample.map((r) => r.map((v) => v || null)), mapping);
    const canImport = mapping.price >= 0 && mapping.area >= 0;
    const def = (k: FieldKey) => FIELDS.find((f) => f.key === k)!;

    const issueChips: { label: string; value: number | null; tone: string }[] = [
      { label: "Missing price", value: issues?.missingPrice ?? null, tone: "text-rust bg-rust-tint" },
      { label: "Invalid price", value: issues?.invalidPrice ?? null, tone: "text-rust bg-rust-tint" },
      { label: "Invalid area", value: issues?.invalidArea ?? null, tone: "text-amberx bg-amberx-tint" },
      { label: "Duplicates", value: issues?.duplicates ?? null, tone: "text-amberx bg-amberx-tint" },
      { label: "Missing location", value: issues?.missingLocation ?? null, tone: "text-ink-2 bg-ink/6" },
      { label: "Bad coordinates", value: issues?.invalidCoords ?? null, tone: "text-ink-2 bg-ink/6" },
    ];

    const mapSelect = (k: FieldKey) => (
      <div className="flex items-center gap-2">
        <span className="w-32 shrink-0 text-[12px] font-medium text-ink-2" title={def(k).hint}>
          {def(k).label}
          {k === "price" || k === "area" ? <span className="text-rust"> *</span> : null}
        </span>
        <Select
          className="h-9 min-w-0 flex-1 text-[12.5px]"
          value={String(mapping[k])}
          onChange={(e) => setMapping({ ...mapping, [k]: parseInt(e.target.value, 10) })}
          aria-label={`Map ${def(k).label}`}
        >
          <option value="-1">Not mapped</option>
          {inspected.headers.map((h, i) => (
            <option key={i} value={i}>
              {h}
            </option>
          ))}
        </Select>
      </div>
    );

    return (
      <div className="space-y-5">
        <div className="anim-rise flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-[22px] tracking-[-0.02em]">Confirm the column mapping</h2>
            <p className="mt-1 text-[13px] text-ink-2">
              <span className="tnum font-medium text-ink">{inspected.rowCount.toLocaleString()} rows</span> · {inspected.fileName} · {fmtBytes(inspected.fileSize)} · sheet “{inspected.sheetName}”
            </p>
          </div>
          <div className="flex items-center gap-2">
            {checking ? (
              <span className="flex items-center gap-1.5 text-[12px] text-ink-3">
                <Spinner className="h-3.5 w-3.5" /> Re-checking…
              </span>
            ) : null}
            <Button variant="ghost" onClick={reset}>
              <Icon d={paths.x} size={13} /> Discard
            </Button>
          </div>
        </div>

        <div className="grid gap-5 lg:grid-cols-[380px_1fr]">
          <div className="space-y-4">
            <div className="anim-rise rounded-lg border border-line bg-card p-4 shadow-card">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-3">Core fields</h3>
                {canImport ? <Badge tone="pine"><Icon d={paths.check} size={10} /> Ready</Badge> : <Badge tone="rust">Price & Area required</Badge>}
              </div>
              <div className="space-y-2.5">{CORE_FIELDS.map((k) => mapSelect(k))}</div>
            </div>
            <div className="anim-rise rounded-lg border border-line bg-card p-4 shadow-card" style={{ animationDelay: "60ms" }}>
              <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-3">Additional fields</h3>
              <div className="space-y-2.5">{MORE_FIELDS.map((k) => mapSelect(k))}</div>
            </div>
            <div className="anim-rise rounded-lg border border-line bg-card p-4 shadow-card" style={{ animationDelay: "120ms" }}>
              <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-3">Data quality</h3>
              <div className="grid grid-cols-2 gap-2">
                {issueChips.map((c) => (
                  <div key={c.label} className={cn("rounded-md px-2.5 py-2", c.tone)}>
                    <div className="tnum text-[16px] font-semibold leading-none">{c.value ?? "—"}</div>
                    <div className="mt-0.5 text-[10.5px] opacity-80">{c.label}</div>
                  </div>
                ))}
              </div>
              <div className="mt-3 flex items-center justify-between rounded-md bg-pine-tint px-3 py-2 text-pine-deep">
                <span className="text-[12px] font-medium">Will be imported</span>
                <span className="tnum font-display text-[17px]">{willImport != null ? willImport.toLocaleString() : "…"}</span>
              </div>
              <Field label="Dataset name" className="mt-3">
                <Input value={name} onChange={(e) => setName(e.target.value)} maxLength={120} />
              </Field>
            </div>
          </div>

          <div className="anim-rise rounded-lg border border-line bg-card shadow-card" style={{ animationDelay: "80ms" }}>
            <div className="flex items-center justify-between border-b border-line-2 px-4 py-3">
              <h3 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-3">Preview — first {inspected.sample.length} rows</h3>
              <span className="text-[11px] text-ink-3">Flagged cells highlighted</span>
            </div>
            <div className="thin-scroll max-h-[520px] overflow-auto">
              <table className="w-full border-collapse text-[12px]">
                <thead className="sticky top-0 z-10">
                  <tr className="bg-cream text-left">
                    <th className="border-b border-line px-3 py-2 text-[10.5px] font-semibold text-ink-3">Flags</th>
                    {inspected.headers.map((h, i) => (
                      <th key={i} className="whitespace-nowrap border-b border-line px-3 py-2 text-[11px] font-semibold text-ink-2">
                        {h}
                        <span className="ml-1.5 rounded bg-pine-tint px-1 py-px text-[9px] font-medium text-pine-deep">
                          {FIELDS.find((f) => mapping[f.key] === i)?.label ?? ""}
                        </span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {inspected.sample.map((row, ri) => {
                    const fl = sampleFlags[ri];
                    return (
                      <tr key={ri} className="anim-fade" style={{ animationDelay: `${ri * 30}ms` }}>
                        <td className="border-b border-line-2 px-3 py-2">
                          <div className="flex gap-1">
                            {fl.missingPrice && <span title="Missing price" className="h-2 w-2 rounded-full bg-rust" />}
                            {fl.invalidPrice && <span title="Invalid price" className="h-2 w-2 rounded-full bg-rust" />}
                            {fl.invalidArea && <span title="Invalid area" className="h-2 w-2 rounded-full bg-amberx" />}
                            {fl.duplicate && <span title="Duplicate" className="h-2 w-2 rounded-full bg-amberx" />}
                            {fl.missingLocation && <span title="Missing location" className="h-2 w-2 rounded-full bg-ink-3" />}
                            {fl.invalidCoords && <span title="Invalid coordinates" className="h-2 w-2 rounded-full bg-ink-3" />}
                          </div>
                        </td>
                        {row.map((cellv, ci) => {
                          const isPrice = mapping.price === ci;
                          const isArea = mapping.area === ci;
                          const badPrice = isPrice && (fl.missingPrice || fl.invalidPrice);
                          const badArea = isArea && fl.invalidArea;
                          return (
                            <td
                              key={ci}
                              className={cn(
                                "whitespace-nowrap border-b border-line-2 px-3 py-2 text-ink-2",
                                !cellv && "text-ink-3/50",
                                badPrice && "bg-rust-tint font-medium text-rust",
                                badArea && "bg-amberx-tint font-medium text-amberx",
                                fl.duplicate && "opacity-60"
                              )}
                            >
                              {cellv || (isPrice || isArea ? "missing" : "—")}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line-2 px-4 py-3">
              <p className="text-[11.5px] text-ink-3">
                Rows with missing/invalid prices or duplicates are skipped on import. Areas, locations and coordinates are kept best-effort.
              </p>
              <Button size="lg" disabled={!canImport || checking} onClick={confirmImport}>
                Confirm & import {willImport != null ? `(${willImport.toLocaleString()})` : ""} <Icon d={paths.arrow} size={15} />
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ------------------------------ importing ------------------------------ */
  if (step === "importing") {
    return (
      <div className="anim-fade mx-auto max-w-md py-16 text-center">
        <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-pine-tint text-pine">
          <Spinner className="h-6 w-6" />
        </div>
        <h3 className="font-display text-xl">Importing your market…</h3>
        <div className="mx-auto mt-6 max-w-xs space-y-2.5">
          {STAGES.map((s, i) => (
            <div key={s} className={cn("flex items-center gap-2.5 text-[13px] transition-all", i < stage ? "text-pine" : i === stage ? "text-ink" : "text-ink-3/50")}>
              {i < stage ? (
                <Icon d={paths.check} size={13} className="text-pine" />
              ) : i === stage ? (
                <Spinner className="h-3.5 w-3.5" />
              ) : (
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-line" />
              )}
              {s}
            </div>
          ))}
        </div>
      </div>
    );
  }

  /* ------------------------------ done ------------------------------ */
  if (step === "done" && result) {
    const warnEntries = Object.entries(result.warnings).filter(([, v]) => (v as number) > 0);
    return (
      <div className="anim-pop mx-auto max-w-lg py-10 text-center">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-pine text-cream">
          <Icon d={paths.check} size={26} strokeWidth={2} />
        </div>
        <h2 className="font-display text-[26px] tracking-[-0.02em]">
          {result.imported.toLocaleString()} properties imported
        </h2>
        <p className="mt-2 text-[13.5px] text-ink-2">
          {result.demo ? (
            <>
              Demo market loaded. <Badge tone="gold" className="mx-1">Demo Dataset — Fictional Data</Badge>
            </>
          ) : (
            <>
              {result.skipped > 0 ? `${result.skipped} row${result.skipped === 1 ? " was" : "s were"} skipped. ` : ""}Your dataset is now part of your workspace.
            </>
          )}
        </p>
        {warnEntries.length > 0 && !result.demo ? (
          <div className="mx-auto mt-5 max-w-sm rounded-lg border border-line bg-card p-4 text-left shadow-card">
            <h4 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-3">Kept with warnings</h4>
            <ul className="mt-2 space-y-1 text-[12.5px] text-ink-2">
              {warnEntries.map(([k, v]) => (
                <li key={k} className="flex justify-between">
                  <span className="capitalize">{k.replace(/([A-Z])/g, " $1").toLowerCase()}</span>
                  <span className="tnum font-medium">{v as number}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
        <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
          <Button size="lg" onClick={() => router.push("/app")}>
            Explore the dashboard <Icon d={paths.arrow} size={15} />
          </Button>
          <Button variant="outline" size="lg" onClick={reset}>
            Import another file
          </Button>
        </div>
      </div>
    );
  }

  return null;
}
