import { useCookie } from "#imports";

interface CustomAuthData {
  user: {
    auth0: string;
  };
  loggedInAt: number;
  expiresAt: number;
}

export const useCustomAuth = () => {
  const authCookie = useCookie<CustomAuthData | undefined>("gc_auth");

  const isAuthenticated = computed(() => {
    if (!authCookie.value) {
      return false;
    }

    // Check if the cookie has expired
    if (authCookie.value.expiresAt && Date.now() > authCookie.value.expiresAt) {
      // Clear expired cookie by setting maxAge to 0
      authCookie.value = undefined;
      return false;
    }

    return true;
  });

  const user = computed(() => {
    return authCookie.value?.user || null;
  });

  const clearAuth = () => {
    // Clear the cookie by setting it to undefined
    authCookie.value = undefined;
  };

  return {
    isAuthenticated,
    user,
    clearAuth,
    authData: authCookie,
  };
};
