-- Migration: Rename config table to view_config
-- This migration renames the existing config table to view_config

-- Only rename if config table exists and view_config doesn't exist
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'config')
       AND NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'view_config') THEN
        ALTER TABLE config RENAME TO view_config;
    END IF;
END $$;
