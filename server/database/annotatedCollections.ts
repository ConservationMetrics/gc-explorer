import { sql } from "drizzle-orm";
import type {
  AnnotatedCollection,
  Incident,
  CollectionEntry,
} from "@/types/types";
import { configDb } from "../utils/db";

/**
 * Creates a new annotated collection with optional incident data and collection entries
 * @param collection - The annotated collection data (without id, created_at, updated_at)
 * @param incidentData - Optional incident-specific data if collection_type is "incident"
 * @param entries - Optional array of collection entries to add to the collection. Each entry contains:
 *   - source_table: The table name (e.g., "fake_alerts", "mapeo_data") corresponding to the URL path
 *   - source_id: The unique identifier from the source table (e.g., alertID for alerts, mapeoID for mapeo)
 *   - notes: Optional notes about the entry
 * @returns Promise<AnnotatedCollection> - The created annotated collection
 */
export const createAnnotatedCollection = async (
  collection: Omit<AnnotatedCollection, "id" | "created_at" | "updated_at">,
  incidentData?: Omit<Incident, "collection_id">,
  entries?: Array<{
    source_table: string;
    source_id: string;
    notes?: string;
  }>,
): Promise<AnnotatedCollection> => {
  try {
    await configDb.execute(sql`BEGIN`);

    // Create the annotated parent collection first
    const collectionResult = await configDb.execute(sql`
      INSERT INTO annotated_collections (name, description, collection_type, created_by, metadata)
      VALUES (${collection.name}, ${collection.description}, ${collection.collection_type}, ${collection.created_by}, ${JSON.stringify(collection.metadata)})
      RETURNING *
    `);

    const newCollection = collectionResult[0];

    // Create incident-specific data if provided
    if (incidentData && collection.collection_type === "incident") {
      await configDb.execute(sql`
        INSERT INTO incidents (collection_id, incident_type, responsible_party, status, is_active, impact_description, supporting_evidence)
        VALUES (${newCollection.id}, ${incidentData.incident_type}, ${incidentData.responsible_party}, ${incidentData.status}, ${incidentData.is_active}, ${incidentData.impact_description}, ${JSON.stringify(incidentData.supporting_evidence || {})})
      `);
    }

    // Add entries if provided
    if (entries && entries.length > 0) {
      for (const entry of entries) {
        // Fetch source data from the original table
        const sourceResult = await configDb.execute(sql`
          SELECT * FROM ${sql.identifier(entry.source_table)} WHERE _id = ${entry.source_id} OR id = ${entry.source_id} LIMIT 1
        `);

        await configDb.execute(sql`
          INSERT INTO collection_entries (collection_id, source_table, source_id, source_data, added_by, notes)
          VALUES (${newCollection.id}, ${entry.source_table}, ${entry.source_id}, ${JSON.stringify(sourceResult[0] || {})}, ${collection.created_by}, ${entry.notes})
        `);
      }
    }

    await configDb.execute(sql`COMMIT`);

    return {
      ...newCollection,
      metadata: JSON.parse((newCollection.metadata as string) || "{}"),
    } as AnnotatedCollection;
  } catch (error) {
    await configDb.execute(sql`ROLLBACK`);
    throw error;
  }
};

/**
 * Retrieves an annotated collection by ID with its incident data and collection entries
 * @param collectionId - The annotated collection ID to retrieve
 * @returns Promise with collection, optional incident data, and collection entries
 */
export const getAnnotatedCollection = async (
  collectionId: string,
): Promise<{
  collection: AnnotatedCollection;
  incident?: Incident;
  entries: CollectionEntry[];
}> => {
  // Get the main collection
  const collectionResult = await configDb.execute(sql`
    SELECT * FROM annotated_collections WHERE id = ${collectionId}
  `);

  if (collectionResult.length === 0) {
    throw new Error("Collection not found");
  }

  const collection = {
    ...collectionResult[0],
    metadata: JSON.parse((collectionResult[0].metadata as string) || "{}"),
  } as AnnotatedCollection;

  // Get incident data if it's an incident collection
  let incident: Incident | undefined = undefined;
  if (collection.collection_type === "incident") {
    const incidentResult = await configDb.execute(sql`
      SELECT * FROM incidents WHERE collection_id = ${collectionId}
    `);

    if (incidentResult.length > 0) {
      incident = {
        ...incidentResult[0],
        supporting_evidence: JSON.parse(
          (incidentResult[0].supporting_evidence as string) || "{}",
        ),
      } as Incident;
    }
  }

  // Get collection entries
  const entriesResult = await configDb.execute(sql`
    SELECT * FROM collection_entries WHERE collection_id = ${collectionId} ORDER BY added_at DESC
  `);

  const entries = entriesResult.map((row) => ({
    ...row,
    source_data: JSON.parse((row.source_data as string) || "{}"),
  })) as CollectionEntry[];

  return { collection, incident, entries };
};

