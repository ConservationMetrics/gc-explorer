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

Run E2E tests that verify the full application, from a real browser down to the
backend API and database, and back up:

```bash
# Run E2E tests in an isolated Docker environment (starts backend + database)
$ docker compose -f docker-compose.tests.yml up -d database backend
$ pnpm test:e2e

# Run E2E tests using a specific Docker image tag
$ ImgTag=2025-01-01 docker compose -f docker-compose.tests.yml up -d database backend
$ pnpm test:e2e

# Or use the convenience script (requires .env.local.docker-tests file)
$ ./run-local-docker-tests.sh
$ pnpm test:e2e

# For local development (without Docker), Playwright will start its own dev server
$ pnpm test:e2e
```

**Important:** E2E tests require a fully functional test environment. The preferred setup uses
docker-compose to spin up isolated containers for the backend and database, then runs Playwright tests separately.
This approach guarantees consistent test runs without relying on shared environments.

**Test Modes:**
- **Docker mode** (CI=true): Uses containerized backend and database, Playwright runs against these services
- **Local mode** (CI not set): Playwright starts its own Nuxt dev server and runs tests against it

**Environment Setup:**
- For local Docker testing: Create a `.env.local.docker-tests` file with your API keys and secrets:
  - `NUXT_PUBLIC_APP_API_KEY`
  - `NUXT_SESSION_SECRET`
  - `MAPBOX_ACCESS_TOKEN`
  - `MEDIA_BASE_PATH`
  - `PLANET_API_KEY`
  - `ImgTag=local`
- For local testing with `.env.test`: Copy `.env.test.example` and set:
  - `CI=true` for Docker mode (uses containerized services)
  - `CI=false` for local mode (Playwright starts its own dev server)
  - All required API keys and secrets
- For CI testing: The workflow uses `.env.test` with GitHub secrets
- See `.env.test.example` for the required environment variables

The `docker-compose.test.yml` takes care of:
1. Populating the test database with known mock data, including survey and alerts views.
2. Setting `NUXT_PUBLIC_AUTH_STRATEGY="none"` to bypass authentication.

Note: the database is ephemeral. To reload seed data, remove the volume:

    docker volume rm gc-explorer_db_data

### CI/CD Testing

The GitHub Actions workflow automatically runs both unit and end-to-end (E2E) tests. For E2E tests to work in CI, we have configured the relevant GitHub secrets in the repository settings based on the `.env.test.example` file.

**How it works:**
- The CI environment spins up isolated Docker containers for the backend and PostgreSQL database, just like local testing.
- The workflow builds a Docker image tagged as `ci-test` and uses it for testing.
- The database is initialized with the same seed data as local testing, ensuring consistent test environments.
- The workflow automatically generates a `.env.test` file with the necessary secrets before running tests.
- Playwright runs E2E tests against the containerized application and database.

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