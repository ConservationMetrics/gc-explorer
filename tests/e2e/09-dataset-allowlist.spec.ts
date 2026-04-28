/**
 * E2E tests for dataset allowlist boundary (issue #347).
 *
 * Current behavior: unregistered table returns 404 and no dataset payload.
 *
 * (b) Role-based: member-only tables return 403 or redirect when unauthenticated.
 */

import { test as baseTest, expect } from "@playwright/test";

const test = baseTest;

// Table name that is NOT in the CI hardcoded config (seed_survey_data, bcmform_responses, fake_alerts).
const UNREGISTERED_TABLE = "timelapse_data_template";

/**
 * Unregistered table must not return dataset payload. Current implementation returns
 * 404 and no data should be leaked in the response body.
 */
test.describe("Dataset allowlist - unregistered table not accessible", () => {
  test("GET /api/{unregistered_table}/map returns 404 and no dataset payload", async ({
    page,
    baseURL,
  }) => {
    const url = `${baseURL ?? "http://localhost:8080"}/api/${UNREGISTERED_TABLE}/map`;
    const response = await page.request.get(url, { failOnStatusCode: false });

    expect(response.status()).toBe(404);
    const body = await response.text();
    const mustNotContain = ['"features":', '"type":"FeatureCollection"'];
    for (const fragment of mustNotContain) {
      expect(body).not.toContain(fragment);
    }
  });

  test("GET /api/{unregistered_table}/data returns 404 and no dataset payload", async ({
    page,
    baseURL,
  }) => {
    const url = `${baseURL ?? "http://localhost:8080"}/api/${UNREGISTERED_TABLE}/data`;
    const response = await page.request.get(url, { failOnStatusCode: false });

    expect(response.status()).toBe(404);
    const body = await response.text();
    expect(body).not.toMatch(/"data":\s*\[/);
  });

  test("GET /api/{unregistered_table}/alerts returns 404 and no dataset payload", async ({
    page,
    baseURL,
  }) => {
    const url = `${baseURL ?? "http://localhost:8080"}/api/${UNREGISTERED_TABLE}/alerts`;
    const response = await page.request.get(url, { failOnStatusCode: false });

    expect(response.status()).toBe(404);
    const body = await response.text();
    expect(body).not.toContain('"alertsData":');
  });

  test("GET /api/{unregistered_table}/gallery returns 404 and no dataset payload", async ({
    page,
    baseURL,
  }) => {
    const url = `${baseURL ?? "http://localhost:8080"}/api/${UNREGISTERED_TABLE}/gallery`;
    const response = await page.request.get(url, { failOnStatusCode: false });

    expect(response.status()).toBe(404);
    const body = await response.text();
    expect(body).not.toMatch(/"data":\s*\[/);
  });
});
