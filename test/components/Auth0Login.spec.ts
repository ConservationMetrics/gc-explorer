import { describe, it, expect, vi } from "vitest";
import { mount } from "@vue/test-utils";
import { createI18n } from "vue-i18n";
import Auth0Login from "../../components/Auth0Login.vue";

// Mock the composables at the top level
vi.mock("#imports", () => ({
  useUserSession: () => ({
    loggedIn: { value: false },
    session: { value: {} },
    user: { value: null },
    fetch: vi.fn(),
  }),
  useCustomAuth: () => ({
    isAuthenticated: { value: false },
    user: { value: null },
    clearAuth: vi.fn(),
    authData: { value: null },
  }),
  navigateTo: vi.fn(),
  onMounted: vi.fn((callback) => {
    // Execute the callback immediately for testing
    callback();
  }),
}));

// Create the i18n instance
const i18n = createI18n({
  legacy: false, // Use Composition API mode
  locale: "en",
  messages: {
    en: {
      loginButton: "Login",
      authMessage: "Please log in",
      yourAccessIsPending: "Access pending",
    },
    es: {
      loginButton: "Iniciar sesión",
      authMessage: "Por favor inicie sesión",
      yourAccessIsPending: "Acceso pendiente",
    },
    pt: {
      loginButton: "Entrar",
      authMessage: "Por favor faça login",
      yourAccessIsPending: "Acesso pendente",
    },
    nl: {
      loginButton: "Inloggen",
      authMessage: "Log alstublieft in",
      yourAccessIsPending: "Toegang in behandeling",
    },
  },
});

// Helper function to mount the Auth0Login component
const mountAuth0Login = (
  props: { errorMessage: string } = { errorMessage: "" },
) => {
  return mount(Auth0Login, {
    global: {
      plugins: [i18n],
      mocks: {
        $t: (key: string) => {
          const messages = {
            loginButton: "Sign up or log in",
            authMessage: "Please sign up or log in to access this application",
            yourAccessIsPending:
              "Your access is pending. Please contact a Guardian Connector administrator for account approval.",
          };
          return messages[key as keyof typeof messages] || key;
        },
      },
      components: {
        LanguagePicker: {
          template: "<div></div>",
        },
      },
    },
    props,
  });
};

describe("Auth0Login", () => {
  it("renders login button", () => {
    const wrapper = mountAuth0Login();
    expect(wrapper.find("[data-testid='login-button']").exists()).toBe(true);
  });

  it("displays error message when provided", () => {
    const wrapper = mountAuth0Login({
      errorMessage:
        "Your access is pending. Please contact a Guardian Connector administrator for account approval.",
    });
    expect(wrapper.find(".text-red-500").text()).toBe(
      "Your access is pending. Please contact a Guardian Connector administrator for account approval.",
    );
  });

  it("changes window.location.href to /api/auth/auth0 on button click", async () => {
    const wrapper = mountAuth0Login();

    const originalLocation = window.location;
    let hrefValue = "";

    Object.defineProperty(window, "location", {
      configurable: true,
      writable: true,
      value: {
        get href() {
          return hrefValue;
        },
        set href(value: string) {
          hrefValue = value;
        },
      } as Location,
    });

    await wrapper.find("[data-testid='login-button']").trigger("click");

    expect(hrefValue).toBe("/api/auth/auth0");

    Object.defineProperty(window, "location", {
      configurable: true,
      writable: true,
      value: originalLocation,
    });
  });

  it("displays error message with correct translation", () => {
    const wrapper = mountAuth0Login({ errorMessage: "Access pending" });
    expect(wrapper.find(".text-red-500").text()).toBe(
      "Your access is pending. Please contact a Guardian Connector administrator for account approval.",
    );
  });

  it("renders LanguagePicker component", () => {
    const wrapper = mountAuth0Login();
    expect(wrapper.findComponent({ name: "LanguagePicker" })).toBeTruthy();
  });
});
