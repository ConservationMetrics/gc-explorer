import { test, expect } from "@/tests/e2e/fixtures/auth-storage";
import {
  createApiTestView,
  deleteApiTestView,
} from "@/tests/e2e/helpers/apiTestData";
import type {
  PublicViewRow,
  ViewConfigRow,
  WarehouseTablesResponse,
} from "@/types";

test("view REST API isolates sibling views and synchronizes public access", async ({
  authenticatedRequestAsAdmin: request,
}) => {
  const testView = await createApiTestView({
    sourceTable: "seed_survey_data",
    viewConfig: { ROUTE_LEVEL_PERMISSION: "member" },
    viewType: "gallery",
  });
  const primaryDataset = testView.primaryDataset;

  try {
    const mapResponse = await request.post("/api/views", {
      data: {
        primaryDataset,
        viewConfig: { ROUTE_LEVEL_PERMISSION: "member" },
        viewType: "map",
      },
    });
    expect(mapResponse.status()).toBe(201);
    const mapView = (await mapResponse.json()) as ViewConfigRow;

    const collectionResponse = await request.get(
      `/api/views?primary_dataset=${primaryDataset}`,
    );
    expect(collectionResponse.status()).toBe(200);
    const collection = (await collectionResponse.json()) as ViewConfigRow[];
    expect(collection.map((view) => view.viewType).sort()).toEqual([
      "gallery",
      "map",
    ]);
    const galleryView = collection.find((view) => view.viewType === "gallery");
    expect(galleryView).toBeDefined();

    const singleResponse = await request.get(
      `/api/views/${galleryView!.viewId}`,
    );
    expect(singleResponse.status()).toBe(200);
    expect(await singleResponse.json()).toEqual(galleryView!);

    const duplicateResponse = await request.post("/api/views", {
      data: {
        primaryDataset,
        viewConfig: {},
        viewType: "gallery",
      },
    });
    expect(duplicateResponse.status()).toBe(409);

    const patchResponse = await request.patch(
      `/api/views/${galleryView!.viewId}`,
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
        viewId: galleryView!.viewId,
        viewName: "Test View",
      }),
    );

    const publicResponse = await request.get("/api/views/public");
    expect(publicResponse.status()).toBe(200);
    const publicViews = (await publicResponse.json()) as PublicViewRow[];
    expect(publicViews).toContainEqual({
      primaryDataset,
      viewId: galleryView!.viewId,
      viewType: "gallery",
    });
    expect(publicViews).not.toContainEqual(
      expect.objectContaining({ viewId: mapView.viewId }),
    );

    const deleteGalleryResponse = await request.delete(
      `/api/views/${galleryView!.viewId}`,
    );
    expect(deleteGalleryResponse.status()).toBe(204);

    const remainingMapResponse = await request.get(
      `/api/views/${mapView.viewId}`,
    );
    expect(remainingMapResponse.status()).toBe(200);
    expect(await remainingMapResponse.json()).toEqual(
      expect.objectContaining({
        primaryDataset,
        viewId: mapView.viewId,
        viewType: "map",
      }),
    );

    const deleteMapResponse = await request.delete(
      `/api/views/${mapView.viewId}`,
    );
    expect(deleteMapResponse.status()).toBe(204);
    expect((await request.get(`/api/views/${mapView.viewId}`)).status()).toBe(
      404,
    );
  } finally {
    await deleteApiTestView(testView);
  }
});

test("view REST API validates authorization, IDs, bodies, and missing views", async ({
  authenticatedRequestAsAdmin: adminRequest,
  authenticatedRequestAsMember: memberRequest,
  request,
}) => {
  const body = {
    primaryDataset: "api_test_forbidden",
    viewConfig: {},
    viewType: "gallery",
  };

  expect((await request.post("/api/views", { data: body })).status()).toBe(401);
  expect(
    (await memberRequest.post("/api/views", { data: body })).status(),
  ).toBe(403);
  expect((await adminRequest.post("/api/views", { data: {} })).status()).toBe(
    400,
  );
  expect((await adminRequest.get("/api/views/0")).status()).toBe(400);

  const missingViewId = 2147483647;
  expect((await adminRequest.get(`/api/views/${missingViewId}`)).status()).toBe(
    404,
  );
  expect(
    (
      await adminRequest.patch(`/api/views/${missingViewId}`, {
        data: { viewConfig: {} },
      })
    ).status(),
  ).toBe(404);
  expect(
    (await adminRequest.delete(`/api/views/${missingViewId}`)).status(),
  ).toBe(404);
});

test("warehouse tables API preserves table inventory", async ({
  authenticatedRequestAsAdmin: request,
}) => {
  const response = await request.get("/api/warehouse/tables");
  expect(response.status()).toBe(200);

  const body = (await response.json()) as WarehouseTablesResponse;
  expect(body.tables).toContain("seed_survey_data");
  expect(body.geospatialTables).toContain("bcmform_responses");
});
