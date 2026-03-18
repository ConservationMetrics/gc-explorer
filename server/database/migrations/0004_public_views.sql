-- Public views metastore: list of table names that are publicly accessible (ROUTE_LEVEL_PERMISSION = anyone).
-- Kept in sync when config is saved via update_config. Read by open API for middleware auth bypass.

CREATE TABLE IF NOT EXISTS public.public_views (
    table_name text NOT NULL PRIMARY KEY
);
