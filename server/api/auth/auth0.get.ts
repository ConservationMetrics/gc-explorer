import type { H3Event } from "h3";
import { useRuntimeConfig } from "#imports";
import { Role } from "~/types/types";

interface Auth0User {
  email: string;
  roles?: string[];

  [key: string]: string | string[] | boolean | number | undefined; // Allow for any additional fields
}

// Cache for Management API access token
let managementTokenCache: { token: string; expiresAt: number } | null = null;

// Function to get or generate Management API access token
const getManagementApiToken = async (): Promise<string | null> => {
  try {
    const config = useRuntimeConfig();
    const { oauth } = config;

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
      return managementTokenCache.token;
    }

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
};

// Function to fetch user ID by email from Auth0 Management API
const fetchUserIdByEmail = async (email: string): Promise<string | null> => {
  try {
    const config = useRuntimeConfig();
    const { oauth } = config;

    if (!oauth?.auth0?.domain) {
      console.error("🔍 Auth0 Management API configuration missing");
      return null;
    }

    const accessToken = await getManagementApiToken();
    if (!accessToken) {
      console.error("🔍 Failed to get Management API access token");
      return null;
    }

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

    if (usersData.length === 0) {
      console.error("🔍 No user found with email:", email);
      return null;
    }

    const userId = usersData[0].user_id;
    return userId;
  } catch (error) {
    console.error("🔍 Error fetching user ID by email:", error);
    return null;
  }
};

// Function to fetch user roles from Auth0 Management API
const fetchUserRoles = async (
  userId: string,
): Promise<Array<{ id: string; name: string; description: string }>> => {
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
};

export default oauthAuth0EventHandler({
  config: {
    emailRequired: true,
    redirectURL: `${useRuntimeConfig().public.baseUrl}/login`,
  },

  async onSuccess(event: H3Event, { user }: { user: Auth0User }) {
    try {
      // Log user info for debugging
      console.log("🔍 Auth0 User:", { email: user.email, sub: user.sub });
      console.log("🔍 User roles from Auth0:", user.roles);

      // If roles aren't in the user object, fetch them from Management API
      let userRoles: Array<{ id: string; name: string; description: string }> =
        [];
      if (!user.roles || user.roles.length === 0) {
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

      // Determine user role level
      let userRole: Role = Role.Public; // Default to Public (not signed in)
      if (userRoles.length > 0) {
        const hasAdminRole = userRoles.some((role) => role.name === "Admin");
        const hasMemberRole = userRoles.some((role) => role.name === "Member");
        const hasViewerRole = userRoles.some((role) => role.name === "Viewer");

        if (hasAdminRole) {
          userRole = Role.Admin;
        } else if (hasMemberRole) {
          userRole = Role.Member;
        } else if (hasViewerRole) {
          userRole = Role.Viewer;
        } else {
          // User has roles but none of the expected ones, treat as Viewer
          userRole = Role.Viewer;
        }
      } else {
        // If user has no roles, assign them the "Public" role via Management API
        // This creates a "Public" role in Auth0 for users who are logged in but not approved
        if (user.email) {
          const userId = await fetchUserIdByEmail(user.email);
          if (userId) {
            try {
              // Assign the Public role using Management API
              const config = useRuntimeConfig();
              const { oauth } = config;
              const accessToken = await getManagementApiToken();

              if (accessToken && oauth?.auth0?.domain) {
                const assignRoleResponse = await fetch(
                  `https://${oauth.auth0.domain}/api/v2/users/${userId}/roles`,
                  {
                    method: "POST",
                    headers: {
                      Authorization: `Bearer ${accessToken}`,
                      "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                      roles: ["rol_ZPOcr12ORHZOF2Tk"], // Public role ID
                    }),
                  },
                );

                if (assignRoleResponse.ok) {
                  console.log(
                    "🔍 Successfully assigned Public role to user:",
                    user.email,
                  );
                  userRoles = [
                    {
                      id: "rol_ZPOcr12ORHZOF2Tk",
                      name: "Public",
                      description:
                        "User is logged in but not yet approved for higher access",
                    },
                  ];
                  userRole = Role.Public; // Internal role is Public for logged-in users with no permissions
                } else {
                  console.error(
                    "🔍 Failed to assign Public role to user:",
                    user.email,
                  );
                  // Fallback: create local role object
                  userRoles = [
                    {
                      id: "public-role",
                      name: "Public",
                      description:
                        "User is logged in but not yet approved for higher access",
                    },
                  ];
                  userRole = Role.Public;
                }
              }
            } catch (error) {
              console.error("🔍 Error assigning Public role:", error);
              // Fallback: create local role object
              userRoles = [
                {
                  id: "public-role",
                  name: "Public",
                  description:
                    "User is logged in but not yet approved for higher access",
                },
              ];
              userRole = Role.Public;
            }
          }
        }
      }

      await setUserSession(event, {
        user: {
          auth0: user.email,
          roles: userRoles,
          userRole,
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
