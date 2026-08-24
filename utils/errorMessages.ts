import { VIEW_CONFIG_MISSING_COLUMNS_ERROR } from "@/types";

/**
 * Chooses the Error screen message for a failed view load.
 *
 * @param {unknown} error - Error from useFetch, or null.
 * @param {(key: string, params?: Record<string, unknown>) => string} t - Translator.
 * @returns {string} Message to show.
 */
export const getDataLoadErrorMessage = (
  error: unknown,
  t: (key: string, params?: Record<string, unknown>) => string,
): string => {
  if (!error || typeof error !== "object") {
    return t("dataLoadErrorMessage");
  }

  const fetchError = error as {
    statusMessage?: string;
    message?: string;
    data?: {
      errorCode?: string;
      table?: string;
      missing?: Array<{ field?: string; column?: string }>;
      data?: {
        errorCode?: string;
        table?: string;
        missing?: Array<{ field?: string; column?: string }>;
      };
    };
  };

  // useFetch puts the API body on `data`. Nitro sometimes wraps our fields
  // one level deeper as `data.data`.
  const details =
    fetchError.data?.errorCode === VIEW_CONFIG_MISSING_COLUMNS_ERROR
      ? fetchError.data
      : fetchError.data?.data?.errorCode === VIEW_CONFIG_MISSING_COLUMNS_ERROR
        ? fetchError.data.data
        : null;

  if (details?.missing?.length === 1) {
    return t("missingConfiguredColumn", {
      field: details.missing[0].field,
      column: details.missing[0].column,
      table: details.table,
    });
  }

  if (details?.missing && details.missing.length > 1) {
    const list = details.missing
      .map((item) =>
        t("missingConfiguredColumnItem", {
          field: item.field,
          column: item.column,
        }),
      )
      .join(", ");
    return t("missingConfiguredColumns", {
      table: details.table,
      list,
    });
  }

  if (fetchError.statusMessage?.trim()) return fetchError.statusMessage;
  if (fetchError.message?.trim()) return fetchError.message;
  return t("dataLoadErrorMessage");
};
