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
  // Skip authentication checks in CI environment
  if (process.env.CI) return;

  // Public access requires no authentication
  if (permission === "anyone") return;

  // Check if user is authenticated
  const session = await getUserSession(event);

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
