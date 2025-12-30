import type { H3Event } from "h3";
import { useRuntimeConfig } from "#imports";
import { Role } from "~/types/types";

/**
 * Interface representing a user object from Auth0
 * Contains user information and optional roles array
 */
interface Auth0User {
  /** User's email address */
  email: string;
  /** Array of role names assigned to the user */
  roles?: string[];

  /** Allow for any additional fields from Auth0 */
  [key: string]: string | string[] | boolean | number | undefined;
}

// Cache for Management API access token
let managementTokenCache: { token: string; expiresAt: number } | null = null;

/**
 * Gets or generates a Management API access token for Auth0
 * Uses client credentials flow to obtain a token for API operations
 * Implements caching to avoid unnecessary token requests
 *
 * @returns {Promise<string | null>} The access token or null if failed
 */
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

/**
 * Fetches a user's ID by their email address using Auth0 Management API
 *
 * @param {string} email - The email address to search for
 * @returns {Promise<string | null>} The user ID or null if not found/error
 */
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

/**
 * Fetches roles from Auth0 Management API
 * Can fetch either all available roles or roles assigned to a specific user
 *
 * @param {string} [userId] - Optional user ID to fetch user-specific roles
 * @returns {Promise<Array<{id: string, name: string, description: string}>>} Array of role objects
 */
const fetchRoles = async (
  userId?: string,
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

    // Build URL - either user-specific roles or all roles
    const url = userId
      ? `https://${oauth.auth0.domain}/api/v2/users/${userId}/roles`
      : `https://${oauth.auth0.domain}/api/v2/roles`;

    const rolesResponse = await fetch(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    });

    if (!rolesResponse.ok) {
      const errorText = await rolesResponse.text();
      console.error(
        "🔍 Failed to fetch roles from Management API. Status:",
        rolesResponse.status,
      );
      console.error("🔍 Error response:", errorText);
      return [];
    }

    const rolesData = await rolesResponse.json();
    return rolesData.map(
      (role: { id: string; name: string; description: string }) => ({
        id: role.id,
        name: role.name.toLowerCase().replace(/\b\w/g, (l) => l.toUpperCase()),
        description: role.description,
      }),
    );
  } catch (error) {
    console.error("🔍 Error fetching roles:", error);
    return [];
  }
};

/**
 * Assigns roles to a user via Auth0 Management API
 *
 * @param {string} userId - The Auth0 user ID to assign roles to
 * @param {string[]} roleIds - Array of role IDs to assign to the user
 * @returns {Promise<boolean>} True if successful, false otherwise
 */
const assignUserRoles = async (
  userId: string,
  roleIds: string[],
): Promise<boolean> => {
  try {
    const config = useRuntimeConfig();
    const { oauth } = config;

    if (!oauth?.auth0?.domain || roleIds.length === 0) return true;

    const accessToken = await getManagementApiToken();
    if (!accessToken) {
      console.error("🔍 Failed to get Management API access token");
      return false;
    }

    const response = await fetch(
      `https://${oauth.auth0.domain}/api/v2/users/${userId}/roles`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          roles: roleIds,
        }),
      },
    );

    return response.ok;
  } catch (error) {
    console.error("🔍 Error assigning user roles:", error);
    return false;
  }
};

/**
 * Auth0 OAuth handler for user authentication and role management
 * Handles user login, role assignment, and session creation
 */
export default oauthAuth0EventHandler({
  config: {
    emailRequired: true,
    redirectURL: `${useRuntimeConfig().public.baseUrl}/login`,
  },

  /**
   * Handles successful Auth0 authentication
   * Processes user roles, assigns default SignedIn role if needed, and creates user session
   *
   * @param {H3Event} event - The H3 event object
   * @param {{user: Auth0User}} params - Object containing the authenticated user data
   */
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
            userRoles = await fetchRoles(userId);
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
      let userRole: Role = Role.SignedIn; // Default to SignedIn (signed in but no elevated access)
      if (userRoles.length > 0) {
        const hasAdminRole = userRoles.some((role) => role.name === "Admin");
        const hasMemberRole = userRoles.some((role) => role.name === "Member");
        const hasGuestRole = userRoles.some((role) => role.name === "Guest");

        if (hasAdminRole) {
          userRole = Role.Admin;
        } else if (hasMemberRole) {
          userRole = Role.Member;
        } else if (hasGuestRole) {
          userRole = Role.Guest;
        } else {
          // User has roles but none of the expected ones, treat as SignedIn
          userRole = Role.SignedIn;
        }
      } else {
        // If user has no roles, assign them the "SignedIn" role via Management API
        // This creates a "SignedIn" role in Auth0 for users who are logged in but not approved
        if (user.email) {
          const userId = await fetchUserIdByEmail(user.email);
          if (userId) {
            try {
              const allRoles = await fetchRoles();
              console.log("🔍 All roles from Auth0:", allRoles);
              const signedInRole = allRoles.find(
                (role) => role.name === "SignedIn" || role.name === "Signedin",
              );

              if (signedInRole) {
                const assignSuccess = await assignUserRoles(userId, [
                  signedInRole.id,
                ]);

                if (assignSuccess) {
                  console.log(
                    "🔍 Successfully assigned SignedIn role to user:",
                    user.email,
                  );
                  userRoles = [signedInRole];
                  userRole = Role.SignedIn; // Internal role is SignedIn for logged-in users with no elevated permissions
                } else {
                  console.error(
                    "🔍 Failed to assign SignedIn role to user:",
                    user.email,
                  );
                  // Fallback: create local role object
                  userRoles = [
                    {
                      id: "signedin-role",
                      name: "SignedIn",
                      description:
                        "User is logged in but not yet approved for higher access",
                    },
                  ];
                  userRole = Role.SignedIn;
                }
              } else {
                console.warn(
                  "🔍 No SignedIn role found in Auth0, creating fallback role",
                );
                // Fallback: create local role object
                userRoles = [
                  {
                    id: "signedin-role",
                    name: "SignedIn",
                    description:
                      "User is logged in but not yet approved for higher access",
                  },
                ];
                userRole = Role.SignedIn;
              }
            } catch (error) {
              console.error("🔍 Error assigning SignedIn role:", error);
              // Fallback: create local role object
              userRoles = [
                {
                  id: "signedin-role",
                  name: "SignedIn",
                  description:
                    "User is logged in but not yet approved for higher access",
                },
              ];
              userRole = Role.SignedIn;
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

  /**
   * Handles Auth0 authentication errors
   * Logs the error and redirects to login page
   *
   * @param {H3Event} event - The H3 event object
   */
  onError(event: H3Event) {
    console.error("OAuth error:", event);
    return sendRedirect(event, "/login");
  },
});
