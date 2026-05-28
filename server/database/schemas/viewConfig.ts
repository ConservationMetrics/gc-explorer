import { integer, pgTable, text } from "drizzle-orm/pg-core";

// Guardian Connector views table.
export const viewConfig = pgTable("views", {
  viewId: integer("view_id").primaryKey().generatedByDefaultAsIdentity(),
  viewName: text("view_name"),
  viewType: text("view_type"),
  primaryDataset: text("primary_dataset").notNull(),
  secondaryDataset: text("secondary_dataset"),
  viewConfig: text("view_config").notNull(),
});
