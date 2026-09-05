import type { APIRequestContext } from "@playwright/test";

import { test, expect } from "@/tests/e2e/fixtures/auth-storage";
import {
  createApiTestView,
  deleteApiTestView,
} from "@/tests/e2e/helpers/apiTestData";
import type {
  ApiTestView,
  PublicViewRow,
  ViewConfigRow,
  WarehouseTablesResponse,
} from "@/types";

const MISSING_VIEW_ID = 2147483647;

const forbiddenCreateBody = {
  primaryDataset: "api_test_forbidden",
  viewConfig: {},
  viewType: "gallery",
};

/**
 * Returns views for one primary dataset.
 *
 * @param {APIRequestContext} request - Authenticated Playwright request.
 * @param {string} primaryDataset - Dataset whose views are listed.
 * @returns {Promise<ViewConfigRow[]>} View rows for that dataset.
 */
const listViewsForDataset = async (
  request: APIRequestContext,
  primaryDataset: string,
): Promise<ViewConfigRow[]> => {
  const response = await request.get(
    `/api/views?primary_dataset=${encodeURIComponent(primaryDataset)}`,
  );
  expect(response.status()).toBe(200);
  return (await response.json()) as ViewConfigRow[];
};

/**
 * Creates a member gallery fixture and a member map sibling through the REST API.
 *
 * @param {APIRequestContext} request - Authenticated Playwright request.
 * @returns {Promise<{ fixture: ApiTestView; gallery: ViewConfigRow; map: ViewConfigRow }>}
 *   Fixture plus both view rows.
 */
const createMemberGalleryAndMap = async (
  request: APIRequestContext,
): Promise<{
  fixture: ApiTestView;
  gallery: ViewConfigRow;
  map: ViewConfigRow;
}> => {
  const fixture = await createApiTestView({
    sourceTable: "seed_survey_data",
    viewConfig: { ROUTE_LEVEL_PERMISSION: "member" },
    viewType: "gallery",
  });
  const mapResponse = await request.post("/api/views", {
    data: {
      primaryDataset: fixture.primaryDataset,
      viewConfig: { ROUTE_LEVEL_PERMISSION: "member" },
      viewType: "map",
    },
  });
  expect(mapResponse.status()).toBe(201);
  const map = (await mapResponse.json()) as ViewConfigRow;
  const collection = await listViewsForDataset(request, fixture.primaryDataset);
  const gallery = collection.find((view) => view.viewType === "gallery");
  expect(gallery).toBeDefined();
  return { fixture, gallery: gallery as ViewConfigRow, map };
};

/**
 * Deletes REST view rows, then the warehouse fixture.
 *
 * @param {APIRequestContext} request - Authenticated Playwright request.
 * @param {{ fixture: ApiTestView; gallery: ViewConfigRow; map: ViewConfigRow }} views - Views to remove.
 * @returns {Promise<void>}
 */
const deleteMemberGalleryAndMap = async (
  request: APIRequestContext,
  views: {
    fixture: ApiTestView;
    gallery: ViewConfigRow;
    map: ViewConfigRow;
  },
): Promise<void> => {
  await request.delete(`/api/views/${views.map.viewId}`);
  await request.delete(`/api/views/${views.gallery.viewId}`);
  await deleteApiTestView(views.fixture);
};

test("creating a map does not replace the sibling gallery", async ({
  authenticatedRequestAsAdmin: request,
}) => {
  const views = await createMemberGalleryAndMap(request);

  try {
    const collection = await listViewsForDataset(
      request,
      views.fixture.primaryDataset,
    );
    expect(collection.map((view) => view.viewType).sort()).toEqual([
      "gallery",
      "map",
    ]);
  } finally {
    await deleteMemberGalleryAndMap(request, views);
  }
});

test("a view can be read by id", async ({
  authenticatedRequestAsAdmin: request,
}) => {
  const views = await createMemberGalleryAndMap(request);

  try {
    const response = await request.get(`/api/views/${views.gallery.viewId}`);
    expect(response.status()).toBe(200);
    expect(await response.json()).toEqual(views.gallery);
  } finally {
    await deleteMemberGalleryAndMap(request, views);
  }
});

test("creating a second gallery for the same dataset is rejected", async ({
  authenticatedRequestAsAdmin: request,
}) => {
  const views = await createMemberGalleryAndMap(request);

  try {
    const response = await request.post("/api/views", {
      data: {
        primaryDataset: views.fixture.primaryDataset,
        viewConfig: {},
        viewType: "gallery",
      },
    });
    expect(response.status()).toBe(409);
  } finally {
    await deleteMemberGalleryAndMap(request, views);
  }
});

