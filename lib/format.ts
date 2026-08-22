export function fmtArea(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return "—";
  return `${new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(value)} m²`;
}

export function fmtMoney(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return "—";
  const abs = Math.abs(value);
  if (abs >= 1_000_000) {
    const m = value / 1_000_000;
    return `EGP ${m % 1 === 0 ? m.toFixed(0) : m.toFixed(m >= 10 ? 1 : 2)}M`;
  }
  if (abs >= 1_000) return `EGP ${Math.round(value / 1000).toLocaleString()}K`;
  return `EGP ${Math.round(value).toLocaleString()}`;
}

export function fmtMoneyFull(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return "—";
  return `EGP ${Math.round(value).toLocaleString("en-US")}`;
}

export function fmtPpm2(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value) || value === 0) return "—";
  return `EGP ${Math.round(value).toLocaleString("en-US")}/m²`;
}

export function fmtBytes(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value) || value < 0) return "—";
  if (value < 1024) return `${value} B`;
  const units = ["KB", "MB", "GB", "TB"];
  let size = value / 1024;
  let unit = 0;
  while (size >= 1024 && unit < units.length - 1) { size /= 1024; unit++; }
  return `${size >= 10 ? size.toFixed(0) : size.toFixed(1)} ${units[unit]}`;
}

export function fmtNum(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return "—";
  return Math.round(value).toLocaleString("en-US");
}

export function fmtDate(value: string | Date | null | undefined): string {
  if (!value) return "—";
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export function titleCase(value: string | null | undefined): string {
  if (!value) return "—";
  return value.replace(/\w\S*/g, (word) => word[0].toUpperCase() + word.slice(1).toLowerCase());
}
