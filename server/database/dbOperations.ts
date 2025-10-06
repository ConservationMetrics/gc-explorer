import { sql, eq } from "drizzle-orm";
import type { Client } from "pg";

import type {
  AnnotatedCollection,
  ColumnEntry,
  CollectionEntry,
  DataEntry,
  DatabaseConnection,
  Incident,
  Views,
} from "@/types/types";

import { viewConfig } from "../db/schema";
import { configDb, warehouseDb } from "../utils/db";

const checkTableExists = async (
  table: string | undefined,
): Promise<boolean> => {
  if (!table) return false;

  try {
    const cleanTableName = table.replace(/"/g, "");
    const result = await warehouseDb.execute(sql`
      SELECT to_regclass(${cleanTableName})
    `);
    return (result[0] as { to_regclass: string | null })?.to_regclass !== null;
  } catch (error) {
    console.error("Error checking table existence:", error);
    return false;
  }
};

const fetchDataFromTable = async (
  table: string | undefined,
): Promise<unknown[]> => {
  if (!table) return [];

  try {
    const cleanTableName = table.replace(/"/g, "");
    const result = await warehouseDb.execute(sql`
      SELECT * FROM ${sql.identifier(cleanTableName)}
    `);
    return result || [];
  } catch (error) {
    console.error("Error fetching data from table:", error);
    return [];
  }
};

export const fetchData = async (
  table: string | undefined,
): Promise<{
  mainData: DataEntry[];
  columnsData: ColumnEntry[] | null;
  metadata: unknown[] | null;
}> => {
  console.log("Fetching data from", table, "...");
  const mainDataExists = await checkTableExists(table);
  let mainData: DataEntry[] = [];
  if (mainDataExists) {
    mainData = (await fetchDataFromTable(table)) as DataEntry[];
  } else {
    throw new Error("Main table does not exist");
  }

  // Fetch mapping columns
  const columnsTable = `"${table}__columns"`;
  const columnsTableExists = await checkTableExists(columnsTable);
  let columnsData = null;
  if (columnsTableExists) {
    columnsData = (await fetchDataFromTable(columnsTable)) as ColumnEntry[];
  }

  // Fetch metadata
  const metadataTable = `"${table}__metadata"`;
  const metadataTableExists = await checkTableExists(metadataTable);
  let metadata = null;
  if (metadataTableExists) {
    metadata = await fetchDataFromTable(metadataTable);
  }

  console.log("Successfully fetched data from", table, "!");

  return { mainData, columnsData, metadata };
};

export const fetchTableNames = async (): Promise<string[]> => {
  try {
    const result = await warehouseDb.execute(sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);

    return result.map(
      (row: unknown) => (row as Record<string, unknown>).table_name as string,
    );
  } catch (error) {
    console.error("Error fetching table names:", error);
    return [];
  }
};

export const fetchConfig = async (): Promise<Views> => {
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

  try {
    // Check if view_config table exists in config database, create if it doesn't
    const tableExistsResult = await configDb.execute(sql`
      SELECT to_regclass('view_config')
    `);
    const tableExists =
      (tableExistsResult[0] as { to_regclass: string | null })?.to_regclass !==
      null;

    if (!tableExists) {
      await configDb.execute(sql`
        CREATE TABLE view_config (
          table_name TEXT PRIMARY KEY,
          views_config TEXT
        )
      `);
    }

    const result = await configDb.select().from(viewConfig);

    const viewsConfig: Views = {};
    result.forEach((row) => {
      viewsConfig[row.tableName] = JSON.parse(row.viewsConfig);
    });

    return viewsConfig;
  } catch (error) {
    console.error("Error fetching config:", error);
    return {};
  }
};

export const updateConfig = async (
  tableName: string,
  config: unknown,
): Promise<void> => {
  try {
    const configString = JSON.stringify(config);

    await configDb
      .update(viewConfig)
      .set({
        viewsConfig: configString,
      })
      .where(eq(viewConfig.tableName, tableName));
  } catch (error) {
    console.error("Error updating config:", error);
    throw error;
  }
};

export const addNewTableToConfig = async (tableName: string): Promise<void> => {
  try {
    await configDb.insert(viewConfig).values({
      tableName,
      viewsConfig: "{}",
    });
  } catch (error) {
    console.error("Error adding new table to config:", error);
    throw error;
  }
};

export const removeTableFromConfig = async (
  tableName: string,
): Promise<void> => {
  try {
    await configDb
      .delete(viewConfig)
      .where(eq(viewConfig.tableName, tableName));
  } catch (error) {
    console.error("Error removing table from config:", error);
    throw error;
  }
};

// Annotated Collections Operations

export const createAnnotatedCollection = async (
  db: DatabaseConnection,
  collection: Omit<AnnotatedCollection, "id" | "created_at" | "updated_at">,
  incidentData?: Omit<Incident, "collection_id">,
  entries?: Array<{
    source_table: string;
    source_id: string;
    notes?: string;
  }>,
): Promise<AnnotatedCollection> => {
  const pgClient = db as Client;

  try {
    await pgClient.query("BEGIN");

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
      collection.created_by,
      JSON.stringify(collection.metadata),
    ]);

    const newCollection = collectionResult.rows[0];

    // Create incident-specific data if provided
    if (incidentData && collection.collection_type === "incident") {
      const incidentQuery = `
        INSERT INTO incidents (collection_id, incident_type, responsible_party, impact_description, supporting_evidence)
        VALUES ($1, $2, $3, $4, $5)
      `;

      await pgClient.query(incidentQuery, [
        newCollection.id,
        incidentData.incident_type,
        incidentData.responsible_party,
        incidentData.impact_description,
        JSON.stringify(incidentData.supporting_evidence || {}),
      ]);
    }

    // Add entries if provided
    if (entries && entries.length > 0) {
      for (const entry of entries) {
        // Fetch source data from the original table
        const sourceDataQuery = `SELECT * FROM "${entry.source_table}" WHERE _id = $1 OR id = $1 LIMIT 1`;
        const sourceResult = await pgClient.query(sourceDataQuery, [
          entry.source_id,
        ]);

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
          entry.notes,
        ]);
      }
    }

    await pgClient.query("COMMIT");

    return {
      ...newCollection,
      metadata: JSON.parse(newCollection.metadata || "{}"),
    };
  } catch (error) {
    await pgClient.query("ROLLBACK");
    throw error;
  }
};

