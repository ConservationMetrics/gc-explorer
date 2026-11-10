import { test as viewsTest, expect } from "./warehouse-views";
import { createApiTestView, deleteApiTestView } from "../helpers/apiTestData";
import { surveyTable } from "@/tests/fixtures/warehouseTables";
import type { ApiTestView } from "@/types";

export const test = viewsTest.extend<{
  configGalleryView: ApiTestView;
}>({
  configGalleryView: async ({ baseURL }, use) => {
    const view = await createApiTestView({
      table: surveyTable,
      viewType: "gallery",
      viewConfig: {
        FRONT_END_FILTER_COLUMN: "community",
        MEDIA_COLUMN: "photo",
        MEDIA_BASE_PATH: new URL("/test-media", baseURL).href,
        ROUTE_LEVEL_PERMISSION: "member",
      },
    });
    try {
      await use(view);
    } finally {
      // Tests can add a map for the same test-owned warehouse table.
      await deleteApiTestView({ ...view, viewType: "map" });
      await deleteApiTestView(view);
    }
  },
});

export { expect };
