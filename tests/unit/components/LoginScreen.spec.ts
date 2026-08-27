import { describe, it, expect, vi, beforeEach } from "vitest";
import { mount } from "@vue/test-utils";
import { createI18n } from "vue-i18n";
import { ref } from "vue";
import LoginScreen from "@/components/LoginScreen.vue";

const { useLoginBackgroundMock } = vi.hoisted(() => ({
  useLoginBackgroundMock: vi.fn(),
}));

vi.mock("@/composables/useLoginBackground", () => ({
  useLoginBackground: () => useLoginBackgroundMock(),
}));

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
  useI18n: () => ({
    locale: { value: "en" },
    locales: { value: ["en", "es", "pt", "nl"] },
    setLocale: vi.fn(),
    t: (key: string) => {
      const messages: Record<string, string> = {
        loginWelcomeTitle: "Welcome to Guardian Connector Explorer",
        loginPleaseSignIn: "Please sign in to continue.",
        loginButton: "Login",
      };
      return messages[key] ?? key;
    },
  }),
  navigateTo: vi.fn(),
  onMounted: vi.fn((callback) => {
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
      loginWelcomeTitle: "Welcome to Guardian Connector Explorer",
      loginPleaseSignIn: "Please sign in to continue.",
      yourAccessIsPending: "Access pending",
    },
    es: {
      loginButton: "Iniciar sesión",
      authMessage: "Por favor inicie sesión",
      loginWelcomeTitle: "Bienvenido a Guardian Connector Explorer",
      loginPleaseSignIn: "Por favor, inicia sesión para continuar.",
      yourAccessIsPending: "Acceso pendiente",
    },
    pt: {
      loginButton: "Entrar",
      authMessage: "Por favor faça login",
      loginWelcomeTitle: "Bem-vindo ao Guardian Connector Explorer",
      loginPleaseSignIn: "Por favor, entre para continuar.",
      yourAccessIsPending: "Acesso pendente",
    },
    nl: {
      loginButton: "Inloggen",
      authMessage: "Log alstublieft in",
      loginWelcomeTitle: "Welkom bij Guardian Connector Explorer",
      loginPleaseSignIn: "Gelieve in te loggen om door te gaan.",
      yourAccessIsPending: "Toegang in behandeling",
    },
  },
});

// Helper function to mount the LoginScreen component
const mountLoginScreen = (
  props: { errorMessage: string } = { errorMessage: "" },
) => {
  return mount(LoginScreen, {
    global: {
      plugins: [i18n],
      mocks: {
        $t: (key: string) => {
          const messages = {
            loginButton: "Sign up or log in",
            authMessage: "Please sign up or log in to access this application",
            loginWelcomeTitle: "Welcome to Guardian Connector Explorer",
            loginPleaseSignIn: "Please sign in to continue.",
            yourAccessIsPending:
              "Your access is pending. Please contact a Guardian Connector administrator for account approval.",
          };
          return messages[key as keyof typeof messages] || key;
        },
      },
      stubs: {
        GlobeLanguagePicker: {
          template: "<div></div>",
        },
      },
    },
    props,
  });
};

const backgroundImg = (wrapper: ReturnType<typeof mountLoginScreen>) =>
  wrapper.find("img.object-cover");

describe("LoginScreen", () => {
  beforeEach(() => {
    useLoginBackgroundMock.mockReturnValue({
      backgroundImage: ref("/background.jpg"),
    });
  });

  it("renders login button", () => {
    const wrapper = mountLoginScreen();
    expect(wrapper.find("[data-testid='login-button']").exists()).toBe(true);
  });

  it("uses /background.jpg when gc_settings.background_image is unset", () => {
    const wrapper = mountLoginScreen();
    expect(backgroundImg(wrapper).attributes("src")).toBe("/background.jpg");
  });

  it("uses gc_settings.background_image when set", () => {
    useLoginBackgroundMock.mockReturnValue({
      backgroundImage: ref("https://cdn.example/bg.jpg"),
    });
    const wrapper = mountLoginScreen();
    expect(backgroundImg(wrapper).attributes("src")).toBe(
      "https://cdn.example/bg.jpg",
    );
  });

  it("displays error message when provided", () => {
    const msg =
      "Your access is pending. Please contact a Guardian Connector administrator for account approval.";
    const wrapper = mountLoginScreen({ errorMessage: msg });
    expect(wrapper.find(".text-red-600").text()).toBe(msg);
  });

  it("changes window.location.href to /api/auth/auth0 on button click", async () => {
    const wrapper = mountLoginScreen();

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

  it("displays the provided error message text", () => {
    const wrapper = mountLoginScreen({ errorMessage: "Access pending" });
    expect(wrapper.find(".text-red-600").text()).toBe("Access pending");
  });

  it("renders LanguagePicker component", () => {
    const wrapper = mountLoginScreen();
    expect(wrapper.findComponent({ name: "GlobeLanguagePicker" })).toBeTruthy();
  });
});