export const getAnnotatedCollection = async (
  db: DatabaseConnection,
  collectionId: string,
): Promise<{
  collection: AnnotatedCollection;
  incident?: Incident;
  entries: CollectionEntry[];
}> => {
  const pgClient = db as Client;

  // Get the main collection
  const collectionQuery = `SELECT * FROM annotated_collections WHERE id = $1`;
  const collectionResult = await pgClient.query(collectionQuery, [
    collectionId,
  ]);

  if (collectionResult.rows.length === 0) {
    throw new Error("Collection not found");
  }

  const collection = {
    ...collectionResult.rows[0],
    metadata: JSON.parse(collectionResult.rows[0].metadata || "{}"),
  };

  // Get incident data if it's an incident collection
  let incident = null;
  if (collection.collection_type === "incident") {
    const incidentQuery = `SELECT * FROM incidents WHERE collection_id = $1`;
    const incidentResult = await pgClient.query(incidentQuery, [collectionId]);

    if (incidentResult.rows.length > 0) {
      incident = {
        ...incidentResult.rows[0],
        supporting_evidence: JSON.parse(
          incidentResult.rows[0].supporting_evidence || "{}",
        ),
      };
    }
  }

  // Get collection entries
  const entriesQuery = `SELECT * FROM collection_entries WHERE collection_id = $1 ORDER BY added_at DESC`;
  const entriesResult = await pgClient.query(entriesQuery, [collectionId]);

  const entries = entriesResult.rows.map((row) => ({
    ...row,
    source_data: JSON.parse(row.source_data || "{}"),
  }));

  return { collection, incident, entries };
};

