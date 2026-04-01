ALTER TABLE "incidents"
ADD COLUMN "parent_alerts_table" text;

CREATE INDEX IF NOT EXISTS "incidents_parent_alerts_table_idx"
ON "incidents" ("parent_alerts_table");
