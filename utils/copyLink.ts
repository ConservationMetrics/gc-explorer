import { ref } from "vue";
import { copyLinkToClipboard } from "./copyLinkHelpers";

/**
 * Composable for copying the current page URL to clipboard.
 * Manages a `showCopied` ref to indicate success.
 * @returns {object} An object containing the `showCopied` ref and the `copyLink` function.
 */
export const useCopyLink = () => {
  const showCopied = ref(false);

  const copyLink = async () => {
    await copyLinkToClipboard();
    showCopied.value = true;
    setTimeout(() => {
      showCopied.value = false;
    }, 2000);
  };

  return { showCopied, copyLink };
};
