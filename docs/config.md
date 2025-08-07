# Explorer configuration

The configuration for views in a _GuardianConnector Explorer_ deployment is done by setting config for database tables in the `/config` route.

## Views Configuration Settings

Each table view can be configured using the following settings:

## Available Views

#### `VIEWS` (required)

Specify the views for each table, separated by commas. The table will be accessible in the specified views.

Currently available options:

- `map`
- `gallery`
- `alerts`

The routes for all views are listed on the index.html route (`/`).

## Map configuration

#### `MAPBOX_STYLE` (optional)

You can provide your own style for any views that utilize a map.

#### `MAPBOX_ACCESS_TOKEN` (required)

You can provide your own Mapbox access token to enable the option to use Mapbox basemaps as a style option in the basemap selector menu.

#### `MAPBOX_ZOOM` (optional)

Define the initial zoom level for the Mapbox map.


#### `MAPBOX_CENTER_LATITUDE` (optional) and `MAPBOX_CENTER_LONGITUDE` (optional)

Set the center latitude and longitude for the Mapbox map.

#### `MAPBOX_PROJECTION` (optional)

Specify the Mapbox map projection.

#### `MAPBOX_PITCH` and `MAPBOX_BEARING` (optional)

Adjust the pitch and bearing for the Mapbox map view.

#### `MAPBOX_3D` (optional)

Enable a 3D terrain layer in the Mapbox map.

#### `MAP_LEGEND_LAYER_IDS` (optional)

A comma-separated list of Mapbox layer ids to be rendered in an optional map legend component. In the component, the layer `type` and `color` will be used to set the legend symbol style (currently supported: fill, line, circle), and the layer `id` will be set as the legend description. Note that we are currently only supporting adding layers to the legend where the color is directly set and not across zoom / data range or with data conditions.

#### `PLANET_API_KEY` (optional)

Provide a Planet API key to enable the option to use Planet basemaps as a style option in the basemap selector menu.

> [!TIP]
>
> [Mapbox's Location Helper](https://demos.mapbox.com/location-helper/) page is a useful tool for easily setting all of the Mapbox configuration settings.

## Media configuration

#### `MEDIA_BASE_PATH` (optional)

Enables embedding of media filenames from the database in the Gallery or Map views. To use this, specify the base path for media files in `MEDIA_BASE_PATH`. If not set, the gallery view will be disabled for this table.

For alerts, you need to provide a separate base path for alerts. Append your `MEDIA_BASE_PATH` variable with `_ALERTS`. If you are also using Mapeo data, then provide a separate `MEDIA_BASE_PATH` value.

## Filtering configuration

#### `FILTER_BY_COLUMN` (optional)

Provides a column by which to filter out unwanted values.

#### `FILTER_OUT_VALUES_FROM_COLUMN` (optional)

A comma-separated list of values, which if found in the value for `FILTER_BY_COLUMN`, will filter out the row from the API response.

#### `FRONT_END_FILTER_COLUMN` (optional)

Depending on your data, you will want to use a meaningful column for filtering (for example, `Category` for Mapeo data). This variable defines the column used for front-end dropdown filtering.

#### `UNWANTED_COLUMNS` (optional) and `UNWANTED_SUBSTRINGS` (optional)

List the exact column names (`UNWANTED_COLUMNS`) and/or columns containing specific substrings (`UNWANTED_SUBSTRINGS`) to be filtered out from data collection APIs. Useful for removing unnecessary metadata columns.

> [!NOTE]
> 
> Many outputs from data collection APIs have a lot of extraneous metadata columns that are not useful to the end user. See [schema.md](schema.md) for a list of these columns that are output by popular data collection APIs.


## Alerts configuration

#### `MAPEO_CATEGORY_IDS` (optional, for Alerts view)

For showing Mapeo data on the Alerts Dashboard, provide a comma-separated list of `categoryId` values that you want to show.

#### `MAPEO_TABLE` (optional, for Alerts view)

For showing Mapeo data on the Alerts Dashboard, provide the name of the Mapeo database table.

## Other configuration

#### `LOGO_URL` (optional)

You can provide a URL to your organization / community logo which will show up in the Alerts dashboard intro panel.