export const updateAnnotatedCollection = async (
  db: DatabaseConnection,
  collectionId: string,
  updates: Partial<AnnotatedCollection>,
  incidentUpdates?: Partial<Incident>,
): Promise<AnnotatedCollection> => {
  const pgClient = db as Client;

  try {
    await pgClient.query("BEGIN");

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
    if (updates.metadata !== undefined) {
      updateFields.push(`metadata = $${paramCount++}`);
      updateValues.push(JSON.stringify(updates.metadata));
    }

    if (updateFields.length > 0) {
      updateFields.push(`updated_at = NOW()`);
      updateValues.push(collectionId);

      const updateQuery = `
        UPDATE annotated_collections 
        SET ${updateFields.join(", ")}
        WHERE id = $${paramCount}
        RETURNING *
      `;

      const result = await pgClient.query(updateQuery, updateValues);

      if (result.rows.length === 0) {
        throw new Error("Collection not found");
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
        if (incidentUpdates.status !== undefined) {
          incidentUpdateFields.push(`status = $${incidentParamCount++}`);
          incidentUpdateValues.push(incidentUpdates.status);
        }
        if (incidentUpdates.is_active !== undefined) {
          incidentUpdateFields.push(`is_active = $${incidentParamCount++}`);
          incidentUpdateValues.push(incidentUpdates.is_active);
        }
        if (incidentUpdates.responsible_party !== undefined) {
          incidentUpdateFields.push(
            `responsible_party = $${incidentParamCount++}`,
          );
          incidentUpdateValues.push(incidentUpdates.responsible_party);
        }
        if (incidentUpdates.impact_description !== undefined) {
          incidentUpdateFields.push(
            `impact_description = $${incidentParamCount++}`,
          );
          incidentUpdateValues.push(incidentUpdates.impact_description);
        }
        if (incidentUpdates.supporting_evidence !== undefined) {
          incidentUpdateFields.push(
            `supporting_evidence = $${incidentParamCount++}`,
          );
          incidentUpdateValues.push(
            JSON.stringify(incidentUpdates.supporting_evidence),
          );
        }

        if (incidentUpdateFields.length > 0) {
          incidentUpdateValues.push(collectionId);

          const incidentUpdateQuery = `
            UPDATE incidents 
            SET ${incidentUpdateFields.join(", ")}
            WHERE collection_id = $${incidentParamCount}
          `;

          await pgClient.query(incidentUpdateQuery, incidentUpdateValues);
        }
      }

      await pgClient.query("COMMIT");

      return {
        ...result.rows[0],
        metadata: JSON.parse(result.rows[0].metadata || "{}"),
      };
    } else {
      await pgClient.query("ROLLBACK");
      throw new Error("No fields to update");
    }
  } catch (error) {
    await pgClient.query("ROLLBACK");
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
  addedBy: string,
): Promise<CollectionEntry[]> => {
  const pgClient = db as Client;

  try {
    await pgClient.query("BEGIN");

    const newEntries = [];

    for (const entry of entries) {
      // Fetch source data from the original table
      const sourceDataQuery = `SELECT * FROM "${entry.source_table}" WHERE _id = $1 OR id = $1 LIMIT 1`;
      const sourceResult = await pgClient.query(sourceDataQuery, [
        entry.source_id,
      ]);

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
        entry.notes,
      ]);

      newEntries.push({
        ...entryResult.rows[0],
        source_data: JSON.parse(entryResult.rows[0].source_data || "{}"),
      });
    }

    await pgClient.query("COMMIT");
    return newEntries;
  } catch (error) {
    await pgClient.query("ROLLBACK");
    throw error;
  }
};

export const deleteAnnotatedCollection = async (
  db: DatabaseConnection,
  collectionId: string,
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
    created_by?: string;
    limit?: number;
    offset?: number;
  },
): Promise<{
  collections: AnnotatedCollection[];
  total: number;
}> => {
  const pgClient = db as Client;

  let whereClause = "";
  const queryParams = [];
  let paramCount = 1;

  if (filters) {
    const conditions = [];

    if (filters.collection_type) {
      conditions.push(`collection_type = $${paramCount++}`);
      queryParams.push(filters.collection_type);
    }
    if (filters.created_by) {
      conditions.push(`created_by = $${paramCount++}`);
      queryParams.push(filters.created_by);
    }

    if (conditions.length > 0) {
      whereClause = `WHERE ${conditions.join(" AND ")}`;
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

  const collections = collectionsResult.rows.map((row) => ({
    ...row,
    metadata: JSON.parse(row.metadata || "{}"),
  }));

  return { collections, total };
};
