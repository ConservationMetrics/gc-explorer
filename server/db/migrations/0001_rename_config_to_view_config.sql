-- Migration: Rename config table to view_config
-- This migration renames the existing config table to view_config

-- Rename the table
ALTER TABLE config RENAME TO view_config;
