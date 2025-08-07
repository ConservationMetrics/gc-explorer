import type { H3Event } from "h3";
import { useRuntimeConfig } from "#imports";

interface Auth0User {
  email: string;
  roles?: string[];

  [key: string]: string | string[] | boolean | number | undefined; // Allow for any additional fields
}

// Cache for Management API access token
let managementTokenCache: { token: string; expiresAt: number } | null = null;

// Function to get or generate Management API access token
async function getManagementApiToken(): Promise<string | null> {
  try {
    const config = useRuntimeConfig();
    const { oauth } = config;

    console.log("🔍 Auth0 config check:", {
      hasClientId: !!oauth?.auth0?.clientId,
      hasClientSecret: !!oauth?.auth0?.clientSecret,
      hasDomain: !!oauth?.auth0?.domain,
      domain: oauth?.auth0?.domain,
    });

    if (
      !oauth?.auth0?.clientId ||
      !oauth?.auth0?.clientSecret ||
      !oauth?.auth0?.domain
    ) {
      console.error("🔍 Auth0 Management API configuration missing");
      return null;
    }

    // Check if we have a valid cached token
    if (managementTokenCache && managementTokenCache.expiresAt > Date.now()) {
      console.log("🔍 Using cached Management API token");
      return managementTokenCache.token;
    }

    console.log("🔍 Generating new Management API token...");
    console.log(
      "🔍 Token request URL:",
      `https://${oauth.auth0.domain}/oauth/token`,
    );

    // Generate new access token
    const tokenResponse = await fetch(
      `https://${oauth.auth0.domain}/oauth/token`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          grant_type: "client_credentials",
          client_id: oauth.auth0.clientId,
          client_secret: oauth.auth0.clientSecret,
          audience: `https://${oauth.auth0.domain}/api/v2/`,
        }),
      },
    );

    console.log("🔍 Token response status:", tokenResponse.status);
    console.log("🔍 Token response ok:", tokenResponse.ok);

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
    console.log("🔍 Token response data:", {
      hasAccessToken: !!tokenData.access_token,
      expiresIn: tokenData.expires_in,
      tokenType: tokenData.token_type,
    });

    const accessToken = tokenData.access_token;
    const expiresIn = tokenData.expires_in || 86400; // Default to 24 hours

    // Cache the token with expiration
    managementTokenCache = {
      token: accessToken,
      expiresAt: Date.now() + expiresIn * 1000 - 60000, // Expire 1 minute early for safety
    };

    console.log(
      "🔍 Generated new Management API token, expires in:",
      expiresIn,
      "seconds",
    );
    return accessToken;
  } catch (error) {
    console.error("🔍 Error generating Management API token:", error);
    return null;
  }
}

