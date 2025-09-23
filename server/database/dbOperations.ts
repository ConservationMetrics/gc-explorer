import type { Client } from "pg";
import type {
  Views,
  DatabaseConnection,
  ConfigRow,
  DataEntry,
  ColumnEntry,
  AnnotatedCollection,
  Incident,
  CollectionEntry,
} from "@/types/types";

const checkTableExists = (
  db: DatabaseConnection,
  table: string | undefined,
): Promise<boolean> => {
  return new Promise((resolve, reject) => {
    const pgClient = db as Client;
    const cleanTableName = table?.replace(/"/g, "") || "";
    const query = `SELECT to_regclass('"${cleanTableName}"')`;
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
  const cleanTableName = table?.replace(/"/g, "") || "";
  const query = `SELECT * FROM "${cleanTableName}"`;
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
      seed_survey_data: {
        VIEWS: "gallery",
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
        ROUTE_LEVEL_PERMISSION: "anyone",
      },
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
        ROUTE_LEVEL_PERMISSION: "member",
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
        ROUTE_LEVEL_PERMISSION: "anyone",
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

// Annotated Collections Operations

export const createAnnotatedCollection = async (
  db: DatabaseConnection,
  collection: Omit<AnnotatedCollection, 'id' | 'created_at' | 'updated_at'>,
  incidentData?: Omit<Incident, 'collection_id'>,
  entries?: Array<{
    source_table: string;
    source_id: string;
    notes?: string;
  }>
): Promise<AnnotatedCollection> => {
  const pgClient = db as Client;
  
  try {
    await pgClient.query('BEGIN');
    
    // Create the main collection
    const collectionQuery = `
      INSERT INTO annotated_collections (name, description, collection_type, status, created_by, is_active, metadata)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;
    
    const collectionResult = await pgClient.query(collectionQuery, [
      collection.name,
      collection.description,
      collection.collection_type,
      collection.status,
      collection.created_by,
      collection.is_active,
      JSON.stringify(collection.metadata)
    ]);
    
    const newCollection = collectionResult.rows[0];
    
    // Create incident-specific data if provided
    if (incidentData && collection.collection_type === 'incident') {
      const incidentQuery = `
        INSERT INTO incidents (collection_id, incident_type, responsible_party, impact_description, supporting_evidence)
        VALUES ($1, $2, $3, $4, $5)
      `;
      
      await pgClient.query(incidentQuery, [
        newCollection.id,
        incidentData.incident_type,
        incidentData.responsible_party,
        incidentData.impact_description,
        JSON.stringify(incidentData.supporting_evidence || {})
      ]);
    }
    
    // Add entries if provided
    if (entries && entries.length > 0) {
      for (const entry of entries) {
        // Fetch source data from the original table
        const sourceDataQuery = `SELECT * FROM "${entry.source_table}" WHERE _id = $1 OR id = $1 LIMIT 1`;
        const sourceResult = await pgClient.query(sourceDataQuery, [entry.source_id]);
        
        const entryQuery = `
          INSERT INTO collection_entries (collection_id, source_table, source_id, source_data, added_by, notes)
          VALUES ($1, $2, $3, $4, $5, $6)
        `;
        
        await pgClient.query(entryQuery, [
          newCollection.id,
          entry.source_table,
          entry.source_id,
          JSON.stringify(sourceResult.rows[0] || {}),
          collection.created_by,
          entry.notes
        ]);
      }
    }
    
    await pgClient.query('COMMIT');
    
    return {
      ...newCollection,
      metadata: JSON.parse(newCollection.metadata || '{}')
    };
  } catch (error) {
    await pgClient.query('ROLLBACK');
    throw error;
  }
};

export const getAnnotatedCollection = async (
  db: DatabaseConnection,
  collectionId: string
): Promise<{
  collection: AnnotatedCollection;
  incident?: Incident;
  entries: CollectionEntry[];
}> => {
  const pgClient = db as Client;
  
  // Get the main collection
  const collectionQuery = `SELECT * FROM annotated_collections WHERE id = $1`;
  const collectionResult = await pgClient.query(collectionQuery, [collectionId]);
  
  if (collectionResult.rows.length === 0) {
    throw new Error('Collection not found');
  }
  
  const collection = {
    ...collectionResult.rows[0],
    metadata: JSON.parse(collectionResult.rows[0].metadata || '{}')
  };
  
  // Get incident data if it's an incident collection
  let incident = null;
  if (collection.collection_type === 'incident') {
    const incidentQuery = `SELECT * FROM incidents WHERE collection_id = $1`;
    const incidentResult = await pgClient.query(incidentQuery, [collectionId]);
    
    if (incidentResult.rows.length > 0) {
      incident = {
        ...incidentResult.rows[0],
        supporting_evidence: JSON.parse(incidentResult.rows[0].supporting_evidence || '{}')
      };
    }
  }
  
  // Get collection entries
  const entriesQuery = `SELECT * FROM collection_entries WHERE collection_id = $1 ORDER BY added_at DESC`;
  const entriesResult = await pgClient.query(entriesQuery, [collectionId]);
  
  const entries = entriesResult.rows.map(row => ({
    ...row,
    source_data: JSON.parse(row.source_data || '{}')
  }));
  
  return { collection, incident, entries };
};

export const updateAnnotatedCollection = async (
  db: DatabaseConnection,
  collectionId: string,
  updates: Partial<AnnotatedCollection>,
  incidentUpdates?: Partial<Incident>
): Promise<AnnotatedCollection> => {
  const pgClient = db as Client;
  
  try {
    await pgClient.query('BEGIN');
    
    // Update main collection
    const updateFields = [];
    const updateValues = [];
    let paramCount = 1;
    
    if (updates.name !== undefined) {
      updateFields.push(`name = $${paramCount++}`);
      updateValues.push(updates.name);
    }
    if (updates.description !== undefined) {
      updateFields.push(`description = $${paramCount++}`);
      updateValues.push(updates.description);
    }
    if (updates.status !== undefined) {
      updateFields.push(`status = $${paramCount++}`);
      updateValues.push(updates.status);
    }
    if (updates.metadata !== undefined) {
      updateFields.push(`metadata = $${paramCount++}`);
      updateValues.push(JSON.stringify(updates.metadata));
    }
    
    if (updateFields.length > 0) {
      updateFields.push(`updated_at = NOW()`);
      updateValues.push(collectionId);
      
      const updateQuery = `
        UPDATE annotated_collections 
        SET ${updateFields.join(', ')}
        WHERE id = $${paramCount}
        RETURNING *
      `;
      
      const result = await pgClient.query(updateQuery, updateValues);
      
      if (result.rows.length === 0) {
        throw new Error('Collection not found');
      }
      
      // Update incident data if provided
      if (incidentUpdates) {
        const incidentUpdateFields = [];
        const incidentUpdateValues = [];
        let incidentParamCount = 1;
        
        if (incidentUpdates.incident_type !== undefined) {
          incidentUpdateFields.push(`incident_type = $${incidentParamCount++}`);
          incidentUpdateValues.push(incidentUpdates.incident_type);
        }
        if (incidentUpdates.responsible_party !== undefined) {
          incidentUpdateFields.push(`responsible_party = $${incidentParamCount++}`);
          incidentUpdateValues.push(incidentUpdates.responsible_party);
        }
        if (incidentUpdates.impact_description !== undefined) {
          incidentUpdateFields.push(`impact_description = $${incidentParamCount++}`);
          incidentUpdateValues.push(incidentUpdates.impact_description);
        }
        if (incidentUpdates.supporting_evidence !== undefined) {
          incidentUpdateFields.push(`supporting_evidence = $${incidentParamCount++}`);
          incidentUpdateValues.push(JSON.stringify(incidentUpdates.supporting_evidence));
        }
        
        if (incidentUpdateFields.length > 0) {
          incidentUpdateValues.push(collectionId);
          
          const incidentUpdateQuery = `
            UPDATE incidents 
            SET ${incidentUpdateFields.join(', ')}
            WHERE collection_id = $${incidentParamCount}
          `;
          
          await pgClient.query(incidentUpdateQuery, incidentUpdateValues);
        }
      }
      
      await pgClient.query('COMMIT');
      
      return {
        ...result.rows[0],
        metadata: JSON.parse(result.rows[0].metadata || '{}')
      };
    } else {
      await pgClient.query('ROLLBACK');
      throw new Error('No fields to update');
    }
  } catch (error) {
    await pgClient.query('ROLLBACK');
    throw error;
  }
};

export const addEntriesToCollection = async (
  db: DatabaseConnection,
  collectionId: string,
  entries: Array<{
    source_table: string;
    source_id: string;
    notes?: string;
  }>,
  addedBy: string
): Promise<CollectionEntry[]> => {
  const pgClient = db as Client;
  
  try {
    await pgClient.query('BEGIN');
    
    const newEntries = [];
    
    for (const entry of entries) {
      // Fetch source data from the original table
      const sourceDataQuery = `SELECT * FROM "${entry.source_table}" WHERE _id = $1 OR id = $1 LIMIT 1`;
      const sourceResult = await pgClient.query(sourceDataQuery, [entry.source_id]);
      
      const entryQuery = `
        INSERT INTO collection_entries (collection_id, source_table, source_id, source_data, added_by, notes)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
      `;
      
      const entryResult = await pgClient.query(entryQuery, [
        collectionId,
        entry.source_table,
        entry.source_id,
        JSON.stringify(sourceResult.rows[0] || {}),
        addedBy,
        entry.notes
      ]);
      
      newEntries.push({
        ...entryResult.rows[0],
        source_data: JSON.parse(entryResult.rows[0].source_data || '{}')
      });
    }
    
    await pgClient.query('COMMIT');
    return newEntries;
  } catch (error) {
    await pgClient.query('ROLLBACK');
    throw error;
  }
};

export const deleteAnnotatedCollection = async (
  db: DatabaseConnection,
  collectionId: string
): Promise<void> => {
  const pgClient = db as Client;
  
  return new Promise((resolve, reject) => {
    const query = `DELETE FROM annotated_collections WHERE id = $1`;
    
    pgClient.query(query, [collectionId], (err: Error) => {
      if (err) {
        console.error("PostgreSQL Error:", err);
        reject(err);
      } else {
        resolve();
      }
    });
  });
};

export const listAnnotatedCollections = async (
  db: DatabaseConnection,
  filters?: {
    collection_type?: string;
    status?: string;
    created_by?: string;
    limit?: number;
    offset?: number;
  }
): Promise<{
  collections: AnnotatedCollection[];
  total: number;
}> => {
  const pgClient = db as Client;
  
  let whereClause = '';
  const queryParams = [];
  let paramCount = 1;
  
  if (filters) {
    const conditions = [];
    
    if (filters.collection_type) {
      conditions.push(`collection_type = $${paramCount++}`);
      queryParams.push(filters.collection_type);
    }
    
    if (filters.status) {
      conditions.push(`status = $${paramCount++}`);
      queryParams.push(filters.status);
    }
    
    if (filters.created_by) {
      conditions.push(`created_by = $${paramCount++}`);
      queryParams.push(filters.created_by);
    }
    
    if (conditions.length > 0) {
      whereClause = `WHERE ${conditions.join(' AND ')}`;
    }
  }
  
  // Get total count
  const countQuery = `SELECT COUNT(*) FROM annotated_collections ${whereClause}`;
  const countResult = await pgClient.query(countQuery, queryParams);
  const total = parseInt(countResult.rows[0].count);
  
  // Get collections with pagination
  const limit = filters?.limit || 20;
  const offset = filters?.offset || 0;
  
  const collectionsQuery = `
    SELECT * FROM annotated_collections 
    ${whereClause}
    ORDER BY created_at DESC
    LIMIT $${paramCount++} OFFSET $${paramCount++}
  `;
  
  queryParams.push(limit, offset);
  const collectionsResult = await pgClient.query(collectionsQuery, queryParams);
  
  const collections = collectionsResult.rows.map(row => ({
    ...row,
    metadata: JSON.parse(row.metadata || '{}')
  }));
  
  return { collections, total };
};
