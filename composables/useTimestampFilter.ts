/**
 * Shared timestamp filter state for Map and Gallery.
 * Holds dateMin/dateMax and provides setDateRange to apply TimestampFilter payload; views call applyAllFilters() after.
 */
export function useTimestampFilter() {
  const dateMin = ref("");
  const dateMax = ref("");

  const setDateRange = (payload: { start: Date | null; end: Date | null }) => {
    dateMin.value = payload.start
      ? payload.start.toISOString().slice(0, 10)
      : "";
    dateMax.value = payload.end ? payload.end.toISOString() : "";
  };

  return { dateMin, dateMax, setDateRange };
}
