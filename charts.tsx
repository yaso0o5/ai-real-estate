"use client";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  LineChart,
  Line,
  ScatterChart,
  Scatter,
  PieChart,
  Pie,
  Cell,
  ComposedChart,
} from "recharts";
import { Card } from "@/components/ui";

export const TYPE_COLORS: Record<string, string> = {
  Apartment: "#274d3b",
  Villa: "#a07a3f",
  Studio: "#7d9b8a",
  Office: "#5c5546",
  Commercial: "#c2a36a",
  Land: "#8b8272",
  Penthouse: "#41635a",
  Other: "#b5ad9c",
};

const AXIS = { fontSize: 11, fill: "#8b8272" };
const GRID = "#e7e2d4";

function Tip({ active, payload, label, fmt }: { active?: boolean; payload?: { name?: string; value?: number | string; color?: string }[]; label?: string; fmt?: (v: number) => string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-md border border-line bg-cream px-3 py-2 shadow-lift">
      {label != null ? <div className="mb-1 text-[11px] font-semibold text-ink">{label}</div> : null}
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-2 text-[11.5px] text-ink-2">
          <span className="inline-block h-2 w-2 rounded-full" style={{ background: p.color ?? "#274d3b" }} />
          <span>{p.name}:</span>
          <span className="tnum font-semibold text-ink">{typeof p.value === "number" && fmt ? fmt(p.value) : p.value}</span>
        </div>
      ))}
    </div>
  );
}

export function ChartCard({ title, sub, children, h = 280, className }: { title: string; sub?: string; children: React.ReactNode; h?: number; className?: string }) {
  return (
    <Card className={className}>
      <div className="border-b border-line px-5 py-4">
        <h3 className="font-display text-[16.5px] tracking-[-0.01em]">{title}</h3>
        {sub ? <p className="mt-0.5 text-[12px] text-ink-3">{sub}</p> : null}
      </div>
      <div className="p-4" style={{ height: h }}>
        <ResponsiveContainer width="100%" height="100%">
          {children as never}
        </ResponsiveContainer>
      </div>
    </Card>
  );
}

/* Vertical bars for district comparisons */
export function DistrictBars({ data, dataKey, name, fmt, color = "#274d3b" }: { data: Record<string, unknown>[]; dataKey: string; name: string; fmt: (v: number) => string; color?: string }) {
  return (
    <BarChart data={data} margin={{ top: 8, right: 8, left: 4, bottom: 4 }}>
      <CartesianGrid vertical={false} stroke={GRID} />
      <XAxis dataKey="district" tick={AXIS} axisLine={{ stroke: GRID }} tickLine={false} interval={0} angle={-14} height={44} textAnchor="end" />
      <YAxis tick={AXIS} axisLine={false} tickLine={false} width={44} tickFormatter={(v: number) => (v >= 1e6 ? `${(v / 1e6).toFixed(1)}M` : `${Math.round(v / 1e3)}K`)} />
      <Tooltip cursor={{ fill: "rgba(39,77,59,0.06)" }} content={<Tip fmt={fmt} />} />
      <Bar dataKey={dataKey} name={name} fill={color} radius={[3, 3, 0, 0]} maxBarSize={42} isAnimationActive animationDuration={700} />
    </BarChart>
  );
}

/* Donut for type distribution */
export function TypeDonut({ data }: { data: { type: string; count: number; share: number }[] }) {
  return (
    <PieChart>
      <Pie data={data} dataKey="count" nameKey="type" innerRadius="58%" outerRadius="88%" paddingAngle={2} strokeWidth={0} isAnimationActive animationDuration={700}>
        {data.map((d) => (
          <Cell key={d.type} fill={TYPE_COLORS[d.type] ?? "#b5ad9c"} />
        ))}
      </Pie>
      <Tooltip content={<Tip />} />
    </PieChart>
  );
}

/* Time trend: volume bars + avg price line */
export function TrendChart({ data, fmt }: { data: { month: string; count: number; avgPrice: number | null }[]; fmt: (v: number) => string }) {
  return (
    <ComposedChart data={data} margin={{ top: 8, right: 8, left: 4, bottom: 4 }}>
      <CartesianGrid vertical={false} stroke={GRID} />
      <XAxis dataKey="month" tick={AXIS} axisLine={{ stroke: GRID }} tickLine={false} minTickGap={24} />
      <YAxis yAxisId="l" tick={AXIS} axisLine={false} tickLine={false} width={44} tickFormatter={(v: number) => (v >= 1e6 ? `${(v / 1e6).toFixed(1)}M` : `${Math.round(v / 1e3)}K`)} />
      <YAxis yAxisId="r" orientation="right" tick={AXIS} axisLine={false} tickLine={false} width={30} allowDecimals={false} />
      <Tooltip cursor={{ fill: "rgba(39,77,59,0.06)" }} content={<Tip fmt={fmt} />} />
      <Bar yAxisId="r" dataKey="count" name="Listings" fill="#e0dac9" radius={[3, 3, 0, 0]} maxBarSize={26} isAnimationActive animationDuration={700} />
      <Line yAxisId="l" dataKey="avgPrice" name="Avg price" stroke="#274d3b" strokeWidth={2} dot={{ r: 2.5, fill: "#274d3b" }} connectNulls isAnimationActive animationDuration={700} />
    </ComposedChart>
  );
}

