import type { Client } from "pg";
import type {
  Views,
  DatabaseConnection,
  ConfigRow,
  DataEntry,
  ColumnEntry,
} from "@/types/types";

const checkTableExists = (
  db: DatabaseConnection,
  table: string | undefined,
): Promise<boolean> => {
  return new Promise((resolve, reject) => {
    const pgClient = db as Client;
    const query = `SELECT to_regclass('"${table}"')`;
    pgClient.query<{ to_regclass: string | null }>(
      query,
      [],
      (err: Error, result) => {
        if (err) reject(err);
        resolve(result.rows[0].to_regclass !== null);
      },
    );
  });
};

const fetchDataFromTable = async (
  db: DatabaseConnection,
  table: string | undefined,
): Promise<unknown[]> => {
  const pgClient = db as Client;
  const query = `SELECT * FROM "${table}"`;
  return new Promise((resolve, reject) => {
    pgClient.query(query, [], (err: Error, result: { rows: unknown[] }) => {
      if (err) reject(err);
      resolve(result.rows);
    });
  });
};

export const fetchData = async (
  db: DatabaseConnection,
  table: string | undefined,
): Promise<{
  mainData: DataEntry[];
  columnsData: ColumnEntry[] | null;
  metadata: unknown[] | null;
}> => {
  console.log("Fetching data from", table, "...");
  const mainDataExists = await checkTableExists(db, table);
  let mainData: DataEntry[] = [];
  if (mainDataExists) {
    mainData = (await fetchDataFromTable(db, table)) as DataEntry[];
  } else {
    throw new Error("Main table does not exist");
  }

  // Fetch mapping columns
  const columnsTable = `"${table}__columns"`;
  const columnsTableExists = await checkTableExists(db, columnsTable);
  let columnsData = null;
  if (columnsTableExists) {
    columnsData = (await fetchDataFromTable(db, columnsTable)) as ColumnEntry[];
  }

  // Fetch metadata
  const metadataTable = `"${table}__metadata"`;
  const metadataTableExists = await checkTableExists(db, metadataTable);
  let metadata = null;
  if (metadataTableExists) {
    metadata = await fetchDataFromTable(db, metadataTable);
  }

  console.log("Successfully fetched data from", table, "!");

  return { mainData, columnsData, metadata };
};

export const fetchTableNames = async (
  db: DatabaseConnection,
): Promise<string[]> => {
  const query = `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'`;

  return new Promise((resolve, reject) => {
    const pgClient = db as Client;
    pgClient.query<{ table_name: string }>(query, [], (err: Error, result) => {
      if (err) reject(err);
      resolve(result.rows.map((row) => row.table_name));
    });
  });
};

