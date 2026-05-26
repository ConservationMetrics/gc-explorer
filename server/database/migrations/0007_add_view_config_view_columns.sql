ALTER TABLE IF EXISTS "view_config" RENAME TO "views";
--> statement-breakpoint
ALTER TABLE "views"
  ADD COLUMN IF NOT EXISTS "view_id" integer,
  ADD COLUMN IF NOT EXISTS "view_name" text,
  ADD COLUMN IF NOT EXISTS "view_type" text,
  ADD COLUMN IF NOT EXISTS "primary_dataset" text,
  ADD COLUMN IF NOT EXISTS "secondary_dataset" text,
  ADD COLUMN IF NOT EXISTS "view_config" text;
--> statement-breakpoint
CREATE SEQUENCE IF NOT EXISTS "views_view_id_seq";
--> statement-breakpoint
ALTER SEQUENCE "views_view_id_seq" OWNED BY "views"."view_id";
--> statement-breakpoint
UPDATE "views"
SET
  "view_id" = COALESCE("view_id", nextval('views_view_id_seq')),
  "view_name" = COALESCE(
    NULLIF(BTRIM("view_name"), ''),
    NULLIF(BTRIM("views_config"::jsonb ->> 'DATASET_TABLE'), ''),
    "table_name"
  ),
  "view_type" = COALESCE(
    NULLIF(BTRIM("view_type"), ''),
    CASE
      WHEN BTRIM(SPLIT_PART(COALESCE("views_config"::jsonb ->> 'VIEWS', ''), ',', 1)) = 'alerts' THEN 'alert'
      ELSE NULLIF(BTRIM(SPLIT_PART(COALESCE("views_config"::jsonb ->> 'VIEWS', ''), ',', 1)), '')
    END
  ),
  "primary_dataset" = COALESCE(NULLIF(BTRIM("primary_dataset"), ''), "table_name"),
  "secondary_dataset" = COALESCE(
    NULLIF(BTRIM("secondary_dataset"), ''),
    NULLIF(BTRIM("views_config"::jsonb ->> 'MAPEO_TABLE'), '')
  ),
  "view_config" = COALESCE(NULLIF(BTRIM("view_config"), ''), "views_config")
WHERE
  "view_id" IS NULL
  OR NULLIF(BTRIM("view_name"), '') IS NULL
  OR NULLIF(BTRIM("view_type"), '') IS NULL
  OR NULLIF(BTRIM("primary_dataset"), '') IS NULL
  OR NULLIF(BTRIM("view_config"), '') IS NULL;
--> statement-breakpoint
SELECT setval(
  'views_view_id_seq',
  COALESCE((SELECT MAX("view_id") FROM "views"), 0) + 1,
  false
);
--> statement-breakpoint
ALTER TABLE "views"
  ALTER COLUMN "view_id" SET DEFAULT nextval('views_view_id_seq'),
  ALTER COLUMN "view_id" SET NOT NULL;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "views_view_id_idx"
  ON "views" ("view_id");
