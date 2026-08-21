"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Button, paths, Icon } from "@/components/ui";

interface CompareCtx {
  ids: string[];
  toggle: (id: string) => void;
  clear: () => void;
  has: (id: string) => boolean;
}

const Ctx = createContext<CompareCtx>({ ids: [], toggle: () => {}, clear: () => {}, has: () => false });
const KEY = "piq_compare";
const MAX = 4;

export function CompareProvider({ children }: { children: ReactNode }) {
  const [ids, setIds] = useState<string[]>([]);
  const router = useRouter();

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const arr = JSON.parse(raw);
        if (Array.isArray(arr)) setIds(arr.filter((x) => typeof x === "string").slice(0, MAX));
      }
    } catch {
      /* ignore */
    }
  }, []);

  const value = useMemo<CompareCtx>(
    () => ({
      ids,
      toggle: (id) =>
        setIds((prev) => {
          const next = prev.includes(id) ? prev.filter((x) => x !== id) : prev.length >= MAX ? prev : [...prev, id];
          localStorage.setItem(KEY, JSON.stringify(next));
          return next;
        }),
      clear: () => {
        setIds([]);
        localStorage.removeItem(KEY);
      },
      has: (id) => ids.includes(id),
    }),
    [ids]
  );

  const tray =
    ids.length > 0 ? (
      <div className="anim-pop fixed bottom-16 left-1/2 z-[900] -translate-x-1/2 md:bottom-6 md:left-auto md:right-6 md:translate-x-0">
        <div className="flex items-center gap-3 rounded-lg border border-line bg-ink px-4 py-2.5 shadow-pop">
          <span className="text-[12.5px] text-cream/80">
            <span className="tnum font-semibold text-cream">{ids.length}</span>/{MAX} selected
          </span>
          <Button size="sm" variant="gold" onClick={() => router.push(`/app/compare?ids=${ids.join(",")}`)}>
            <Icon d={paths.compare} size={13} /> Compare
          </Button>
          <button onClick={value.clear} aria-label="Clear comparison" className="text-cream/60 transition-colors hover:text-cream">
            <Icon d={paths.x} size={13} />
          </button>
        </div>
      </div>
    ) : null;

  return (
    <Ctx.Provider value={value}>
      {children}
      {tray}
    </Ctx.Provider>
  );
}

export function useCompare() {
  return useContext(Ctx);
}
