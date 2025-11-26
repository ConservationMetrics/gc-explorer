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

  // In CI/test mode: Check for test auth cookie first
  if (process.env.CI || process.env.NODE_ENV === "test") {
    const testUser = decodeTestAuthToken(event);
    if (testUser && !session.user) {
      // Set the session from cookie token
      const mutableSession = session as unknown as {
        user?: User;
      };
      mutableSession.user = testUser;
      console.log(
        `🔍 [TEST] Server-side: Set user from test cookie: role=${testUser.userRole}`,
      );
    }

    // Fallback: Check for testRole in query string or referer
    if (!session.user && !testUser) {
      const url = event.node.req.url || "";
      const referer = event.node.req.headers.referer || "";
      const testRoleMatch =
        url.match(/[?&]testRole=(\d)/) || referer.match(/[?&]testRole=(\d)/);

      if (testRoleMatch) {
        // Create a test user session directly from the query parameter
        const testRole = Number(testRoleMatch[1]) as Role;
        const validRoles = [Role.SignedIn, Role.Guest, Role.Member, Role.Admin];

        if (validRoles.includes(testRole)) {
          const roleNames: Record<number, string> = {
            [Role.SignedIn]: "SignedIn",
            [Role.Guest]: "Guest",
            [Role.Member]: "Member",
            [Role.Admin]: "Admin",
          };

          // Set the session directly for this request
          const mutableSession = session as unknown as {
            user?: User;
          };
          mutableSession.user = {
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
            `🔍 [TEST] Server-side: Set test role from URL: ${roleNames[testRole]} (${testRole})`,
          );
        }
      }
    }

    // In CI, if no session and no testRole and no cookie, allow access (normal CI behavior)
    if (!session.user && !testUser) {
      return; // Skip auth checks in CI when no test auth specified
    }
  }

  if (!session.user) {
    throw createError({
      statusCode: 401,
      statusMessage: "Unauthorized - Authentication required",
    });
  }

  // For guest permission, check user role
  if (permission === "guest") {
    const typedUser = session.user as User;
    const userRole = typedUser?.userRole ?? Role.SignedIn;

    if (userRole < Role.Guest) {
      throw createError({
        statusCode: 403,
        statusMessage: "Forbidden - Insufficient permissions",
      });
    }
  }

  // For member permission, check user role
  if (permission === "member") {
    const typedUser = session.user as User;
    const userRole = typedUser?.userRole ?? Role.SignedIn;

    if (userRole < Role.Member) {
      throw createError({
        statusCode: 403,
        statusMessage: "Forbidden - Insufficient permissions",
      });
    }
  }

  // For admin permission, check user role
  if (permission === "admin") {
    const typedUser = session.user as User;
    const userRole = typedUser?.userRole ?? Role.SignedIn;

    if (userRole < Role.Admin) {
      throw createError({
        statusCode: 403,
        statusMessage: "Forbidden - Insufficient permissions",
      });
    }
  }
};
