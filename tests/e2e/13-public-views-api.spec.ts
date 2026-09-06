import type { APIRequestContext } from "@playwright/test";

import { test, expect } from "@/tests/e2e/fixtures/auth-storage";
import {
  createApiTestView,
  deleteApiTestView,
} from "@/tests/e2e/helpers/apiTestData";
import type { ApiTestView, PublicViewRow, ViewConfigRow } from "@/types";

/**
 * Returns the public view list for the current admin session.
 *
 * @param {APIRequestContext} request - Authenticated Playwright request.
 * @returns {Promise<PublicViewRow[]>} Public view rows.
 */
const listPublicViews = async (
  request: APIRequestContext,
): Promise<PublicViewRow[]> => {
  const response = await request.get("/api/views/public");
  expect(response.status()).toBe(200);
  return (await response.json()) as PublicViewRow[];
};

/**
 * Creates a member gallery and an anyone map on the same dataset.
 *
 * @param {APIRequestContext} request - Authenticated Playwright request.
 * @returns {Promise<{ fixture: ApiTestView; galleryViewId: number; mapViewId: number }>}
 *   Fixture and view ids for teardown.
 */
const createMemberGalleryWithAnyoneMap = async (
  request: APIRequestContext,
): Promise<{
  fixture: ApiTestView;
  galleryViewId: number;
  mapViewId: number;
}> => {
  const fixture = await createApiTestView({
    sourceTable: "seed_survey_data",
    viewConfig: { ROUTE_LEVEL_PERMISSION: "member" },
    viewType: "gallery",
  });
  const galleryRowsResponse = await request.get(
    `/api/views?primary_dataset=${encodeURIComponent(fixture.primaryDataset)}`,
  );
  const galleryRows = (await galleryRowsResponse.json()) as ViewConfigRow[];
  const galleryViewId = galleryRows.find(
    (view) => view.viewType === "gallery",
  )?.viewId;
  expect(galleryViewId).toEqual(expect.any(Number));

  const createMapResponse = await request.post("/api/views", {
    data: {
      primaryDataset: fixture.primaryDataset,
      viewConfig: { ROUTE_LEVEL_PERMISSION: "anyone" },
      viewType: "map",
    },
  });
  expect(createMapResponse.status()).toBe(201);
  const mapViewId = ((await createMapResponse.json()) as ViewConfigRow).viewId;

  return {
    fixture,
    galleryViewId: galleryViewId as number,
    mapViewId,
  };
};

/**
 * Deletes the map sibling, then the gallery warehouse fixture.
 *
 * @param {APIRequestContext} request - Authenticated Playwright request.
 * @param {{ fixture: ApiTestView; mapViewId: number }} views - Views to remove.
 * @returns {Promise<void>}
 */
const deleteGalleryAndMap = async (
  request: APIRequestContext,
  views: { fixture: ApiTestView; mapViewId: number },
): Promise<void> => {
  await request.delete(`/api/views/${views.mapViewId}`);
  await deleteApiTestView(views.fixture);
};

test("anyone map is public when sibling gallery is member", async ({
  authenticatedRequestAsAdmin: request,
}) => {
  const views = await createMemberGalleryWithAnyoneMap(request);

  try {
    const publicViews = await listPublicViews(request);
    expect(publicViews).toContainEqual(
      expect.objectContaining({
        primaryDataset: views.fixture.primaryDataset,
        viewType: "map",
      }),
    );
    expect(publicViews).not.toContainEqual(
      expect.objectContaining({
        primaryDataset: views.fixture.primaryDataset,
        viewType: "gallery",
      }),
    );
  } finally {
    await deleteGalleryAndMap(request, views);
  }
});

test("anyone gallery is public without hiding sibling anyone map", async ({
  authenticatedRequestAsAdmin: request,
}) => {
  const views = await createMemberGalleryWithAnyoneMap(request);

  try {
    const updateGalleryResponse = await request.patch(
      `/api/views/${views.galleryViewId}`,
      {
        data: {
          viewConfig: { ROUTE_LEVEL_PERMISSION: "anyone" },
        },
      },
    );
    expect(updateGalleryResponse.status()).toBe(200);

    const publicViews = (await listPublicViews(request)).filter(
      (view) => view.primaryDataset === views.fixture.primaryDataset,
    );
    expect(publicViews).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ viewType: "gallery" }),
        expect.objectContaining({ viewType: "map" }),
      ]),
    );
  } finally {
    await deleteGalleryAndMap(request, views);
  }
});

test("member map is not public when sibling gallery stays anyone", async ({
  authenticatedRequestAsAdmin: request,
}) => {
  const views = await createMemberGalleryWithAnyoneMap(request);

  try {
    const updateGalleryResponse = await request.patch(
      `/api/views/${views.galleryViewId}`,
      {
        data: {
          viewConfig: { ROUTE_LEVEL_PERMISSION: "anyone" },
        },
      },
    );
    expect(updateGalleryResponse.status()).toBe(200);

    const updateMapResponse = await request.patch(
      `/api/views/${views.mapViewId}`,
      {
        data: {
          viewConfig: { ROUTE_LEVEL_PERMISSION: "member" },
        },
      },
    );
    expect(updateMapResponse.status()).toBe(200);

    const publicViews = await listPublicViews(request);
    expect(publicViews).toContainEqual(
      expect.objectContaining({
        primaryDataset: views.fixture.primaryDataset,
        viewType: "gallery",
      }),
    );
    expect(publicViews).not.toContainEqual(
      expect.objectContaining({
        primaryDataset: views.fixture.primaryDataset,
        viewType: "map",
      }),
    );
  } finally {
    await deleteGalleryAndMap(request, views);
  }
});
