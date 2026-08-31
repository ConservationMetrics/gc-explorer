import { test, expect } from "@/tests/e2e/fixtures/auth-storage";

test("GET /api/fake_alerts/alerts returns the seeded alerts dataset contract", async ({
  authenticatedRequestAsAdmin: request,
}) => {
  const response = await request.get("/api/fake_alerts/alerts");
  expect(response.status()).toBe(200);

  const body = await response.json();
  expect(body.primary_dataset).toBe("fake_alerts");
  expect(body.table).toBe(body.primary_dataset);
  expect(body.secondary_dataset).toBe("mapeo_data");
  expect(body.routeLevelPermission).toBe("anyone");
  expect(typeof body.rowLimitReached).toBe("boolean");

  expect(body.alertsData).toEqual(
    expect.objectContaining({
      mostRecentAlerts: expect.objectContaining({
        type: "FeatureCollection",
        features: expect.any(Array),
      }),
      previousAlerts: expect.objectContaining({
        type: "FeatureCollection",
        features: expect.any(Array),
      }),
    }),
  );
  expect(
    body.alertsData.mostRecentAlerts.features.length +
      body.alertsData.previousAlerts.features.length,
  ).toBeGreaterThan(0);

  expect(body.secondaryData).toEqual(
    expect.objectContaining({
      type: "FeatureCollection",
      features: expect.any(Array),
    }),
  );
  expect(body.secondaryData.features.length).toBe(2);
  for (const feature of body.secondaryData.features) {
    expect(feature.properties.p__categoryid).toBe("threat");
  }
});

test("GET /api/seed_survey_data/:recordId returns the seeded warehouse row", async ({
  authenticatedRequestAsAdmin: request,
}) => {
  const response = await request.get(
    "/api/seed_survey_data/254137498?view_type=gallery",
  );
  expect(response.status()).toBe(200);

  const body = await response.json();
  expect(body._id).toBe("254137498");
  expect(typeof body.photo).toBe("string");
  expect(typeof body.community).toBe("string");
});

test("POST /api/seed_survey_data/records returns matching seeded rows", async ({
  authenticatedRequestAsAdmin: request,
}) => {
  const response = await request.post(
    "/api/seed_survey_data/records?view_type=gallery",
    {
      data: { ids: ["254137498", "missing-id"] },
    },
  );
  expect(response.status()).toBe(200);

  const body = await response.json();
  expect(Array.isArray(body)).toBe(true);
  expect(body).toHaveLength(1);
  expect(body[0]._id).toBe("254137498");
});
