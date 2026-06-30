import { integer, pgTable, text, unique, uniqueIndex } from "drizzle-orm/pg-core";

// Guardian Connector views table.
export const viewConfig = pgTable(
  "views",
  {
    viewId: integer("view_id").primaryKey().generatedByDefaultAsIdentity(),
    viewName: text("view_name").notNull(),
    viewType: text("view_type"),
    primaryDataset: text("primary_dataset").notNull(),
    secondaryDataset: text("secondary_dataset"),
    viewConfig: text("view_config").notNull(),
  },
  (table) => [
    uniqueIndex("views_view_id_idx").on(table.viewId),
    // (view_type, primary_dataset) is the logical key: a dataset exposes each view
    // type at most once. Mirrors the UNIQUE constraint in migration 0007.
    unique("views_view_type_primary_dataset_unique").on(
      table.viewType,
      table.primaryDataset,
    ),
  ],
);
