import { ref } from "vue";

/**
 * Utility function to copy the current page URL to clipboard
 * Returns a promise that resolves when the copy operation completes
 * @returns Promise<void>
 */
const copyLinkToClipboard = async (): Promise<void> => {
  await navigator.clipboard.writeText(window.location.href);
};

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
