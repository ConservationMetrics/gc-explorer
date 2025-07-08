# GuardianConnector Explorer

<p align="center">
  <img src="docs/gcexplorer-small.png" alt="GC Explorer" />
</p>

This tool, designed for [GuardianConnector](https://guardianconnector.net) and built using [Nuxt.js](https://nuxt.com/), offers an API compatible with a PostgreSQL databases, and renders tabular data from one or more tables on different views including a map and a media gallery.

## Configure

To get started, copy `.env.example` to `.env` and add your database and table information, authentication, and a Mapbox access token.

**Database:** Provide your database information in the relevant variables.

**Authentication strategy:** GuardianConnector Explorer supports three different authentication strategies: auth0, password (from an environmental var) with JWT key, or none. Set your authentication strategy in `NUXT_PUBLIC_AUTH_STRATEGY`.

* If you are using an auth0 strategy, then you need to provide a domain, client ID, client secret, audience, and base URL.

**Nuxt App API key:** Generate an API key to add to request headers made by the Nuxt front end. You can generate one by running `openssl rand -base64 42`.

**Views configuration:** GuardianConnector Explorer can render multiple tables and you can determine which views to show for each table. To configure your tables and views, access the `/config` route once the application has started. For more information on this, please see [config.md](docs/config.md). You do not need to set this in order for GuardianConnector Explorer to start, however the index page will show an empty list and none of the view routes will load anything.

## Build Setup

```bash
# install dependencies
$ pnpm install

# serve with hot reload at localhost:8080
$ pnpm dev

# build for production and launch server
$ pnpm build
$ pnpm start

# generate static project
$ pnpm generate
```

Add `--hostname 0.0.0.0` if you want the app to be accessible across your local network.

## Deployment

For deployment, the following additional env vars are needed:

```
HOST: 0.0.0.0
NODE_ENV: production
```

Local deployment of Docker:

```sh
docker run --env-file=.env -it -p 8080:8080 guardianconnector-explorer:latest
```

## Testing

GuardianConnector Explorer uses two testing frameworks:

### Unit and Component Tests (Vitest)

Run unit and component tests with Vitest:

```bash
# Run tests in watch mode
$ pnpm test:unit
```

These tests use mocked dependencies and verify component logic in isolation.

### End-to-End Tests (Playwright)

Run E2E tests that verify the full application in a real browser:

```bash
# Run E2E tests
$ pnpm test:e2e

# Run all tests (unit + E2E)
$ pnpm test
```

**Important:** For E2E tests to work properly, you must set up a test environment:

1. Copy `.env.test.example` to `.env.test`
2. Ensure `NUXT_PUBLIC_AUTH_STRATEGY="none"` in your `.env.test` file to bypass authentication
3. Ensure your test database has the required tables, data and views config for the tests. This includes at least one alerts view.

The E2E tests run the real Nuxt application in a browser and connect to a real PostgreSQL database to verify user interactions and page rendering.

### CI/CD Testing

The GitHub Actions workflow automatically runs both unit and end-to-end (E2E) tests. For E2E tests to work in CI, we have configured the relevant GitHub secrets in the repository settings.

**How it works:**
- The CI environment does **not** spin up a local database. Instead, it connects to the shared demo/test database using the above secrets. This ensures your CI and local test environments are consistent and eliminates drift.
- The workflow automatically generates a `.env.test` file with these secrets before running tests.
- Playwright starts the Nuxt dev server using this environment and runs E2E tests against the real application and database.

## Available Views

### **Map**

![GuardianConnector Map with KoboToolbox data](docs/GuardianConnector-Map.jpg)
_Map view using sample KoboToolbox data, with an image and audio attachment embedded._

### **Gallery**

![GuardianConnector Gallery with KoboToolbox data](docs/GuardianConnector-Gallery.jpg)
_Gallery view using sample KoboToolbox data._

### **Alerts (change detection)**

![GuardianConnector Alerts with change detection data](docs/GuardianConnector-Alerts.jpg)
_Alerts dashboard view with fake alerts data._

## How it works

### Column headers ###

Currently, GuardianConnector expects these column headers, which follow the structure of a GeoJSON feature. You can use these [GeoJSON to SQL conversion scripts](https://github.com/rudokemper/geojson-csv-sql-conversion-tools) to transform your GeoJSON file into the expected format if needed.

| SQL Column | GeoJSON Field |
|------------|---------------|
| id         | id            |
| g\_\_type    | geometry.type |
| g\_\_coordinates | geometry.coordinates |
| ...     | properties... |

If found, GuardianConnector Explorer will use a column mapping SQL table (with "__column" suffix), like the one created by connector scripts of [GuardianConnector Script Hub](https://github.com/ConservationMetrics/gc-scripts-hub), to handle filtering and key/value rewrites.

 Any columns specified in the `.env` file will be filtered out (*see "Unwanted columns and substrings" above*).

At this time, media attachments in the popups are handled in a somewhat brittle way by embedding any strings that end in the expected photo, audio, or video file ending (such as `.jpg`, `.mp3`, or `.mp4`). We can improve on this later when we know more about how media attachments will be stored in the SQL database, and what kind of metadata we have access to.

### GeoJSON export formats for map view ###

The GuardianConnector Explorer map will render the feature on a map in accordance to what kind of `type` it is (Point, LineString, Polygon). The properties are shown in a popup opened by clicking on the feature.

The GuardianConnector Explorer map can work with any GeoJSON data stored in the expected tabular format, but the main purpose is to visualize field data collected using data collection applications such as (Co)Mapeo, ODK, and KoboToolbox. 

* Mapeo data from Mapeo Desktop is already exported as GeoJSON file, and a CoMapeo Archive Server returns data in a GeoJSON-compliant format.
* ODK / KoboToolbox API survey data with a geospatial column may be transformed into such a format.

In the future, this app can be expanded to also supporting loading from PostGIS, or directly from file.