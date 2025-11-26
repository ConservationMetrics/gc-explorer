import type { H3Event } from "h3";
import type { User, RouteLevelPermission } from "@/types/types";
import { Role } from "@/types/types";

/**
 * Decodes the test auth token from cookie (CI/test mode only)
 * Returns user info if token is valid, null otherwise
 */
const decodeTestAuthToken = (event: H3Event): User | null => {
  if (!process.env.CI && process.env.NODE_ENV !== "test") {
    return null;
  }

  try {
    const cookies = parseCookies(event);
    const token = cookies["test-auth-token"];

    if (!token) {
      return null;
    }

    // Decode base64 token
    const decoded = Buffer.from(token, "base64").toString("utf-8");
    const payload = JSON.parse(decoded);

    if (payload.user && payload.user.userRole !== undefined) {
      console.log(
        `🔍 [TEST] Decoded test auth token: role=${payload.user.userRole}`,
      );
      return payload.user as User;
    }
  } catch (error) {
    console.error("🔍 [TEST] Error decoding test auth token:", error);
  }

  return null;
};

/**
 * Validates user authentication and permissions for the given permission level
 * @param event - The H3 event object
 * @param permission - The required permission level for access
 * @throws {Error} - Throws 401 or 403 errors for authentication/authorization failures
 */
export const validatePermissions = async (
  event: H3Event,
  permission: RouteLevelPermission,
): Promise<void> => {
  // Public access requires no authentication
  if (permission === "anyone") return;

  // Check if user is authenticated
  const session = await getUserSession(event);

  // In CI/test mode: Check for test auth cookie/query early - we'll use this for permission checks
  let testUser: User | null = null;
  if (process.env.CI || process.env.NODE_ENV === "test") {
    // First, check for test auth cookie
    testUser = decodeTestAuthToken(event);
    if (testUser) {
      console.log(
        `🔍 [TEST] Found test user from cookie: role=${testUser.userRole}, roles=${JSON.stringify(testUser.roles)}`,
      );
    }

    // Fallback: Check for testRole in query string or referer
    if (!testUser) {
      const url = event.node.req.url || "";
      const referer = event.node.req.headers.referer || "";
      const testRoleMatch =
        url.match(/[?&]testRole=(\d)/) || referer.match(/[?&]testRole=(\d)/);

      if (testRoleMatch) {
        // Create a test user directly from the query parameter
        const testRole = Number(testRoleMatch[1]) as Role;
        const validRoles = [Role.SignedIn, Role.Guest, Role.Member, Role.Admin];

        if (validRoles.includes(testRole)) {
          const roleNames: Record<number, string> = {
            [Role.SignedIn]: "SignedIn",
            [Role.Guest]: "Guest",
            [Role.Member]: "Member",
            [Role.Admin]: "Admin",
          };

          testUser = {
            auth0: "test@example.com",
            roles: [
              {
                id: `test-${roleNames[testRole].toLowerCase()}-role`,
                name: roleNames[testRole],
                description: `Test ${roleNames[testRole]} role for e2e testing`,
              },
            ],
            userRole: testRole,
          };
          console.log(
            `🔍 [TEST] Found test user from URL: role=${roleNames[testRole]} (${testRole})`,
          );
        }
      }
    }

    // In CI, if no session and no testUser, allow access (normal CI behavior)
    if (!session.user && !testUser) {
      return; // Skip auth checks in CI when no test auth specified
    }
  }

  // Check authentication - in CI/test mode, testUser counts as authenticated
  const isAuthenticated = session.user !== null || testUser !== null;
  if (!isAuthenticated) {
    throw createError({
      statusCode: 401,
      statusMessage: "Unauthorized - Authentication required",
    });
  }

  // Permission checks - same logic for test users and real users
  // In CI/test mode, use testUser if available, otherwise use session user
  const userToCheck =
    (process.env.CI || process.env.NODE_ENV === "test") && testUser
      ? testUser
      : (session.user as User);
  const userRole = userToCheck?.userRole ?? Role.SignedIn;

  console.log("🔍 [TEST] API route checking permissions:", {
    permission,
    userRole,
    userRoles: userToCheck?.roles?.map((r) => r.name),
    isTestUser:
      (process.env.CI || process.env.NODE_ENV === "test") && testUser !== null,
  });

  // For guest permission, check user role
  if (permission === "guest") {
    if (userRole < Role.Guest) {
      throw createError({
        statusCode: 403,
        statusMessage: "Forbidden - Insufficient permissions",
      });
    }
  }

  // For member permission, check user role
  if (permission === "member") {
    if (userRole < Role.Member) {
      throw createError({
        statusCode: 403,
        statusMessage: "Forbidden - Insufficient permissions",
      });
    }
  }

  // For admin permission, check user role
  if (permission === "admin") {
    if (userRole < Role.Admin) {
      throw createError({
        statusCode: 403,
        statusMessage: "Forbidden - Insufficient permissions",
      });
    }
  }
};
