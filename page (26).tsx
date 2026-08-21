"use client";

import Link from "next/link";
import { useFetch } from "@/lib/hooks";
import { Badge, Button, EmptyState, ErrorState, Icon, paths, Skeleton } from "@/components/ui";
import { PropertyCard, type PropItem } from "@/components/PropertyCard";

interface SavedResp {
  ok: boolean;
  items: { p: PropItem; savedAt: string }[];
}

export default function SavedPage() {
  const { data, loading, error, reload } = useFetch<SavedResp>("/api/saved");

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-[26px] tracking-[-0.02em]">Saved properties</h1>
          <p className="text-[13px] text-ink-2">
            {data ? (
              <>
                <span className="tnum font-medium text-ink">{data.items.length}</span> bookmarked listing{data.items.length === 1 ? "" : "s"}
              </>
            ) : (
              "Listings you've bookmarked to revisit"
            )}
          </p>
        </div>
        {data && data.items.length > 0 ? (
          <Button variant="outline" size="sm" onClick={reload}>
            Refresh
          </Button>
        ) : null}
      </div>

      {error ? (
        <ErrorState message={error} retry={reload} />
      ) : loading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-72" />
          ))}
        </div>
      ) : data && data.items.length === 0 ? (
        <EmptyState
          icon={<Icon d={paths.bookmark} size={26} />}
          title="Nothing saved yet"
          desc="Tap the bookmark on any property card — or “Save property” on a detail page — and it will wait for you here."
          actions={
            <Link href="/app/properties">
              <Button>
                <Icon d={paths.building} size={14} /> Browse properties
              </Button>
            </Link>
          }
        />
      ) : data ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {data.items.map(({ p }, i) => (
            <PropertyCard key={p.id} p={{ ...p, saved: true }} delay={Math.min(i, 8) * 50} onSaved={() => reload()} />
          ))}
        </div>
      ) : null}

      {data && data.items.length > 0 ? (
        <p className="flex items-center gap-2 text-[11.5px] text-ink-3">
          <Badge tone="outline">Tip</Badge> Saved items stay in your account — remove them by tapping the bookmark again.
        </p>
      ) : null}
    </div>
  );
}
