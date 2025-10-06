import { getDatabaseConnection } from "@/server/database/dbConnection";
import { createAnnotatedCollection } from "@/server/database/dbOperations";
import type { AnnotatedCollection, Incident } from "@/types/types";

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event);
    
    // Validate required fields
    if (!body.name) {
      throw createError({
        statusCode: 400,
        statusMessage: "Incident name is required",
      });
    }

    const session = await getUserSession(event);
    if (!session.user) {
      throw createError({
        statusCode: 401,
        statusMessage: "Unauthorized - Authentication required",
      });
    }
    const createdBy = session.user as {email: string};

    const collectionData: Omit<AnnotatedCollection, 'id' | 'created_at' | 'updated_at'> = {
      name: body.name,
      description: body.description,
      collection_type: 'incident', // Always set to incident
      status: body.status || 'active',
      created_by: createdBy.email,
      is_active: body.is_active || false,
      metadata: body.metadata || {},
    };

    const incidentData: Omit<Incident, 'collection_id'> = {
      incident_type: body.incident_type,
      responsible_party: body.responsible_party,
      impact_description: body.impact_description,
      supporting_evidence: body.supporting_evidence,
    };

    const configDb = await getDatabaseConnection(true);
    if (!configDb) {
      throw createError({
        statusCode: 500,
        statusMessage: "Database connection failed",
      });
    }

    const newIncident = await createAnnotatedCollection(
      configDb,
      collectionData,
      incidentData,
      body.entries
    );
    
    return {
      incident: newIncident,
    };
  } catch (error) {
    console.error("Error creating incident:", error);
    throw createError({
      statusCode: 500,
      statusMessage: "Failed to create incident",
    });
  }
});
