-- Move each view-level Mapbox token into its basemap entries.
-- Stop and report the view ID when existing basemap data cannot be migrated safely.
DO $$
DECLARE
  view_row record;
  config jsonb;
  basemaps jsonb;
  migrated_basemaps jsonb;
BEGIN
  FOR view_row IN
    SELECT view_id, view_config
    FROM views
    WHERE NULLIF(btrim(view_config::jsonb ->> 'MAPBOX_ACCESS_TOKEN'), '') IS NOT NULL
  LOOP
    config := view_row.view_config::jsonb;

    IF config ? 'MAPBOX_BASEMAPS'
      AND jsonb_typeof(config -> 'MAPBOX_BASEMAPS') <> 'string' THEN
      RAISE EXCEPTION
        'Cannot migrate Mapbox tokens for view_id=%: malformed MAPBOX_BASEMAPS',
        view_row.view_id;
    END IF;

    BEGIN
      basemaps := (config ->> 'MAPBOX_BASEMAPS')::jsonb;
    EXCEPTION WHEN invalid_text_representation THEN
      RAISE EXCEPTION
        'Cannot migrate Mapbox tokens for view_id=%: malformed MAPBOX_BASEMAPS',
        view_row.view_id;
    END;

    IF jsonb_typeof(basemaps) = 'array' AND jsonb_array_length(basemaps) > 0 THEN
      IF EXISTS (
        SELECT 1
        FROM jsonb_array_elements(basemaps) AS item(basemap)
        WHERE jsonb_typeof(basemap) <> 'object'
          OR NULLIF(btrim(basemap ->> 'name'), '') IS NULL
          OR basemap -> 'style' IS NULL
          OR jsonb_typeof(basemap -> 'style') = 'null'
          OR (
            jsonb_typeof(basemap -> 'style') = 'string'
            AND NULLIF(btrim(basemap ->> 'style'), '') IS NULL
          )
      ) THEN
        RAISE EXCEPTION
          'Cannot migrate Mapbox tokens for view_id=%: malformed MAPBOX_BASEMAPS',
          view_row.view_id;
      END IF;

      SELECT jsonb_agg(
        CASE
          WHEN NULLIF(btrim(basemap ->> 'access_token'), '') IS NOT NULL
            THEN basemap
          ELSE jsonb_set(
            basemap,
            '{access_token}',
            to_jsonb(btrim(config ->> 'MAPBOX_ACCESS_TOKEN'))
          )
        END
        ORDER BY position
      )
      INTO migrated_basemaps
      FROM jsonb_array_elements(basemaps) WITH ORDINALITY AS item(basemap, position);
    ELSIF basemaps IS NOT NULL AND jsonb_typeof(basemaps) <> 'array' THEN
      RAISE EXCEPTION
        'Cannot migrate Mapbox tokens for view_id=%: malformed MAPBOX_BASEMAPS',
        view_row.view_id;
    ELSIF NULLIF(btrim(config ->> 'MAPBOX_STYLE'), '') IS NOT NULL THEN
      migrated_basemaps := jsonb_build_array(jsonb_build_object(
        'name', 'Default Style',
        'style', config -> 'MAPBOX_STYLE',
        'access_token', btrim(config ->> 'MAPBOX_ACCESS_TOKEN'),
        'isDefault', true
      ));
    ELSE
      RAISE EXCEPTION
        'Cannot migrate Mapbox tokens for view_id=%: no valid MAPBOX_BASEMAPS or MAPBOX_STYLE',
        view_row.view_id;
    END IF;

    UPDATE views
    SET view_config = (
      jsonb_set(
        config,
        '{MAPBOX_BASEMAPS}',
        to_jsonb(migrated_basemaps::text)
      ) - 'MAPBOX_ACCESS_TOKEN' - 'MAPBOX_STYLE'
    )::text
    WHERE view_id = view_row.view_id;
  END LOOP;
END $$;
