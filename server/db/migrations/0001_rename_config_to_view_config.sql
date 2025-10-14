-- Migration: Rename config table to view_config
-- This migration renames the existing config table to view_config

DO $$
BEGIN
    -- If config table exists and view_config doesn't exist, rename it
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'config')
       AND NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'view_config') THEN
        ALTER TABLE config RENAME TO view_config;
    -- If both tables exist, migrate data from config to view_config and drop config
    ELSIF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'config')
       AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'view_config') THEN
        INSERT INTO view_config (table_name, views_config)
        SELECT table_name, views_config FROM config
        ON CONFLICT (table_name) DO NOTHING;
        DROP TABLE config;
    END IF;
END $$;
