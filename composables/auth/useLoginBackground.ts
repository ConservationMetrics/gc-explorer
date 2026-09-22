import { computed } from "vue";
import { useFetch } from "#imports";

const DEFAULT_BACKGROUND = "/background.jpg";

export const useLoginBackground = () => {
  const { data } = useFetch<{ backgroundImage: string }>(
    "/api/background-image",
    { key: "gc-login-background" },
  );

  const backgroundImage = computed(() => {
    const url = data.value?.backgroundImage?.trim() || "";
    return url || DEFAULT_BACKGROUND;
  });

  return { backgroundImage };
};
