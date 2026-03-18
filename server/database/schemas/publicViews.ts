import { pgTable, text } from "drizzle-orm/pg-core";

export const publicViews = pgTable("public_views", {
  tableName: text("table_name").primaryKey(),
});
