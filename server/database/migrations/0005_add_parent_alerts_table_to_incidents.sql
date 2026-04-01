ALTER TABLE "incidents"
ADD COLUMN IF NOT EXISTS "parent_alerts_table" text;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "incidents_parent_alerts_table_idx"
ON "incidents" ("parent_alerts_table");
