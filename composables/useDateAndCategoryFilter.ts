import { parseDateMs } from "@/utils/dateUtils";

import type { FilterValues } from "@/types";

/**
 * Normalizes filter payload from DataFilter: "null" string or array of { value } to string[].
 *
 * @param values - Raw filter values (strings or option objects with .value).
 * @returns Normalized string array for inclusion checks.
 */
export const normalizeFilterValues = (values: FilterValues): string[] => {
  return values.map((v: string | { value?: unknown }) =>
    typeof v === "object" && v != null && v.value != null
      ? String(v.value)
      : String(v),
  );
};

export interface DateAndCategoryFilterOptions<T> {
  timestampColumn?: string;
  dateMin: string;
  dateMax: string;
  filterColumn: string;
  selectedValues: string[];
  getTimestamp: (item: T) => unknown;
  getCategory: (item: T) => unknown;
}

/**
 * Filters items by date range (when timestampColumn set) then by category (AND).
 * Date range is inclusive; category keeps items whose value is in selectedValues, or all if selectedValues includes "null".
 *
 * @param items - Array to filter.
 * @param options - Column names, date strings, selected values, and accessors.
 * @returns Filtered array.
 */
export const filterByDateAndCategory = <T>(
  items: T[],
  options: DateAndCategoryFilterOptions<T>,
): T[] => {
  const {
    timestampColumn,
    dateMin,
    dateMax,
    selectedValues,
    getTimestamp,
    getCategory,
  } = options;

  let result = items;

  if (timestampColumn && (dateMin || dateMax)) {
    const minMs = dateMin ? parseDateMs(dateMin) : null;
    const maxMs = dateMax ? parseDateMs(dateMax) : null;
    result = result.filter((item) => {
      const ms = parseDateMs(getTimestamp(item));
      if (ms == null) return false;
      if (minMs != null && ms < minMs) return false;
      if (maxMs != null && ms > maxMs) return false;
      return true;
    });
  }

  if (selectedValues.length && !selectedValues.includes("null")) {
    result = result.filter((item) =>
      selectedValues.includes(String(getCategory(item) ?? "")),
    );
  }

  return result;
};

/**
 * Shared timestamp filter state for Map and Gallery.
 * Returns dateMin/dateMax refs and setDateRange to apply TimestampFilter payload; views call applyAllFilters() after.
 */
export const useTimestampFilter = () => {
  const dateMin = ref("");
  const dateMax = ref("");

  const setDateRange = (payload: { start: Date | null; end: Date | null }) => {
    dateMin.value = payload.start
      ? payload.start.toISOString().slice(0, 10)
      : "";
    dateMax.value = payload.end ? payload.end.toISOString() : "";
  };

  return { dateMin, dateMax, setDateRange };
};
