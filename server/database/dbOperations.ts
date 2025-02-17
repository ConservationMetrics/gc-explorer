import type { Client } from "pg";
import type { Database as SqliteDatabase } from "sqlite3";
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
  isSQLite: boolean | undefined,
): Promise<boolean> => {
  return new Promise((resolve, reject) => {
    let query: string;
    if (isSQLite) {
      const sqliteDb = db as SqliteDatabase;
      query = `SELECT name FROM sqlite_master WHERE type='table' AND name='${table}'`;
      sqliteDb.all(query, (err: Error, rows: unknown[]) => {
        if (err) reject(err);
        resolve(rows.length > 0);
      });
    } else {
      const pgClient = db as Client;
      query = `SELECT to_regclass('${table}')`;
      pgClient.query<{ to_regclass: string | null }>(
        query,
        [],
        (err: Error, result) => {
          if (err) reject(err);
          resolve(result.rows[0].to_regclass !== null);
        },
      );
    }
  });
};

const fetchDataFromTable = async (
  db: DatabaseConnection,
  table: string | undefined,
  isSQLite: boolean | undefined,
): Promise<unknown[]> => {
  let query: string;
  if (isSQLite) {
    const sqliteDb = db as SqliteDatabase;
    query = `SELECT * FROM ${table}`;
    return new Promise((resolve, reject) => {
      sqliteDb.all(query, (err: Error, rows: Record<string, unknown>[]) => {
        if (err) reject(err);
        if (
          rows.length > 0 &&
          Object.keys(rows[0]).some((key) => isNaN(Number(key)))
        ) {
          rows.shift();
        }
        resolve(rows);
      });
    });
  } else {
    const pgClient = db as Client;
    query = `SELECT * FROM ${table}`;
    return new Promise((resolve, reject) => {
      pgClient.query(query, [], (err: Error, result: { rows: unknown[] }) => {
        if (err) reject(err);
        resolve(result.rows);
      });
    });
  }
};

export const fetchData = async (
  db: DatabaseConnection,
  table: string | undefined,
  isSQLite: boolean | undefined,
): Promise<{
  mainData: DataEntry[];
  columnsData: ColumnEntry[] | null;
  metadata: unknown[] | null;
}> => {
  console.log("Fetching data from", table, "...");
  // Fetch data
  const mainDataExists = await checkTableExists(db, table, isSQLite);
  let mainData: DataEntry[] = [];
  if (mainDataExists) {
    mainData = (await fetchDataFromTable(db, table, isSQLite)) as DataEntry[];
  } else {
    throw new Error("Main table does not exist");
  }

  // Fetch mapping columns
  const columnsTable = `${table}__columns`;
  const columnsTableExists = await checkTableExists(db, columnsTable, isSQLite);
  let columnsData = null;
  if (columnsTableExists) {
    columnsData = (await fetchDataFromTable(
      db,
      columnsTable,
      isSQLite,
    )) as ColumnEntry[];
  }

  // Fetch metadata
  const metadataTable = `${table}__metadata`;
  const metadataTableExists = await checkTableExists(
    db,
    metadataTable,
    isSQLite,
  );
  let metadata = null;
  if (metadataTableExists) {
    metadata = await fetchDataFromTable(db, metadataTable, isSQLite);
  }

  console.log("Successfully fetched data from", table, "!");

  return { mainData, columnsData, metadata };
};

export const fetchTableNames = async (
  db: DatabaseConnection,
  isSQLite: boolean | undefined,
): Promise<string[]> => {
  const query = isSQLite
    ? `SELECT name FROM sqlite_master WHERE type='table'`
    : `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'`;

  return new Promise((resolve, reject) => {
    if (isSQLite) {
      const sqliteDb = db as SqliteDatabase;
      sqliteDb.all<{ name: string }>(
        query,
        (err: Error, rows: { name: string }[]) => {
          if (err) reject(err);
          resolve(rows.map((row) => row.name));
        },
      );
    } else {
      const pgClient = db as Client;
      pgClient.query<{ table_name: string }>(
        query,
        [],
        (err: Error, result) => {
          if (err) reject(err);
          resolve(result.rows.map((row) => row.table_name));
        },
      );
    }
  });
};

