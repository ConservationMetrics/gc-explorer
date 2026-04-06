/**
 * Optional Node flag: run with `NODE_OPTIONS='--inspect --expose-gc'` so
 * `global.gc` exists and snapshots are less noisy between measurements.
 */

type MemoryUsageSnapshot = {
  heapUsed: number;
  heapTotal: number;
  rss: number;
  external: number;
  arrayBuffers?: number;
};

type ServerProfilingLogPayload = {
  label: string;
  ms: number;
  heapUsedBefore: number;
  heapUsedAfter: number;
  heapUsedDelta: number;
  rssDelta: number;
  externalDelta: number;
  gcBefore: boolean;
  gcAfter: boolean;
  gcRanBefore: boolean;
  gcRanAfter: boolean;
  threw?: boolean;
};

const isProfilingEnabled = (): boolean => {
  const flag = process.env.SERVER_PROFILING;
  return flag === "1" || flag === "true";
};

/**
 * Invokes V8's garbage collector when Node was started with `--expose-gc`.
 *
 * @returns {boolean} Whether `gc` was invoked.
 */
export const triggerGcIfAvailable = (): boolean => {
  const gc = (globalThis as { gc?: () => void }).gc;
  if (typeof gc !== "function") {
    return false;
  }
  gc();
  return true;
};

/**
 * Returns numeric fields from `process.memoryUsage()` for logging or deltas.
 *
 * @returns {MemoryUsageSnapshot} Current process memory usage.
 */
export const snapshotProcessMemory = (): MemoryUsageSnapshot => {
  const usage = process.memoryUsage();
  const out: MemoryUsageSnapshot = {
    heapUsed: usage.heapUsed,
    heapTotal: usage.heapTotal,
    rss: usage.rss,
    external: usage.external,
  };
  if (typeof usage.arrayBuffers === "number") {
    out.arrayBuffers = usage.arrayBuffers;
  }
  return out;
};

const logPayload = (payload: ServerProfilingLogPayload): void => {
  console.log(`[server-prof] ${JSON.stringify(payload)}`);
};

/**
 * Logs a named memory snapshot when `SERVER_PROFILING=1` (or `true`).
 *
 * @param {string} label - Logical name (e.g. route or phase).
 * @param {object} [extra] - Optional fields merged into the log line.
 * @param {boolean} [options.forceGc] - Run `gc` before sampling when available.
 * @returns {MemoryUsageSnapshot} The snapshot taken after optional GC.
 */
export const logServerProfilingMark = (
  label: string,
  extra?: Record<string, unknown>,
  options?: { forceGc?: boolean },
): MemoryUsageSnapshot => {
  let gcRan = false;
  if (options?.forceGc && isProfilingEnabled()) {
    gcRan = triggerGcIfAvailable();
  }
  const mem = snapshotProcessMemory();
  if (!isProfilingEnabled()) {
    return mem;
  }
  const line: Record<string, unknown> = { label, ...mem };
  if (options?.forceGc) {
    line.gcRan = gcRan;
  }
  if (extra) {
    Object.assign(line, extra);
  }
  console.log(`[server-prof] ${JSON.stringify(line)}`);
  return mem;
};

type WithServerProfilingOptions = {
  /**
   * When true, runs `global.gc()` before timing (needs `--expose-gc`).
   */
  gcBefore?: boolean;
  /**
   * When true, runs `global.gc()` after the callback (needs `--expose-gc`).
   */
  gcAfter?: boolean;
};

const runCallback = async <T>(fn: () => T | Promise<T>): Promise<T> => {
  const result = fn();
  if (result instanceof Promise) {
    return result;
  }
  return Promise.resolve(result);
};

const recordBlock = (
  label: string,
  memBefore: MemoryUsageSnapshot,
  t0: number,
  options: {
    gcBefore: boolean;
    gcAfter: boolean;
    gcRanBefore: boolean;
    threw: boolean;
  },
): void => {
  const t1 = performance.now();
  const memAfter = snapshotProcessMemory();
  const gcRanAfter = options.gcAfter ? triggerGcIfAvailable() : false;

  if (!isProfilingEnabled()) {
    return;
  }

  const payload: ServerProfilingLogPayload = {
    label,
    ms: t1 - t0,
    heapUsedBefore: memBefore.heapUsed,
    heapUsedAfter: memAfter.heapUsed,
    heapUsedDelta: memAfter.heapUsed - memBefore.heapUsed,
    rssDelta: memAfter.rss - memBefore.rss,
    externalDelta: memAfter.external - memBefore.external,
    gcBefore: options.gcBefore,
    gcAfter: options.gcAfter,
    gcRanBefore: options.gcRanBefore,
    gcRanAfter,
  };
  if (options.threw) {
    payload.threw = true;
  }
  logPayload(payload);
};

/**
 * Times a synchronous or async block and logs heap deltas when `SERVER_PROFILING=1`.
 * Use for before/after comparisons around heavy server work.
 *
 * @template T
 * @param {string} label - Identifier for log lines (e.g. `alerts:prepareMinimal`).
 * @param {() => T | Promise<T>} fn - Work to measure.
 * @param {WithServerProfilingOptions} [options] - Optional GC before/after the block.
 * @returns {Promise<T>} The callback result.
 */
export const withServerProfiling = async <T>(
  label: string,
  fn: () => T | Promise<T>,
  options?: WithServerProfilingOptions,
): Promise<T> => {
  const profiling = isProfilingEnabled();
  const gcBefore = profiling && (options?.gcBefore ?? false);
  const gcAfter = profiling && (options?.gcAfter ?? false);

  const gcRanBefore = gcBefore ? triggerGcIfAvailable() : false;
  const memBefore = snapshotProcessMemory();
  const t0 = performance.now();

  try {
    const result = await runCallback(fn);
    recordBlock(label, memBefore, t0, {
      gcBefore,
      gcAfter,
      gcRanBefore,
      threw: false,
    });
    return result;
  } catch (error) {
    recordBlock(label, memBefore, t0, {
      gcBefore,
      gcAfter,
      gcRanBefore,
      threw: true,
    });
    throw error;
  }
};
