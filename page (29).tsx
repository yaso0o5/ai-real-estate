"use client";

import { Badge, Icon, paths } from "@/components/ui";
import { UploadFlow } from "@/components/UploadFlow";

export default function UploadPage() {
  return (
    <div className="space-y-6">
      <div>
        <div className="mb-1 flex items-center gap-2.5">
          <h1 className="font-display text-[26px] tracking-[-0.02em]">Import property data</h1>
          <Badge tone="outline">.xlsx · .xls · .csv</Badge>
        </div>
        <p className="text-[13px] text-ink-2">
          Upload → we detect your columns → confirm the mapping → your market appears on the dashboard. Each file becomes its own dataset in your import history.
        </p>
      </div>
      <div className="grid grid-cols-3 gap-px overflow-hidden rounded-lg border border-line bg-line">
        {[
          [paths.search, "1. Auto-detect", "18 fields matched by fuzzy name — English & Arabic"],
          [paths.filter, "2. Confirm & preview", "Adjust mappings, see row-level data-quality flags"],
          [paths.chart, "3. Analyze", "Normalized properties with computed price/m²"],
        ].map(([ic, t, b], i) => (
          <div key={i} className="anim-rise bg-card p-4" style={{ animationDelay: `${i * 70}ms` }}>
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-pine-tint text-pine">
              <Icon d={ic as string} size={14} />
            </div>
            <div className="mt-2.5 text-[13px] font-semibold">{t}</div>
            <div className="mt-1 text-[11.5px] leading-relaxed text-ink-2">{b}</div>
          </div>
        ))}
      </div>
      <UploadFlow />
    </div>
  );
}
