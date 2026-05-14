-- Backfill map view configuration into first-class columns.
-- Non-destructive: source rows in view_config are preserved.
INSERT INTO "view_config_map" (
  "view_id",
  "primary_dataset",
  "secondary_datasets"
)
SELECT
  vc."table_name" AS "view_id",
  vc."table_name" AS "primary_dataset",
  NULL AS "secondary_datasets"
FROM "view_config" vc
WHERE EXISTS (
  SELECT 1
  FROM UNNEST(
    STRING_TO_ARRAY(
      COALESCE(vc."views_config"::jsonb ->> 'VIEWS', ''),
      ','
    )
  ) AS configured_view(view_name)
  WHERE BTRIM(configured_view.view_name) = 'map'
)
ON CONFLICT ("view_id") DO NOTHING;
