UPDATE views
SET view_config = (view_config::jsonb - 'UNWANTED_SUBSTRINGS')::text
WHERE view_config::jsonb ? 'UNWANTED_SUBSTRINGS';
