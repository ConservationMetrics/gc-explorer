/**
 * Defines Nuxt/h3 globals so server API handlers can be loaded in Vitest without a Nuxt context.
 */
const g = globalThis as unknown as {
  defineEventHandler?: (fn: (e: unknown) => unknown) => unknown;
  sendError?: (event: unknown, error: unknown) => never;
  createError?: (opts: {
    statusCode?: number;
    statusMessage?: string;
  }) => Error;
};
g.defineEventHandler = (fn: (e: unknown) => unknown) => fn;
g.createError = (opts) =>
  Object.assign(new Error(opts.statusMessage ?? "Error"), opts);
g.sendError = (_event, error) => {
  throw error;
};
