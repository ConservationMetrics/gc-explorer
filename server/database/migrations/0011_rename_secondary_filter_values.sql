-- Replace category-specific secondary filter keys with generic include values.
-- Existing Mapeo configs implicitly filtered on p__categoryid.
UPDATE views
SET view_config = (
  (view_config::jsonb - 'MAPEO_CATEGORY_IDS' - 'SECONDARY_CATEGORY_IDS')
  || CASE
    WHEN NOT (view_config::jsonb ? 'SECONDARY_FILTER_VALUES')
    THEN jsonb_build_object(
      'SECONDARY_FILTER_VALUES',
      COALESCE(
        view_config::jsonb -> 'SECONDARY_CATEGORY_IDS',
        view_config::jsonb -> 'MAPEO_CATEGORY_IDS'
      )
    )
    ELSE '{}'::jsonb
  END
  || CASE
    WHEN NOT (view_config::jsonb ? 'FRONT_END_FILTER_COLUMN')
    THEN jsonb_build_object('FRONT_END_FILTER_COLUMN', 'p__categoryid')
    ELSE '{}'::jsonb
  END
)::text
WHERE view_config::jsonb ? 'SECONDARY_CATEGORY_IDS'
   OR view_config::jsonb ? 'MAPEO_CATEGORY_IDS';