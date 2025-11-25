import type { H3Event } from "h3";
import { Role } from "~/types/types";

/**
 * Test-only API endpoint to set user session with a specific role (GET version for browser navigation)
 * Only available when CI=true or NODE_ENV=test
 * This allows e2e tests to simulate different user roles without Auth0
 * Usage: /api/test/set-session?role=0 (for SignedIn) or /api/test/set-session?clear=true (to clear)
 */
export default defineEventHandler(async (event: H3Event) => {
  // Only allow in CI or test environment
  if (!process.env.CI && process.env.NODE_ENV !== "test") {
    throw createError({
      statusCode: 403,
      statusMessage: "This endpoint is only available in test environments",
    });
  }

  const query = getQuery(event);
  const { role, clear, email = "test@example.com" } = query;

  // Allow clearing session
  if (clear === "true" || clear === true) {
    await clearUserSession(event);
    return sendRedirect(event, "/");
  }

  // Parse role from query string
  const roleNum = role ? Number(role) : null;

  if (roleNum === null || isNaN(roleNum)) {
    throw createError({
      statusCode: 400,
      statusMessage:
        "Role query parameter is required (0=SignedIn, 1=Guest, 2=Member, 3=Admin)",
    });
  }

  // Validate role is a valid Role enum value
  const validRoles: Role[] = [
    Role.SignedIn,
    Role.Guest,
    Role.Member,
    Role.Admin,
  ];
  if (!validRoles.includes(roleNum as Role)) {
    throw createError({
      statusCode: 400,
      statusMessage: `Invalid role. Must be one of: ${validRoles.join(", ")}`,
    });
  }

  // Type assertion after validation
  const userRole = roleNum as Role;

  // Map role number to role name for the roles array
  const roleNames: Record<number, string> = {
    [Role.SignedIn]: "SignedIn",
    [Role.Guest]: "Guest",
    [Role.Member]: "Member",
    [Role.Admin]: "Admin",
  };

  const roleName = roleNames[userRole];

  await setUserSession(event, {
    user: {
      auth0: email as string,
      roles: [
        {
          id: `test-${roleName.toLowerCase()}-role`,
          name: roleName,
          description: `Test ${roleName} role for e2e testing`,
        },
      ],
      userRole,
    },
    loggedInAt: Date.now(),
  });

  // Redirect to home page after setting session
  return sendRedirect(event, "/");
});
