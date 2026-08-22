"use client";

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

type CompareContextValue = {
  ids: string[];
  add: (id: string) => void;
  remove: (id: string) => void;
  clear: () => void;
  has: (id: string) => boolean;
};

const CompareContext = createContext<CompareContextValue | null>(null);

export function CompareProvider({ children }: { children: ReactNode }) {
  const [ids, setIds] = useState<string[]>([]);
  const value = useMemo(() => ({
    ids,
    add: (id: string) => setIds(v => v.includes(id) ? v : [...v, id]),
    remove: (id: string) => setIds(v => v.filter(x => x !== id)),
    clear: () => setIds([]),
    has: (id: string) => ids.includes(id),
  }), [ids]);
  return <CompareContext.Provider value={value}>{children}</CompareContext.Provider>;
}

export function useCompare() {
  const value = useContext(CompareContext);
  if (!value) throw new Error("useCompare must be used inside CompareProvider");
  return value;
}
