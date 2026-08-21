"use client";

import { useEffect, useState } from "react";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { useFetch } from "@/lib/hooks";
import { Badge, Button, Card, EmptyState, ErrorState, Field, Icon, paths, Select, Skeleton, Spinner } from "@/components/ui";
import { fmtMoney, fmtPpm2 } from "@/lib/format";

interface Report {
  title: string;
  generatedAt: string;
  scope: string;
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
  byDistrict: { district: string; city: string | null; count: number; avgPrice: number | null; medianPrice: number | null; avgPpm2: number | null; medianPpm2: number | null; minPrice: number | null; maxPrice: number | null }[];
  byType: { type: string; count: number; share: number; avgPrice: number | null; avgPpm2: number | null }[];
  histogram: { label: string; count: number }[];
  opportunities: { id: string; title: string; kind: string; price: number | null; pricePerSqm: number | null; district: string | null; detail: string }[];
  outliers: { id: string; title: string; kind: string; detail: string; price: number | null }[];
  summary: string[];
}

interface DatasetsResp {
  ok: boolean;
  datasets: { id: string; name: string; isDemo: boolean }[];
}
interface HistoryResp {
  ok: boolean;
  reports: { id: string; title: string; createdAt: string; content: Report }[];
}

export default function ReportsPage() {
  const { data: dsData } = useFetch<DatasetsResp>("/api/datasets");
  const { data: histData, reload: reloadHist } = useFetch<HistoryResp | null>("/api/reports");
  const [scope, setScope] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<Report | null>(null);
  const [pdfBusy, setPdfBusy] = useState(false);

  useEffect(() => {
    if (histData?.reports.length && !report) {
      /* keep latest available for reference; user still can regenerate */
    }
  }, [histData, report]);

  const generate = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/reports", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ datasetId: scope || undefined }) });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Report generation failed.");
      setReport(json.report as Report);
      reloadHist();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const downloadPdf = () => {
    if (!report) return;
    setPdfBusy(true);
    setTimeout(() => {
      try {
        const doc = new jsPDF({ unit: "pt", format: "a4" });
        const W = doc.internal.pageSize.getWidth();
        doc.setFont("times", "bold");
        doc.setFontSize(20);
        doc.setTextColor(33, 29, 21);
        doc.text("PropertyIQ — Market Intelligence Report", 48, 56);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        doc.setTextColor(120, 112, 96);
        doc.text(`Generated ${new Date(report.generatedAt).toUTCString()}  ·  Scope: ${report.scope}  ·  ${report.metrics.total.toLocaleString()} listings`, 48, 74);
        doc.setDrawColor(210, 203, 186);
        doc.line(48, 84, W - 48, 84);

        let y = 104;
        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        doc.setTextColor(39, 77, 59);
        doc.text("1. Executive summary", 48, y);
        y += 14;
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9.5);
        doc.setTextColor(60, 55, 45);
        for (const para of report.summary) {
          const lines = doc.splitTextToSize(para, W - 96);
          if (y + lines.length * 12 > 800) {
            doc.addPage();
            y = 56;
          }
          doc.text(lines, 48, y);
          y += lines.length * 12 + 6;
        }

        y += 8;
        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        doc.setTextColor(39, 77, 59);
        doc.text("2. Dataset summary", 48, y);
        autoTable(doc, {
          startY: y + 8,
          theme: "grid",
          styles: { font: "helvetica", fontSize: 9, cellPadding: 5, lineColor: [226, 220, 204] },
          headStyles: { fillColor: [39, 77, 59], textColor: 250 },
          head: [["Metric", "Value"], ["Total properties", String(report.metrics.total)], ["Average price", fmtMoney(report.metrics.avgPrice)], ["Median price", fmtMoney(report.metrics.medianPrice)], ["Average price / m²", fmtPpm2(report.metrics.avgPpm2)], ["Median price / m²", fmtPpm2(report.metrics.medianPpm2)], ["Price range", `${fmtMoney(report.metrics.minPrice)} — ${fmtMoney(report.metrics.maxPrice)}`]],
        });

        const after1 = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY;
        let y2 = after1 + 28;
        if (y2 > 700) {
          doc.addPage();
          y2 = 56;
        }
        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        doc.setTextColor(39, 77, 59);
        doc.text("3. Area comparison", 48, y2);
        autoTable(doc, {
          startY: y2 + 8,
          theme: "grid",
          styles: { font: "helvetica", fontSize: 9, cellPadding: 5, lineColor: [226, 220, 204] },
          headStyles: { fillColor: [39, 77, 59], textColor: 250 },
          head: [["District", "City", "Listings", "Avg price", "Median", "Avg /m²"]],
          body: report.byDistrict.map((d) => [d.district, d.city ?? "—", String(d.count), fmtMoney(d.avgPrice), fmtMoney(d.medianPrice), fmtPpm2(d.avgPpm2)]),
        });
        const after2 = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY;
        let y3 = after2 + 28;
        if (y3 > 700) {
          doc.addPage();
          y3 = 56;
        }
        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        doc.text("4. Property type breakdown", 48, y3);
        autoTable(doc, {
          startY: y3 + 8,
          theme: "grid",
          styles: { font: "helvetica", fontSize: 9, cellPadding: 5, lineColor: [226, 220, 204] },
          headStyles: { fillColor: [39, 77, 59], textColor: 250 },
          head: [["Type", "Listings", "Share", "Avg price", "Avg /m²"]],
          body: report.byType.map((t) => [t.type, String(t.count), `${Math.round(t.share * 100)}%`, fmtMoney(t.avgPrice), fmtPpm2(t.avgPpm2)]),
        });

        const after3 = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY;
        let y4 = after3 + 28;
        if (y4 > 700) {
          doc.addPage();
          y4 = 56;
        }
        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        doc.text("5. Top opportunities & outliers (data-based signals)", 48, y4);
        autoTable(doc, {
          startY: y4 + 8,
          theme: "grid",
          styles: { font: "helvetica", fontSize: 8.5, cellPadding: 5, lineColor: [226, 220, 204] },
          headStyles: { fillColor: [160, 122, 63], textColor: 250 },
          head: [["Property", "Signal", "Price", "District"]],
          body: [
            ...report.opportunities.slice(0, 8).map((o) => [o.title.slice(0, 44), o.kind, fmtMoney(o.price), o.district ?? "—"]),
            ...report.outliers.slice(0, 6).map((o) => [o.title.slice(0, 44), `outlier: ${o.kind}`, fmtMoney(o.price), "—"]),
          ],
        });

        const pages = doc.getNumberOfPages();
        for (let i = 1; i <= pages; i++) {
          doc.setPage(i);
          doc.setFont("helvetica", "italic");
          doc.setFontSize(8);
          doc.setTextColor(150, 143, 126);
          doc.text("Signals are data-based statistical observations, not professional investment advice.", 48, doc.internal.pageSize.getHeight() - 32);
          doc.text(`PropertyIQ · page ${i} of ${pages}`, W - 48, doc.internal.pageSize.getHeight() - 32, { align: "right" });
        }
        doc.save("propertyiq-market-report.pdf");
      } catch (e) {
        console.error(e);
      } finally {
        setPdfBusy(false);
      }
    }, 50);
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-[26px] tracking-[-0.02em]">Market report</h1>
        <p className="text-[13px] text-ink-2">Generate a document-style intelligence report from your market — view it here or export to PDF.</p>
      </div>

      <Card className="flex flex-col gap-3 p-4 sm:flex-row sm:items-end">
        <Field label="Report scope" className="flex-1">
          <Select value={scope} onChange={(e) => setScope(e.target.value)}>
            <option value="">All datasets (entire workspace)</option>
            {(dsData?.datasets ?? []).map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
                {d.isDemo ? " (demo — fictional)" : ""}
              </option>
            ))}
          </Select>
        </Field>
        <Button size="lg" onClick={generate} disabled={busy || !(dsData?.datasets ?? []).length}>
          {busy ? <Spinner /> : <Icon d={paths.doc} size={15} />} Generate report
        </Button>
      </Card>

      {error ? <ErrorState message={error} /> : null}

      {busy ? (
        <div className="space-y-3">
          <Skeleton className="h-10 w-2/3" />
          <Skeleton className="h-40" />
          <Skeleton className="h-64" />
        </div>
      ) : report ? (
        <div className="anim-rise mx-auto max-w-3xl">
          <div className="overflow-hidden rounded-lg border border-line bg-card shadow-lift">
            <div className="border-b border-line bg-cream px-7 py-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-pine">PropertyIQ</div>
                  <h2 className="mt-1.5 font-display text-[24px] leading-tight tracking-[-0.02em]">{report.title}</h2>
                  <div className="mt-2 text-[12px] text-ink-3">
                    {new Date(report.generatedAt).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })} · Scope: {report.scope} · {report.metrics.total.toLocaleString()} listings
                  </div>
                </div>
                <Button variant="dark" onClick={downloadPdf} disabled={pdfBusy}>
                  {pdfBusy ? <Spinner /> : <Icon d={paths.download} size={14} />} PDF
                </Button>
              </div>
            </div>

            <div className="space-y-8 px-7 py-6">
              <Section n="01" title="Executive summary">
                <div className="space-y-3 text-[13.5px] leading-relaxed text-ink-2">
                  {report.summary.map((p, i) => (
                    <p key={i}>{p}</p>
                  ))}
                </div>
              </Section>

              <Section n="02" title="Dataset summary">
                <div className="grid grid-cols-2 gap-px overflow-hidden rounded-md border border-line bg-line sm:grid-cols-3">
                  {[
                    ["Total properties", String(report.metrics.total)],
                    ["Average price", fmtMoney(report.metrics.avgPrice)],
                    ["Median price", fmtMoney(report.metrics.medianPrice)],
                    ["Average /m²", fmtPpm2(report.metrics.avgPpm2)],
                    ["Median /m²", fmtPpm2(report.metrics.medianPpm2)],
                    ["Price range", `${fmtMoney(report.metrics.minPrice)} – ${fmtMoney(report.metrics.maxPrice)}`],
                  ].map(([l, v]) => (
                    <div key={l} className="bg-card px-4 py-3">
                      <div className="text-[9.5px] font-semibold uppercase tracking-[0.14em] text-ink-3">{l}</div>
                      <div className="tnum mt-1 font-display text-[17px]">{v}</div>
                    </div>
                  ))}
                </div>
              </Section>

              <Section n="03" title="Area comparison">
                <div className="thin-scroll overflow-x-auto">
                  <table className="w-full min-w-[560px] text-[12.5px]">
                    <thead>
                      <tr className="border-b border-line text-left text-[10px] uppercase tracking-[0.12em] text-ink-3">
                        <th className="py-2 pr-3">District</th>
                        <th className="py-2 pr-3 text-right">Listings</th>
                        <th className="py-2 pr-3 text-right">Avg price</th>
                        <th className="py-2 pr-3 text-right">Median</th>
                        <th className="py-2 text-right">Avg /m²</th>
                      </tr>
                    </thead>
                    <tbody>
                      {report.byDistrict.map((d) => (
                        <tr key={d.district} className="border-b border-line-2 last:border-0">
                          <td className="py-2 pr-3 font-medium">{d.district}</td>
                          <td className="tnum py-2 pr-3 text-right">{d.count}</td>
                          <td className="tnum py-2 pr-3 text-right">{fmtMoney(d.avgPrice)}</td>
                          <td className="tnum py-2 pr-3 text-right text-ink-2">{fmtMoney(d.medianPrice)}</td>
                          <td className="tnum py-2 text-right text-pine-deep">{fmtPpm2(d.avgPpm2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Section>

              <div className="grid gap-8 sm:grid-cols-2">
                <Section n="04" title="Property types">
                  <ul className="space-y-2.5">
                    {report.byType.map((t) => (
                      <li key={t.type}>
                        <div className="flex justify-between text-[12.5px]">
                          <span className="font-medium">{t.type}</span>
                          <span className="tnum text-ink-2">{t.count} · {Math.round(t.share * 100)}%</span>
                        </div>
                        <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-line-2">
                          <div className="anim-growbar h-full rounded-full bg-pine" style={{ width: `${Math.max(4, t.share * 100)}%` }} />
                        </div>
                      </li>
                    ))}
                  </ul>
                </Section>
                <Section n="05" title="Price distribution">
                  <div className="flex h-28 items-end gap-1">
                    {report.histogram.map((h) => {
                      const max = Math.max(...report.histogram.map((x) => x.count), 1);
                      return (
                        <div key={h.label} className="flex flex-1 flex-col items-center gap-1">
                          <div className="w-full rounded-t-[2px] bg-pine/85" style={{ height: `${(h.count / max) * 88}%`, minHeight: h.count ? 4 : 1 }} title={`${h.label}: ${h.count}`} />
                        </div>
                      );
                    })}
                  </div>
                  <div className="mt-1.5 flex justify-between text-[9.5px] text-ink-3">
                    <span>{report.histogram[0]?.label}</span>
                    <span>{report.histogram[report.histogram.length - 1]?.label}</span>
                  </div>
                </Section>
              </div>

              <Section n="06" title={`Top opportunities (${report.opportunities.length})`}>
                {report.opportunities.length ? (
                  <ul className="space-y-2">
                    {report.opportunities.slice(0, 6).map((o) => (
                      <li key={o.id + o.kind} className="flex items-start gap-3 rounded-md border border-line-2 bg-cream/60 px-3 py-2.5">
                        <Badge tone={o.kind === "high-ppm2" ? "gold" : "pine"}>{o.kind.replace("-", " ")}</Badge>
                        <div className="min-w-0">
                          <div className="truncate text-[12.5px] font-medium">{o.title}</div>
                          <div className="text-[11.5px] leading-relaxed text-ink-2">{o.detail}</div>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-[12.5px] text-ink-3">No opportunity signals in scope.</p>
                )}
              </Section>

              <Section n="07" title={`Outliers (${report.outliers.length})`}>
                {report.outliers.length ? (
                  <ul className="space-y-2">
                    {report.outliers.slice(0, 6).map((o) => (
                      <li key={o.id + o.kind} className="rounded-md border border-line-2 bg-cream/60 px-3 py-2.5">
                        <div className="flex items-center gap-2">
                          <Badge tone="rust">{o.kind.replace("-", " ")}</Badge>
                          <span className="truncate text-[12.5px] font-medium">{o.title}</span>
                        </div>
                        <div className="mt-1 text-[11.5px] leading-relaxed text-ink-2">{o.detail}</div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-[12.5px] text-ink-3">No outliers detected in scope.</p>
                )}
              </Section>

              <p className="border-t border-line pt-4 text-[11px] italic leading-relaxed text-ink-3">
                All figures in this report are computed exclusively from the property dataset selected above. Opportunities and outliers are data-based statistical signals — not professional investment advice.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <EmptyState
          icon={<Icon d={paths.doc} size={26} />}
          title="No report yet"
          desc="Generate a full market report — executive summary, district comparison, type breakdown, price distribution, top opportunities and outliers — then export it as a PDF."
        />
      )}

      {histData && histData.reports.length ? (
        <div>
          <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-3">Previous reports</h3>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {histData.reports.slice(0, 6).map((r) => (
              <button
                key={r.id}
                onClick={() => setReport(r.content as Report)}
                className="anim-rise rounded-lg border border-line bg-card p-3.5 text-left transition-all hover:border-pine/40 hover:shadow-card"
              >
                <div className="flex items-center gap-2 text-pine">
                  <Icon d={paths.doc} size={13} />
                  <span className="text-[12px] font-semibold">{new Date(r.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</span>
                </div>
                <div className="mt-1 line-clamp-1 text-[12px] text-ink-2">{(r.content as Report)?.scope ?? r.title}</div>
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function Section({ n, title, children }: { n: string; title: string; children: React.ReactNode }) {
  return (
    <section>
      <div className="mb-3 flex items-baseline gap-2.5 border-b border-line pb-2">
        <span className="font-display text-[13px] text-pine">{n}</span>
        <h3 className="font-display text-[17px] tracking-[-0.01em]">{title}</h3>
      </div>
      {children}
    </section>
  );
}
