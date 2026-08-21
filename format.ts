export function fmtMoney(v: number | null | undefined): string {
  if (v == null || Number.isNaN(v)) return "—";
  const abs = Math.abs(v);
  if (abs >= 1_000_000) {
    const m = v / 1_000_000;
    return `EGP ${m % 1 === 0 ? m.toFixed(0) : m.toFixed(m >= 10 ? 1 : 2)}M`;
  }
  if (abs >= 1_000) return `EGP ${Math.round(v / 1000).toLocaleString()}K`;
  return `EGP ${Math.round(v).toLocaleString()}`;
}

export function fmtMoneyFull(v: number | null | undefined): string {
  if (v == null || Number.isNaN(v)) return "—";
  return `EGP ${Math.round(v).toLocaleString("en-US")}`;
}

export function fmtPpm2(v: number | null | undefined): string {
  if (v == null || Number.isNaN(v) || v === 0) return "—";
  return `EGP ${Math.round(v).toLocaleString("en-US")}/m²`;
}

export function fmtArea(v: number | null | undefined): string {
  if (v == null || Number.isNaN(v)) return "—";
  return `${Math.round(v * 10) / 10} m²`;
}

export function fmtNum(v: number | null | undefined): string {
  if (v == null || Number.isNaN(v)) return "—";
  return Math.round(v).toLocaleString("en-US");
}

export function fmtDate(v: string | Date | null | undefined): string {
  if (!v) return "—";
  const d = typeof v === "string" ? new Date(v) : v;
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export function fmtBytes(v: number | null | undefined): string {
  if (!v) return "—";
  if (v >= 1024 * 1024) return `${(v / 1024 / 1024).toFixed(1)} MB`;
  if (v >= 1024) return `${(v / 1024).toFixed(0)} KB`;
  return `${v} B`;
}

export function titleCase(s: string | null | undefined): string {
  if (!s) return "—";
  return s.replace(/\w\S*/g, (w) => w[0].toUpperCase() + w.slice(1).toLowerCase());
}
