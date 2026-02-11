export type HideMode = "box" | "pixelate" | "blur";
export type UploadSlot = "face" | "target";

export interface ApiJsonResponse {
  image_base64?: string;
  mime_type?: string;
}
