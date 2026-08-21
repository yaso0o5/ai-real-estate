import { avg, median, quantile, type StatRow } from "@/lib/stats";
import { fmtMoney, fmtPpm2 } from "@/lib/format";

export interface InsightTable {
  columns: string[];
  rows: (string | number)[][];
}

export interface InsightResult {
  title: string;
  summary: string;
  paragraphs: string[];
  calculations: string[];
  table?: InsightTable;
  propertyIds?: string[];
  matched: boolean;
}

function group(arr: StatRow[], key: (r: StatRow) => string | null): Map<string, StatRow[]> {
  const m = new Map<string, StatRow[]>();
  for (const r of arr) {
    const k = key(r);
    if (k == null) continue;
    (m.get(k) ?? m.set(k, []).get(k)!).push(r);
  }
  return m;
}

function districtStats(rows: StatRow[]) {
  return [...group(rows, (r) => r.district ?? null).entries()].map(([district, list]) => {
    const ps = list.filter((r) => r.price != null).map((r) => r.price as number);
    const pp = list.filter((r) => r.pricePerSqm != null).map((r) => r.pricePerSqm as number);
    return { district, n: list.length, avgPrice: avg(ps), medianPrice: median(ps), avgPpm2: avg(pp), medianPpm2: median(pp) };
  });
}

