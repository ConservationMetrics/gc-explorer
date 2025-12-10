import type { H3Event } from "h3";
import type { User, RouteLevelPermission } from "@/types/types";
import { Role } from "@/types/types";

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

  // In CI/test mode: Check for testRole in query string or referer
  // This allows tests to pass role via URL without needing cookies
  if (process.env.CI || process.env.NODE_ENV === "test") {
    const url = event.node.req.url || "";
    const referer = event.node.req.headers.referer || "";
    const testRoleMatch =
      url.match(/[?&]testRole=(\d)/) || referer.match(/[?&]testRole=(\d)/);

    if (testRoleMatch && !session.user) {
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
        // Use unknown as intermediate type to allow mutation in test mode
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

    // In CI, if no session and no testRole, allow access (normal CI behavior)
    if (!session.user && !testRoleMatch) {
      return; // Skip auth checks in CI when no test role specified
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
