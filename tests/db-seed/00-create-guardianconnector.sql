-- Runs on first Postgres container init (empty data volume).
-- Creates the config DB before healthchecks pass.
CREATE DATABASE guardianconnector;
