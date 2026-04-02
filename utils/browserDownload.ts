/**
 * Saves a Blob as a file download in the browser.
 *
 * @param blob - File contents.
 * @param filename - Suggested download filename including extension.
 * @returns {void}
 */
export const triggerBrowserDownload = (blob: Blob, filename: string): void => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
