import type { H3Event } from "h3";
import { useRuntimeConfig } from "#imports";

interface Auth0User {
  email: string;
}

export default oauthAuth0EventHandler({
  config: {
    emailRequired: true,
    redirectURL: `${useRuntimeConfig().public.baseUrl}/login`,
  },

  async onSuccess(event: H3Event, { user }: { user: Auth0User }) {
    try {
      await setUserSession(event, {
        user: {
          auth0: user.email,
        },
        loggedInAt: Date.now(),
      });
    } catch (error) {
      console.error("🔍 Auth0 Error: Error setting user session", error);
    }
    // Redirect directly to the target page instead of login
    return sendRedirect(event, "/login");
  },
  onError(event: H3Event) {
    console.error("OAuth error:", event);
    return sendRedirect(event, "/login");
  },
});
