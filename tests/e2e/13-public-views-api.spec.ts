import { test, expect } from "@/tests/e2e/fixtures/auth-storage";
import {
  createApiTestView,
  deleteApiTestView,
} from "@/tests/e2e/helpers/apiTestData";
import type { PublicViewRow } from "@/types";

test("public view synchronization isolates sibling view permissions", async ({
  authenticatedRequestAsAdmin: request,
}) => {
  const galleryView = await createApiTestView({
    sourceTable: "seed_survey_data",
    viewConfig: { ROUTE_LEVEL_PERMISSION: "member" },
    viewType: "gallery",
  });
  const mapPath = `/api/config/delete_table/${galleryView.primaryDataset}?view_type=map`;

  try {
    const createMapResponse = await request.post(
      `/api/config/new_table/${galleryView.primaryDataset}?view_type=map`,
      {
        data: {
          config: { ROUTE_LEVEL_PERMISSION: "anyone" },
        },
      },
    );
    expect(createMapResponse.status()).toBe(200);

    const initialPublicViews = (await (
      await request.get("/api/config/public_views")
    ).json()) as PublicViewRow[];
    expect(initialPublicViews).toContainEqual(
      expect.objectContaining({
        primaryDataset: galleryView.primaryDataset,
        viewType: "map",
      }),
    );
    expect(initialPublicViews).not.toContainEqual(
      expect.objectContaining({
        primaryDataset: galleryView.primaryDataset,
        viewType: "gallery",
      }),
    );

    const updateGalleryResponse = await request.post(
      `/api/config/update_config/${galleryView.primaryDataset}?view_type=gallery`,
      {
        data: {
          config: { ROUTE_LEVEL_PERMISSION: "anyone" },
        },
      },
    );
    expect(updateGalleryResponse.status()).toBe(200);

    const updatedPublicViews = (await (
      await request.get("/api/config/public_views")
    ).json()) as PublicViewRow[];
    expect(
      updatedPublicViews.filter(
        (view) => view.primaryDataset === galleryView.primaryDataset,
      ),
    ).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ viewType: "gallery" }),
        expect.objectContaining({ viewType: "map" }),
      ]),
    );

    const updateMapResponse = await request.post(
      `/api/config/update_config/${galleryView.primaryDataset}?view_type=map`,
      {
        data: {
          config: { ROUTE_LEVEL_PERMISSION: "member" },
        },
      },
    );
    expect(updateMapResponse.status()).toBe(200);

    const finalPublicViews = (await (
      await request.get("/api/config/public_views")
    ).json()) as PublicViewRow[];
    expect(finalPublicViews).toContainEqual(
      expect.objectContaining({
        primaryDataset: galleryView.primaryDataset,
        viewType: "gallery",
      }),
    );
    expect(finalPublicViews).not.toContainEqual(
      expect.objectContaining({
        primaryDataset: galleryView.primaryDataset,
        viewType: "map",
      }),
    );
  } finally {
    await request.post(mapPath);
    await deleteApiTestView(galleryView);
  }
});
