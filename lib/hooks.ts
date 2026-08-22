import { useCallback, useEffect, useRef, useState } from "react";

export function useDebounced<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delay);
    return () => window.clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

export function useFetch<T = unknown>(url: string, options?: RequestInit, deps: unknown[] = []) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const controllerRef = useRef<AbortController | null>(null);

  const reload = useCallback(async () => {
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(url, { ...options, signal: controller.signal });
      const body = await response.json().catch(() => null);
      if (!response.ok) throw new Error(body?.error ?? `Request failed (${response.status})`);
      setData(body as T);
      return body as T;
    } catch (err) {
      if ((err as Error).name === "AbortError") return null;
      const message = err instanceof Error ? err.message : "Request failed";
      setError(message);
      return null;
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  }, [url, options]);

  useEffect(() => {
    reload();
    return () => controllerRef.current?.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url, ...deps]);

  return { data, error, loading, reload, refetch: reload };
}