/* Area vs price scatter, colored by type */
export function ScatterAP({ data }: { data: { id: string; area: number; price: number; ppm2: number | null; type: string }[] }) {
  const types = [...new Set(data.map((d) => d.type))];
  return (
    <ScatterChart margin={{ top: 8, right: 12, left: 4, bottom: 4 }}>
      <CartesianGrid stroke={GRID} />
      <XAxis type="number" dataKey="area" name="Area" tick={AXIS} axisLine={{ stroke: GRID }} tickLine={false} unit=" m²" domain={[0, "dataMax + 5%"]} />
      <YAxis type="number" dataKey="price" name="Price" tick={AXIS} axisLine={false} tickLine={false} width={48} tickFormatter={(v: number) => (v >= 1e6 ? `${(v / 1e6).toFixed(1)}M` : `${Math.round(v / 1e3)}K`)} />
      <Tooltip
        cursor={{ strokeDasharray: "3 3", stroke: "#8b8272" }}
        content={({ active, payload }) => {
          if (!active || !payload?.length) return null;
          const p = payload[0].payload as (typeof data)[0];
          return (
            <div className="rounded-md border border-line bg-cream px-3 py-2 text-[11.5px] shadow-lift">
              <div className="font-semibold text-ink">{p.type}</div>
              <div className="tnum text-ink-2">
                {p.area.toLocaleString()} m² · EGP {(p.price / 1e6).toFixed(2)}M
                {p.ppm2 ? ` · EGP ${Math.round(p.ppm2).toLocaleString()}/m²` : ""}
              </div>
            </div>
          );
        }}
      />
      {types.map((t) => (
        <Scatter key={t} name={t} data={data.filter((d) => d.type === t)} fill={TYPE_COLORS[t] ?? "#b5ad9c"} fillOpacity={0.75} isAnimationActive animationDuration={600} />
      ))}
    </ScatterChart>
  );
}

/* Histogram */
export function HistChart({ data, fmt }: { data: { label: string; count: number; from: number; to: number }[]; fmt: (v: number) => string }) {
  return (
    <BarChart data={data} margin={{ top: 8, right: 8, left: 4, bottom: 4 }}>
      <CartesianGrid vertical={false} stroke={GRID} />
      <XAxis dataKey="label" tick={AXIS} axisLine={{ stroke: GRID }} tickLine={false} interval={0} angle={-18} height={46} textAnchor="end" />
      <YAxis tick={AXIS} axisLine={false} tickLine={false} width={30} allowDecimals={false} />
      <Tooltip cursor={{ fill: "rgba(39,77,59,0.06)" }} content={<Tip fmt={fmt} />} />
      <Bar dataKey="count" name="Properties" fill="#274d3b" radius={[3, 3, 0, 0]} maxBarSize={40} isAnimationActive animationDuration={700} />
    </BarChart>
  );
}

/* Bedrooms vs average price */
export function BedChart({ data, fmt }: { data: { bedrooms: number; count: number; avgPrice: number | null }[]; fmt: (v: number) => string }) {
  const d = data.map((x) => ({ ...x, label: x.bedrooms >= 5 ? "5+" : String(x.bedrooms) }));
  return (
    <BarChart data={d} margin={{ top: 8, right: 8, left: 4, bottom: 4 }}>
      <CartesianGrid vertical={false} stroke={GRID} />
      <XAxis dataKey="label" tick={AXIS} axisLine={{ stroke: GRID }} tickLine={false} />
      <YAxis tick={AXIS} axisLine={false} tickLine={false} width={44} tickFormatter={(v: number) => (v >= 1e6 ? `${(v / 1e6).toFixed(1)}M` : `${Math.round(v / 1e3)}K`)} />
      <Tooltip cursor={{ fill: "rgba(39,77,59,0.06)" }} content={<Tip fmt={fmt} />} />
      <Bar dataKey="avgPrice" name="Avg price" fill="#a07a3f" radius={[3, 3, 0, 0]} maxBarSize={44} isAnimationActive animationDuration={700} />
    </BarChart>
  );
}

/* Line: avg ppm2 by month */
export function LineSeries({ data, dataKey, name, fmt }: { data: Record<string, unknown>[]; dataKey: string; name: string; fmt: (v: number) => string }) {
  return (
    <LineChart data={data} margin={{ top: 8, right: 8, left: 4, bottom: 4 }}>
      <CartesianGrid vertical={false} stroke={GRID} />
      <XAxis dataKey="month" tick={AXIS} axisLine={{ stroke: GRID }} tickLine={false} minTickGap={24} />
      <YAxis tick={AXIS} axisLine={false} tickLine={false} width={44} tickFormatter={(v: number) => (v >= 1e6 ? `${(v / 1e6).toFixed(1)}M` : `${Math.round(v / 1e3)}K`)} />
      <Tooltip cursor={{ stroke: "#8b8272", strokeDasharray: "3 3" }} content={<Tip fmt={fmt} />} />
      <Line dataKey={dataKey} name={name} stroke="#274d3b" strokeWidth={2} dot={false} connectNulls isAnimationActive animationDuration={700} />
    </LineChart>
  );
}
