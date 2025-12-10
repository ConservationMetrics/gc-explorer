import { defineNuxtRouteMiddleware, useRuntimeConfig } from "#imports";
import type { User, RouteLevelPermission } from "~/types/types";
import { Role } from "~/types/types";

// Following example: https://github.com/atinux/atidone/blob/main/app/middleware/auth.ts
export default defineNuxtRouteMiddleware(async (to) => {
  const session = useUserSession();
  const { loggedIn, user } = session;

  // Test mode: Directly set user role in middleware for permission testing
  // This bypasses authentication entirely - we just set the role state directly
  // The role persists via a query parameter that we keep in the URL
  if (process.env.CI || process.env.NODE_ENV === "test") {
    // Check for testRole in query - if present, set the user directly
    if (to.query.testRole) {
      const testRole = Number(to.query.testRole);
      const validRoles = [0, 1, 2, 3]; // SignedIn, Guest, Member, Admin
      if (validRoles.includes(testRole)) {
        const roleNames: Record<number, string> = {
          0: "SignedIn",
          1: "Guest",
          2: "Member",
          3: "Admin",
        };
        const testUser: User = {
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

        // Directly set the session state - bypassing cookies entirely
        // Use unknown as intermediate type to allow mutation in test mode
        const mutableSession = session as unknown as {
          user?: { value?: User };
          loggedIn?: { value: boolean };
        };
        if (mutableSession.user) {
          mutableSession.user.value = testUser;
        }
        if (mutableSession.loggedIn) {
          mutableSession.loggedIn.value = true;
        }

        console.log(
          `🔍 [TEST] ✅ Directly set test role in middleware: ${roleNames[testRole]} (${testRole})`,
        );
        console.log("🔍 [TEST] Test user set:", testUser);
        console.log("🔍 [TEST] Session state after setting:", {
          loggedIn: session.loggedIn.value,
          user: session.user.value,
        });

        // Keep the testRole in query for subsequent navigations
        // This allows the role to persist across page navigations
        return; // Continue with the route, keeping testRole in URL
      }
    }

    // If no testRole but we're in CI, check if we should clear any existing test user
    // (This handles the case where we want to test unauthenticated access)
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
      if (!loggedIn.value) {
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

      // Authenticated from here on
      const typedUser = user.value as User;
      const userRole = typedUser?.userRole ?? Role.SignedIn;
      console.log("🔍 [TEST] Middleware checking permissions:", {
        permission,
        userRole,
        path: to.path,
      });
      // Role-based access control
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
      if (!loggedIn.value && authStrategy === "auth0") {
        return router.push("/login");
      }
    }
  }

  // Handle authentication for non-dataset routes
  if (authStrategy === "auth0" && !loggedIn.value && to.path !== "/login") {
    return router.push("/login");
  }

  // Check role-based access for restricted routes
  if (authStrategy === "auth0" && loggedIn.value && user.value) {
    const typedUser = user.value as User;
    const userRole = typedUser.userRole ?? Role.SignedIn;

    // Redirect non-Admins from config routes
    if (to.path.startsWith("/config") && userRole < Role.Admin) {
      return router.push("/?reason=unauthorized");
    }
  }
});
