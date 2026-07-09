UPDATE views
SET view_config = (view_config::jsonb - 'MAPEO_TABLE')::text
WHERE view_type = 'alerts'
  AND secondary_dataset IS NOT NULL;