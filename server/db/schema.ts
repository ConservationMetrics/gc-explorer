// Import all schemas
import { viewConfig } from "./schemas/viewConfig";
import {
  annotatedCollections,
  incidents,
  collectionEntries,
} from "./schemas/annotatedCollections";

// Re-export all schemas from separate files
export * from "./schemas/viewConfig";
export * from "./schemas/annotatedCollections";

export const schemas = {
  viewConfig,
  annotatedCollections,
  incidents,
  collectionEntries,
};
