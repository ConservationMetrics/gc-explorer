import type { ViewType } from "@/types";

export const VIEW_TYPES = [
  "alerts",
  "map",
  "gallery",
] as const satisfies readonly ViewType[];

export const SECONDARY_DATASET_VIEW_TYPES = [
  "alerts",
  "map",
] as const satisfies readonly ViewType[];

/** Whether a view type can reference a companion warehouse table. */
export const supportsSecondaryDataset = (
  viewType: ViewType | undefined,
): boolean =>
  viewType !== undefined &&
  SECONDARY_DATASET_VIEW_TYPES.some((type) => type === viewType);
