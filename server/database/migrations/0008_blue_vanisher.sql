-- Delta from schema baseline (pull review): align views with prod introspection.
-- Prior migrations (0000–0007) already own all table DDL; do not recreate tables here.
ALTER TABLE "views" ALTER COLUMN "view_type" DROP NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "views_view_id_idx" ON "views" USING btree ("view_id");
