import type { H3Event } from "h3";
import type { User, RouteLevelPermission } from "@/types";
import { Role } from "@/types";
import { useRuntimeConfig } from "#imports";

import type { Ref } from "vue";

/**
 * Validates that a user session exists, unless authStrategy is "none".
 * @param event - The H3 event object
 * @returns The user session
 * @throws {Error} - Throws 401 if authentication is required but missing
 */
export const validateUserSession = async (event: H3Event) => {
  const config = useRuntimeConfig();
  const authStrategy = config.public.authStrategy;
  const session = await getUserSession(event);

  if (authStrategy !== "none" && !session.user) {
    throw createError({
      statusCode: 401,
      statusMessage: "Unauthorized - Authentication required",
    });
  }
  return session;
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

/**
 * Composable for checking if a view is publicly accessible
 * @param data - The API response data containing routeLevelPermission
 * @returns A computed boolean indicating if the view is publicly accessible
 */
export const useIsPublic = (
  data: Ref<{ routeLevelPermission?: RouteLevelPermission } | null | undefined>,
) => {
  return computed(() => {
    return data.value?.routeLevelPermission === "anyone";
  });
};

/**
 * Utility function for checking if a view is publicly accessible
 * @param routeLevelPermission - The permission level from the API response
 * @returns boolean indicating if the view is publicly accessible
 */
export const isPublicView = (
  routeLevelPermission?: RouteLevelPermission,
): boolean => {
  return routeLevelPermission === "anyone";
};
