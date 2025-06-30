const checkTableExists = (db, table) => {
  return new Promise((resolve, reject) => {
    const pgClient = db;
    const query = `SELECT to_regclass('"${table}"')`;
    pgClient.query(
      query,
      [],
      (err, result) => {
        if (err) reject(err);
        resolve(result.rows[0].to_regclass !== null);
      }
    );
  });
};
const fetchDataFromTable = async (db, table) => {
  const pgClient = db;
  const query = `SELECT * FROM "${table}"`;
  return new Promise((resolve, reject) => {
    pgClient.query(query, [], (err, result) => {
      if (err) reject(err);
      resolve(result.rows);
    });
  });
};
const fetchData = async (db, table) => {
  console.log("Fetching data from", table, "...");
  const mainDataExists = await checkTableExists(db, table);
  let mainData = [];
  if (mainDataExists) {
    mainData = await fetchDataFromTable(db, table);
  } else {
    throw new Error("Main table does not exist");
  }
  const columnsTable = `"${table}__columns"`;
  const columnsTableExists = await checkTableExists(db, columnsTable);
  let columnsData = null;
  if (columnsTableExists) {
    columnsData = await fetchDataFromTable(db, columnsTable);
  }
  const metadataTable = `"${table}__metadata"`;
  const metadataTableExists = await checkTableExists(db, metadataTable);
  let metadata = null;
  if (metadataTableExists) {
    metadata = await fetchDataFromTable(db, metadataTable);
  }
  console.log("Successfully fetched data from", table, "!");
  return { mainData, columnsData, metadata };
};
const fetchTableNames = async (db) => {
  const query = `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'`;
  return new Promise((resolve, reject) => {
    const pgClient = db;
    pgClient.query(query, [], (err, result) => {
      if (err) reject(err);
      resolve(result.rows.map((row) => row.table_name));
    });
  });
};
const fetchConfig = async (db) => {
  const createConfigTable = `CREATE TABLE IF NOT EXISTS config (
         table_name TEXT PRIMARY KEY,
         views_config TEXT
       )`;
  await new Promise((resolve, reject) => {
    const pgClient = db;
    pgClient.query(createConfigTable, [], (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
  const query = `SELECT * FROM config`;
  const result = await new Promise((resolve, reject) => {
    const pgClient = db;
    pgClient.query(query, [], (err, result2) => {
      if (err) reject(err);
      resolve(result2.rows);
    });
  });
  const viewsConfig = {};
  result.forEach((row) => {
    viewsConfig[row.table_name] = JSON.parse(row.views_config);
  });
  return viewsConfig;
};
const updateConfig = async (db, tableName, config) => {
  const configString = JSON.stringify(config);
  const query = `UPDATE config SET views_config = $1 WHERE table_name = $2`;
  return new Promise((resolve, reject) => {
    const pgClient = db;
    pgClient.query(query, [configString, tableName], (err) => {
      if (err) {
        console.error("PostgreSQL Error:", err);
        reject(err);
      } else {
        resolve();
      }
    });
  });
};
const addNewTableToConfig = async (db, tableName) => {
  const query = `INSERT INTO config (table_name, views_config) VALUES ($1, $2)`;
  return new Promise((resolve, reject) => {
    const pgClient = db;
    pgClient.query(query, [tableName, "{}"], (err) => {
      if (err) {
        console.error("PostgreSQL Error:", err);
        reject(err);
      } else {
        resolve();
      }
    });
  });
};
const removeTableFromConfig = async (db, tableName) => {
  const query = `DELETE FROM config WHERE table_name = $1`;
  return new Promise((resolve, reject) => {
    const pgClient = db;
    pgClient.query(query, [tableName], (err) => {
      if (err) {
        console.error("PostgreSQL Error:", err);
        reject(err);
      } else {
        resolve();
      }
    });
  });
};

export { fetchData as a, addNewTableToConfig as b, fetchTableNames as c, fetchConfig as f, removeTableFromConfig as r, updateConfig as u };
//# sourceMappingURL=dbOperations.mjs.map
