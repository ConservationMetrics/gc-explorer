import pg from "pg";
import { getConfig } from "./dbConfig";

import type { DatabaseConnection } from "@/types/types";

let configDb: DatabaseConnection | null = null;
let db: DatabaseConnection | null = null;

export const setupDatabaseConnection = async (
  isConfigDb: boolean,
): Promise<DatabaseConnection> => {
  const {
    configDatabase,
    database,
    dbHost,
    dbUser,
    dbPassword,
    dbPort,
    dbSsl,
  } = getConfig();

  const localDatabase = isConfigDb ? configDatabase : database;
  console.log(`Setting up database connection to ${localDatabase}...`);

  const dbConnection = {
    database: localDatabase,
    user: dbUser,
    host: dbHost,
    password: dbPassword,
    port: parseInt(dbPort, 10),
    ssl:
      dbSsl === true && !process.env.CI ? { rejectUnauthorized: false } : false,
  };
  // Skip config database connection in CI/testing environments
  // The config database (guardianconnector) doesn't exist in our test setup,
  // and since we "hijack" the return values during testing/CI anyway,
  // we can just return null to avoid connection errors and potential crashes.
  // This is the correct behavior since the database DOES NOT exist.
  if (isConfigDb && process.env.CI) {
    console.log(
      "Skipping config database connection in CI/testing environment.",
    );
    return null;
  }
  let client = new pg.Client(dbConnection);

  try {
    await client.connect();
    console.log(`Connected to the PostgreSQL database: "${localDatabase}"`);
    return client;
  } catch (error: unknown) {
    if (
      error instanceof Error &&
      error.message.includes("self signed certificate")
    ) {
      console.error(
        "Error connecting to the PostgreSQL database: Self-signed certificate issue.",
      );
    } else if (
      error instanceof Error &&
      error.message.includes("azure replication users")
    ) {
      console.error(
        "Error connecting to the PostgreSQL database: remaining connection slots are reserved for azure replication users.",
      );
    } else {
      // Attempt to create the database if connection fails
      if (isConfigDb) {
        console.log("Config database does not exist. Attemping to create...");
        const created = await createDatabaseIfNotExists(
          localDatabase,
          database,
          dbHost,
          dbUser,
          dbPassword,
          dbPort,
          dbSsl,
        );
        if (created) {
          // Retry connection after creating the database
          client = new pg.Client(dbConnection);
          try {
            await client.connect();
            console.log(`Connected to the PostgreSQL database: "${database}"`);
            return client;
          } catch (retryError) {
            console.error("Retry failed:", retryError);
          } finally {
            await client.end();
          }
        }
      } else {
        console.error(
          `Error connecting to the PostgreSQL database ${database}:`,
          error,
        );
      }
    }
    return null;
  }
};

export const getDatabaseConnection = async (
  isConfigDb: boolean,
): Promise<DatabaseConnection> => {
  await ensurePostgresConnection(db, isConfigDb);

  if (isConfigDb) {
    if (!configDb) {
      configDb = await setupDatabaseConnection(true);
    }
    return configDb;
  } else {
    if (!db) {
      db = await setupDatabaseConnection(false);
    }
    return db;
  }
};

export const refreshDatabaseConnection = async (
  isConfigDb: boolean,
): Promise<void> => {
  if (isConfigDb && configDb instanceof pg.Client) {
    await configDb.end();
    configDb = await setupDatabaseConnection(true);
  } else if (!isConfigDb && db instanceof pg.Client) {
    await db.end();
    db = await setupDatabaseConnection(false);
  }
};

async function ensurePostgresConnection(
  db: DatabaseConnection,
  isConfigDb: boolean,
): Promise<void> {
  if (db instanceof pg.Client) {
    try {
      await db.query("SELECT 1"); // Simple query to check connection
    } catch (error) {
      if (error instanceof Error) {
        console.warn(
          "Error encountered when checking PostgreSQL connection:",
          error.message,
        );
      }
      console.log("Reconnecting to PostgreSQL...");
      await refreshDatabaseConnection(isConfigDb);
    }
  }
}

const createDatabaseIfNotExists = async (
  database: string,
  defaultDb: string | undefined,
  host: string | undefined,
  user: string | undefined,
  password: string | undefined,
  port: string,
  ssl: boolean | string | undefined,
): Promise<boolean> => {
  console.log(`Creating database ${database}...`);

  const client = new pg.Client({
    user: user,
    host: host,
    password: password,
    port: parseInt(port, 10),
    ssl: ssl === true ? { rejectUnauthorized: false } : false,
    database: defaultDb,
  });

  try {
    await client.connect();
    const res = await client.query(
      `SELECT 1 FROM pg_database WHERE datname = $1`,
      [database],
    );
    if (res.rowCount === 0) {
      await client.query(`CREATE DATABASE ${database}`);
      console.log(`Database ${database} created successfully.`);

      // Grant privileges to the user
      await client.query(
        `GRANT ALL PRIVILEGES ON DATABASE ${database} TO ${user};`,
      );
    } else {
      console.log(`Database ${database} already exists.`);
    }
    return true;
  } catch (error) {
    console.error(`Error creating database ${database}:`, error);
    return false;
  } finally {
    await client.end();
  }
};
