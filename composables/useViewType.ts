import type { ViewType } from "@/types";
import { decodeDatasetNameFromUrl } from "@/utils/identifierUtils";

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
 * `view_id`). Cross-table companion reads use `resolveRecordPermissionQuery`
 * instead so permissions come from the parent view.
 */
const VIEW_TYPE_BY_SEGMENT: Record<string, ViewType> = {
  map: "map",
  gallery: "gallery",
  alerts: "alerts",
};

export type RecordPermissionQuery = {
  view_type?: ViewType;
  permission_table?: string;
};

/**
 * Decides whether a data request to the server should carry a `view_type`, and
 * which one, given the current route and the warehouse table being fetched.
 *
 * Returns a view type only when `table` is the route's own `:tablename` and the
 * route's first path segment is a known view prefix (`map`, `gallery`, `alerts`).
 * Otherwise returns `undefined` (callers omit the query param).
 *
 * @param {{ path: string; params: Record<string, unknown> }} route - Current page route.
 * @param {string} table - Warehouse table being fetched.
 * @returns {ViewType | undefined} View type for same-table reads, else undefined.
 */
export function resolveViewTypeForTable(
  route: { path: string; params: Record<string, unknown> },
  table: string,
): ViewType | undefined {
  const primaryTable =
    typeof route.params.tablename === "string"
      ? decodeDatasetNameFromUrl(route.params.tablename)
      : undefined;
  // Guard #1: cross-table reads must not carry the route's view type alone —
  // companion tables have no view row; use resolveRecordPermissionQuery instead.
  if (!primaryTable || decodeDatasetNameFromUrl(table) !== primaryTable) {
    return undefined;
  }
  // Guard #2: only known view route prefixes; e.g. /dataset/:tablename → undefined.
  const firstSegment = route.path.split("/").filter(Boolean)[0];
  return firstSegment ? VIEW_TYPE_BY_SEGMENT[firstSegment] : undefined;
}

/**
 * Builds query params for record/list fetches that may target a companion table.
 *
 * Same-table view reads send `view_type`. Cross-table reads on a view page send
 * `permission_table` (route primary) + `view_type` so the server authorizes via
 * the parent view while reading the companion warehouse table.
 *
 * @param {{ path: string; params: Record<string, unknown> }} route - Current page route.
 * @param {string} table - Warehouse table being fetched.
 * @returns {RecordPermissionQuery} Query object (possibly empty).
 */
export function resolveRecordPermissionQuery(
  route: { path: string; params: Record<string, unknown> },
  table: string,
): RecordPermissionQuery {
  const primaryTable =
    typeof route.params.tablename === "string"
      ? decodeDatasetNameFromUrl(route.params.tablename)
      : undefined;
  const firstSegment = route.path.split("/").filter(Boolean)[0];
  const routeViewType = firstSegment
    ? VIEW_TYPE_BY_SEGMENT[firstSegment]
    : undefined;

  if (!primaryTable || !routeViewType) {
    return {};
  }

  if (decodeDatasetNameFromUrl(table) === primaryTable) {
    return { view_type: routeViewType };
  }

  return {
    view_type: routeViewType,
    permission_table: primaryTable,
  };
}
