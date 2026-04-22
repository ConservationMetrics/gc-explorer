import { pgTable, text } from "drizzle-orm/pg-core";

import { viewConfig } from "./viewConfig";

export const viewConfigAlerts = pgTable("view_config_alerts", {
  viewId: text("view_id")
    .primaryKey()
    .references(() => viewConfig.tableName, { onDelete: "cascade" }),
  primaryDataset: text("primary_dataset").notNull(),
  secondaryDataset: text("secondary_dataset"),
});

export const viewConfigMap = pgTable("view_config_map", {
  viewId: text("view_id")
    .primaryKey()
    .references(() => viewConfig.tableName, { onDelete: "cascade" }),
  primaryDataset: text("primary_dataset").notNull(),
  // Keep this list-based to avoid schema migrations when max changes.
  secondaryDatasets: text("secondary_datasets"),
});

export const viewConfigGallery = pgTable("view_config_gallery", {
  viewId: text("view_id")
    .primaryKey()
    .references(() => viewConfig.tableName, { onDelete: "cascade" }),
  primaryDataset: text("primary_dataset").notNull(),
});
