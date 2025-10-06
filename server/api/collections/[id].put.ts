import { getDatabaseConnection } from "@/server/database/dbConnection";
import { updateAnnotatedCollection } from "@/server/database/dbOperations";
import type { AnnotatedCollection, Incident } from "@/types/types";

export default defineEventHandler(async (event) => {
  try {
    const collectionId = getRouterParam(event, "id");
    const body = await readBody(event);

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

    // Prepare collection updates
    const collectionUpdates: Partial<AnnotatedCollection> = {};
    if (body.name !== undefined) collectionUpdates.name = body.name;
    if (body.description !== undefined)
      collectionUpdates.description = body.description;
    if (body.status !== undefined) collectionUpdates.status = body.status;
    if (body.metadata !== undefined) collectionUpdates.metadata = body.metadata;

    // Prepare incident updates if provided
    let incidentUpdates: Partial<Incident> | undefined;
    if (body.incident_data) {
      incidentUpdates = {};
      if (body.incident_data.incident_type !== undefined)
        incidentUpdates.incident_type = body.incident_data.incident_type;
      if (body.incident_data.responsible_party !== undefined)
        incidentUpdates.responsible_party =
          body.incident_data.responsible_party;
      if (body.incident_data.impact_description !== undefined)
        incidentUpdates.impact_description =
          body.incident_data.impact_description;
      if (body.incident_data.supporting_evidence !== undefined)
        incidentUpdates.supporting_evidence =
          body.incident_data.supporting_evidence;
    }

    const updatedCollection = await updateAnnotatedCollection(
      configDb,
      collectionId,
      collectionUpdates,
      incidentUpdates,
    );

    return {
      collection: updatedCollection,
    };
  } catch (error) {
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
});
