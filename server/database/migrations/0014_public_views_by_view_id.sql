ALTER TABLE public.public_views
    ADD COLUMN view_id integer;

ALTER TABLE public.public_views
    DROP CONSTRAINT public_views_pkey,
    ALTER COLUMN table_name DROP NOT NULL;

INSERT INTO public.public_views (view_id)
SELECT view_id
FROM public.views
WHERE view_config::jsonb ->> 'ROUTE_LEVEL_PERMISSION' = 'anyone';

DELETE FROM public.public_views
WHERE view_id IS NULL;

ALTER TABLE public.public_views
    DROP COLUMN table_name,
    ALTER COLUMN view_id SET NOT NULL,
    ADD CONSTRAINT public_views_pkey PRIMARY KEY (view_id),
    ADD CONSTRAINT public_views_view_id_views_view_id_fk
        FOREIGN KEY (view_id)
        REFERENCES public.views(view_id)
        ON DELETE CASCADE;
