import type { ViewType } from "@/types";

/**
 * View-type threading for dataset-level API requests.
 *
 * A dataset can expose several views (map, gallery, alerts), each with its own row
 * in the views table and potentially its own permission/settings. The server-side
 * handlers for table data (`/api/:table/data`, `records`, `:recordId`, `export`,
 * `statistics-export`) accept an optional `view_type` query param so they can
 * resolve the correct view row instead of picking an arbitrary one.
 *
 * View pages identify themselves by their first URL segment (`/map/:tablename`,
 * `/gallery/:tablename`, `/alerts/:tablename`). Composables that call those API
 * routes derive `view_type` from the current page route and attach it to the
 * request. When `resolveViewTypeForTable` returns `undefined`, callers omit the
 * param; the server then falls back to its deterministic default (oldest view by
 * `view_id`). Cross-table reads (e.g. alerts page fetching its Mapeo table) omit
 * `view_type` — see guard #1 below.
 */
const VIEW_TYPE_BY_SEGMENT: Record<string, ViewType> = {
  map: "map",
  gallery: "gallery",
  alerts: "alerts",
};

/**
 * Decides whether a data request to the server should carry a `view_type`, and
 * which one, given the current route and the warehouse table being fetched.
 *
 * Returns a view type only when `table` is the route's own `:tablename` and the
 * route's first path segment is a known view prefix (`map`, `gallery`, `alerts`).
 * Otherwise returns `undefined` (callers omit the query param).
 */
export function resolveViewTypeForTable(
  route: { path: string; params: Record<string, unknown> },
  table: string,
): ViewType | undefined {
  const primaryTable =
    typeof route.params.tablename === "string"
      ? route.params.tablename
      : undefined;
  // Guard #1: cross-table reads (e.g. alerts page → Mapeo table) must not carry
  // the route's view type.
  if (!primaryTable || table !== primaryTable) return undefined;
  // Guard #2: only known view route prefixes; e.g. /dataset/:tablename → undefined.
  const firstSegment = route.path.split("/").filter(Boolean)[0];
  return firstSegment ? VIEW_TYPE_BY_SEGMENT[firstSegment] : undefined;
}
