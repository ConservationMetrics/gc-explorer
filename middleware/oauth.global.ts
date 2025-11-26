import { defineNuxtRouteMiddleware, useRuntimeConfig } from "#imports";
import type { User, RouteLevelPermission } from "~/types/types";
import { Role } from "~/types/types";

/**
 * Decodes the test auth token from cookie (CI/test mode only)
 * Works on both client and server side using Nuxt's useCookie
 */
const decodeTestAuthToken = (): User | null => {
  if (!process.env.CI && process.env.NODE_ENV !== "test") {
    return null;
  }

  try {
    // useCookie works on both server and client
    const testAuthCookie = useCookie("test-auth-token");
    const token = testAuthCookie.value;

    if (!token) {
      return null;
    }

    // Decode base64 token
    const decoded = import.meta.server
      ? Buffer.from(token, "base64").toString("utf-8")
      : atob(token);
    const payload = JSON.parse(decoded);

    if (payload.user && payload.user.userRole !== undefined) {
      console.log(
        `🔍 [TEST] ${import.meta.server ? "Server" : "Client"}-side: Decoded test auth token: role=${payload.user.userRole}`,
      );
      return payload.user as User;
    }
  } catch (error) {
    console.error("🔍 [TEST] Error decoding test auth token:", error);
  }

  return null;
};

// Following example: https://github.com/atinux/atidone/blob/main/app/middleware/auth.ts
export default defineNuxtRouteMiddleware(async (to) => {
  const session = useUserSession();
  const { loggedIn, user } = session;

  // Test mode: Check for test auth cookie/query early - we'll use this for permission checks
  // We can't mutate session in middleware, so we'll use testUser directly for checks
  let testUser: User | null = null;
  if (process.env.CI || process.env.NODE_ENV === "test") {
    // First, check for test auth cookie
    testUser = decodeTestAuthToken();
    if (testUser) {
      console.log(
        `🔍 [TEST] Found test user from cookie: role=${testUser.userRole}, roles=${JSON.stringify(testUser.roles)}`,
      );
    }

    // Fallback: Check for testRole in query
    if (!testUser && to.query.testRole) {
      const testRole = Number(to.query.testRole);
      const validRoles = [0, 1, 2, 3]; // SignedIn, Guest, Member, Admin
      if (validRoles.includes(testRole)) {
        const roleNames: Record<number, string> = {
          0: "SignedIn",
          1: "Guest",
          2: "Member",
          3: "Admin",
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
          userRole: testRole as Role,
        };
        console.log(
          `🔍 [TEST] Found test user from query: role=${roleNames[testRole]} (${testRole})`,
        );
      }
    }
  }
  const {
    public: { authStrategy },
  } = useRuntimeConfig();
  const router = useRouter();
  console.log("🔍 [TEST] oauth.global middleware called", user, to.path);
  // In order to redirect the user back to the page they were on when unauthenticated, we need to store the redirect url in session storage
  // We use the window object to get where the user was before they were redirected to the login page
  // Store it in the session storage and in the Auth0 component we grab and redirect

  if (import.meta.client) {
    if (to.path.includes("/login")) {
      const back = window.history.state.back;
      const current = window.history.state.current;

      if (!current.includes("/login") && !back) {
        sessionStorage.setItem("redirect_url", current);
      }
    }
  }
  // Check if this is a dataset route that might have public access
  const isDatasetRoute =
    to.path.startsWith("/alerts/") ||
    to.path.startsWith("/gallery/") ||
    to.path.startsWith("/map/");

  if (isDatasetRoute) {
    try {
      const {
        public: { appApiKey },
      } = useRuntimeConfig();
      const headers = { "x-api-key": appApiKey };

      const response = await $fetch<
        [
          Record<string, { ROUTE_LEVEL_PERMISSION?: RouteLevelPermission }>,
          string[],
        ]
      >("/api/config", { headers });
      const [tableConfig] = response;

      // Extract the table name from the last part of the path
      const tableName = to.path.split("/").pop()!;
      const permission: RouteLevelPermission =
        tableConfig?.[tableName]?.ROUTE_LEVEL_PERMISSION ?? "anyone";
      // Public access: no login needed
      if (permission === "anyone") return;

      // Require authentication
      // In CI/test mode, check if we have testUser - if so, treat as authenticated
      const isAuthenticated = loggedIn.value || testUser !== null;
      if (!isAuthenticated) {
        if (authStrategy === "auth0") return router.push("/login");
        // In CI/test mode with "none" auth strategy, still check permissions
        // For member/admin permissions, block unauthenticated access even in CI
        if (
          (process.env.CI || process.env.NODE_ENV === "test") &&
          (permission === "member" || permission === "admin")
        ) {
          return router.push("/?reason=unauthorized");
        }
        return; // allow for other auth strategies or guest permission in CI
      }

      // Authenticated from here on - check permissions using userRole
      // In CI/test mode, use testUser if available, otherwise use session user
      const userToCheck =
        (process.env.CI || process.env.NODE_ENV === "test") && testUser
          ? testUser
          : (user.value as User);
      const userRole = userToCheck?.userRole ?? Role.SignedIn;
      console.log("🔍 [TEST] Middleware checking permissions:", {
        permission,
        userRole,
        userRoles: userToCheck?.roles?.map((r) => r.name),
        path: to.path,
        isTestUser:
          (process.env.CI || process.env.NODE_ENV === "test") &&
          testUser !== null,
      });
      // Role-based access control - same logic for test and real users
      switch (permission) {
        case "guest":
          if (userRole < Role.Guest) {
            console.log(
              "🔍 [TEST] Guest permission denied for role:",
              userRole,
            );
            return router.push("/?reason=unauthorized");
          }
          break;
        case "member":
          if (userRole < Role.Member) {
            console.log(
              "🔍 [TEST] Member permission denied for role:",
              userRole,
            );
            return router.push("/?reason=unauthorized");
          }
          break;
        case "admin":
          if (userRole < Role.Admin) {
            console.log(
              "🔍 [TEST] Admin permission denied for role:",
              userRole,
            );
            return router.push("/?reason=unauthorized");
          }
          break;
      }
    } catch (error) {
      console.error("Error checking view permissions:", error);
      // On error, fall back to requiring authentication
      // In CI/test mode, check if we have testUser - if so, treat as authenticated
      const isAuthenticated = loggedIn.value || testUser !== null;
      if (!isAuthenticated && authStrategy === "auth0") {
        return router.push("/login");
      }
    }
  }

  // Handle authentication for non-dataset routes
  // In CI/test mode, check if we have testUser - if so, treat as authenticated
  const isAuthenticated = loggedIn.value || testUser !== null;
  if (authStrategy === "auth0" && !isAuthenticated && to.path !== "/login") {
    return router.push("/login");
  }

  // Check role-based access for restricted routes
  // In CI/test mode, use testUser if available, otherwise use session user
  if (authStrategy === "auth0" && isAuthenticated) {
    const userToCheck =
      (process.env.CI || process.env.NODE_ENV === "test") && testUser
        ? testUser
        : (user.value as User);
    const userRole = userToCheck?.userRole ?? Role.SignedIn;

    // Redirect non-Admins from config route
    if (to.path === "/config" && userRole < Role.Admin) {
      return router.push("/?reason=unauthorized");
    }
  }
});
