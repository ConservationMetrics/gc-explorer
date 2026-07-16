# GuardianConnector Explorer

<p align="center">
  <img src="docs/gcexplorer-small.png" alt="GC Explorer" />
</p>

This tool, designed for [GuardianConnector](https://guardianconnector.net) and built using [Nuxt.js](https://nuxt.com/), offers an API compatible with a PostgreSQL databases, and renders tabular data from one or more tables on different views including a map and a media gallery.

## Configure

To get started, copy `.env.example` to `.env` and add your database and table information, authentication, and a Mapbox access token.

**Database:** Provide your database information in the relevant variables.

**Authentication strategy:** GuardianConnector Explorer supports three different authentication strategies: auth0, password (from an environmental var) with JWT key, or none. Set your authentication strategy in `NUXT_PUBLIC_AUTH_STRATEGY`.

- If you are using an auth0 strategy, then you need to provide a domain, client ID, client secret, audience, and base URL.

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

## Database

This application uses [Drizzle ORM](https://orm.drizzle.team/) for database operations and migrations.

### Migrations

Database migrations can be run in several ways:

**Development:**

```bash
# Generate new migration files
$ pnpm db:generate

# Apply migrations to database
$ pnpm db:migrate

# Open Drizzle Studio (database GUI)
$ pnpm db:studio
```

**Production (Docker), CI, and local dev:**
Migrations run for every environment automatically when the Nuxt/Nitro server starts (`server/plugins/migrate.ts`).

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

### 1. Unit and Component Tests (Vitest)

Run unit and component tests with Vitest:

```bash
# Run tests in watch mode
$ pnpm test:unit
```

These tests use mocked dependencies and verify component logic in isolation.

### 2. End-to-End Tests (Playwright)

Run E2E tests that verify the full application, from a real browser down to the
backend API and database, and back up.

E2E tests require a fully functional test environment. The preferred setup uses
docker-compose to spin up isolated containers for the backend and database, then runs Playwright tests separately.
This approach guarantees consistent test runs without relying on shared environments.

#### Test Execution Modes

E2E tests use two separate environment signals:

| Variable | Meaning |
| -------- | ------- |
| `NUXT_TEST=true` | Use the **Docker test stack**: Playwright connects to containers started by `docker-compose.tests.yml`, waits for migrations, and seeds guardianconnector fixtures via `globalSetup`. |
| `CI` (set automatically on GitHub Actions) | Playwright **does not** start `pnpm dev`; tests assume an external server is already running. |

Local Docker testing does **not** need `CI=true`. Set `NUXT_TEST=true` instead.

```bash
# Recommended: use the convenience script (requires .env.test.compose file)
$ ./run-local-docker-tests.sh
$ NUXT_TEST=true pnpm test:e2e

# Run E2E tests with isolated Docker services
$ docker compose -f docker-compose.tests.yml up -d database backend
$ NUXT_TEST=true pnpm test:e2e

# Run E2E tests using a specific Docker image tag
$ ImgTag=2025-01-01 docker compose -f docker-compose.tests.yml up -d database backend
$ NUXT_TEST=true pnpm test:e2e

# Quick development testing (Playwright starts its own dev server)
$ pnpm test:e2e
```

> [!WARNING]
>
> **Dev mode** (`NUXT_TEST` unset) requires a database connection in `.env.test.playwright`, and some E2E tests (e.g. config) write to the database. Use the Docker test stack locally to avoid touching your development database. Do not use production credentials in dev mode.

#### What runs where

| Step | Owner |
| ---- | ----- |
| Warehouse mock data (`warehouse.sql`) | Postgres init on first container start |
| Drizzle schema migrations | Nitro startup (`server/plugins/migrate.ts`) |
| Guardianconnector view fixtures (`guardianconnector.sql`) | Playwright `globalSetup` when `NUXT_TEST=true` |

#### Environment setup

##### Docker test stack (`NUXT_TEST=true`)

**For local testing with Docker services:**

- Copy `.env.test.compose.example` to `.env.test.compose` and set all required API keys and secrets
- Copy `.env.test.playwright.example` to `.env.test.playwright` and set `NUXT_TEST=true`
- Use `./run-local-docker-tests.sh` or manually start services with `docker compose -f docker-compose.tests.yml`
- Stop services when done: `docker compose -f docker-compose.tests.yml down`

`docker-compose.tests.yml`:

1. Seeds warehouse data from `tests/db-seed/warehouse.sql` on first Postgres start
2. Runs the backend with `NUXT_PUBLIC_AUTH_STRATEGY` from your env file (auth0 in CI, `none` optional locally)
3. Exposes Postgres on `127.0.0.1:5433` so Playwright can seed guardianconnector fixtures after migrations

The database volume is ephemeral. To reload warehouse seed data, remove the volume:

```bash
docker volume rm gc-explorer_db_data
```

**For GitHub Actions:**

- The workflow sets `CI=true` (Playwright external server) and writes `NUXT_TEST=true` into `.env.test.playwright`
- Uses the same `docker-compose.tests.yml` as local testing

##### Dev mode (local development)

**For quick development testing:**

- Copy `.env.test.playwright.example` to `.env.test.playwright` and set database connection + API keys
- Leave `NUXT_TEST` unset
- Playwright starts its own Nuxt dev server via `pnpm dev`

#### Playwright Test Development

It is recommended to run tests with headless mode disabled, so that you can see the browser as it runs the tests. While developing tests, you may also want to add timeouts to the tests, so that you can see the browser as it runs the tests. (Remember to remove these timeouts before committing your changes.)

You can run specific Playwright tests by appending `.only` to the test name, or by running:

```bash
pnpm test:e2e --grep "layer visibility toggles" # change to the test you want to run
```

### CI/CD Testing

The GitHub Actions workflow automatically runs both unit and E2E tests on every push and pull request.

**Automated workflow:**

- Builds a Docker image tagged as `ci-test` for testing
- Creates `.env.test.playwright` with GitHub secrets and starts the same Docker services as local testing
- Runs unit tests with `pnpm test:unit`
- Runs E2E tests with `NUXT_TEST=true` against the Docker test stack (`CI` is set automatically for Playwright)

GitHub secrets must be configured based on the `.env.test.playwright.example` file for the workflow to succeed.

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

### Column headers

Currently, GuardianConnector expects these column headers, which follow the structure of a GeoJSON feature. You can use these [GeoJSON to SQL conversion scripts](https://github.com/rudokemper/geojson-csv-sql-conversion-tools) to transform your GeoJSON file into the expected format if needed.

| SQL Column       | GeoJSON Field        |
| ---------------- | -------------------- |
| id               | id                   |
| g\_\_type        | geometry.type        |
| g\_\_coordinates | geometry.coordinates |
| ...              | properties...        |

If found, GuardianConnector Explorer will use a column mapping SQL table (with "\_\_column" suffix), like the one created by connector scripts of [GuardianConnector Script Hub](https://github.com/ConservationMetrics/gc-scripts-hub), to handle filtering and key/value rewrites.

Any columns specified in the `.env` file will be filtered out (_see "Unwanted columns and substrings" above_).

At this time, media attachments in the popups are handled in a somewhat brittle way by embedding any strings that end in the expected photo, audio, or video file ending (such as `.jpg`, `.mp3`, or `.mp4`). We can improve on this later when we know more about how media attachments will be stored in the SQL database, and what kind of metadata we have access to.

### GeoJSON export formats for map view

The GuardianConnector Explorer map will render the feature on a map in accordance to what kind of `type` it is (Point, LineString, Polygon). The properties are shown in a popup opened by clicking on the feature.

The GuardianConnector Explorer map can work with any GeoJSON data stored in the expected tabular format, but the main purpose is to visualize field data collected using data collection applications such as (Co)Mapeo, ODK, and KoboToolbox.

- Mapeo data from Mapeo Desktop is already exported as GeoJSON file, and a CoMapeo Archive Server returns data in a GeoJSON-compliant format.
- ODK / KoboToolbox API survey data with a geospatial column may be transformed into such a format.

In the future, this app can be expanded to also supporting loading from PostGIS, or directly from file.
