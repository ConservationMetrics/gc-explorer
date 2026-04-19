import { useI18n, useToast } from "#imports";
import { toValue, watch, type MaybeRef, type Ref } from "vue";

type DatasetFetchPayload = { rowLimitReached?: boolean } | null | undefined;

/**
 * Shows a warning toast when dataset APIs report `rowLimitReached` (ToastContainer in layout).
 */
export const useRowLimitReachedToast = (
  data: Ref<DatasetFetchPayload>,
  rowLimit: MaybeRef<number>,
) => {
  const { t } = useI18n();
  const { warning } = useToast();

  watch(
    () => data.value?.rowLimitReached === true,
    (show) => {
      if (!import.meta.client || !show) return;
      const limit = Number(toValue(rowLimit));
      warning(
        t("rowLimitReachedTitle"),
        t("rowLimitReachedMessage", { limit: limit.toLocaleString() }),
      );
    },
    { immediate: true },
  );
};
