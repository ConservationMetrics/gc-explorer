/**
 * Utility function to copy the current page URL to clipboard
 * Returns a promise that resolves when the copy operation completes
 * @returns Promise<void>
 */
export const copyLinkToClipboard = async (): Promise<void> => {
  await navigator.clipboard.writeText(window.location.href);
};
