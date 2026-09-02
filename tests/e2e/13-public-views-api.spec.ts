import type { APIRequestContext } from "@playwright/test";

import { test, expect } from "@/tests/e2e/fixtures/auth-storage";
import {
  createApiTestView,
  deleteApiTestView,
} from "@/tests/e2e/helpers/apiTestData";
import type { ApiTestView, PublicViewRow } from "@/types";

/**
 * Returns the public view list for the current admin session.
 *
 * @param {APIRequestContext} request - Authenticated Playwright request.
 * @returns {Promise<PublicViewRow[]>} Public view rows.
 */
const listPublicViews = async (
  request: APIRequestContext,
): Promise<PublicViewRow[]> => {
  const response = await request.get("/api/config/public_views");
  expect(response.status()).toBe(200);
  return (await response.json()) as PublicViewRow[];
};

/**
 * Creates a member gallery and an anyone map on the same dataset.
 *
 * @param {APIRequestContext} request - Authenticated Playwright request.
 * @returns {Promise<ApiTestView>} Gallery fixture to tear down after the map is deleted.
 */
const createMemberGalleryWithAnyoneMap = async (
  request: APIRequestContext,
): Promise<ApiTestView> => {
  const galleryView = await createApiTestView({
    sourceTable: "seed_survey_data",
    viewConfig: { ROUTE_LEVEL_PERMISSION: "member" },
    viewType: "gallery",
  });
  const createMapResponse = await request.post(
    `/api/config/new_table/${galleryView.primaryDataset}?view_type=map`,
    {
      data: {
        config: { ROUTE_LEVEL_PERMISSION: "anyone" },
      },
    },
  );
  expect(createMapResponse.status()).toBe(200);
  return galleryView;
};

/**
 * Deletes the map sibling, then the gallery warehouse fixture.
 *
 * @param {APIRequestContext} request - Authenticated Playwright request.
 * @param {ApiTestView} galleryView - Gallery fixture created for the test.
 * @returns {Promise<void>}
 */
const deleteGalleryAndMap = async (
  request: APIRequestContext,
  galleryView: ApiTestView,
): Promise<void> => {
  await request.post(
    `/api/config/delete_table/${galleryView.primaryDataset}?view_type=map`,
  );
  await deleteApiTestView(galleryView);
};

test("anyone map is public when sibling gallery is member", async ({
  authenticatedRequestAsAdmin: request,
}) => {
  const galleryView = await createMemberGalleryWithAnyoneMap(request);

  try {
    const publicViews = await listPublicViews(request);
    expect(publicViews).toContainEqual(
      expect.objectContaining({
        primaryDataset: galleryView.primaryDataset,
        viewType: "map",
      }),
    );
    expect(publicViews).not.toContainEqual(
      expect.objectContaining({
        primaryDataset: galleryView.primaryDataset,
        viewType: "gallery",
      }),
    );
  } finally {
    await deleteGalleryAndMap(request, galleryView);
  }
});

test("anyone gallery is public without hiding sibling anyone map", async ({
  authenticatedRequestAsAdmin: request,
}) => {
  const galleryView = await createMemberGalleryWithAnyoneMap(request);

  try {
    const updateGalleryResponse = await request.post(
      `/api/config/update_config/${galleryView.primaryDataset}?view_type=gallery`,
      {
        data: {
          config: { ROUTE_LEVEL_PERMISSION: "anyone" },
        },
      },
    );
    expect(updateGalleryResponse.status()).toBe(200);

    const publicViews = (await listPublicViews(request)).filter(
      (view) => view.primaryDataset === galleryView.primaryDataset,
    );
    expect(publicViews).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ viewType: "gallery" }),
        expect.objectContaining({ viewType: "map" }),
      ]),
    );
  } finally {
    await deleteGalleryAndMap(request, galleryView);
  }
});

test("member map is not public when sibling gallery stays anyone", async ({
  authenticatedRequestAsAdmin: request,
}) => {
  const galleryView = await createMemberGalleryWithAnyoneMap(request);

  try {
    const updateGalleryResponse = await request.post(
      `/api/config/update_config/${galleryView.primaryDataset}?view_type=gallery`,
      {
        data: {
          config: { ROUTE_LEVEL_PERMISSION: "anyone" },
        },
      },
    );
    expect(updateGalleryResponse.status()).toBe(200);

    const updateMapResponse = await request.post(
      `/api/config/update_config/${galleryView.primaryDataset}?view_type=map`,
      {
        data: {
          config: { ROUTE_LEVEL_PERMISSION: "member" },
        },
      },
    );
    expect(updateMapResponse.status()).toBe(200);

    const publicViews = await listPublicViews(request);
    expect(publicViews).toContainEqual(
      expect.objectContaining({
        primaryDataset: galleryView.primaryDataset,
        viewType: "gallery",
      }),
    );
    expect(publicViews).not.toContainEqual(
      expect.objectContaining({
        primaryDataset: galleryView.primaryDataset,
        viewType: "map",
      }),
    );
  } finally {
    await deleteGalleryAndMap(request, galleryView);
  }
});
