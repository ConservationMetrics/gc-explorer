/**
 * E2E tests for dataset allowlist boundary (issue #347).
 *
 * Current behavior: unregistered table triggers fetchData then throws (viewsConfig[table]
 * undefined), so API returns 500 and no dataset payload. We test for 500 and no data.
 * Desired behavior (after allowlist fix): 403 or 404 and no payload. When that fix is
 * in place, update these tests to expect 403/404 instead of 500.
 *
 * (b) Role-based: member-only tables return 403 or redirect when unauthenticated.
 */

import { test as baseTest, expect } from "@playwright/test";

const test = baseTest;

// Table name that is NOT in the CI hardcoded config (seed_survey_data, bcmform_responses, fake_alerts).
const UNREGISTERED_TABLE = "timelapse_data_template";

/**
 * Unregistered table must not return dataset payload. Current implementation returns
 * 500 (fetchData runs, then viewsConfig[table] is undefined and throws). Equivalent
 * to "request fails" — no data leaked. TODO: when allowlist check is added, expect
 * 403 or 404 instead of 500. See https://github.com/ConservationMetrics/gc-explorer/issues/347#issuecomment-4006974561
 */
test.describe("Dataset allowlist - unregistered table not accessible", () => {
  test("GET /api/{unregistered_table}/map returns 500 and no dataset payload", async ({
    page,
    baseURL,
  }) => {
    const url = `${baseURL ?? "http://localhost:8080"}/api/${UNREGISTERED_TABLE}/map`;
    const response = await page.request.get(url, { failOnStatusCode: false });

    expect(response.status()).toBe(500);
    const body = await response.text();
    const mustNotContain = ['"features":', '"type":"FeatureCollection"'];
    for (const fragment of mustNotContain) {
      expect(body).not.toContain(fragment);
    }
  });

  test("GET /api/{unregistered_table}/data returns 500 and no dataset payload", async ({
    page,
    baseURL,
  }) => {
    const url = `${baseURL ?? "http://localhost:8080"}/api/${UNREGISTERED_TABLE}/data`;
    const response = await page.request.get(url, { failOnStatusCode: false });

    expect(response.status()).toBe(500);
    const body = await response.text();
    expect(body).not.toMatch(/"data":\s*\[/);
  });

  test("GET /api/{unregistered_table}/alerts returns 500 and no dataset payload", async ({
    page,
    baseURL,
  }) => {
    const url = `${baseURL ?? "http://localhost:8080"}/api/${UNREGISTERED_TABLE}/alerts`;
    const response = await page.request.get(url, { failOnStatusCode: false });

    expect(response.status()).toBe(500);
    const body = await response.text();
    expect(body).not.toContain('"alertsData":');
  });

  test("GET /api/{unregistered_table}/gallery returns 500 and no dataset payload", async ({
    page,
    baseURL,
  }) => {
    const url = `${baseURL ?? "http://localhost:8080"}/api/${UNREGISTERED_TABLE}/gallery`;
    const response = await page.request.get(url, { failOnStatusCode: false });

    expect(response.status()).toBe(500);
    const body = await response.text();
    expect(body).not.toMatch(/"data":\s*\[/);
  });
});

test.describe("Dataset allowlist - role-based restriction enforced at API", () => {
  // CI config has bcmform_responses with ROUTE_LEVEL_PERMISSION: "member".
  // Unauthenticated request must get 403 (or redirect if API is behind auth middleware).
  test("GET /api/bcmform_responses/map without auth returns 403 or redirect", async ({
    page,
    baseURL,
  }) => {
    const url = `${baseURL ?? "http://localhost:8080"}/api/bcmform_responses/map`;
    const response = await page.request.get(url, {
      maxRedirects: 0,
      failOnStatusCode: false,
    });

    // Either 403 Forbidden or we're redirected (e.g. to login)
    const ok = response.status() === 403 || response.status() === 302;
    expect(
      ok,
      `Member-only table must return 403 or redirect, got ${response.status()}`,
    ).toBe(true);
  });
});
