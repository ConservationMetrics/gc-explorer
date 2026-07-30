import type { User } from "@/types";
import { Role } from "@/types";

/**
 * When NUXT_PUBLIC_AUTH_STRATEGY=none, ensure every request has a local
 * Admin session so route/API RBAC works without Auth0.
 */
export default defineEventHandler(async (event) => {
  const {
    public: { authStrategy },
  } = useRuntimeConfig();
  if (authStrategy !== "none") return;

  const session = await getUserSession(event);
  const typedUser = session.user as User | undefined;
  if (typedUser?.userRole === Role.Admin) return;

  await setUserSession(event, {
    user: {
      auth0: "local-dev@localhost",
      roles: [
        {
          id: "local-admin",
          name: "Admin",
          description: "Local development admin (authStrategy=none)",
        },
      ],
      userRole: Role.Admin,
    },
    loggedInAt: Date.now(),
  });
});
