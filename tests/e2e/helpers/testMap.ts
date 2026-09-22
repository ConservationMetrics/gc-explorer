import type { Page } from "@playwright/test";

export const waitForTestMap = async (page: Page): Promise<void> => {
  await page.waitForFunction(() => {
    return typeof window.getTestMap === "function" && Boolean(window._testMap);
  });
};
