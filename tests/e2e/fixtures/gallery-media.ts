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
      warehouseInitializer: async (database, tableName) => {
        // Keep audio before photo so the test exercises carousel navigation.
        await database`
          CREATE TABLE ${database(tableName)} (
            _id text NOT NULL,
            audio text NOT NULL,
            photo text NOT NULL
          )
        `;
        const rows = [1, 2, 3].map((id) => ({
          _id: `gallery-media-${id}`,
          audio: `clip-${id}.mp3`,
          photo: `photo-${id}.webp`,
        }));
        await database`
          INSERT INTO ${database(tableName)} ${database(rows, "_id", "audio", "photo")}
        `;
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
