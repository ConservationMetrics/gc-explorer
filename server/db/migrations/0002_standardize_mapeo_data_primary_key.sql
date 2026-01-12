-- Migration: Standardize mapeo_data primary key to _id
-- This migration renames the id column to _id and updates the primary key constraint
-- to maintain consistency across all warehouse tables
DO $$
BEGIN
    -- Check if mapeo_data table exists and has id column as primary key
    IF EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu 
            ON tc.constraint_name = kcu.constraint_name
        WHERE tc.table_name = 'mapeo_data'
          AND tc.constraint_type = 'PRIMARY KEY'
          AND kcu.column_name = 'id'
    ) THEN
        -- Drop the existing primary key constraint
        ALTER TABLE public.mapeo_data DROP CONSTRAINT IF EXISTS mapeo_data_pkey;
        
        -- If _id column exists but is nullable, make it NOT NULL
        -- If _id doesn't exist, we'll need to create it from id
        IF EXISTS (
            SELECT 1 
            FROM information_schema.columns 
            WHERE table_name = 'mapeo_data' AND column_name = '_id'
        ) THEN
            -- Update _id to match id values where _id is NULL
            UPDATE public.mapeo_data SET _id = id WHERE _id IS NULL;
            
            -- Make _id NOT NULL
            ALTER TABLE public.mapeo_data ALTER COLUMN _id SET NOT NULL;
        ELSE
            -- Create _id column and copy values from id
            ALTER TABLE public.mapeo_data ADD COLUMN _id text;
            UPDATE public.mapeo_data SET _id = id;
            ALTER TABLE public.mapeo_data ALTER COLUMN _id SET NOT NULL;
        END IF;
        
        -- Drop the old id column
        ALTER TABLE public.mapeo_data DROP COLUMN IF EXISTS id;
        
        -- Create new primary key on _id
        ALTER TABLE public.mapeo_data 
            ADD CONSTRAINT mapeo_data_pkey PRIMARY KEY (_id);
    END IF;
END $$;
