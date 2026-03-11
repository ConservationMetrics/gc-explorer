-- Make created_by column optional in annotated_collections table
-- This allows incidents to be created when AUTH_STRATEGY=none (no authentication)

ALTER TABLE "annotated_collections" ALTER COLUMN "created_by" DROP NOT NULL;
