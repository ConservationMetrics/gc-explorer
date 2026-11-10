import { test as authTest, expect } from "./auth-storage";
import { createApiTestView, deleteApiTestView } from "../helpers/apiTestData";
import type { ApiTestView } from "@/types";

export const test = authTest.extend<{
  galleryMediaView: ApiTestView;
}>({
  galleryMediaView: async ({ baseURL }, use) => {
    const view = await createApiTestView({
      viewType: "gallery",
      viewConfig: {
        MEDIA_BASE_PATH: new URL("/test-media", baseURL).href,
        ROUTE_LEVEL_PERMISSION: "member",
      },
      table: {
        // Keep audio before photo so the test exercises carousel navigation.
        columns: ["_id", "audio", "photo"],
        rows: [1, 2, 3].map((id) => ({
          _id: `gallery-media-${id}`,
          audio: `clip-${id}.mp3`,
          photo: `photo-${id}.webp`,
        })),
      },
    });
    try {
      await use(view);
    } finally {
      await deleteApiTestView(view);
    }
  },
});

export { expect };
