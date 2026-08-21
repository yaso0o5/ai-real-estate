"use client";

import Link from "next/link";
import { useState } from "react";
import { useFetch } from "@/lib/hooks";
import { Badge, Button, Card, EmptyState, ErrorState, Icon, Modal, paths, Skeleton, Spinner } from "@/components/ui";
import { fmtBytes, fmtDate } from "@/lib/format";

interface DatasetsResp {
  ok: boolean;
  datasets: {
    id: string;
    name: string;
    sourceFile: string | null;
    fileSize: number;
    rowCount: number;
    status: string;
    isDemo: boolean;
    createdAt: string;
  }[];
  imports: {
    id: string;
    fileName: string;
    fileSize: number;
    rowsDetected: number;
    rowsImported: number;
    rowsSkipped: number;
    status: string;
    summary: Record<string, number> | null;
    createdAt: string;
  }[];
}

export default function ImportsPage() {
  const { data, loading, error, reload } = useFetch<DatasetsResp>("/api/datasets");
  const [toDelete, setToDelete] = useState<{ id: string; name: string } | null>(null);
  const [deleting, setDeleting] = useState(false);

  const doDelete = async () => {
    if (!toDelete) return;
    setDeleting(true);
    await fetch(`/api/datasets/${toDelete.id}`, { method: "DELETE" });
    setDeleting(false);
    setToDelete(null);
    reload();
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-[26px] tracking-[-0.02em]">Import history</h1>
          <p className="text-[13px] text-ink-2">Every file you've processed — inspect, or remove datasets entirely.</p>
        </div>
        <Link href="/app/upload">
          <Button>
            <Icon d={paths.upload} size={14} /> New import
          </Button>
        </Link>
      </div>

      {error ? (
        <ErrorState message={error} retry={reload} />
      ) : loading || !data ? (
        <div className="space-y-4">
          <Skeleton className="h-48" />
          <Skeleton className="h-48" />
        </div>
      ) : (
        <>
          {/* Datasets */}
          <Card>
            <div className="border-b border-line px-5 py-4">
              <h3 className="font-display text-[16.5px]">Datasets</h3>
              <p className="mt-0.5 text-[12px] text-ink-3">Removing a dataset permanently deletes its properties and saved items.</p>
            </div>
            {data.datasets.length === 0 ? (
              <div className="px-5 py-8 text-center text-[13px] text-ink-3">No datasets yet — import your first file or load the demo.</div>
            ) : (
              <div className="thin-scroll overflow-x-auto">
                <table className="w-full min-w-[720px] text-[12.5px]">
                  <thead>
                    <tr className="border-b border-line text-left text-[10.5px] uppercase tracking-[0.1em] text-ink-3">
                      <th className="px-5 py-2.5">Dataset</th>
                      <th className="px-4 py-2.5">Source file</th>
                      <th className="px-4 py-2.5 text-right">Properties</th>
                      <th className="px-4 py-2.5">Size</th>
                      <th className="px-4 py-2.5">Status</th>
                      <th className="px-4 py-2.5">Imported</th>
                      <th className="px-4 py-2.5" />
                    </tr>
                  </thead>
                  <tbody>
                    {data.datasets.map((d) => (
                      <tr key={d.id} className="border-b border-line-2 last:border-0 hover:bg-pine-wash/40">
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-2 font-medium text-ink">
                            {d.name}
                            {d.isDemo ? <Badge tone="gold">Demo — Fictional</Badge> : null}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-ink-2">{d.sourceFile ?? "—"}</td>
                        <td className="tnum px-4 py-3 text-right font-medium">{d.rowCount.toLocaleString()}</td>
                        <td className="tnum px-4 py-3 text-ink-2">{d.fileSize ? fmtBytes(d.fileSize) : "—"}</td>
                        <td className="px-4 py-3">
                          <Badge tone={d.status === "completed" ? "pine" : "amber"}>{d.status}</Badge>
                        </td>
                        <td className="tnum px-4 py-3 text-ink-2">{fmtDate(d.createdAt)}</td>
                        <td className="px-4 py-3 text-right">
                          <button onClick={() => setToDelete({ id: d.id, name: d.name })} aria-label={`Remove ${d.name}`} className="rounded-md p-1.5 text-ink-3 transition-colors hover:bg-rust-tint hover:text-rust">
                            <Icon d={paths.trash} size={15} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>

          {/* Import log */}
          <Card>
            <div className="border-b border-line px-5 py-4">
              <h3 className="font-display text-[16.5px]">Processing log</h3>
              <p className="mt-0.5 text-[12px] text-ink-3">Row detection, validation outcomes and warnings per file</p>
            </div>
            {data.imports.length === 0 ? (
              <div className="px-5 py-8 text-center text-[13px] text-ink-3">No imports processed yet.</div>
            ) : (
              <div className="thin-scroll overflow-x-auto">
                <table className="w-full min-w-[720px] text-[12.5px]">
                  <thead>
                    <tr className="border-b border-line text-left text-[10.5px] uppercase tracking-[0.1em] text-ink-3">
                      <th className="px-5 py-2.5">File</th>
                      <th className="px-4 py-2.5">Uploaded</th>
                      <th className="px-4 py-2.5 text-right">Detected</th>
                      <th className="px-4 py-2.5 text-right">Imported</th>
                      <th className="px-4 py-2.5 text-right">Skipped</th>
                      <th className="px-4 py-2.5">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.imports.map((im) => (
                      <tr key={im.id} className="border-b border-line-2 last:border-0">
                        <td className="max-w-[240px] truncate px-5 py-3 font-medium text-ink">{im.fileName}</td>
                        <td className="tnum px-4 py-3 text-ink-2">{fmtDate(im.createdAt)}</td>
                        <td className="tnum px-4 py-3 text-right">{im.rowsDetected.toLocaleString()}</td>
                        <td className="tnum px-4 py-3 text-right text-pine-deep">{im.rowsImported.toLocaleString()}</td>
                        <td className="tnum px-4 py-3 text-right">
                          {im.rowsSkipped.toLocaleString()}
                          {im.summary && Object.values(im.summary).some((v) => v > 0) && !im.summary.demo ? (
                            <span className="ml-1.5 text-[10.5px] text-ink-3" title={Object.entries(im.summary).map(([k, v]) => `${k}: ${v}`).join(", ")}>
                              ({Object.entries(im.summary).filter(([k, v]) => v > 0 && k !== "demo").map(([k]) => k.replace(/([A-Z])/, " $1").toLowerCase().split(" ").join(" ")).join(", ")})
                            </span>
                          ) : null}
                        </td>
                        <td className="px-4 py-3">
                          <Badge tone={im.status === "completed" ? "pine" : "amber"}>{im.status}</Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </>
      )}

      <Modal open={!!toDelete} onClose={() => !deleting && setToDelete(null)} title="Remove dataset?">
        <p className="text-[13.5px] leading-relaxed text-ink-2">
          “<b className="text-ink">{toDelete?.name}</b>” and all of its properties, images and saved items will be permanently removed from your workspace. This cannot be undone.
        </p>
        <div className="mt-5 flex justify-end gap-2.5">
          <Button variant="ghost" onClick={() => setToDelete(null)} disabled={deleting}>
            Cancel
          </Button>
          <Button variant="danger" onClick={doDelete} disabled={deleting}>
            {deleting ? <Spinner /> : <Icon d={paths.trash} size={13} />} Remove dataset
          </Button>
        </div>
      </Modal>
    </div>
  );
}
