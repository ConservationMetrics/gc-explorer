import { vi } from "vitest";

// Mock the composables used in Auth0Login component
export const useUserSession = vi.fn(() => ({
  loggedIn: { value: false },
  session: { value: {} },
  user: { value: null },
  fetch: vi.fn(),
}));

export const useCustomAuth = vi.fn(() => ({
  isAuthenticated: { value: false },
  user: { value: null },
  clearAuth: vi.fn(),
  authData: { value: null },
}));

export const navigateTo = vi.fn();

// Export other common composables that might be needed
export const useRuntimeConfig = vi.fn(() => ({
  public: {
    authStrategy: "auth0",
    baseUrl: "http://localhost:8080",
  },
}));

export const useCookie = vi.fn(() => ({
  value: null,
}));
