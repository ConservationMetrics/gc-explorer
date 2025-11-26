import type { H3Event } from "h3";
import { Role } from "~/types/types";
import type { User } from "~/types/types";

/**
 * Test-only API endpoint to set user session with a specific role (POST version for Playwright)
 * Only available when CI=true or NODE_ENV=test
 * This allows e2e tests to simulate different user roles without Auth0
 * Usage: POST /api/test/set-session with body: { role: 0 } (for SignedIn) or { role: null } (to clear)
 *
 * Sets a cookie with JWT-like token containing user info for test authentication
 */
export default defineEventHandler(async (event: H3Event) => {
  console.log("🔍 [TEST] set-session POST endpoint called");

  try {
    // Only allow in CI or test environment
    if (!process.env.CI && process.env.NODE_ENV !== "test") {
      console.warn(
        "🔍 [TEST] set-session endpoint called outside test environment",
      );
      throw createError({
        statusCode: 403,
        statusMessage: "This endpoint is only available in test environments",
      });
    }

    const body = await readBody(event);
    const { role, email = "test@example.com" } = body;

    console.log("🔍 [TEST] POST body:", { role, email });

    // Allow clearing session by passing null or undefined role
    if (role === null || role === undefined) {
      console.log("🔍 [TEST] Clearing test cookie");
      setCookie(event, "test-auth-token", "", {
        httpOnly: true,
        secure: false,
        sameSite: "lax",
        maxAge: 0, // Delete cookie
        path: "/",
      });
      return {
        success: true,
        message: "Test session cleared",
      };
    }

    if (role !== 0 && !role) {
      throw createError({
        statusCode: 400,
        statusMessage: "Role is required",
      });
    }

    // Validate role is a valid Role enum value
    const validRoles: Role[] = [
      Role.SignedIn,
      Role.Guest,
      Role.Member,
      Role.Admin,
    ];
    if (!validRoles.includes(role as Role)) {
      console.error("🔍 [TEST] Invalid role value:", role);
      throw createError({
        statusCode: 400,
        statusMessage: `Invalid role. Must be one of: ${validRoles.join(", ")}`,
      });
    }

    // Type assertion after validation
    const userRole = role as Role;

    // Map role number to role name for the roles array
    const roleNames: Record<number, string> = {
      [Role.SignedIn]: "SignedIn",
      [Role.Guest]: "Guest",
      [Role.Member]: "Member",
      [Role.Admin]: "Admin",
    };

    const roleName = roleNames[userRole];
    console.log(
      `🔍 [TEST] Setting user session with role: ${roleName} (${userRole})`,
    );

    // Create user object
    const testUser: User = {
      auth0: email as string,
      roles: [
        {
          id: `test-${roleName.toLowerCase()}-role`,
          name: roleName,
          description: `Test ${roleName} role for e2e testing`,
        },
      ],
      userRole,
    };

    // Create JWT-like token (simple base64 encoded JSON for testing)
    // Format: base64(JSON.stringify({ user, loggedInAt }))
    const tokenPayload = {
      user: testUser,
      loggedInAt: Date.now(),
    };
    const token = Buffer.from(JSON.stringify(tokenPayload)).toString("base64");

    // Set cookie with the token
    setCookie(event, "test-auth-token", token, {
      httpOnly: true,
      secure: false, // Allow in test environments
      sameSite: "lax",
      maxAge: 60 * 60 * 24, // 24 hours
      path: "/",
    });

    console.log(
      `🔍 [TEST] Test auth cookie set successfully for ${email} with role ${roleName}`,
    );

    return {
      success: true,
      role: userRole,
      roleName,
      email,
    };
  } catch (error) {
    console.error("🔍 [TEST] Unhandled error in set-session POST:", error);
    throw error;
  }
});
