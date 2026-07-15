import type { ViewType } from "@/types";

/**
 * Returns true when the search query is empty, or when any field contains the
 * query (case-insensitive substring match).
 *
 * @param {string} query - Raw search input from the user.
 * @param {...(string | null | undefined)} fields - Text fields to match against.
 * @returns {boolean} Whether the item should be included in search results.
 */
export const matchesSearchQuery = (
  query: string,
  ...fields: Array<string | null | undefined>
): boolean => {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) {
    return true;
  }

  return fields.some((field) =>
    (field || "").toLowerCase().includes(normalizedQuery),
  );
};

/**
 * Returns true when the active filter is "all", or when the item's view type(s)
 * include the selected filter.
 *
 * @param {string} filter - Active filter value (`"all"` or a ViewType).
 * @param {ViewType | ViewType[]} viewTypes - One view type or a list of types.
 * @returns {boolean} Whether the item should be included for this filter.
 */
export const matchesViewTypeFilter = (
  filter: string,
  viewTypes: ViewType | ViewType[],
): boolean => {
  if (filter === "all") {
    return true;
  }

  const types = Array.isArray(viewTypes) ? viewTypes : [viewTypes];
  return types.includes(filter as ViewType);
};
