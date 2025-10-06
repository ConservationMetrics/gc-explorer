import { getDatabaseConnection } from "@/server/database/dbConnection";
import {
  createAnnotatedCollection,
  getAnnotatedCollection,
  updateAnnotatedCollection,
  addEntriesToCollection,
  deleteAnnotatedCollection,
  listAnnotatedCollections,
} from "@/server/database/annotatedCollections";
import type { AnnotatedCollection, Incident } from "@/types/types";
import type { H3Event } from "h3";
/**
 * Shared handler for listing collections with optional collection type filtering
 * @param event - Nuxt event object
 * @param defaultCollectionType - Optional default collection type to filter by
 * @returns Promise with collections, total, limit, and offset
 */
export const handleListCollections = async (
  event: H3Event,
  defaultCollectionType?: string,
) => {
  try {
    const query = getQuery(event);

    // Parse query parameters
    const filters = Object.fromEntries(
      Object.entries({
        collection_type: defaultCollectionType || (query.type as string),
        status: query.status as string,
        created_by: query.created_by as string,
        limit: query.limit ? parseInt(query.limit as string) : 20,
        offset: query.offset ? parseInt(query.offset as string) : 0,
      }).filter(([_, value]) => value !== undefined),
    );

    const configDb = await getDatabaseConnection(true);
    if (!configDb) {
      throw createError({
        statusCode: 500,
        statusMessage: "Database connection failed",
      });
    }

    const result = await listAnnotatedCollections(configDb, filters);

    return {
      collections: result.collections,
      total: result.total,
      limit: filters.limit,
      offset: filters.offset,
    };
  } catch (error) {
    console.error("Error fetching collections:", error);
    throw createError({
      statusCode: 500,
      statusMessage: "Failed to fetch collections",
    });
  }
};

/**
 * Shared handler for creating collections with optional incident data and entries
 * @param event - Nuxt event object
 * @param defaultCollectionType - Optional default collection type
 * @returns Promise with the created collection
 */
export const handleCreateCollection = async (
  event: H3Event,
  defaultCollectionType?: string,
) => {
  try {
    const body = await readBody(event);

    // Validate required fields
    if (!body.name) {
      throw createError({
        statusCode: 400,
        statusMessage: "Collection name is required",
      });
    }

    // Set default collection type if provided
    const collectionType = defaultCollectionType || body.collection_type;
    if (!collectionType) {
      throw createError({
        statusCode: 400,
        statusMessage: "Collection type is required",
      });
    }

    const configDb = await getDatabaseConnection(true);
    if (!configDb) {
      throw createError({
        statusCode: 500,
        statusMessage: "Database connection failed",
      });
    }

    // Prepare collection data
    const collectionData: Omit<
      AnnotatedCollection,
      "id" | "created_at" | "updated_at"
    > = {
      name: body.name,
      description: body.description || "",
      collection_type: collectionType,
      status: body.status || "active",
      created_by: body.created_by || "system",
      is_active: body.is_active !== false,
      metadata: body.metadata || {},
    };

    // Prepare incident data if it's an incident collection
    let incidentData: Omit<Incident, "collection_id"> | undefined;
    if (collectionType === "incident") {
      incidentData = {
        incident_type: body.incident_type,
        responsible_party: body.responsible_party,
        impact_description: body.impact_description,
        supporting_evidence: body.supporting_evidence || {},
      };
    }

    // Create the collection
    const result = await createAnnotatedCollection(
      configDb,
      collectionData,
      incidentData,
      body.entries,
    );

    return result;
  } catch (error: unknown) {
    console.error("Error creating collection:", error);
    if (error && typeof error === "object" && "statusCode" in error) {
      throw error;
    }
    throw createError({
      statusCode: 500,
      statusMessage: "Failed to create collection",
    });
  }
};

/**
 * Shared handler for getting a collection by ID
 * @param event - Nuxt event object
 * @returns Promise with collection, optional incident, and entries
 */
export const handleGetCollection = async (event: H3Event) => {
  try {
    const collectionId = getRouterParam(event, "id");
    if (!collectionId) {
      throw createError({
        statusCode: 400,
        statusMessage: "Collection ID is required",
      });
    }

    const configDb = await getDatabaseConnection(true);
    if (!configDb) {
      throw createError({
        statusCode: 500,
        statusMessage: "Database connection failed",
      });
    }

    const result = await getAnnotatedCollection(configDb, collectionId);
    return result;
  } catch (error: unknown) {
    console.error("Error fetching collection:", error);
    if (error instanceof Error && error.message === "Collection not found") {
      throw createError({
        statusCode: 404,
        statusMessage: "Collection not found",
      });
    }
    throw createError({
      statusCode: 500,
      statusMessage: "Failed to fetch collection",
    });
  }
};

