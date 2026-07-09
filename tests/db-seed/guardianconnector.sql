-- Guardian Connector test fixtures (data only).
-- DDL is owned by Drizzle migrations; applied after migrate in CI (see server/plugins/migrate.ts).

INSERT INTO public_views (table_name) VALUES ('seed_survey_data') ON CONFLICT DO NOTHING;
INSERT INTO public_views (table_name) VALUES ('fake_alerts') ON CONFLICT DO NOTHING;

INSERT INTO views (view_name, view_type, primary_dataset, secondary_dataset, view_config) VALUES
  (
    'seed_survey_data',
    'gallery',
    'seed_survey_data',
    NULL,
    '{"MAPBOX_STYLE":"mapbox://styles/mapbox/streets-v12","MAPBOX_ACCESS_TOKEN":"{MAPBOX_ACCESS_TOKEN}","MAPBOX_ZOOM":16,"MAPBOX_CENTER_LATITUDE":"3.44704","MAPBOX_CENTER_LONGITUDE":"-76.53995","MAPBOX_PROJECTION":"globe","MAPBOX_BEARING":0,"MAPBOX_PITCH":0,"FRONT_END_FILTER_COLUMN":"community","MEDIA_BASE_PATH":"{MEDIA_BASE_PATH}","ROUTE_LEVEL_PERMISSION":"anyone"}'
  ),
  (
    'bcmform_responses',
    'map',
    'bcmform_responses',
    NULL,
    '{"MAPBOX_STYLE":"mapbox://styles/mapbox/streets-v12","MAPBOX_ACCESS_TOKEN":"{MAPBOX_ACCESS_TOKEN}","MAPBOX_ZOOM":16,"MAPBOX_CENTER_LATITUDE":"3.44704","MAPBOX_CENTER_LONGITUDE":"-76.53995","MAPBOX_PROJECTION":"globe","MAPBOX_BEARING":0,"MAPBOX_PITCH":0,"FRONT_END_FILTER_COLUMN":"community","MEDIA_BASE_PATH":"{MEDIA_BASE_PATH}","ROUTE_LEVEL_PERMISSION":"member"}'
  ),
  (
    'bcmform_responses',
    'gallery',
    'bcmform_responses',
    NULL,
    '{"MAPBOX_STYLE":"mapbox://styles/mapbox/streets-v12","MAPBOX_ACCESS_TOKEN":"{MAPBOX_ACCESS_TOKEN}","MAPBOX_ZOOM":16,"MAPBOX_CENTER_LATITUDE":"3.44704","MAPBOX_CENTER_LONGITUDE":"-76.53995","MAPBOX_PROJECTION":"globe","MAPBOX_BEARING":0,"MAPBOX_PITCH":0,"FRONT_END_FILTER_COLUMN":"community","MEDIA_BASE_PATH":"{MEDIA_BASE_PATH}","ROUTE_LEVEL_PERMISSION":"member"}'
  ),
  (
    'fake_alerts',
    'alerts',
    'fake_alerts',
    'mapeo_data',
    '{"EMBED_MEDIA":"YES","MEDIA_BASE_PATH_ALERTS":"","MEDIA_BASE_PATH":"","LOGO_URL":"https://conservationmetrics.com/wp-content/themes/conservation-metrics/images/logo-conservation-metrics.png","MAPBOX_STYLE":"mapbox://styles/mapbox/satellite-streets-v12","MAPBOX_PROJECTION":"globe","MAPBOX_CENTER_LATITUDE":"38","MAPBOX_CENTER_LONGITUDE":"-79","MAPBOX_ZOOM":7,"MAPBOX_PITCH":0,"MAPBOX_BEARING":0,"MAPBOX_3D":false,"MAPEO_TABLE":"mapeo_data","MAPEO_CATEGORY_IDS":"threat","MAP_LEGEND_LAYER_IDS":"road-primary,aerialway","ALERT_RESOURCES":"NO","MAPBOX_ACCESS_TOKEN":"{MAPBOX_ACCESS_TOKEN}","PLANET_API_KEY":"{PLANET_API_KEY}","ROUTE_LEVEL_PERMISSION":"anyone"}'
  ),
  (
    'gfw_alerts_viirs',
    'alerts',
    'gfw_alerts_viirs',
    'mapeo_data',
    '{"EMBED_MEDIA":"NO","MEDIA_BASE_PATH_ALERTS":"","MEDIA_BASE_PATH":"","MAPBOX_STYLE":"mapbox://styles/mapbox/satellite-streets-v12","MAPBOX_PROJECTION":"globe","MAPBOX_CENTER_LATITUDE":"1.20","MAPBOX_CENTER_LONGITUDE":"34.60","MAPBOX_ZOOM":8,"MAPBOX_PITCH":0,"MAPBOX_BEARING":0,"MAPBOX_3D":false,"MAPEO_TABLE":"mapeo_data","MAPEO_CATEGORY_IDS":"threat","MAP_LEGEND_LAYER_IDS":"road-primary,aerialway","ALERT_RESOURCES":"NO","MAPBOX_ACCESS_TOKEN":"{MAPBOX_ACCESS_TOKEN}","PLANET_API_KEY":"{PLANET_API_KEY}","ROUTE_LEVEL_PERMISSION":"anyone"}'
  )
ON CONFLICT (view_type, primary_dataset) DO NOTHING;