export const fetchConfig = async (
  db: DatabaseConnection,
  isSQLite: boolean | undefined,
): Promise<Views> => {
  // Create the config table if it does not exist
  const createConfigTable = `CREATE TABLE IF NOT EXISTS config (
         table_name TEXT PRIMARY KEY,
         views_config TEXT
       )`;

  await new Promise<void>((resolve, reject) => {
    if (isSQLite) {
      const sqliteDb = db as SqliteDatabase;
      sqliteDb.run(createConfigTable, [], (err: Error) => {
        if (err) reject(err);
        else resolve();
      });
    } else {
      const pgClient = db as Client;
      pgClient.query(createConfigTable, [], (err: Error) => {
        if (err) reject(err);
        else resolve();
      });
    }
  });

  // Fetch the config data
  const query = `SELECT * FROM config`;

  const result = await new Promise<ConfigRow[]>((resolve, reject) => {
    if (isSQLite) {
      const sqliteDb = db as SqliteDatabase;
      sqliteDb.all(query, (err: Error, rows: unknown[]) => {
        if (err) reject(err);
        resolve(rows as ConfigRow[]);
      });
    } else {
      const pgClient = db as Client;
      pgClient.query(query, [], (err: Error, result: { rows: unknown[] }) => {
        if (err) reject(err);
        resolve(result.rows as ConfigRow[]);
      });
    }
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
  isSQLite: boolean | undefined,
): Promise<void> => {
  const configString = JSON.stringify(config);

  const query = isSQLite
    ? `UPDATE config SET views_config = ? WHERE table_name = ?`
    : `UPDATE config SET views_config = $1 WHERE table_name = $2`;

  return new Promise((resolve, reject) => {
    if (isSQLite) {
      const sqliteDb = db as SqliteDatabase;
      sqliteDb.run(query, [configString, tableName], (err: Error) => {
        if (err) {
          console.error("SQLite Error:", err);
          reject(err);
        } else {
          resolve();
        }
      });
    } else {
      const pgClient = db as Client;
      pgClient.query(query, [configString, tableName], (err: Error) => {
        if (err) {
          console.error("PostgreSQL Error:", err);
          reject(err);
        } else {
          resolve();
        }
      });
    }
  });
};

export const addNewTableToConfig = async (
  db: DatabaseConnection,
  tableName: string,
  isSQLite: boolean | undefined,
): Promise<void> => {
  const query = isSQLite
    ? `INSERT INTO config (table_name, views_config) VALUES (?, ?)`
    : `INSERT INTO config (table_name, views_config) VALUES ($1, $2)`;

  return new Promise((resolve, reject) => {
    if (isSQLite) {
      const sqliteDb = db as SqliteDatabase;
      sqliteDb.run(query, [tableName, "{}"], (err: Error) => {
        if (err) {
          console.error("SQLite Error:", err);
          reject(err);
        } else {
          resolve();
        }
      });
    } else {
      const pgClient = db as Client;
      pgClient.query(query, [tableName, "{}"], (err: Error) => {
        if (err) {
          console.error("PostgreSQL Error:", err);
          reject(err);
        } else {
          resolve();
        }
      });
    }
  });
};

export const removeTableFromConfig = async (
  db: DatabaseConnection,
  tableName: string,
  isSQLite: boolean | undefined,
): Promise<void> => {
  const query = isSQLite
    ? `DELETE FROM config WHERE table_name = ?`
    : `DELETE FROM config WHERE table_name = $1`;

  return new Promise((resolve, reject) => {
    if (isSQLite) {
      const sqliteDb = db as SqliteDatabase;
      sqliteDb.run(query, [tableName], (err: Error) => {
        if (err) {
          console.error("SQLite Error:", err);
          reject(err);
        } else {
          resolve();
        }
      });
    } else {
      const pgClient = db as Client;
      pgClient.query(query, [tableName], (err: Error) => {
        if (err) {
          console.error("PostgreSQL Error:", err);
          reject(err);
        } else {
          resolve();
        }
      });
    }
  });
};
