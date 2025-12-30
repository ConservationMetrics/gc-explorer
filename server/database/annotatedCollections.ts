import { sql, eq, and } from "drizzle-orm";
import type {
  AnnotatedCollection,
  Incident,
  CollectionEntry,
} from "@/types/types";
import { configDb, warehouseDb } from "../utils/db";
import {
  annotatedCollections,
  incidents,
  collectionEntries,
} from "../db/schema";

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
  // Use drizzle transaction API
  return await configDb.transaction(async (tx) => {
    // Create the annotated parent collection first
    const [newCollection] = await tx
      .insert(annotatedCollections)
      .values({
        name: collection.name,
        description: collection.description,
        collectionType: collection.collection_type,
        createdBy: collection.created_by,
        metadata: collection.metadata,
      })
      .returning();

    // Create incident-specific data if provided
    if (incidentData && collection.collection_type === "incident") {
      await tx.insert(incidents).values({
        collectionId: newCollection.id,
        incidentType: incidentData.incident_type,
        responsibleParty: incidentData.responsible_party,
        status: incidentData.status,
        isActive: incidentData.is_active,
        impactDescription: incidentData.impact_description,
        supportingEvidence: incidentData.supporting_evidence,
      });
    }

    // Add entries if provided
    if (entries && entries.length > 0) {
      for (const entry of entries) {
        // Fetch source data from the original table in the warehouse database
        // Source tables are in warehouse, not config database
        // Warehouse tables use _id as the primary key column
        const sourceResult = await warehouseDb.execute(sql`
          SELECT * FROM ${sql.identifier(entry.source_table)} WHERE _id = ${entry.source_id} LIMIT 1
        `);

        await tx.insert(collectionEntries).values({
          collectionId: newCollection.id,
          sourceTable: entry.source_table,
          sourceId: entry.source_id,
          sourceData: sourceResult[0] || {},
          addedBy: collection.created_by,
          notes: entry.notes,
        });
      }
    }

    return {
      id: newCollection.id,
      name: newCollection.name,
      description: newCollection.description,
      collection_type: newCollection.collectionType,
      created_by: newCollection.createdBy,
      created_at: newCollection.createdAt?.toISOString() || "",
      updated_at: newCollection.updatedAt?.toISOString() || "",
      metadata: newCollection.metadata || {},
    } as AnnotatedCollection;
  });
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
  const [collectionResult] = await configDb
    .select()
    .from(annotatedCollections)
    .where(eq(annotatedCollections.id, collectionId));

  if (!collectionResult) {
    throw new Error("Collection not found");
  }

  const collection = {
    id: collectionResult.id,
    name: collectionResult.name,
    description: collectionResult.description,
    collection_type: collectionResult.collectionType,
    created_by: collectionResult.createdBy,
    created_at: collectionResult.createdAt?.toISOString() || "",
    updated_at: collectionResult.updatedAt?.toISOString() || "",
    metadata: collectionResult.metadata || {},
  } as AnnotatedCollection;

  // Get incident data if it's an incident collection
  let incident: Incident | undefined = undefined;
  if (collection.collection_type === "incident") {
    const [incidentResult] = await configDb
      .select()
      .from(incidents)
      .where(eq(incidents.collectionId, collectionId));

    if (incidentResult) {
      incident = {
        collection_id: incidentResult.collectionId,
        incident_type: incidentResult.incidentType,
        responsible_party: incidentResult.responsibleParty,
        status: incidentResult.status,
        is_active: incidentResult.isActive,
        impact_description: incidentResult.impactDescription,
        supporting_evidence: incidentResult.supportingEvidence,
      } as Incident;
    }
  }

  // Get collection entries
  const entriesResult = await configDb
    .select()
    .from(collectionEntries)
    .where(eq(collectionEntries.collectionId, collectionId))
    .orderBy(collectionEntries.addedAt);

  const entries = entriesResult.map((row) => ({
    id: row.id,
    collection_id: row.collectionId,
    source_table: row.sourceTable,
    source_id: row.sourceId,
    source_data: row.sourceData || {},
    added_by: row.addedBy,
    added_at: row.addedAt?.toISOString() || "",
    notes: row.notes,
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
  // Update main collection
  const collectionUpdateData: Partial<
    typeof annotatedCollections.$inferInsert
  > = {};
  if (updates.name !== undefined) collectionUpdateData.name = updates.name;
  if (updates.description !== undefined)
    collectionUpdateData.description = updates.description;
  if (updates.metadata !== undefined)
    collectionUpdateData.metadata = updates.metadata;

  if (Object.keys(collectionUpdateData).length === 0 && !incidentUpdates) {
    throw new Error("No fields to update");
  }

  return await configDb.transaction(async (tx) => {
    let updatedCollection;

    if (Object.keys(collectionUpdateData).length > 0) {
      const [result] = await tx
        .update(annotatedCollections)
        .set(collectionUpdateData)
        .where(eq(annotatedCollections.id, collectionId))
        .returning();

      if (!result) {
        throw new Error("Collection not found");
      }
      updatedCollection = result;
    } else {
      // If only incident updates, fetch the collection
      const [result] = await tx
        .select()
        .from(annotatedCollections)
        .where(eq(annotatedCollections.id, collectionId));
      if (!result) {
        throw new Error("Collection not found");
      }
      updatedCollection = result;
    }

    // Update incident data if provided
    if (incidentUpdates) {
      const incidentUpdateData: Partial<typeof incidents.$inferInsert> = {};
      if (incidentUpdates.incident_type !== undefined)
        incidentUpdateData.incidentType = incidentUpdates.incident_type;
      if (incidentUpdates.responsible_party !== undefined)
        incidentUpdateData.responsibleParty = incidentUpdates.responsible_party;
      if (incidentUpdates.impact_description !== undefined)
        incidentUpdateData.impactDescription =
          incidentUpdates.impact_description;
      if (incidentUpdates.status !== undefined)
        incidentUpdateData.status = incidentUpdates.status;
      if (incidentUpdates.is_active !== undefined)
        incidentUpdateData.isActive = incidentUpdates.is_active;
      if (incidentUpdates.supporting_evidence !== undefined)
        incidentUpdateData.supportingEvidence =
          incidentUpdates.supporting_evidence;

      if (Object.keys(incidentUpdateData).length > 0) {
        await tx
          .update(incidents)
          .set(incidentUpdateData)
          .where(eq(incidents.collectionId, collectionId));
      }
    }

    return {
      id: updatedCollection.id,
      name: updatedCollection.name,
      description: updatedCollection.description,
      collection_type: updatedCollection.collectionType,
      created_by: updatedCollection.createdBy,
      created_at: updatedCollection.createdAt?.toISOString() || "",
      updated_at: updatedCollection.updatedAt?.toISOString() || "",
      metadata: updatedCollection.metadata || {},
    } as AnnotatedCollection;
  });
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
  return await configDb.transaction(async (tx) => {
    const newEntries = [];

    for (const entry of entries) {
      // Fetch source data from the original table in the warehouse database
      // Source tables are in warehouse, not config database
      // Warehouse tables use _id as the primary key column
      const sourceResult = await warehouseDb.execute(sql`
        SELECT * FROM ${sql.identifier(entry.source_table)} WHERE _id = ${entry.source_id} LIMIT 1
      `);

      const [newEntry] = await tx
        .insert(collectionEntries)
        .values({
          collectionId: collectionId,
          sourceTable: entry.source_table,
          sourceId: entry.source_id,
          sourceData: sourceResult[0] || {},
          addedBy: addedBy,
          notes: entry.notes,
        })
        .returning();

      newEntries.push({
        id: newEntry.id,
        collection_id: newEntry.collectionId,
        source_table: newEntry.sourceTable,
        source_id: newEntry.sourceId,
        source_data: newEntry.sourceData || {},
        added_by: newEntry.addedBy,
        added_at: newEntry.addedAt?.toISOString() || "",
        notes: newEntry.notes,
      } as CollectionEntry);
    }

    return newEntries;
  });
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
    await configDb
      .delete(annotatedCollections)
      .where(eq(annotatedCollections.id, collectionId));
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
  // Build where conditions
  const whereConditions = [];
  if (filters?.collection_type) {
    whereConditions.push(
      eq(annotatedCollections.collectionType, filters.collection_type),
    );
  }
  if (filters?.created_by) {
    whereConditions.push(
      eq(annotatedCollections.createdBy, filters.created_by),
    );
  }

  // For status filtering, we need to join with incidents table
  if (filters?.status) {
    const collectionsResult = await configDb
      .select()
      .from(annotatedCollections)
      .leftJoin(incidents, eq(annotatedCollections.id, incidents.collectionId))
      .where(eq(incidents.status, filters.status))
      .orderBy(annotatedCollections.createdAt)
      .limit(filters?.limit || 20)
      .offset(filters?.offset || 0);

    const [countResult] = await configDb
      .select({ count: sql<number>`count(*)` })
      .from(annotatedCollections)
      .leftJoin(incidents, eq(annotatedCollections.id, incidents.collectionId))
      .where(eq(incidents.status, filters.status));

    const collections = collectionsResult.map((row) => ({
      id: row.annotated_collections.id,
      name: row.annotated_collections.name,
      description: row.annotated_collections.description,
      collection_type: row.annotated_collections.collectionType,
      created_by: row.annotated_collections.createdBy,
      created_at: row.annotated_collections.createdAt?.toISOString() || "",
      updated_at: row.annotated_collections.updatedAt?.toISOString() || "",
      metadata: row.annotated_collections.metadata || {},
    })) as AnnotatedCollection[];

    return { collections, total: countResult.count };
  } else {
    // Simple query without status filtering
    const whereCondition =
      whereConditions.length > 0
        ? whereConditions.length === 1
          ? whereConditions[0]
          : and(...whereConditions)
        : undefined;

    const [countResult] = await configDb
      .select({ count: sql<number>`count(*)` })
      .from(annotatedCollections)
      .where(whereCondition);

    const collectionsResult = await configDb
      .select()
      .from(annotatedCollections)
      .where(whereCondition)
      .orderBy(annotatedCollections.createdAt)
      .limit(filters?.limit || 20)
      .offset(filters?.offset || 0);

    const collections = collectionsResult.map((row) => ({
      id: row.id,
      name: row.name,
      description: row.description,
      collection_type: row.collectionType,
      created_by: row.createdBy,
      created_at: row.createdAt?.toISOString() || "",
      updated_at: row.updatedAt?.toISOString() || "",
      metadata: row.metadata || {},
    })) as AnnotatedCollection[];

    return { collections, total: countResult.count };
  }
};
