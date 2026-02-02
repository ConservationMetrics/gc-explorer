import { ref } from "vue";

/**
 * Utility function to copy the current page URL to clipboard
 * Optionally excludes specified query parameters from the URL
 * @param excludeParams - Array of query parameter names to exclude from the URL
 * @returns Promise<void>
 */
const copyLinkToClipboard = async (excludeParams?: string[]): Promise<void> => {
  let url = window.location.href;

  if (excludeParams && excludeParams.length > 0) {
    const urlObj = new URL(url);
    excludeParams.forEach((param) => {
      urlObj.searchParams.delete(param);
    });
    url = urlObj.toString();
  }

  await navigator.clipboard.writeText(url);
};

/**
 * Composable for copying the current page URL to clipboard.
 * Manages a `showCopied` ref to indicate success.
 * @param excludeParams - Optional array of query parameter names to exclude from the copied URL
 * @returns {object} An object containing the `showCopied` ref and the `copyLink` function.
 */
export const useCopyLink = (excludeParams?: string[]) => {
  const showCopied = ref(false);

  const copyLink = async () => {
    await copyLinkToClipboard(excludeParams);
    showCopied.value = true;
    setTimeout(() => {
      showCopied.value = false;
    }, 2000);
  };

  return { showCopied, copyLink };
};