/**
 * Updates an annotated collection and optionally its incident data
 * @param collectionId - The annotated collection ID to update
 * @param updates - Annotated collection fields to update
 * @param incidentUpdates - Optional incident-specific fields to update
 * @returns Promise<AnnotatedCollection> - The updated annotated collection
 */
export const updateAnnotatedCollection = async (
  collectionId: string,
  updates: Partial<AnnotatedCollection>,
  incidentUpdates?: Partial<Incident>,
): Promise<AnnotatedCollection> => {
  try {
    await configDb.execute(sql`BEGIN`);

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

      const result = await configDb.execute(sql.raw(updateQuery));

      if (result.length === 0) {
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
        if (incidentUpdates.status !== undefined) {
          incidentUpdateFields.push(`status = $${incidentParamCount++}`);
          incidentUpdateValues.push(incidentUpdates.status);
        }
        if (incidentUpdates.is_active !== undefined) {
          incidentUpdateFields.push(`is_active = $${incidentParamCount++}`);
          incidentUpdateValues.push(incidentUpdates.is_active);
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

          await configDb.execute(sql.raw(incidentUpdateQuery));
        }
      }

      await configDb.execute(sql`COMMIT`);

      return {
        ...result[0],
        metadata: JSON.parse((result[0].metadata as string) || "{}"),
      } as AnnotatedCollection;
    } else {
      await configDb.execute(sql`ROLLBACK`);
      throw new Error("No fields to update");
    }
  } catch (error) {
    await configDb.execute(sql`ROLLBACK`);
    throw error;
  }
};

/**
 * Adds collection entries to an existing annotated collection
 * @param collectionId - The annotated collection ID to add entries to
 * @param entries - Array of collection entries to add. Each entry contains:
 *   - source_table: The table name (e.g., "fake_alerts", "mapeo_data") corresponding to the URL path
 *   - source_id: The unique identifier from the source table (e.g., alertID for alerts, mapeoID for mapeo)
 *   - notes: Optional notes about the entry
 * @param addedBy - User ID who is adding the collection entries
 * @returns Promise<CollectionEntry[]> - The added collection entries
 */
export const addEntriesToCollection = async (
  collectionId: string,
  entries: Array<{
    source_table: string;
    source_id: string;
    notes?: string;
  }>,
  addedBy: string,
): Promise<CollectionEntry[]> => {
  try {
    await configDb.execute(sql`BEGIN`);

    const newEntries = [];

    for (const entry of entries) {
      // Fetch source data from the original table
      const sourceResult = await configDb.execute(sql`
        SELECT * FROM ${sql.identifier(entry.source_table)} WHERE _id = ${entry.source_id} OR id = ${entry.source_id} LIMIT 1
      `);

      const entryResult = await configDb.execute(sql`
        INSERT INTO collection_entries (collection_id, source_table, source_id, source_data, added_by, notes)
        VALUES (${collectionId}, ${entry.source_table}, ${entry.source_id}, ${JSON.stringify(sourceResult[0] || {})}, ${addedBy}, ${entry.notes})
        RETURNING *
      `);

      newEntries.push({
        ...entryResult[0],
        source_data: JSON.parse((entryResult[0].source_data as string) || "{}"),
      } as CollectionEntry);
    }

    await configDb.execute(sql`COMMIT`);
    return newEntries;
  } catch (error) {
    await configDb.execute(sql`ROLLBACK`);
    throw error;
  }
};

/**
 * Deletes an annotated collection by ID (cascades to related incidents and collection entries)
 * @param collectionId - The annotated collection ID to delete
 * @returns Promise<void>
 */
export const deleteAnnotatedCollection = async (
  collectionId: string,
): Promise<void> => {
  try {
    await configDb.execute(sql`
      DELETE FROM annotated_collections WHERE id = ${collectionId}
    `);
  } catch (error) {
    console.error("PostgreSQL Error:", error);
    throw error;
  }
};

/**
 * Lists annotated collections with optional filtering and pagination
 * @param filters - Optional filters for collection_type, status, created_by, limit, offset
 * @returns Promise with annotated collections array and total count
 */
export const listAnnotatedCollections = async (filters?: {
  collection_type?: string;
  status?: string;
  created_by?: string;
  limit?: number;
  offset?: number;
}): Promise<{
  collections: AnnotatedCollection[];
  total: number;
}> => {
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
  const countResult = await configDb.execute(
    sql.raw(`SELECT COUNT(*) FROM annotated_collections ${whereClause}`),
  );
  const total = parseInt(countResult[0].count as string);

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
  const collectionsResult = await configDb.execute(sql.raw(collectionsQuery));

  const collections = collectionsResult.map((row) => ({
    ...row,
    metadata: JSON.parse((row.metadata as string) || "{}"),
  })) as AnnotatedCollection[];

  return { collections, total };
};
