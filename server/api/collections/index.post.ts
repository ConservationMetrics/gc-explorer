import { getDatabaseConnection } from "@/server/database/dbConnection";
import { createAnnotatedCollection } from "@/server/database/dbOperations";
import type { AnnotatedCollection, Incident } from "@/types/types";

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event);

    // Validate required fields
    if (!body.name || !body.collection_type) {
      throw createError({
        statusCode: 400,
        statusMessage: "Name and collection_type are required",
      });
    }

    const session = await getUserSession(event);
    if (!session.user) {
      throw createError({
        statusCode: 401,
        statusMessage: "Unauthorized - Authentication required",
      });
    }
    const createdBy = session.user as { email: string };

    const collectionData: Omit<
      AnnotatedCollection,
      "id" | "created_at" | "updated_at"
    > = {
      name: body.name,
      description: body.description,
      collection_type: body.collection_type,
      status: body.status || "active",
      created_by: createdBy.email,
      is_active: body.is_active || false,
      metadata: body.metadata || {},
    };

    let incidentData: Omit<Incident, "collection_id"> | undefined;
    if (body.collection_type === "incident" && body.incident_data) {
      incidentData = {
        incident_type: body.incident_data.incident_type,
        responsible_party: body.incident_data.responsible_party,
        impact_description: body.incident_data.impact_description,
        supporting_evidence: body.incident_data.supporting_evidence,
      };
    }

    const configDb = await getDatabaseConnection(true);
    if (!configDb) {
      throw createError({
        statusCode: 500,
        statusMessage: "Database connection failed",
      });
    }

    const newCollection = await createAnnotatedCollection(
      configDb,
      collectionData,
      incidentData,
      body.entries,
    );

    return {
      collection: newCollection,
    };
  } catch (error) {
    console.error("Error creating collection:", error);
    throw createError({
      statusCode: 500,
      statusMessage: "Failed to create collection",
    });
  }
});
