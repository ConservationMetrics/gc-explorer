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