export function answerQuestion(question: string, rows: StatRow[]): InsightResult {
  const q = question.toLowerCase().replace(/[?!.]/g, " ").trim();
  if (rows.length < 3) {
    return {
      title: "Not enough data",
      summary: "The current selection has fewer than 3 properties, so I can't compute reliable statistics. Widen your filters or import more data.",
      paragraphs: ["Statistics need a minimum sample size — I won't report numbers on a dataset this small."],
      calculations: [`n = ${rows.length}`],
      matched: false,
    };
  }

  const districts = districtStats(rows);
  const named = districts.filter((d) => d.n >= 3 && d.district !== "Unspecified");

  /* ---- Compare X with Y ---- */
  const cmp = q.match(/compare\s+(.+?)\s+(?:with|and|vs\.?)\s+(.+)$/);
  if (cmp) {
    const find = (name: string) => {
      const n = name.trim();
      return (
        named.find((d) => d.district.toLowerCase() === n) ??
        named.find((d) => d.district.toLowerCase().includes(n) || n.includes(d.district.toLowerCase())) ??
        rows.some((r) => (r.district ?? "").toLowerCase().includes(n))
          ? { district: name.trim(), n: rows.filter((r) => (r.district ?? "").toLowerCase().includes(n)).length, avgPrice: null, medianPrice: null, avgPpm2: null, medianPpm2: null }
          : null
      );
    };
    const a = find(cmp[1]);
    const b = find(cmp[2]);
    if (a && b && "avgPrice" in a && a.avgPrice != null && b.avgPrice != null) {
      const diff = b.avgPrice! - a.avgPrice!;
      const cheaper = diff > 0 ? a.district : b.district;
      return {
        title: `${a.district} vs ${b.district}`,
        summary: `${cheaper} is ${fmtMoney(Math.abs(diff))} ${diff > 0 ? "cheaper" : "more expensive"} on average — ${Math.round((Math.abs(diff) / Math.max(a.avgPrice, b.avgPrice) * 100))}% difference.`,
        paragraphs: [
          a.avgPpm2 != null && b.avgPpm2 != null
            ? `On a like-for-like basis, ${a.district} trades at ${fmtPpm2(a.avgPpm2)} versus ${fmtPpm2(b.avgPpm2)} in ${b.district} — ${fmtPpm2(Math.abs(a.avgPpm2 - b.avgPpm2))} apart.`
            : "Price/m² is not available for both areas.",
          `${a.district} has ${a.n} listings in the current selection, ${b.district} has ${b.n}. Medians: ${fmtMoney(a.medianPrice)} vs ${fmtMoney(b.medianPrice)}.`,
        ],
        calculations: [
          `Δ price = ${fmtMoney(b.avgPrice)} − ${fmtMoney(a.avgPrice)} = ${fmtMoney(diff)}`,
          `Δ /m² = ${b.avgPpm2 != null && a.avgPpm2 != null ? `EGP ${Math.round(b.avgPpm2 - a.avgPpm2).toLocaleString()}/m²` : "n/a"}`,
        ],
        table: {
          columns: ["District", "Listings", "Avg price", "Median price", "Avg /m²", "Median /m²"],
          rows: [a, b].map((d) => [d.district, d.n, fmtMoney(d.avgPrice), fmtMoney(d.medianPrice), fmtPpm2(d.avgPpm2), fmtPpm2(d.medianPpm2)]),
        },
        matched: true,
      };
    }
  }

  /* ---- Below district average ---- */
  if (/below (the )?(district|area|local|market) average/.test(q)) {
    const list: { r: StatRow; dAvg: number }[] = [];
    for (const r of rows) {
      if (r.price == null || !r.district) continue;
      const same = rows.filter((x) => x.district === r.district && x.price != null);
      if (same.length >= 3) {
        const a = avg(same.map((x) => x.price as number)) as number;
        if (r.price < a) list.push({ r, dAvg: a });
      }
    }
    list.sort((x, y) => x.r.price! / x.dAvg - y.r.price! / y.dAvg);
    const top = list.slice(0, 8);
    if (!top.length) {
      return { title: "Below district average", summary: "No property in the current selection is priced below its own district average.", paragraphs: [], calculations: [], matched: true };
    }
    return {
      title: "Priced below the district average",
      summary: `${list.length} propert${list.length === 1 ? "y" : "ies"} in the current selection are priced below their district average — the ${list.length === 1 ? "strongest" : "top candidates"} are listed below.`,
      paragraphs: top.map(({ r, dAvg }) => `• ${r.title} — ${fmtMoney(r.price)} vs district avg ${fmtMoney(dAvg)} (${Math.round((1 - r.price! / dAvg) * 100)}% below)`),
      calculations: top.slice(0, 3).map(({ r, dAvg }) => `${fmtMoney(r.price)} < ${fmtMoney(dAvg)} (avg of district)`),
      propertyIds: top.map((t) => t.r.id),
      table: { columns: ["Property", "Price", "District avg", "Δ"], rows: top.map(({ r, dAvg }) => [r.title.slice(0, 38), fmtMoney(r.price), fmtMoney(dAvg), `${Math.round((1 - r.price! / dAvg) * 100)}% below`]) },
      matched: true,
    };
  }

  /* ---- Expensive vs similar ---- */
  if (/(expensive|overpriced|premium).*(similar|comparable|peers)|look expensive/.test(q)) {
    const list: { r: StatRow; ratio: number; med: number }[] = [];
    for (const r of rows) {
      if (r.pricePerSqm == null) continue;
      const similar = rows.filter((x) => x.pricePerSqm != null && (x.district ?? "Unspecified") === (r.district ?? "Unspecified") && (x.propertyType ?? "Other") === (r.propertyType ?? "Other"));
      if (similar.length < 3) continue;
      const med = median(similar.map((x) => x.pricePerSqm as number)) as number;
      const ratio = r.pricePerSqm / med;
      if (ratio > 1.25) list.push({ r, ratio, med });
    }
    list.sort((a, b) => b.ratio - a.ratio);
    const top = list.slice(0, 8);
    if (!top.length) {
      return { title: "Expensive vs similar", summary: "No property in the current selection trades more than 25% above its similar-property median. Pricing looks consistent.", paragraphs: [], calculations: ["Threshold: price/m² > 1.25 × median of same district + type (min 3 comparables)"], matched: true };
    }
    return {
      title: "Priced above similar properties",
      summary: `${list.length} listing${list.length === 1 ? "" : "s"} trade at least 25% above the median price/m² of comparable properties (same district + type).`,
      paragraphs: top.map(({ r, ratio, med }) => `• ${r.title} — ${fmtPpm2(r.pricePerSqm)} vs comparable median ${fmtPpm2(med)} (${ratio.toFixed(2)}×)`),
      calculations: top.slice(0, 3).map(({ r, med }) => `EGP ${Math.round(r.pricePerSqm!).toLocaleString()} ÷ EGP ${Math.round(med).toLocaleString()} (comparable median) = ${(r.pricePerSqm! / med).toFixed(2)}×`),
      propertyIds: top.map((t) => t.r.id),
      matched: true,
    };
  }

  /* ---- Cheapest district ---- */
  if (/cheapest (district|area|neighborhood|locality)/.test(q)) {
    if (!named.length) return { title: "Cheapest district", summary: "Not enough properties per district to rank averages (minimum 3).", paragraphs: [], calculations: [], matched: false };
    const ranked = [...named].sort((a, b) => a.avgPrice! - b.avgPrice!);
    const top3 = ranked.slice(0, 3);
    return {
      title: "Cheapest districts by average price",
      summary: `${top3[0].district} is the cheapest district in your data — average ${fmtMoney(top3[0].avgPrice)} across ${top3[0].n} listings.`,
      paragraphs: top3.map((d) => `• ${d.district} — avg ${fmtMoney(d.avgPrice)} (median ${fmtMoney(d.medianPrice)}, ${d.n} listings)`),
      calculations: [`${top3[0].district}: Σ prices ÷ ${top3[0].n} = ${fmtMoney(top3[0].avgPrice)}`],
      table: { columns: ["District", "Listings", "Avg price", "Median"], rows: top3.map((d) => [d.district, d.n, fmtMoney(d.avgPrice), fmtMoney(d.medianPrice)]) },
      matched: true,
    };
  }

  /* ---- Highest average price district ---- */
  if (/(highest|most expensive).*(average )?price|expensive (district|area)/.test(q) && !/m²|per (m|meter|square)/.test(q)) {
    if (!named.length) return { title: "Most expensive district", summary: "Not enough properties per district to rank averages (minimum 3).", paragraphs: [], calculations: [], matched: false };
    const ranked = [...named].sort((a, b) => b.avgPrice! - a.avgPrice!);
    const top3 = ranked.slice(0, 3);
    return {
      title: "Most expensive districts by average price",
      summary: `${top3[0].district} commands the highest average price — ${fmtMoney(top3[0].avgPrice)} across ${top3[0].n} listings.`,
      paragraphs: top3.map((d) => `• ${d.district} — avg ${fmtMoney(d.avgPrice)} (median ${fmtMoney(d.medianPrice)})`),
      calculations: [`${top3[0].district}: Σ prices ÷ ${top3[0].n} = ${fmtMoney(top3[0].avgPrice)}`],
      table: { columns: ["District", "Listings", "Avg price", "Median"], rows: top3.map((d) => [d.district, d.n, fmtMoney(d.avgPrice), fmtMoney(d.medianPrice)]) },
      matched: true,
    };
  }

  /* ---- Lowest / highest price per m² ---- */
  if (/price per (square )?m(eter|²|2)|price\/m²|\/m²|per m2/.test(q)) {
    const low = /lowest|cheapest|least/.test(q);
    const ranked = [...named].filter((d) => d.avgPpm2 != null).sort((a, b) => (low ? a.avgPpm2! - b.avgPpm2! : b.avgPpm2! - a.avgPpm2!));
    if (!ranked.length) return { title: "Price per m²", summary: "Not enough price/m² data per district to rank areas.", paragraphs: [], calculations: [], matched: false };
    const top3 = ranked.slice(0, 3);
    return {
      title: low ? "Lowest average price/m²" : "Highest average price/m²",
      summary: `${top3[0].district} has the ${low ? "lowest" : "highest"} average price per square meter — ${fmtPpm2(top3[0].avgPpm2)}.`,
      paragraphs: top3.map((d) => `• ${d.district} — ${fmtPpm2(d.avgPpm2)} (median ${fmtPpm2(d.medianPpm2)}, ${d.n} listings)`),
      calculations: [`${top3[0].district}: average of ${d2(top3[0].n)} listings' price/m² = ${fmtPpm2(top3[0].avgPpm2)}`],
      table: { columns: ["District", "Listings", "Avg /m²", "Median /m²"], rows: top3.map((d) => [d.district, d.n, fmtPpm2(d.avgPpm2), fmtPpm2(d.medianPpm2)]) },
      matched: true,
    };
  }

  /* ---- Unusually low price/m² ---- */
  if (/unusually low|abnormally low|low price\/m|low price per m|cheapest per m/.test(q)) {
    const list: { r: StatRow; p10: number; med: number }[] = [];
    for (const r of rows) {
      if (r.pricePerSqm == null || !r.district) continue;
      const pp = rows.filter((x) => x.district === r.district && x.pricePerSqm != null).map((x) => x.pricePerSqm as number);
      if (pp.length < 5) continue;
      const p10 = quantile(pp, 0.1) as number;
      if (r.pricePerSqm <= p10) list.push({ r, p10, med: median(pp) as number });
    }
    list.sort((a, b) => a.r.pricePerSqm! / a.med - b.r.pricePerSqm! / b.med);
    const top = list.slice(0, 8);
    if (!top.length) {
      return { title: "Unusually low price/m²", summary: "No property sits below the 10th percentile of its district's price/m². No extreme low-price signals in the current selection.", paragraphs: [], calculations: ["Rule: price/m² ≤ P10 of the same district (min 5 listings)"], matched: true };
    }
    return {
      title: "Unusually low price/m²",
      summary: `${top.length} propert${top.length === 1 ? "y" : "ies"} sit in the bottom 10% of their district's price/m² — worth a closer look before assuming a bargain.`,
      paragraphs: top.map(({ r, p10, med }) => `• ${r.title} — ${fmtPpm2(r.pricePerSqm)} vs district P10 ${fmtPpm2(p10)} (median ${fmtPpm2(med)})`),
      calculations: top.slice(0, 3).map(({ r, p10 }) => `${fmtPpm2(r.pricePerSqm)} ≤ P10 ${fmtPpm2(p10)}`),
      propertyIds: top.map((t) => t.r.id),
      matched: true,
    };
  }

  /* ---- Most common type ---- */
  if (/most common|popular.*(type|property)|what (property )?type|type distribution/.test(q)) {
    const byType = [...group(rows, (r) => r.propertyType ?? "Other").entries()]
      .map(([type, list]) => ({ type, n: list.length, share: list.length / rows.length }))
      .sort((a, b) => b.n - a.n);
    const [t1, t2] = byType;
    return {
      title: "Property type mix",
      summary: `${t1.type} is the most common property type — ${t1.n} of ${rows.length} listings (${Math.round(t1.share * 100)}%).`,
      paragraphs: byType.slice(0, 5).map((t) => `• ${t.type} — ${t.n} listings (${Math.round(t.share * 100)}%)`),
      calculations: [`${t1.type}: ${t1.n} ÷ ${rows.length} = ${(t1.share * 100).toFixed(1)}%${t2 ? `; next is ${t2.type} at ${(t2.share * 100).toFixed(1)}%` : ""}`],
      table: { columns: ["Type", "Listings", "Share"], rows: byType.map((t) => [t.type, t.n, `${Math.round(t.share * 100)}%`]) },
      matched: true,
    };
  }

  /* ---- Average price / m² global ---- */
  if (/average|mean|median|overall|summary|snapshot/.test(q)) {
    const prices = rows.filter((r) => r.price != null).map((r) => r.price as number);
    const pp = rows.filter((r) => r.pricePerSqm != null).map((r) => r.pricePerSqm as number);
    const avgP = avg(prices);
    const medP = median(prices);
    const avgM = avg(pp);
    const medM = median(pp);
    return {
      title: "Market snapshot",
      summary: `Across ${rows.length} listings: average price ${fmtMoney(avgP)}, median ${fmtMoney(medP)}; average price/m² ${fmtPpm2(avgM)}.`,
      paragraphs: [
        `Price range: ${fmtMoney(Math.min(...prices))} → ${fmtMoney(Math.max(...prices))}. ${avgP! > medP! ? "The average sits above the median, indicating a small number of high-value listings pulling the mean up." : "The average sits at or below the median, so the distribution is fairly balanced or skewed toward affordable listings."}`,
        `Price/m² ranges from ${fmtPpm2(Math.min(...pp))} to ${fmtPpm2(Math.max(...pp))} (median ${fmtPpm2(medM)}).`,
      ],
      calculations: [
        `Average = Σ prices ÷ n = ${fmtMoney(avgP! * prices.length)} ÷ ${prices.length} = ${fmtMoney(avgP)}`,
        `Median = middle of ${prices.length} sorted prices = ${fmtMoney(medP)}`,
      ],
      matched: true,
    };
  }

  /* ---- Fallback: real-data summary ---- */
  const prices = rows.filter((r) => r.price != null).map((r) => r.price as number);
  const ranked = [...named].sort((a, b) => b.avgPrice! - a.avgPrice!).slice(0, 3);
  return {
    title: "I analyzed your dataset",
    summary: `I interpreted that as a general request, so here is a data-backed snapshot of your current selection (${rows.length} listings).`,
    paragraphs: [
      ranked.length ? `Highest average prices: ${ranked.map((d) => `${d.district} (${fmtMoney(d.avgPrice)})`).join(", ")}.` : "District-level averages need at least 3 listings per district.",
      `Overall price range: ${fmtMoney(Math.min(...prices))} → ${fmtMoney(Math.max(...prices))}.`,
      "Try asking: “What is the cheapest district?”, “Compare New Cairo with 6th of October”, or “Show me properties priced below the district average.”",
    ],
    calculations: [`n = ${rows.length} listings in current filters`],
    matched: false,
  };

  function d2(n: number) {
    return String(n);
  }
}
