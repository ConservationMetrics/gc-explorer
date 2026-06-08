import { integer, pgTable, text, unique } from "drizzle-orm/pg-core";

// Guardian Connector views table.
export const viewConfig = pgTable(
  "views",
  {
    viewId: integer("view_id").primaryKey().generatedByDefaultAsIdentity(),
    viewName: text("view_name"),
    viewType: text("view_type").notNull(),
    primaryDataset: text("primary_dataset").notNull(),
    secondaryDataset: text("secondary_dataset"),
    viewConfig: text("view_config").notNull(),
  },
  (table) => [
    // (view_type, primary_dataset) is the logical key: a dataset exposes each view
    // type at most once. Mirrors the UNIQUE constraint in migration 0007.
    unique("views_view_type_primary_dataset_unique").on(
      table.viewType,
      table.primaryDataset,
    ),
  ],
);
