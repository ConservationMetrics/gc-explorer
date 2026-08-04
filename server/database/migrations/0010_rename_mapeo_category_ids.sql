-- Rename MAPEO_CATEGORY_IDS → SECONDARY_CATEGORY_IDS in view_config JSON.
-- Prefer an existing SECONDARY_CATEGORY_IDS value if both keys are present.
UPDATE views
SET view_config = (
  CASE
    WHEN view_config::jsonb ? 'MAPEO_CATEGORY_IDS'
      AND NOT (view_config::jsonb ? 'SECONDARY_CATEGORY_IDS')
    THEN (
      (view_config::jsonb - 'MAPEO_CATEGORY_IDS')
      || jsonb_build_object(
        'SECONDARY_CATEGORY_IDS',
        view_config::jsonb -> 'MAPEO_CATEGORY_IDS'
      )
    )
    WHEN view_config::jsonb ? 'MAPEO_CATEGORY_IDS'
    THEN (view_config::jsonb - 'MAPEO_CATEGORY_IDS')
    ELSE view_config::jsonb
  END
)::text
WHERE view_config::jsonb ? 'MAPEO_CATEGORY_IDS';