// Function to fetch user ID by email from Auth0 Management API
async function fetchUserIdByEmail(email: string): Promise<string | null> {
  try {
    const config = useRuntimeConfig();
    const { oauth } = config;

    console.log("🔍 Fetching user ID for email:", email);

    if (!oauth?.auth0?.domain) {
      console.error("🔍 Auth0 Management API configuration missing");
      return null;
    }

    const accessToken = await getManagementApiToken();
    if (!accessToken) {
      console.error("🔍 Failed to get Management API access token");
      return null;
    }

    console.log("🔍 Got access token, fetching user by email...");
    console.log(
      "🔍 User API URL:",
      `https://${oauth.auth0.domain}/api/v2/users-by-email?email=${encodeURIComponent(email)}`,
    );

    // Fetch user by email
    const userResponse = await fetch(
      `https://${oauth.auth0.domain}/api/v2/users-by-email?email=${encodeURIComponent(email)}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      },
    );

    console.log("🔍 User response status:", userResponse.status);
    console.log("🔍 User response ok:", userResponse.ok);

    if (!userResponse.ok) {
      const errorText = await userResponse.text();
      console.error(
        "🔍 Failed to fetch user by email from Management API. Status:",
        userResponse.status,
      );
      console.error("🔍 Error response:", errorText);
      return null;
    }

    const usersData = await userResponse.json();
    console.log("🔍 Users data received:", {
      count: usersData.length,
      users: usersData.map((u: { email: string; user_id: string }) => ({
        email: u.email,
        user_id: u.user_id,
      })),
    });

    if (usersData.length === 0) {
      console.error("🔍 No user found with email:", email);
      return null;
    }

    const userId = usersData[0].user_id;
    console.log("🔍 Found user ID:", userId, "for email:", email);
    return userId;
  } catch (error) {
    console.error("🔍 Error fetching user ID by email:", error);
    return null;
  }
}

// Function to fetch user roles from Auth0 Management API
async function fetchUserRoles(
  userId: string,
): Promise<Array<{ id: string; name: string; description: string }>> {
  try {
    const config = useRuntimeConfig();
    const { oauth } = config;

    if (!oauth?.auth0?.domain) {
      console.error("🔍 Auth0 Management API configuration missing");
      return [];
    }

    const accessToken = await getManagementApiToken();
    if (!accessToken) {
      console.error("🔍 Failed to get Management API access token");
      return [];
    }

    // Fetch user roles using the provided Management API token
    const rolesResponse = await fetch(
      `https://${oauth.auth0.domain}/api/v2/users/${userId}/roles`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      },
    );

    if (!rolesResponse.ok) {
      console.error("🔍 Failed to fetch user roles from Management API");
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

export default oauthAuth0EventHandler({
  config: {
    emailRequired: true,
    redirectURL: `${useRuntimeConfig().public.baseUrl}/login`,
  },

  async onSuccess(event: H3Event, { user }: { user: Auth0User }) {
    try {
      // Log the full user object to see what Auth0 provides
      console.log("🔍 Auth0 User Object:", JSON.stringify(user, null, 2));
      console.log("🔍 Auth0 User Keys:", Object.keys(user));

      // Log specific fields that might contain roles
      console.log("🔍 User email:", user.email);
      console.log("🔍 User sub:", user.sub);
      console.log("🔍 User name:", user.name);
      console.log("🔍 User nickname:", user.nickname);
      console.log("🔍 User picture:", user.picture);
      console.log("🔍 User email_verified:", user.email_verified);
      console.log("🔍 User updated_at:", user.updated_at);
      console.log("🔍 Roles from roles field:", user.roles);
      console.log("🔍 Permissions:", user.permissions);

      // Log all custom fields that might contain role information
      Object.keys(user).forEach((key) => {
        if (
          key.includes("role") ||
          key.includes("permission") ||
          key.includes("https://")
        ) {
          console.log(`🔍 Custom field ${key}:`, user[key]);
        }
      });

      // If roles aren't in the user object, fetch them from Management API
      let userRoles: Array<{ id: string; name: string; description: string }> =
        [];
      if (!user.roles || user.roles.length === 0) {
        console.log(
          "🔍 No roles found in user object, fetching from Management API...",
        );
        if (user.email) {
          const userId = await fetchUserIdByEmail(user.email);
          if (userId) {
            userRoles = await fetchUserRoles(userId);
            console.log("🔍 Fetched roles from Management API:", userRoles);
          } else {
            console.log("🔍 Could not find user ID for email:", user.email);
          }
        }
      } else {
        // Convert string roles to role objects if they exist in user object
        userRoles = user.roles.map((role: string) => ({
          id: "",
          name: role,
          description: "",
        }));
      }

      await setUserSession(event, {
        user: {
          auth0: user.email,
          roles: userRoles,
        },
        loggedInAt: Date.now(),
      });
    } catch (error) {
      console.error("🔍 Auth0 Error: Error setting user session", error);
    }
    // Redirect directly to the target page instead of login
    return sendRedirect(event, "/login");
  },
  onError(event: H3Event) {
    console.error("OAuth error:", event);
    return sendRedirect(event, "/login");
  },
});
