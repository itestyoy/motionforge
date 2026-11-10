// Memoization cache shared by the performance hooks.

/**
 * Memoization cache for computed values
 */
export class MemoCache {
  private static instance: MemoCache;
  private cache: Map<string, { value: unknown; deps: unknown[] }> = new Map();

  static getInstance(): MemoCache {
    if (!MemoCache.instance) {
      MemoCache.instance = new MemoCache();
    }
    return MemoCache.instance;
  }

  /**
   * Get or compute a memoized value
   */
  getOrCompute<T>(key: string, compute: () => T, deps: unknown[] = []): T {
    const cached = this.cache.get(key);

    if (cached && this.depsEqual(cached.deps, deps)) {
      return cached.value as T;
    }

    const value = compute();
    this.cache.set(key, { value, deps });
    return value;
  }

  /**
   * Check if dependencies are equal
   */
  private depsEqual(a: unknown[], b: unknown[]): boolean {
    if (a.length !== b.length) return false;
    return a.every((val, i) => Object.is(val, b[i]));
  }

  /**
   * Clear all memoized values
   */
  clear(): void {
    this.cache.clear();
  }
}
