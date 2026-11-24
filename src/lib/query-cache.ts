import type { QueryKey } from "@tanstack/react-query";

export const QUERY_CACHE_TTL_MS = 60_000;
const QUERY_CACHE_GC_TIME_MS = QUERY_CACHE_TTL_MS * 5;

const STORAGE_KEY = "smartbiz.query-cache.v1";
const MAX_CACHE_ENTRIES = 80;

export type QueryCacheEntry<T = unknown> = {
  queryKey: QueryKey;
  data: T;
  updatedAt: number;
};

const memoryCache = new Map<string, QueryCacheEntry>();
let storageLoaded = false;

function stableSerialize(value: unknown): string {
  if (value === undefined) return "undefined";
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value) ?? String(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map((item) => stableSerialize(item)).join(",")}]`;
  }

  const record = value as Record<string, unknown>;
  return `{${Object.keys(record)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${stableSerialize(record[key])}`)
    .join(",")}}`;
}

function isCacheEntry(value: unknown): value is QueryCacheEntry {
  if (typeof value !== "object" || value === null) return false;
  const entry = value as Record<string, unknown>;
  return (
    Array.isArray(entry.queryKey) &&
    "data" in entry &&
    typeof entry.updatedAt === "number"
  );
}

function loadStorageCache() {
  if (storageLoaded || typeof window === "undefined") return;
  storageLoaded = true;

  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return;

    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return;

    for (const candidate of parsed) {
      if (!isCacheEntry(candidate)) continue;
      const key = stableSerialize(candidate.queryKey);
      memoryCache.set(key, candidate);
    }
    pruneExpiredEntries();
  } catch {
    memoryCache.clear();
    try {
      window.sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      // The in-memory cache remains available when storage is blocked.
    }
  }
}

function pruneExpiredEntries(now = Date.now()) {
  for (const [key, entry] of memoryCache) {
    if (now - entry.updatedAt > QUERY_CACHE_TTL_MS) memoryCache.delete(key);
  }
}

function persistStorageCache() {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(
      STORAGE_KEY,
      JSON.stringify([...memoryCache.values()]),
    );
  } catch {
    // sessionStorage is best effort; the current tab still has memory cache.
  }
}

export function getCachedQuery<T>(queryKey: QueryKey): QueryCacheEntry<T> | undefined {
  loadStorageCache();
  const key = stableSerialize(queryKey);
  const entry = memoryCache.get(key);
  if (!entry) return undefined;

  if (Date.now() - entry.updatedAt > QUERY_CACHE_TTL_MS) {
    memoryCache.delete(key);
    persistStorageCache();
    return undefined;
  }

  return entry as QueryCacheEntry<T>;
}

export function setCachedQuery<T>(queryKey: QueryKey, data: T): void {
  loadStorageCache();
  pruneExpiredEntries();
  memoryCache.set(stableSerialize(queryKey), {
    queryKey,
    data,
    updatedAt: Date.now(),
  });

  if (memoryCache.size > MAX_CACHE_ENTRIES) {
    const oldestEntries = [...memoryCache.entries()]
      .sort(([, first], [, second]) => first.updatedAt - second.updatedAt)
      .slice(0, memoryCache.size - MAX_CACHE_ENTRIES);
    for (const [key] of oldestEntries) memoryCache.delete(key);
  }

  persistStorageCache();
}

function matchesPrefix(queryKey: QueryKey, prefix: QueryKey): boolean {
  if (prefix.length > queryKey.length) return false;
  return stableSerialize(queryKey.slice(0, prefix.length)) === stableSerialize(prefix);
}

export function invalidateCache(prefix: QueryKey): void {
  loadStorageCache();
  for (const [key, entry] of memoryCache) {
    if (matchesPrefix(entry.queryKey, prefix)) memoryCache.delete(key);
  }
  persistStorageCache();
}

export function getQueryCacheOptions<T>(queryKey: QueryKey) {
  const cached = getCachedQuery<T>(queryKey);
  return {
    initialData: cached?.data,
    initialDataUpdatedAt: cached?.updatedAt,
    staleTime: QUERY_CACHE_TTL_MS,
    gcTime: QUERY_CACHE_GC_TIME_MS,
  };
}
