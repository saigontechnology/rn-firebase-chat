export interface CloudinaryConfig {
  /** Your Cloudinary cloud name (e.g. "my-app") */
  cloudName: string;

  /**
   * An unsigned upload preset created in the Cloudinary dashboard.
   * Required for client-side uploads (no API secret needed).
   */
  uploadPreset: string;

  /**
   * Default folder prefix applied to every upload.
   * The remotePath is appended after this folder.
   * Example: "chat" → public_id becomes "chat/conversationId/timestamp"
   */
  folder?: string;

  /**
   * Cloudinary API key.  Required only for listFiles().
   * Keep this server-side or in a secured env file.
   */
  apiKey?: string;

  /**
   * Cloudinary API secret.  Required only for listFiles().
   * NEVER embed this in a client-side bundle shipped to users.
   */
  apiSecret?: string;

  /**
   * Transformation string injected into every delivery URL (after `/upload/`).
   * Defaults to `f_auto,q_auto,c_limit,w_1920` — auto-format + auto-quality +
   * resize down to 1920px max width (originals smaller than 1920 aren't upscaled).
   *
   * Set to `''` to disable.
   * @example 'f_auto,q_auto' // only format + quality, no resize
   * @example 'f_auto,q_auto:good,c_limit,w_1280' // cap at 1280, fixed quality
   */
  deliveryTransformations?: string;
}

/** Subset of the Cloudinary upload API response we care about. */
export interface CloudinaryUploadResponse {
  secure_url: string;
  public_id: string;
  resource_type: 'image' | 'video' | 'raw' | 'auto';
  format: string;
  bytes: number;
  width?: number;
  height?: number;
  error?: { message: string };
}

/** Subset of the Cloudinary Admin API resource list response. */
export interface CloudinaryResource {
  public_id: string;
  secure_url: string;
  resource_type: string;
  /** File extension as stored by Cloudinary, e.g. "jpg", "mp4". */
  format: string;
}

export interface CloudinaryResourceListResponse {
  resources: CloudinaryResource[];
  next_cursor?: string;
}
