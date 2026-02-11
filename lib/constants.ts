import { HideMode } from "@/types/face-hider";

export const API_URL = "https://api-serve-facehide.onrender.com/api/face-hide";
export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;
export const INPUT_ACCEPT =
  "image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp";

export const ACCEPTED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp"
]);

export const ACCEPTED_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp"];

export const DEFAULT_MODE: HideMode = "box";

export const MODE_OPTIONS: ReadonlyArray<{
  value: HideMode;
  label: string;
  description: string;
}> = [
  { value: "box", label: "Box", description: "Solid blackout block." },
  { value: "pixelate", label: "Pixelate", description: "Mosaic effect." },
  { value: "blur", label: "Blur", description: "Soft obfuscation." }
];
