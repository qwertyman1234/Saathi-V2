// Storage is disabled — Firebase Spark plan does not include Storage.
// Upgrade to Blaze plan to enable file uploads.

export async function uploadFile(
  uid: string,
  documentType: string,
  file: File,
  onProgress?: (pct: number) => void
): Promise<{ path: string; url: string }> {
  throw new Error("File storage requires Firebase Blaze plan upgrade.");
}

export async function getFileUrl(path: string): Promise<string> {
  return "";
}

export async function deleteFile(path: string): Promise<void> {
  // no-op
}
