import "server-only";

/**
 * Small in-memory LRU cache with per-entry TTL. Per server instance: on
 * serverless hosting each instance has its own, which is fine for caching
 * public scholarly metadata and repeated AI checks (gap M5).
 */
export class TtlCache<V> {
  private map = new Map<string, { value: V; expires: number }>();

  constructor(
    private readonly maxEntries: number,
    private readonly defaultTtlMs: number,
  ) {}

  get(key: string): V | undefined {
    const hit = this.map.get(key);
    if (!hit) return undefined;
    if (hit.expires < Date.now()) {
      this.map.delete(key);
      return undefined;
    }
    this.map.delete(key);
    this.map.set(key, hit); // refresh recency
    return hit.value;
  }

  set(key: string, value: V, ttlMs = this.defaultTtlMs): void {
    if (this.map.has(key)) this.map.delete(key);
    this.map.set(key, { value, expires: Date.now() + ttlMs });
    while (this.map.size > this.maxEntries) {
      const oldest = this.map.keys().next().value;
      if (oldest === undefined) break;
      this.map.delete(oldest);
    }
  }
}

const HOUR = 3_600_000;
export const httpCache = new TtlCache<{ status: number; data?: unknown }>(1000, 6 * HOUR);
export const aiCache = new TtlCache<unknown>(500, 12 * HOUR);
