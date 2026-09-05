import { integer, pgTable } from "drizzle-orm/pg-core";
import { viewConfig } from "./viewConfig";

export const publicViews = pgTable("public_views", {
  viewId: integer("view_id")
    .primaryKey()
    .references(() => viewConfig.viewId, { onDelete: "cascade" }),
});