test("anyone gallery is public while sibling member map is not", async ({
  authenticatedRequestAsAdmin: request,
}) => {
  const views = await createMemberGalleryAndMap(request);

  try {
    const patchResponse = await request.patch(
      `/api/views/${views.gallery.viewId}`,
      {
        data: {
          viewConfig: {
            DATASET_TABLE: "Test View",
            ROUTE_LEVEL_PERMISSION: "anyone",
          },
        },
      },
    );
    expect(patchResponse.status()).toBe(200);
    expect(await patchResponse.json()).toEqual(
      expect.objectContaining({
        viewId: views.gallery.viewId,
        viewName: "Test View",
      }),
    );

    const publicResponse = await request.get("/api/views/public");
    expect(publicResponse.status()).toBe(200);
    const publicViews = (await publicResponse.json()) as PublicViewRow[];
    expect(publicViews).toContainEqual({
      primaryDataset: views.fixture.primaryDataset,
      viewId: views.gallery.viewId,
      viewType: "gallery",
    });
    expect(publicViews).not.toContainEqual(
      expect.objectContaining({ viewId: views.map.viewId }),
    );
  } finally {
    await deleteMemberGalleryAndMap(request, views);
  }
});

test("deleting a gallery leaves the sibling map", async ({
  authenticatedRequestAsAdmin: request,
}) => {
  const views = await createMemberGalleryAndMap(request);

  try {
    expect(
      (await request.delete(`/api/views/${views.gallery.viewId}`)).status(),
    ).toBe(204);

    const remainingMapResponse = await request.get(
      `/api/views/${views.map.viewId}`,
    );
    expect(remainingMapResponse.status()).toBe(200);
    expect(await remainingMapResponse.json()).toEqual(
      expect.objectContaining({
        primaryDataset: views.fixture.primaryDataset,
        viewId: views.map.viewId,
        viewType: "map",
      }),
    );
  } finally {
    await request.delete(`/api/views/${views.map.viewId}`);
    await deleteApiTestView(views.fixture);
  }
});

test("deleting a view removes it", async ({
  authenticatedRequestAsAdmin: request,
}) => {
  const views = await createMemberGalleryAndMap(request);

  try {
    expect(
      (await request.delete(`/api/views/${views.map.viewId}`)).status(),
    ).toBe(204);
    expect((await request.get(`/api/views/${views.map.viewId}`)).status()).toBe(
      404,
    );
  } finally {
    await request.delete(`/api/views/${views.gallery.viewId}`);
    await deleteApiTestView(views.fixture);
  }
});

test("unauthenticated user cannot create a view", async ({ request }) => {
  expect(
    (await request.post("/api/views", { data: forbiddenCreateBody })).status(),
  ).toBe(401);
});

test("member cannot create a view", async ({
  authenticatedRequestAsMember: memberRequest,
}) => {
  expect(
    (
      await memberRequest.post("/api/views", { data: forbiddenCreateBody })
    ).status(),
  ).toBe(403);
});

test("admin create with an empty body is rejected", async ({
  authenticatedRequestAsAdmin: adminRequest,
}) => {
  expect((await adminRequest.post("/api/views", { data: {} })).status()).toBe(
    400,
  );
});

test("invalid view id is rejected", async ({
  authenticatedRequestAsAdmin: adminRequest,
}) => {
  expect((await adminRequest.get("/api/views/0")).status()).toBe(400);
});

test("missing view cannot be read", async ({
  authenticatedRequestAsAdmin: adminRequest,
}) => {
  expect(
    (await adminRequest.get(`/api/views/${MISSING_VIEW_ID}`)).status(),
  ).toBe(404);
});

test("missing view cannot be updated", async ({
  authenticatedRequestAsAdmin: adminRequest,
}) => {
  expect(
    (
      await adminRequest.patch(`/api/views/${MISSING_VIEW_ID}`, {
        data: { viewConfig: {} },
      })
    ).status(),
  ).toBe(404);
});

test("missing view cannot be deleted", async ({
  authenticatedRequestAsAdmin: adminRequest,
}) => {
  expect(
    (await adminRequest.delete(`/api/views/${MISSING_VIEW_ID}`)).status(),
  ).toBe(404);
});

test("warehouse tables API lists seeded survey and geospatial tables", async ({
  authenticatedRequestAsAdmin: request,
}) => {
  const response = await request.get("/api/warehouse/tables");
  expect(response.status()).toBe(200);

  const body = (await response.json()) as WarehouseTablesResponse;
  expect(body.tables).toContain("seed_survey_data");
  expect(body.geospatialTables).toContain("bcmform_responses");
});
