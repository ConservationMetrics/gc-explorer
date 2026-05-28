ALTER TABLE IF EXISTS "view_config" RENAME TO "views";
--> statement-breakpoint
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'views' AND column_name = 'table_name'
  ) AND NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'views' AND column_name = 'primary_dataset'
  ) THEN
    ALTER TABLE "views" RENAME COLUMN "table_name" TO "primary_dataset";
  END IF;
END $$;
--> statement-breakpoint
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'views' AND column_name = 'views_config'
  ) AND NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'views' AND column_name = 'view_config'
  ) THEN
    ALTER TABLE "views" RENAME COLUMN "views_config" TO "view_config";
  END IF;
END $$;
--> statement-breakpoint
ALTER TABLE "views"
  ADD COLUMN IF NOT EXISTS "view_id" integer,
  ADD COLUMN IF NOT EXISTS "view_name" text,
  ADD COLUMN IF NOT EXISTS "view_type" text,
  ADD COLUMN IF NOT EXISTS "secondary_dataset" text;
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
    NULLIF(BTRIM("view_config"::jsonb ->> 'DATASET_TABLE'), ''),
    "primary_dataset"
  ),
  "view_type" = COALESCE(
    NULLIF(BTRIM("view_type"), ''),
    CASE
      WHEN BTRIM(SPLIT_PART(COALESCE("view_config"::jsonb ->> 'VIEWS', ''), ',', 1)) = 'alerts' THEN 'alert'
      ELSE NULLIF(BTRIM(SPLIT_PART(COALESCE("view_config"::jsonb ->> 'VIEWS', ''), ',', 1)), '')
    END
  ),
  "secondary_dataset" = COALESCE(
    NULLIF(BTRIM("secondary_dataset"), ''),
    NULLIF(BTRIM("view_config"::jsonb ->> 'MAPEO_TABLE'), '')
  )
WHERE
  "view_id" IS NULL
  OR NULLIF(BTRIM("view_name"), '') IS NULL
  OR NULLIF(BTRIM("view_type"), '') IS NULL
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
  ALTER COLUMN "view_id" SET NOT NULL,
  ALTER COLUMN "primary_dataset" SET NOT NULL,
  ALTER COLUMN "view_config" SET NOT NULL;
--> statement-breakpoint
DO $$
DECLARE
  existing_primary_key text;
BEGIN
  SELECT constraint_name
  INTO existing_primary_key
  FROM information_schema.table_constraints
  WHERE table_name = 'views'
    AND constraint_type = 'PRIMARY KEY'
  LIMIT 1;

  IF existing_primary_key IS NOT NULL THEN
    EXECUTE format('ALTER TABLE "views" DROP CONSTRAINT %I', existing_primary_key);
  END IF;
END $$;
--> statement-breakpoint
ALTER TABLE "views"
  ADD CONSTRAINT "views_pkey" PRIMARY KEY ("view_id");
--> statement-breakpoint
ALTER TABLE "views"
  DROP COLUMN IF EXISTS "table_name",
  DROP COLUMN IF EXISTS "views_config";