/**
 * Shared handler for updating a collection
 * @param event - Nuxt event object
 * @returns Promise with the updated collection
 */
export const handleUpdateCollection = async (event: H3Event) => {
  try {
    const collectionId = getRouterParam(event, "id");
    if (!collectionId) {
      throw createError({
        statusCode: 400,
        statusMessage: "Collection ID is required",
      });
    }

    const body = await readBody(event);

    const configDb = await getDatabaseConnection(true);
    if (!configDb) {
      throw createError({
        statusCode: 500,
        statusMessage: "Database connection failed",
      });
    }

    // Prepare collection updates
    const collectionUpdates: Partial<AnnotatedCollection> = {};
    if (body.name !== undefined) collectionUpdates.name = body.name;
    if (body.description !== undefined)
      collectionUpdates.description = body.description;
    if (body.status !== undefined) collectionUpdates.status = body.status;
    if (body.metadata !== undefined) collectionUpdates.metadata = body.metadata;

    // Prepare incident updates if provided
    let incidentUpdates: Partial<Incident> | undefined;
    if (
      body.incident_type !== undefined ||
      body.responsible_party !== undefined ||
      body.impact_description !== undefined ||
      body.supporting_evidence !== undefined
    ) {
      incidentUpdates = {};
      if (body.incident_type !== undefined)
        incidentUpdates.incident_type = body.incident_type;
      if (body.responsible_party !== undefined)
        incidentUpdates.responsible_party = body.responsible_party;
      if (body.impact_description !== undefined)
        incidentUpdates.impact_description = body.impact_description;
      if (body.supporting_evidence !== undefined)
        incidentUpdates.supporting_evidence = body.supporting_evidence;
    }

    const result = await updateAnnotatedCollection(
      configDb,
      collectionId,
      collectionUpdates,
      incidentUpdates,
    );

    return result;
  } catch (error: unknown) {
    console.error("Error updating collection:", error);
    if (error instanceof Error && error.message === "Collection not found") {
      throw createError({
        statusCode: 404,
        statusMessage: "Collection not found",
      });
    }
    throw createError({
      statusCode: 500,
      statusMessage: "Failed to update collection",
    });
  }
};

/**
 * Shared handler for deleting a collection
 * @param event - Nuxt event object
 * @returns Promise<void>
 */
export const handleDeleteCollection = async (event: H3Event) => {
  try {
    const collectionId = getRouterParam(event, "id");
    if (!collectionId) {
      throw createError({
        statusCode: 400,
        statusMessage: "Collection ID is required",
      });
    }

    const configDb = await getDatabaseConnection(true);
    if (!configDb) {
      throw createError({
        statusCode: 500,
        statusMessage: "Database connection failed",
      });
    }

    await deleteAnnotatedCollection(configDb, collectionId);
    return { success: true };
  } catch (error) {
    console.error("Error deleting collection:", error);
    throw createError({
      statusCode: 500,
      statusMessage: "Failed to delete collection",
    });
  }
};

/**
 * Shared handler for adding entries to a collection
 * @param event - Nuxt event object
 * @returns Promise with the added entries
 */
export const handleAddEntriesToCollection = async (event: H3Event) => {
  try {
    const collectionId = getRouterParam(event, "id");
    if (!collectionId) {
      throw createError({
        statusCode: 400,
        statusMessage: "Collection ID is required",
      });
    }

    const body = await readBody(event);
    if (!body.entries || !Array.isArray(body.entries)) {
      throw createError({
        statusCode: 400,
        statusMessage: "Entries array is required",
      });
    }

    const configDb = await getDatabaseConnection(true);
    if (!configDb) {
      throw createError({
        statusCode: 500,
        statusMessage: "Database connection failed",
      });
    }

    const result = await addEntriesToCollection(
      configDb,
      collectionId,
      body.entries,
      body.added_by || "system",
    );

    return { entries: result };
  } catch (error) {
    console.error("Error adding entries to collection:", error);
    throw createError({
      statusCode: 500,
      statusMessage: "Failed to add entries to collection",
    });
  }
};
