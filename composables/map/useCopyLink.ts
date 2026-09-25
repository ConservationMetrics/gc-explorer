import { ref } from "vue";
import type { Ref } from "vue";
import type { Map as MapboxMap } from "mapbox-gl";

import { MAP_CAMERA_QUERY_KEYS } from "@/types";
import {
  buildMapLocationShareUrl,
  readMapCamera,
} from "@/utils/mapCameraQuery";

export const COPY_ALERT_LINK_EXCLUDE_PARAMS = [
  "incidentId",
  ...MAP_CAMERA_QUERY_KEYS,
];

export const COPY_MAP_FEATURE_LINK_EXCLUDE_PARAMS = [...MAP_CAMERA_QUERY_KEYS];

export const COPY_INCIDENT_LINK_EXCLUDE_PARAMS = [
  "alertId",
  "mapeoDocId",
  "secondaryDocId",
  ...MAP_CAMERA_QUERY_KEYS,
];

/**
 * Copies the current page URL to the clipboard.
 * Optionally excludes specified query parameters from the URL.
 *
 * @param excludeParams - Query parameter names to exclude from the URL
 * @returns Promise that resolves when the URL is written
 */
const copyLinkToClipboard = async (excludeParams?: string[]): Promise<void> => {
  let url = window.location.href;

  if (excludeParams && excludeParams.length > 0) {
    const urlObj = new URL(url);
    excludeParams.forEach((param) => {
      urlObj.searchParams.delete(param);
    });
    url = urlObj.toString();
  }

  await navigator.clipboard.writeText(url);
};

/**
 * Composable for copying the current page URL to clipboard.
 * Manages a `showCopied` ref to indicate success.
 *
 * @param excludeParams - Optional query parameter names to exclude from the copied URL
 * @returns An object containing the `showCopied` ref and the `copyLink` function
 */
export const useCopyLink = (excludeParams?: string[]) => {
  const showCopied = ref(false);

  const copyLink = async () => {
    await copyLinkToClipboard(excludeParams);
    showCopied.value = true;
    setTimeout(() => {
      showCopied.value = false;
    }, 2000);
  };

  return { showCopied, copyLink };
};

/**
 * Copies a viewport URL from the current map camera. Feature ids are omitted.
 * The live page URL is not changed.
 *
 * @param map - Mapbox map ref
 * @returns Copied state and the copy function
 */
export const useCopyMapLocation = (map: Ref<MapboxMap | undefined>) => {
  const showCopied = ref(false);

  const copyLocation = async () => {
    if (!map.value) {
      return;
    }
    const url = buildMapLocationShareUrl(
      window.location.href,
      readMapCamera(map.value),
    );
    await navigator.clipboard.writeText(url);
    showCopied.value = true;
    setTimeout(() => {
      showCopied.value = false;
    }, 2000);
  };

  return { showCopied, copyLocation };
};
