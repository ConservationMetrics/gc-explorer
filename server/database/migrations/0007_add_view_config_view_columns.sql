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
CREATE OR REPLACE FUNCTION normalize_view_config_for_type_0007(
  source_config text,
  normalized_view_type text
)
RETURNS text
LANGUAGE SQL
AS $$
  SELECT CASE
    WHEN normalized_view_type IN ('map', 'alert') THEN
      jsonb_set(
        source_config::jsonb,
        '{VIEWS}',
        to_jsonb(CASE WHEN normalized_view_type = 'alert' THEN 'alerts' ELSE normalized_view_type END),
        true
      )::text
    ELSE
      jsonb_set(
      jsonb_set(
      jsonb_set(
      jsonb_set(
      jsonb_set(
      jsonb_set(
      jsonb_set(
      jsonb_set(
      jsonb_set(
      jsonb_set(
      jsonb_set(
      jsonb_set(
      jsonb_set(
      jsonb_set(
      jsonb_set(
        jsonb_set(source_config::jsonb, '{VIEWS}', to_jsonb('gallery'::text), true),
        '{MAPBOX_STYLE}', to_jsonb(''::text), true),
        '{MAPBOX_PROJECTION}', to_jsonb(''::text), true),
        '{MAPBOX_ZOOM}', to_jsonb(''::text), true),
        '{MAPBOX_CENTER_LATITUDE}', to_jsonb(''::text), true),
        '{MAPBOX_CENTER_LONGITUDE}', to_jsonb(''::text), true),
        '{MAPBOX_PITCH}', to_jsonb(''::text), true),
        '{MAPBOX_BEARING}', to_jsonb(''::text), true),
        '{MAPBOX_3D}', to_jsonb(''::text), true),
        '{MAPBOX_3D_TERRAIN_EXAGGERATION}', to_jsonb(''::text), true),
        '{MAPBOX_BASEMAPS}', to_jsonb(''::text), true),
        '{MAPBOX_ACCESS_TOKEN}', to_jsonb(''::text), true),
        '{PLANET_API_KEY}', to_jsonb(''::text), true),
        '{MAP_LEGEND_LAYER_IDS}', to_jsonb(''::text), true),
        '{COLOR_COLUMN}', to_jsonb(''::text), true),
        '{ICON_COLUMN}', to_jsonb(''::text), true
      )::text
  END;
$$;
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
      WHEN LOWER(BTRIM(SPLIT_PART(COALESCE("view_config"::jsonb ->> 'VIEWS', ''), ',', 1))) = 'alerts' THEN 'alert'
      ELSE NULLIF(LOWER(BTRIM(SPLIT_PART(COALESCE("view_config"::jsonb ->> 'VIEWS', ''), ',', 1))), '')
    END
  ),
  "secondary_dataset" = COALESCE(
    NULLIF(BTRIM("secondary_dataset"), ''),
    CASE
      WHEN LOWER(BTRIM(SPLIT_PART(COALESCE("view_config"::jsonb ->> 'VIEWS', ''), ',', 1))) IN ('alert', 'alerts')
        THEN NULLIF(BTRIM("view_config"::jsonb ->> 'MAPEO_TABLE'), '')
      ELSE NULL
    END
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
INSERT INTO "views" (
  "view_name",
  "view_type",
  "primary_dataset",
  "secondary_dataset",
  "view_config"
)
SELECT
  COALESCE(
    NULLIF(BTRIM(base_view."view_config"::jsonb ->> 'DATASET_TABLE'), ''),
    base_view."primary_dataset"
  ) AS "view_name",
  configured_view.normalized_view_type AS "view_type",
  base_view."primary_dataset",
  CASE
    WHEN configured_view.normalized_view_type = 'alert'
      THEN NULLIF(BTRIM(base_view."view_config"::jsonb ->> 'MAPEO_TABLE'), '')
    ELSE NULL
  END AS "secondary_dataset",
  normalize_view_config_for_type_0007(
    base_view."view_config",
    configured_view.normalized_view_type
  )
FROM "views" base_view
CROSS JOIN LATERAL (
  SELECT
    CASE
      WHEN LOWER(BTRIM(raw_view.view_name)) IN ('alert', 'alerts') THEN 'alert'
      ELSE LOWER(BTRIM(raw_view.view_name))
    END AS normalized_view_type,
    raw_view.ordinality
  FROM UNNEST(
    STRING_TO_ARRAY(COALESCE(base_view."view_config"::jsonb ->> 'VIEWS', ''), ',')
  ) WITH ORDINALITY AS raw_view(view_name, ordinality)
) configured_view
WHERE configured_view.ordinality > 1
  AND configured_view.normalized_view_type IN ('alert', 'map', 'gallery')
  AND NOT EXISTS (
    SELECT 1
    FROM "views" existing_view
    WHERE existing_view."primary_dataset" = base_view."primary_dataset"
      AND existing_view."view_type" = configured_view.normalized_view_type
  );
--> statement-breakpoint
UPDATE "views"
SET "view_config" = normalize_view_config_for_type_0007("view_config", "view_type")
WHERE "view_type" IN ('alert', 'map', 'gallery');
--> statement-breakpoint
DROP FUNCTION normalize_view_config_for_type_0007(text, text);
