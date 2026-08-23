UPDATE views
SET view_config = (view_config::jsonb - 'UNWANTED_COLUMNS')::text
WHERE view_config::jsonb ? 'UNWANTED_COLUMNS';
