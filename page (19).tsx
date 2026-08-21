"use client";

import Link from "next/link";
import { Suspense, useCallback, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useFetch } from "@/lib/hooks";
import { Badge, Button, Card, EmptyState, ErrorState, Icon, paths, Input, Select, Skeleton, Spinner } from "@/components/ui";
import type { InsightResult } from "@/lib/insights";
import { fmtDate } from "@/lib/format";

const SUGGESTIONS = [
  "What is the cheapest district?",
  "Which area has the lowest average price per square meter?",
  "Show me properties priced below the district average.",
  "Which properties look expensive compared with similar properties?",
  "Compare New Cairo with 6th of October.",
  "What property type is most common?",
  "Which area has the highest average price?",
  "Show me properties with unusually low price/m².",
];

interface HistoryItem {
  id: string;
  question: string;
  answer: InsightResult;
  createdAt: string;
}

function Answer({ a, sampleSize }: { a: InsightResult; sampleSize?: number }) {
  return (
    <div className="anim-pop space-y-4">
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="font-display text-[19px] tracking-[-0.01em]">{a.title}</h3>
          {!a.matched ? <Badge tone="amber">Interpreted as general request</Badge> : <Badge tone="pine">Matched pattern</Badge>}
        </div>
        <p className="mt-2 text-[14px] leading-relaxed text-ink-2">{a.summary}</p>
        {typeof sampleSize === "number" ? (
          <p className="mt-1.5 text-[11.5px] text-ink-3">
            Computed from <span className="tnum font-medium text-ink-2">{sampleSize.toLocaleString()}</span> listings in the current scope.
          </p>
        ) : null}
      </div>

      {a.paragraphs.length ? (
        <div className="rounded-lg border border-line bg-card p-4">
          <ul className="space-y-1.5 text-[13px] leading-relaxed text-ink-2">
            {a.paragraphs.map((p, i) => (
              <li key={i}>{p}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {a.calculations?.length ? (
        <div className="rounded-lg border border-pine/25 bg-pine-wash p-4">
          <div className="mb-2 flex items-center gap-1.5 text-[10.5px] font-semibold uppercase tracking-[0.16em] text-pine-deep">
            <Icon d={paths.check} size={11} /> The calculation
          </div>
          <div className="space-y-1 font-mono text-[12px] leading-relaxed text-pine-deep/90">
            {a.calculations.map((c, i) => (
              <div key={i}>{c}</div>
            ))}
          </div>
        </div>
      ) : null}

      {a.table ? (
        <div className="thin-scroll overflow-x-auto rounded-lg border border-line bg-card">
          <table className="w-full min-w-[420px] text-[12.5px]">
            <thead>
              <tr className="border-b border-line text-left text-[10.5px] uppercase tracking-[0.1em] text-ink-3">
                {a.table.columns.map((c) => (
                  <th key={c} className="px-4 py-2.5">{c}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {a.table.rows.map((r, i) => (
                <tr key={i} className="border-b border-line-2 last:border-0">
                  {r.map((cell, j) => (
                    <td key={j} className={`px-4 py-2.5 ${j === 0 ? "font-medium text-ink" : "tnum text-ink-2"}`}>{cell}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      {a.propertyIds?.length ? (
        <div>
          <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-3">Properties referenced</div>
          <div className="flex flex-wrap gap-2">
            {a.propertyIds.slice(0, 8).map((pid) => (
              <Link key={pid} href={`/app/properties/${pid}`} className="inline-flex h-8 items-center gap-1.5 rounded-md border border-line bg-card px-3 text-[12px] font-medium text-ink-2 transition-colors hover:border-pine hover:text-pine">
                View <Icon d={paths.arrowUpRight} size={11} />
              </Link>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function InsightsInner() {
  const sp = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const [question, setQuestion] = useState("");
  const [busy, setBusy] = useState(false);
  const [current, setCurrent] = useState<{ a: InsightResult; sampleSize?: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { data: histData, reload: reloadHist } = useFetch<{ ok: boolean; history: HistoryItem[] } | null>("/api/insights");
  const [datasets, setDatasets] = useState<{ id: string; name: string }[]>([]);

  useMemo(() => {
    fetch("/api/stats")
      .then((r) => r.json())
      .then((j) => setDatasets((j.stats?.facet?.datasets ?? []).map((d: { id: string; name: string }) => ({ id: d.id, name: d.name }))))
      .catch(() => {});
  }, []);

  const ask = useCallback(
    async (q: string) => {
      if (!q.trim() || busy) return;
      setBusy(true);
      setError(null);
      const params: Record<string, string | null> = {};
      for (const k of ["ds", "city", "district", "type", "status", "furn", "pmin", "pmax", "amin", "amax", "beds", "baths", "from", "to"]) {
        const v = sp.get(k);
        if (v) params[k] = v;
      }
      try {
        const res = await fetch("/api/insights", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ question: q, filters: params }) });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error ?? "Insight failed.");
        setCurrent({ a: json.answer, sampleSize: json.sampleSize });
        reloadHist();
      } catch (e) {
        setError((e as Error).message);
      } finally {
        setBusy(false);
      }
    },
    [busy, sp, reloadHist]
  );

  const setDs = (v: string) => {
    const next = new URLSearchParams(sp.toString());
    if (v) next.set("ds", v);
    else next.delete("ds");
    const qs = next.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  };

  const dsValue = sp.get("ds") ?? "";

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-[26px] tracking-[-0.02em]">AI market intelligence</h1>
        <p className="text-[13px] text-ink-2">Ask plain-language questions. Answers are computed only from your uploaded data — with the calculation shown.</p>
      </div>

      <Card className="p-4 sm:p-5">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            ask(question);
          }}
          className="flex flex-col gap-3 sm:flex-row"
        >
          <div className="relative flex-1">
            <Input aria-label="Ask a question" className="h-12 pr-4 text-[14px]" placeholder="e.g. Which area has the lowest average price per square meter?" value={question} onChange={(e) => setQuestion(e.target.value)} />
          </div>
          <div className="flex gap-2.5">
            <Select aria-label="Dataset scope" className="h-12 w-44" value={dsValue} onChange={(e) => setDs(e.target.value)}>
              <option value="">All datasets</option>
              {datasets.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </Select>
            <Button type="submit" size="lg" className="h-12" disabled={busy || !question.trim()}>
              {busy ? <Spinner /> : <Icon d={paths.spark} size={15} />} Ask
            </Button>
          </div>
        </form>
        <div className="mt-3 flex flex-wrap gap-2">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              onClick={() => {
                setQuestion(s);
                ask(s);
              }}
              disabled={busy}
              className="rounded-full border border-line bg-cream px-3 py-1.5 text-[12px] text-ink-2 transition-colors hover:border-pine hover:text-pine disabled:opacity-50"
            >
              {s}
            </button>
          ))}
        </div>
      </Card>

      <div className="grid gap-5 lg:grid-cols-[1.6fr_1fr]">
        <div className="space-y-5">
          {busy ? (
            <Card className="flex items-center gap-3 p-6">
              <Spinner className="text-pine" />
              <div>
                <div className="text-[13.5px] font-medium">Analyzing your listings…</div>
                <div className="text-[12px] text-ink-3">Benchmarking districts, types and price/m² percentiles</div>
              </div>
            </Card>
          ) : null}
          {error ? <ErrorState message={error} /> : null}
          {current && !busy ? <Answer a={current.a} sampleSize={current.sampleSize} /> : null}
          {!current && !busy && !error ? (
            <EmptyState
              compact
              icon={<Icon d={paths.spark} size={24} />}
              title="Ask your data a question"
              desc="The engine matches your question to a statistical pattern, runs it against your rows, and shows the arithmetic. No invented numbers."
            />
          ) : null}
        </div>

        <div>
          <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-3">Recent questions</h3>
          {histData && histData.history.length ? (
            <div className="space-y-2">
              {histData.history.slice(0, 8).map((h) => (
                <button
                  key={h.id}
                  onClick={() => setCurrent({ a: h.answer })}
                  className="anim-rise block w-full rounded-lg border border-line bg-card p-3.5 text-left transition-all hover:border-pine/40 hover:shadow-card"
                >
                  <div className="text-[13px] font-medium leading-snug text-ink">“{h.question}”</div>
                  <div className="mt-1 flex items-center gap-2 text-[11px] text-ink-3">
                    {fmtDate(h.createdAt)}
                    <span className="ml-auto">
                      {h.answer.matched ? <Badge tone="pine">answered</Badge> : <Badge tone="amber">interpreted</Badge>}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            !busy ? (
              <div className="rounded-lg border border-dashed border-line bg-cream/60 px-4 py-6 text-center text-[12.5px] text-ink-3">
                Your question history will appear here.
              </div>
            ) : null
          )}
          <div className="mt-4 rounded-lg border border-line bg-pine-wash p-4 text-[11.5px] leading-relaxed text-ink-2">
            <b className="text-pine-deep">Scope:</b> answers respect the dataset selected above. To scope by district or price range, set filters on the dashboard — they carry across the workspace.
          </div>
        </div>
      </div>
    </div>
  );
}

export default function InsightsPage() {
  return (
    <Suspense fallback={<Skeleton className="h-96" />}>
      <InsightsInner />
    </Suspense>
  );
}
