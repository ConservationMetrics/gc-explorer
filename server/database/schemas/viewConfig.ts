import { integer, pgTable, text } from "drizzle-orm/pg-core";

// Guardian Connector views table.
export const viewConfig = pgTable("views", {
  viewId: integer("view_id").unique(),
  tableName: text("table_name").primaryKey(),
  viewName: text("view_name"),
  viewType: text("view_type"),
  primaryDataset: text("primary_dataset"),
  secondaryDataset: text("secondary_dataset"),
  viewConfig: text("view_config"),
  viewsConfig: text("views_config").notNull(),
});
