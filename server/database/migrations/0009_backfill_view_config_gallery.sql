-- Backfill gallery view configuration into first-class columns.
-- Non-destructive: source rows in view_config are preserved.
INSERT INTO "view_config_gallery" (
  "view_id",
  "primary_dataset"
)
SELECT
  vc."table_name" AS "view_id",
  vc."table_name" AS "primary_dataset"
FROM "view_config" vc
WHERE EXISTS (
  SELECT 1
  FROM UNNEST(
    STRING_TO_ARRAY(
      COALESCE(vc."views_config"::jsonb ->> 'VIEWS', ''),
      ','
    )
  ) AS configured_view(view_name)
  WHERE BTRIM(configured_view.view_name) = 'gallery'
)
ON CONFLICT ("view_id") DO NOTHING;
