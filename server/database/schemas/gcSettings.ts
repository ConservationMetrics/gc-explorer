import { pgTable, text, timestamp } from "drizzle-orm/pg-core";

/** Landing-page-owned table. Read-only here; omit from schema.ts so drizzle-kit does not migrate it. */
export const gcSettings = pgTable("gc_settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});
