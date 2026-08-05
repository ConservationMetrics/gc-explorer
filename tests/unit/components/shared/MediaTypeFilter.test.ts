import { mount } from "@vue/test-utils";
import { computed, ref, watch } from "vue";
import { describe, expect, it } from "vitest";

import MediaTypeFilter from "@/components/shared/MediaTypeFilter.vue";
import { allowedFileExtensionsFixture as extensions } from "@/tests/unit/fixtures/allowedFileExtensions";

Object.assign(globalThis, { ref, computed, watch });

const globalConfig = {
  mocks: {
    $t: (key: string) => key,
  },
};

describe("MediaTypeFilter", () => {
  it("renders configured media kinds and emits selection changes", async () => {
    const wrapper = mount(MediaTypeFilter, {
      props: {
        allowedFileExtensions: extensions,
        data: [
          { _id: "1", photo: "a.jpg" },
          { _id: "2", photo: "b.mp3" },
        ],
        mediaColumn: "photo",
      },
      global: globalConfig,
    });

    expect(wrapper.find('[data-testid="media-type-filter"]').exists()).toBe(
      true,
    );
    expect(
      wrapper.find('[data-testid="media-type-checkbox-none"]').exists(),
    ).toBe(false);

    await wrapper
      .get('[data-testid="media-type-checkbox-audio"]')
      .setValue(true);

    expect(wrapper.emitted("filter")?.at(-1)).toEqual([["audio"]]);
  });

  it("shows none only when some rows lack classifiable media", async () => {
    const wrapper = mount(MediaTypeFilter, {
      props: {
        allowedFileExtensions: extensions,
        data: [
          { _id: "1", photo: "a.jpg" },
          { _id: "2", notes: "no media" },
        ],
        mediaColumn: "photo",
      },
      global: globalConfig,
    });

    expect(
      wrapper.find('[data-testid="media-type-checkbox-none"]').exists(),
    ).toBe(true);

    await wrapper
      .get('[data-testid="media-type-checkbox-none"]')
      .setValue(true);

    expect(wrapper.emitted("filter")?.at(-1)).toEqual([["none"]]);
  });
});
