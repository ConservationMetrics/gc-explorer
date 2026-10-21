import {
  defineNuxtRouteMiddleware,
  navigateTo,
  useRuntimeConfig,
} from "#imports";
import type {
  PublicViewRow,
  RouteLevelPermission,
  User,
  ViewConfigRow,
  ViewType,
} from "@/types";
import { Role } from "@/types";
import { consumeAuthRedirect, safeAuthRedirect } from "@/utils/authRedirect";
import { decodeDatasetNameFromUrl } from "@/utils/identifierUtils";

// Following example: https://github.com/atinux/atidone/blob/main/app/middleware/auth.ts
export default defineNuxtRouteMiddleware(async (to) => {
  const session = useUserSession();
  const { loggedIn, user } = session;
  const {
    public: { authStrategy },
  } = useRuntimeConfig();
  const router = useRouter();

  // Handle logout flow
  if (to.query.logout === "true") {
    return navigateTo("/api/auth/logout", { external: true });
  }

  // Local/dev bypass when authStrategy is set to "none"
  if (authStrategy === "none") {
    if (to.path === "/login") return router.push("/");
    return;
  }

  // Preserve post-login destination across silent Auth0 redirect and LoginScreen.
  // sessionStorage is client-only; the redirect query is stored as a cookie by
  // /api/auth/auth0 so a full page load (no sessionStorage) still returns here.
  if (import.meta.client && to.path.includes("/login")) {
    const back = window.history.state.back;
    const current = window.history.state.current;

    if (!current.includes("/login") && !back && safeAuthRedirect(current)) {
      sessionStorage.setItem("redirect_url", current);
    }
  }

  const redirectToSilentAuth = () => {
    if (import.meta.client && safeAuthRedirect(to.fullPath)) {
      sessionStorage.setItem("redirect_url", to.fullPath);
    }
    const redirect = encodeURIComponent(to.fullPath);
    return navigateTo(`/api/auth/auth0?silent=1&redirect=${redirect}`, {
      external: true,
    });
  };

  // Check if this is a dataset route that might have public access
  const isDatasetRoute =
    to.path.startsWith("/alerts/") ||
    to.path.startsWith("/gallery/") ||
    to.path.startsWith("/map/");

  if (isDatasetRoute) {
    try {
      const rawTableName =
        typeof to.params.tablename === "string"
          ? to.params.tablename
          : to.path.split("/").pop()!;
      const tableName = decodeDatasetNameFromUrl(rawTableName);
      const viewType = to.path.split("/")[1] as ViewType;
      const publicViews = await $fetch<PublicViewRow[]>("/api/views/public");
      // Public access: no login needed
      if (
        publicViews.some(
          (view) =>
            view.primaryDataset === tableName && view.viewType === viewType,
        )
      ) {
        return;
      }

      // Require authentication (silent SSO when possible; public views stay anonymous)
      if (!loggedIn.value) {
        if (authStrategy === "auth0") return redirectToSilentAuth();
        return;
      }

      const viewRows = await $fetch<ViewConfigRow[]>("/api/views", {
        query: { primary_dataset: tableName },
      });
      const viewEntry = viewRows.find((view) => view.viewType === viewType);
      const permission: RouteLevelPermission =
        viewEntry?.viewConfig?.ROUTE_LEVEL_PERMISSION ?? "member";

      // Authenticated from here on
      const typedUser = user.value as User;
      const userRole = typedUser?.userRole ?? Role.SignedIn;
      // Role-based access control
      switch (permission) {
        case "guest":
          if (userRole < Role.Guest) {
            return router.push("/?reason=unauthorized");
          }
          break;
        case "member":
          if (userRole < Role.Member) {
            return router.push("/?reason=unauthorized");
          }
          break;
        case "admin":
          if (userRole < Role.Admin) {
            return router.push("/?reason=unauthorized");
          }
          break;
      }
    } catch (error) {
      console.error("Error checking view permissions:", error);
      // On error, fall back to requiring authentication
      if (!loggedIn.value && authStrategy === "auth0") {
        return redirectToSilentAuth();
      }
    }
  }

  // Silent SSO for non-dataset routes; LoginScreen on login_required
  if (authStrategy === "auth0" && !loggedIn.value && to.path !== "/login") {
    return redirectToSilentAuth();
  }

  if (loggedIn.value && to.path === "/login") {
    if (import.meta.client) {
      const redirectUrl = safeAuthRedirect(
        sessionStorage.getItem("redirect_url"),
      );
      if (redirectUrl) {
        sessionStorage.removeItem("redirect_url");
        return navigateTo(redirectUrl);
      }
    }
    const event = useRequestEvent();
    if (event) {
      const target = consumeAuthRedirect(event);
      if (target) return navigateTo(target);
    }
    return router.push("/");
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
