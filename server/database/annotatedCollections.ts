import type { Client } from "pg";
import type {
  AnnotatedCollection,
  Incident,
  CollectionEntry,
  DatabaseConnection,
} from "@/types/types";

/**
 * Creates a new annotated collection with optional incident data and entries
 * @param db - Database connection
 * @param collection - Collection data (without id, created_at, updated_at)
 * @param incidentData - Optional incident-specific data
 * @param entries - Optional array of entries to add to the collection
 * @returns Promise<AnnotatedCollection> - The created collection
 */
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
      collection.status,
      collection.created_by,
      collection.is_active,
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

/**
 * Retrieves an annotated collection by ID with its incident data and entries
 * @param db - Database connection
 * @param collectionId - The collection ID to retrieve
 * @returns Promise with collection, optional incident, and entries
 */
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

/**
 * Updates an annotated collection and optionally its incident data
 * @param db - Database connection
 * @param collectionId - The collection ID to update
 * @param updates - Collection fields to update
 * @param incidentUpdates - Optional incident fields to update
 * @returns Promise<AnnotatedCollection> - The updated collection
 */
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

/**
 * Adds entries to an existing collection
 * @param db - Database connection
 * @param collectionId - The collection ID to add entries to
 * @param entries - Array of entries to add
 * @param addedBy - User ID who is adding the entries
 * @returns Promise<CollectionEntry[]> - The added entries
 */
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

/**
 * Deletes an annotated collection by ID
 * @param db - Database connection
 * @param collectionId - The collection ID to delete
 * @returns Promise<void>
 */
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

/**
 * Lists annotated collections with optional filtering and pagination
 * @param db - Database connection
 * @param filters - Optional filters for collection_type, status, created_by, limit, offset
 * @returns Promise with collections array and total count
 */
export const listAnnotatedCollections = async (
  db: DatabaseConnection,
  filters?: {
    collection_type?: string;
    status?: string;
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

    if (filters.status) {
      conditions.push(`status = $${paramCount++}`);
      queryParams.push(filters.status);
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
