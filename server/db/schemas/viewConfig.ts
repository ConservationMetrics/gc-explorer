import { pgTable, text } from "drizzle-orm/pg-core";

// Guardian Connector view config table (existing table)
export const viewConfig = pgTable("view_config", {
  tableName: text("table_name").primaryKey(),
  viewsConfig: text("views_config").notNull(),
});
