import "server-only";
import { put } from "@vercel/blob";

export const blobConfigured = Boolean(process.env.BLOB_READ_WRITE_TOKEN);

const MAX_BYTES = 4 * 1024 * 1024;
const ALLOWED = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/svg+xml",
]);

export type UploadResult =
  | { ok: true; url: string }
  | { ok: false; error: string };

/**
 * Store a user-supplied image and return its public URL.
 *
 * Validates type and size before touching storage — this endpoint is reachable
 * by any signed-in user, so an unbounded write is a real abuse vector.
 */
export async function uploadImage(
  file: File,
  keyPrefix: string
): Promise<UploadResult> {
  if (!blobConfigured) {
    return {
      ok: false,
      error:
        "Image hosting isn't set up yet. Add a Blob store in Vercel → Storage, or paste an image URL instead.",
    };
  }
  if (!ALLOWED.has(file.type)) {
    return { ok: false, error: "Use a PNG, JPG, WebP or SVG image." };
  }
  if (file.size > MAX_BYTES) {
    return { ok: false, error: "That image is over 4MB. Try a smaller one." };
  }

  const ext = file.name.includes(".") ? file.name.split(".").pop() : "png";
  const blob = await put(`${keyPrefix}-${Date.now()}.${ext}`, file, {
    access: "public",
    contentType: file.type,
  });

  return { ok: true, url: blob.url };
}
