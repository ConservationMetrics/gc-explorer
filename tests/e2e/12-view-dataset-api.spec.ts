import { test, expect } from "@/tests/e2e/fixtures/auth-storage";

test("GET /api/seed_survey_data/gallery returns the seeded gallery dataset contract", async ({
  authenticatedPageAsAdmin: page,
}) => {
  const response = await page.request.get("/api/seed_survey_data/gallery");
  expect(response.status()).toBe(200);

  const body = await response.json();
  expect(body.primary_dataset).toBe("seed_survey_data");
  expect(body.table).toBe(body.primary_dataset);
  expect(body.filterColumn).toBe("community");
  expect(body.routeLevelPermission).toBe("anyone");
  expect(typeof body.rowLimitReached).toBe("boolean");
  expect(body.allowedFileExtensions).toEqual(
    expect.objectContaining({
      image: expect.any(Array),
      audio: expect.any(Array),
      video: expect.any(Array),
    }),
  );

  expect(Array.isArray(body.data)).toBe(true);
  expect(body.data.length).toBeGreaterThan(0);
  for (const item of body.data) {
    expect(item).toEqual(
      expect.objectContaining({
        _id: expect.any(String),
      }),
    );
  }
  expect(
    body.data.some(
      (item: Record<string, unknown>) =>
        typeof item.photo === "string" || typeof item.audio === "string",
    ),
  ).toBe(true);
});

test("GET /api/bcmform_responses/map returns the seeded map dataset contract", async ({
  authenticatedPageAsAdmin: page,
}) => {
  const response = await page.request.get("/api/bcmform_responses/map");
  expect(response.status()).toBe(200);

  const body = await response.json();
  expect(body.primary_dataset).toBe("bcmform_responses");
  expect(body.table).toBe(body.primary_dataset);
  expect(body.filterColumn).toBe("community");
  expect(typeof body.rowLimitReached).toBe("boolean");
  expect(body.mapboxLatitude).toEqual(expect.any(Number));
  expect(body.mapboxLongitude).toEqual(expect.any(Number));
  expect(body.mapboxZoom).toEqual(expect.any(Number));
  expect(body.mapStatistics).toEqual(
    expect.objectContaining({
      totalFeatures: expect.any(Number),
    }),
  );

  expect(body.data).toEqual(
    expect.objectContaining({
      type: "FeatureCollection",
      features: expect.any(Array),
    }),
  );
  expect(body.data.features.length).toBeGreaterThan(0);
  expect(body.data.features[0]).toEqual(
    expect.objectContaining({
      type: "Feature",
      geometry: expect.any(Object),
      properties: expect.any(Object),
    }),
  );
});
