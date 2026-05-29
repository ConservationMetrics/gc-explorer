import type { ViewType } from "@/types";

const VIEW_TYPE_BY_SEGMENT: Record<string, ViewType> = {
  map: "map",
  gallery: "gallery",
  alerts: "alerts",
};

/**
 * Resolves the view type a data request should carry, given the current route
 * and the table being fetched.
 *
 * Why this exists: a dataset can now expose several views (e.g. map + gallery),
 * each with its own row and potentially its own settings/permission. The
 * dataset-level endpoints (data, records, export, [recordId], statistics-export)
 * therefore need to know WHICH view is asking so the server resolves the right
 * row instead of an arbitrary one. A view page's first path segment identifies
 * the view it renders (`/map/:table`, `/gallery/:table`, `/alerts/:table`), so
 * we derive the view type from the route and pass it down.
 *
 * Two guards make this safe; both are deliberate:
 *
 * 1. Own-dataset only. The view type applies to the route's OWN dataset
 *    (`route.params.tablename`). A page can read OTHER tables — e.g. an alerts
 *    page loading a record from its secondary Mapeo table — and that table has
 *    no alerts view of its own. Sending `view_type=alerts` for it would make the
 *    server look up a `(mapeoTable, alerts)` row that does not exist and fail.
 *    So when `table !== primaryTable` we return undefined.
 *
 * 2. Whitelist the segment instead of trusting it. We look the first segment up
 *    in `VIEW_TYPE_BY_SEGMENT` rather than returning it raw. This is NOT about
 *    URL typos (those 404 before any fetch); it is about routes whose first
 *    segment is a real word but not a view type — most importantly
 *    `/dataset/:table`, where guard #1 passes (the table matches) but the
 *    segment is `"dataset"`. Returning that raw would send `view_type=dataset`
 *    and trigger a missing-config error. The lookup maps any non-view segment to
 *    undefined, and it also keeps the return type `ViewType | undefined` without
 *    an unsafe cast.
 *
 * In every undefined case the server falls back to its deterministic default
 * (oldest view by `view_id`), so omitting the view type is always safe.
 */
export function resolveViewTypeForTable(
  route: { path: string; params: Record<string, unknown> },
  table: string,
): ViewType | undefined {
  const primaryTable =
    typeof route.params.tablename === "string"
      ? route.params.tablename
      : undefined;
  // Guard #1: only the route's own dataset carries the route's view type.
  if (!primaryTable || table !== primaryTable) return undefined;
  // Guard #2: whitelist the path segment; non-view routes resolve to undefined.
  const firstSegment = route.path.split("/").filter(Boolean)[0];
  return firstSegment ? VIEW_TYPE_BY_SEGMENT[firstSegment] : undefined;
}
