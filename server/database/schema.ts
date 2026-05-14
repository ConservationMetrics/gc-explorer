// Import all schemas
import { viewConfig } from "./schemas/viewConfig";
import {
  viewConfigAlerts,
  viewConfigMap,
  viewConfigGallery,
} from "./schemas/viewConfigByType";
import { publicViews } from "./schemas/publicViews";
import {
  annotatedCollections,
  incidents,
  collectionEntries,
} from "./schemas/annotatedCollections";

// Re-export all schemas from separate files
export * from "./schemas/viewConfig";
export * from "./schemas/viewConfigByType";
export * from "./schemas/publicViews";
export * from "./schemas/annotatedCollections";

export const schemas = {
  viewConfig,
  viewConfigAlerts,
  viewConfigMap,
  viewConfigGallery,
  publicViews,
  annotatedCollections,
  incidents,
  collectionEntries,
};
