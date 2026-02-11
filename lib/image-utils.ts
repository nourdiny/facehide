import {
  ACCEPTED_EXTENSIONS,
  ACCEPTED_MIME_TYPES,
  MAX_FILE_SIZE_BYTES
} from "@/lib/constants";
import { ApiJsonResponse } from "@/types/face-hider";

const DATA_URL_PATTERN = /^data:image\/[a-zA-Z0-9.+-]+;base64,/;

function hasAllowedMimeType(file: File): boolean {
  const mimeType = file.type.trim().toLowerCase();
  if (mimeType && ACCEPTED_MIME_TYPES.has(mimeType)) {
    return true;
  }

  const lowerName = file.name.trim().toLowerCase();
  return ACCEPTED_EXTENSIONS.some((ext) => lowerName.endsWith(ext));
}

export function validateImageFile(file: File): string | null {
  if (!hasAllowedMimeType(file)) {
    return "Invalid file format. Allowed: jpg, jpeg, png, webp.";
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    return "File is too large. Maximum size is 10MB.";
  }

  return null;
}

function ensureDataUrl(base64: string, mimeType?: string): string {
  const cleaned = base64.trim();
  if (!cleaned) {
    throw new Error("API returned an empty image payload.");
  }

  if (DATA_URL_PATTERN.test(cleaned)) {
    return cleaned;
  }

  const safeMime =
    typeof mimeType === "string" && mimeType.startsWith("image/")
      ? mimeType
      : "image/png";

  return `data:${safeMime};base64,${cleaned}`;
}

async function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
        return;
      }
      reject(new Error("Failed to read image blob."));
    };

    reader.onerror = () => reject(new Error("Failed to read image blob."));
    reader.readAsDataURL(blob);
  });
}

function parseJsonPayload(payload: ApiJsonResponse): string {
  if (!payload || typeof payload.image_base64 !== "string") {
    throw new Error("API JSON response is missing image_base64.");
  }

  return ensureDataUrl(payload.image_base64, payload.mime_type);
}

export async function parseOutputImage(response: Response): Promise<string> {
  const contentType = response.headers.get("content-type")?.toLowerCase() ?? "";

  if (contentType.includes("application/json")) {
    const payload = (await response.json()) as ApiJsonResponse;
    return parseJsonPayload(payload);
  }

  const blob = await response.blob();
  const blobType = blob.type.toLowerCase();

  if (blobType.startsWith("image/")) {
    return blobToDataUrl(blob);
  }

  const textPayload = await blob.text();

  try {
    const parsed = JSON.parse(textPayload) as ApiJsonResponse;
    return parseJsonPayload(parsed);
  } catch {
    throw new Error(
      "Unexpected API response. Expected JSON with image_base64 or an image binary."
    );
  }
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}