export const fetchConfig = async (db: DatabaseConnection): Promise<Views> => {
  // If running in CI, return hardcoded configuration for testing purposes
  if (process.env.CI) {
    const mapboxAccessToken =
      process.env.MAPBOX_ACCESS_TOKEN || "{MAPBOX_ACCESS_TOKEN}";
    const mediaBasePath = process.env.MEDIA_BASE_PATH || "{MEDIA_BASE_PATH}";
    const planetApiKey = process.env.PLANET_API_KEY || "{PLANET_API_KEY}";

    return {
      bcmform_responses: {
        VIEWS: "map,gallery",
        MAPBOX_STYLE: "mapbox://styles/mapbox/streets-v12",
        MAPBOX_ACCESS_TOKEN: mapboxAccessToken,
        MAPBOX_ZOOM: 16,
        MAPBOX_CENTER_LATITUDE: "3.44704",
        MAPBOX_CENTER_LONGITUDE: "-76.53995",
        MAPBOX_PROJECTION: "globe",
        MAPBOX_BEARING: 0,
        MAPBOX_PITCH: 0,
        FRONT_END_FILTER_COLUMN: "community",
        MEDIA_BASE_PATH: mediaBasePath,
      },
      fake_alerts: {
        VIEWS: "alerts",
        EMBED_MEDIA: "YES",
        MEDIA_BASE_PATH_ALERTS: "",
        MEDIA_BASE_PATH: "",
        LOGO_URL:
          "https://conservationmetrics.com/wp-content/themes/conservation-metrics/images/logo-conservation-metrics.png",
        MAPBOX_STYLE: "mapbox://styles/mapbox/satellite-streets-v12",
        MAPBOX_PROJECTION: "globe",
        MAPBOX_CENTER_LATITUDE: "38",
        MAPBOX_CENTER_LONGITUDE: "-79",
        MAPBOX_ZOOM: 7,
        MAPBOX_PITCH: 0,
        MAPBOX_BEARING: 0,
        MAPBOX_3D: "NO",
        MAPEO_TABLE: "mapeo_data",
        MAPEO_CATEGORY_IDS: "threat",
        MAP_LEGEND_LAYER_IDS: "road-primary,aerialway",
        ALERT_RESOURCES: "NO",
        MAPBOX_ACCESS_TOKEN: mapboxAccessToken,
        PLANET_API_KEY: planetApiKey,
      },
      gfw_fake_alerts: {
        VIEWS: "alerts",
        EMBED_MEDIA: "YES",
        MEDIA_BASE_PATH_ALERTS: "",
        MEDIA_BASE_PATH: "",
        LOGO_URL:
          "https://conservationmetrics.com/wp-content/themes/conservation-metrics/images/logo-conservation-metrics.png",
        MAPBOX_STYLE: "mapbox://styles/mapbox/satellite-v11",
        MAPBOX_PROJECTION: "mercator",
        MAPBOX_CENTER_LATITUDE: "0",
        MAPBOX_CENTER_LONGITUDE: "0",
        MAPBOX_ZOOM: 3,
        MAPBOX_PITCH: 0,
        MAPBOX_BEARING: 0,
        MAPBOX_3D: "NO",
        MAPEO_TABLE: "mapeo_data",
        MAPEO_CATEGORY_IDS: "threat,deforestation",
        MAP_LEGEND_LAYER_IDS: "road-primary,aerialway,water",
        ALERT_RESOURCES: "NO",
        MAPBOX_ACCESS_TOKEN: mapboxAccessToken,
        PLANET_API_KEY: planetApiKey,
      },
    };
  }

  // Create the config table if it does not exist
  const createConfigTable = `CREATE TABLE IF NOT EXISTS config (
         table_name TEXT PRIMARY KEY,
         views_config TEXT
       )`;

  await new Promise<void>((resolve, reject) => {
    const pgClient = db as Client;
    pgClient.query(createConfigTable, [], (err: Error) => {
      if (err) reject(err);
      else resolve();
    });
  });

  // Fetch the config data
  const query = `SELECT * FROM config`;

  const result = await new Promise<ConfigRow[]>((resolve, reject) => {
    const pgClient = db as Client;
    pgClient.query(query, [], (err: Error, result: { rows: unknown[] }) => {
      if (err) reject(err);
      resolve(result.rows as ConfigRow[]);
    });
  });

  const viewsConfig: Views = {};
  result.forEach((row: ConfigRow) => {
    viewsConfig[row.table_name] = JSON.parse(row.views_config);
  });

  return viewsConfig;
};

export const updateConfig = async (
  db: DatabaseConnection,
  tableName: string,
  config: unknown,
): Promise<void> => {
  const configString = JSON.stringify(config);

  const query = `UPDATE config SET views_config = $1 WHERE table_name = $2`;

  return new Promise((resolve, reject) => {
    const pgClient = db as Client;
    pgClient.query(query, [configString, tableName], (err: Error) => {
      if (err) {
        console.error("PostgreSQL Error:", err);
        reject(err);
      } else {
        resolve();
      }
    });
  });
};

export const addNewTableToConfig = async (
  db: DatabaseConnection,
  tableName: string,
): Promise<void> => {
  const query = `INSERT INTO config (table_name, views_config) VALUES ($1, $2)`;

  return new Promise((resolve, reject) => {
    const pgClient = db as Client;
    pgClient.query(query, [tableName, "{}"], (err: Error) => {
      if (err) {
        console.error("PostgreSQL Error:", err);
        reject(err);
      } else {
        resolve();
      }
    });
  });
};

export const removeTableFromConfig = async (
  db: DatabaseConnection,
  tableName: string,
): Promise<void> => {
  const query = `DELETE FROM config WHERE table_name = $1`;

  return new Promise((resolve, reject) => {
    const pgClient = db as Client;
    pgClient.query(query, [tableName], (err: Error) => {
      if (err) {
        console.error("PostgreSQL Error:", err);
        reject(err);
      } else {
        resolve();
      }
    });
  });
};
