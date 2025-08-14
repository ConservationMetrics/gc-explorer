import type { H3Event } from "h3";
import { useRuntimeConfig } from "#imports";

// Cache for Management API access token
let managementTokenCache: { token: string; expiresAt: number } | null = null;

// Function to get or generate Management API access token
async function getManagementApiToken(): Promise<string | null> {
  try {
    console.log("🔍 === GET MANAGEMENT API TOKEN START ===");

    const config = useRuntimeConfig();
    console.log("🔍 Full runtime config:", JSON.stringify(config, null, 2));
    console.log("🔍 Auth0 Client ID:", config.oauth?.auth0?.clientId);
    console.log(
      "🔍 Auth0 Secret:",
      config.oauth?.auth0?.clientSecret
        ? "***SECRET_PRESENT***"
        : "***SECRET_MISSING***",
    );
    console.log("🔍 Auth0 Domain:", config.oauth?.auth0?.domain);
    console.log("🔍 Public config keys:", Object.keys(config.public));
    console.log("🔍 Private config keys:", Object.keys(config));

    if (
      !config.oauth?.auth0?.clientId ||
      !config.oauth?.auth0?.clientSecret ||
      !config.oauth?.auth0?.domain
    ) {
      console.error("🔍 Auth0 Management API configuration missing");
      console.error(
        "🔍 Missing auth0ClientId:",
        !config.oauth?.auth0?.clientId,
      );
      console.error(
        "🔍 Missing auth0Secret:",
        !config.oauth?.auth0?.clientSecret,
      );
      console.error("🔍 Missing auth0Domain:", !config.oauth?.auth0?.domain);
      return null;
    }

    // Check if we have a valid cached token
    if (managementTokenCache && managementTokenCache.expiresAt > Date.now()) {
      return managementTokenCache.token;
    }

    // Generate new access token
    const tokenResponse = await fetch(
      `https://${config.oauth.auth0.domain}/oauth/token`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          grant_type: "client_credentials",
          client_id: config.oauth.auth0.clientId,
          client_secret: config.oauth.auth0.clientSecret,
          audience: `https://${config.oauth.auth0.domain}/api/v2/`,
        }),
      },
    );

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error(
        "🔍 Failed to generate Management API token. Status:",
        tokenResponse.status,
      );
      console.error("🔍 Error response:", errorText);
      return null;
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;
    const expiresIn = tokenData.expires_in || 86400; // Default to 24 hours

    // Cache the token with expiration
    managementTokenCache = {
      token: accessToken,
      expiresAt: Date.now() + expiresIn * 1000 - 60000, // Expire 1 minute early for safety
    };
    return accessToken;
  } catch (error) {
    console.error("🔍 Error generating Management API token:", error);
    return null;
  }
}

// Function to fetch user roles from Auth0 Management API
async function fetchUserRoles(
  userId: string,
): Promise<Array<{ id: string; name: string; description: string }>> {
  try {
    const config = useRuntimeConfig();

    if (!config.oauth?.auth0?.domain) {
      console.error("🔍 Auth0 Management API configuration missing");
      return [];
    }

    const accessToken = await getManagementApiToken();
    if (!accessToken) {
      console.error("🔍 Failed to get Management API access token");
      return [];
    }

    // Fetch user roles using the Management API token
    const rolesResponse = await fetch(
      `https://${config.oauth.auth0.domain}/api/v2/users/${userId}/roles`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      },
    );

    if (!rolesResponse.ok) {
      const errorText = await rolesResponse.text();
      console.error(
        "🔍 Failed to fetch user roles from Management API. Status:",
        rolesResponse.status,
      );
      console.error("🔍 Error response:", errorText);
      return [];
    }

    const rolesData = await rolesResponse.json();
    return rolesData.map(
      (role: { id: string; name: string; description: string }) => ({
        id: role.id,
        name: role.name,
        description: role.description,
      }),
    );
  } catch (error) {
    console.error("🔍 Error fetching user roles:", error);
    return [];
  }
}

export default defineEventHandler(async (event: H3Event) => {
  try {
    console.log("🔍 === ROLES API CALL START ===");

    // Validate API key
    const config = useRuntimeConfig();
    const requestApiKey = event.node.req.headers["x-api-key"];

    if (requestApiKey !== config.public.appApiKey) {
      console.error("🔍 Invalid API key provided");
      throw createError({
        status: 403,
        message: "Forbidden - Invalid API key",
      });
    }

    // Get userId from query parameter
    const query = getQuery(event);
    const userId = query.userId as string;
    console.log("🔍 Extracted userId from query:", userId);
    console.log("🔍 userId type:", typeof userId);
    console.log("🔍 userId truthy check:", !!userId);

    if (!userId) {
      console.error("🔍 Missing required parameter - userId:", !!userId);
      return sendError(event, new Error("userId is required"));
    }

    console.log("🔍 About to call fetchUserRoles with userId:", userId);

    // Fetch user roles using Management API token
    const roles = await fetchUserRoles(userId);

    console.log("🔍 fetchUserRoles returned:", JSON.stringify(roles, null, 2));
    console.log("🔍 Roles array length:", roles.length);
    console.log("🔍 Roles array type:", Array.isArray(roles));

    console.log(
      "🔍 Final result - Fetched roles for user:",
      userId,
      "Roles count:",
      roles.length,
    );
    console.log("🔍 === ROLES API CALL END ===");

    return { roles };
  } catch (error) {
    console.error("🔍 === ROLES API ERROR ===");
    console.error("🔍 Error type:", typeof error);
    console.error(
      "🔍 Error message:",
      error instanceof Error ? error.message : String(error),
    );
    console.error(
      "🔍 Error stack:",
      error instanceof Error ? error.stack : "No stack trace",
    );
    console.error("🔍 Full error object:", error);
    console.error("🔍 === ROLES API ERROR END ===");

    return sendError(event, new Error("Failed to fetch user roles"));
  }
});
