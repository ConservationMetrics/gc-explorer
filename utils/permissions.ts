import type { Ref } from "vue";
import type { RouteLevelPermission } from "@/types/types";

/**
 * Composable for checking if a view is publicly accessible
 * @param data - The API response data containing routeLevelPermission
 * @returns A computed boolean indicating if the view is publicly accessible
 */
export const useIsPublic = (
  data: Ref<{ routeLevelPermission?: RouteLevelPermission } | null | undefined>,
) => {
  return computed(() => {
    return data.value?.routeLevelPermission === "anyone";
  });
};

/**
 * Utility function for checking if a view is publicly accessible
 * @param routeLevelPermission - The permission level from the API response
 * @returns boolean indicating if the view is publicly accessible
 */
export const isPublicView = (
  routeLevelPermission?: RouteLevelPermission,
): boolean => {
  return routeLevelPermission === "anyone";
};
