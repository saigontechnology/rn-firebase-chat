import type {
  StorageProvider,
  UploadResult,
  StorageFile,
} from '@saigontechnology/firebase-chat-shared';
import type {
  CloudinaryConfig,
  CloudinaryUploadResponse,
  CloudinaryResourceListResponse,
} from './types';

const CLOUDINARY_API_BASE = 'https://api.cloudinary.com/v1_1';
const CLOUDINARY_RES_BASE = 'https://res.cloudinary.com';

/** Derive MIME type from file extension for React Native FormData. */
function mimeFromExtension(ext: string): string {
  const lower = ext.toLowerCase();
  const map: Record<string, string> = {
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    gif: 'image/gif',
    webp: 'image/webp',
    heic: 'image/heic',
    heif: 'image/heif',
    mp4: 'video/mp4',
    mov: 'video/quicktime',
    avi: 'video/x-msvideo',
    mkv: 'video/x-matroska',
    webm: 'video/webm',
    mp3: 'audio/mpeg',
    m4a: 'audio/mp4',
    aac: 'audio/aac',
    wav: 'audio/wav',
    pdf: 'application/pdf',
  };
  return map[lower] ?? 'application/octet-stream';
}

/** Extract file extension from a path string. */
function extensionOf(path: string): string {
  return path.split('.').pop() ?? '';
}

/** Extract filename from a path string. */
function filenameOf(path: string): string {
  return path.split('/').pop() ?? 'file';
}

/**
 * Determine whether code is running in a browser/web environment.
 * React Native does not have a real `document` object.
 */
function isWeb(): boolean {
  return typeof document !== 'undefined';
}

/**
 * CloudinaryStorageProvider
 *
 * Implements StorageProvider using the Cloudinary Upload API (REST/fetch).
 * Works on both React Native (file:// URIs) and Web (blob:// or data: URLs).
 *
 * Usage:
 * ```ts
 * const cloudinaryProvider = new CloudinaryStorageProvider({
 *   cloudName: 'my-cloud',
 *   uploadPreset: 'my_unsigned_preset',
 *   folder: 'chat',
 * });
 *
 * <ChatProvider storageProvider={cloudinaryProvider}>
 * ```
 */
export class CloudinaryStorageProvider implements StorageProvider {
  private readonly config: CloudinaryConfig;

  constructor(config: CloudinaryConfig) {
    if (!config.cloudName)
      throw new Error('[Cloudinary] cloudName is required');
    if (!config.uploadPreset)
      throw new Error('[Cloudinary] uploadPreset is required');
    this.config = config;
  }

  /**
   * Inject the configured delivery transformations into a Cloudinary URL.
   *
   * Transformations live in the path segment between `/upload/` and the
   * version/public_id: `/upload/f_auto,q_auto,c_limit,w_1920/v123/public_id.jpg`.
   * If the URL already contains transformations, we leave it alone.
   */
  private withTransformations(url: string): string {
    const transformations = this.config.deliveryTransformations?.trim();
    const effective =
      transformations === undefined
        ? 'f_auto,q_auto,c_limit,w_1920'
        : transformations;

    if (!effective) return url;

    const marker = '/upload/';
    const idx = url.indexOf(marker);
    if (idx === -1) return url;

    const afterMarker = url.slice(idx + marker.length);
    // Skip if a transformation segment is already present (starts with single
    // letter + underscore, e.g. "f_auto"). Version segments start with "v".
    const firstSegment = afterMarker.split('/')[0] ?? '';
    const looksLikeTransform =
      /^[a-z]_[^/]+/.test(firstSegment) && !/^v\d+$/.test(firstSegment);
    if (looksLikeTransform) return url;

    return `${url.slice(0, idx + marker.length)}${effective}/${afterMarker}`;
  }

  // ---------------------------------------------------------------------------
  // StorageProvider interface
  // ---------------------------------------------------------------------------

  /**
   * Upload a file to Cloudinary.
   *
   * @param localPath - On React Native: a `file://` URI.
   *                    On Web: a `blob:` object URL (from URL.createObjectURL).
   * @param remotePath - Relative storage path, e.g. `"conversationId/1234567890.jpg"`.
   *                     Used as the Cloudinary `public_id` (folder prefix is prepended
   *                     when `config.folder` is set).
   * @returns `downloadUrl` — the permanent Cloudinary HTTPS URL.
   *          `fullPath`    — the Cloudinary `public_id` (use with getDownloadUrl).
   */
  async uploadFile(
    localPath: string,
    remotePath: string
  ): Promise<UploadResult> {
    const formData = await this.buildFormData(localPath, remotePath);

    const url = `${CLOUDINARY_API_BASE}/${this.config.cloudName}/auto/upload`;
    const response = await fetch(url, { method: 'POST', body: formData });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(
        `[Cloudinary] Upload failed (${response.status}): ${text}`
      );
    }

    const data: CloudinaryUploadResponse = await response.json();

    if (data.error) {
      throw new Error(`[Cloudinary] Upload error: ${data.error.message}`);
    }

    return {
      downloadUrl: this.withTransformations(data.secure_url),
      fullPath: data.public_id,
    };
  }

  /**
   * Reconstruct a download URL from a stored Cloudinary public_id.
   *
   * The URL is built using the `image` resource_type as default; for videos
   * the caller should store the secure_url directly instead of the public_id.
   * If `remotePath` is already an https:// URL, it is returned as-is.
   */
  async getDownloadUrl(remotePath: string): Promise<string> {
    if (remotePath.startsWith('https://') || remotePath.startsWith('http://')) {
      return this.withTransformations(remotePath);
    }
    // Attempt image resource type; Cloudinary redirects if actual type differs.
    return this.withTransformations(
      `${CLOUDINARY_RES_BASE}/${this.config.cloudName}/image/upload/${remotePath}`
    );
  }

  /**
   * List files stored under a Cloudinary folder prefix.
   *
   * Requires `apiKey` and `apiSecret` to be set in config (Admin API).
   * Returns an empty array and logs a warning when credentials are absent —
   * this is intentional for client-side use where exposing the secret is unsafe.
   */
  async listFiles(directoryPath: string): Promise<StorageFile[]> {
    const { apiKey, apiSecret, cloudName } = this.config;

    if (!apiKey || !apiSecret) {
      console.warn(
        '[Cloudinary] listFiles() requires apiKey and apiSecret. ' +
          'These are Admin API credentials — consider calling listFiles() ' +
          'from a trusted backend instead of exposing secrets in client code.'
      );
      return [];
    }

    const prefix = this.buildFolder(directoryPath);
    const params = new URLSearchParams({
      type: 'upload',
      prefix,
      max_results: '500',
    });

    const url = `${CLOUDINARY_API_BASE}/${cloudName}/resources/auto?${params.toString()}`;
    const credentials = btoa(`${apiKey}:${apiSecret}`);

    const response = await fetch(url, {
      method: 'GET',
      headers: { Authorization: `Basic ${credentials}` },
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(
        `[Cloudinary] listFiles failed (${response.status}): ${text}`
      );
    }

    const data: CloudinaryResourceListResponse = await response.json();

    return data.resources.map((r) => ({
      // Append the format so getMediaTypeFromExtension(file.name) can resolve
      // the media type correctly — Cloudinary public_ids have no extension.
      name: r.format ? `${r.public_id}.${r.format}` : r.public_id,
      downloadUrl: this.withTransformations(r.secure_url),
    }));
  }

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  /**
   * Build the FormData payload for the Cloudinary upload endpoint.
   * Handles both Web (blob URLs) and React Native (file:// URIs).
   */
  private async buildFormData(
    localPath: string,
    remotePath: string
  ): Promise<FormData> {
    const formData = new FormData();
    const fileName = filenameOf(remotePath);
    const ext = extensionOf(remotePath);
    const publicId = this.buildPublicId(remotePath);

    if (isWeb()) {
      // Web: fetch the object URL to obtain a Blob, then append it.
      const res = await fetch(localPath);
      const blob = await res.blob();
      formData.append('file', blob, fileName);
    } else {
      // React Native: pass the file:// URI directly inside a plain object.
      // The RN fetch/XHR layer recognises this shape and reads the file.
      (formData as FormData).append('file', {
        uri: localPath,
        type: mimeFromExtension(ext),
        name: fileName,
      } as unknown as Blob);
    }

    formData.append('upload_preset', this.config.uploadPreset);
    formData.append('public_id', publicId);

    if (this.config.folder) {
      formData.append('folder', this.config.folder);
    }

    return formData;
  }

  /**
   * Strip the file extension from `remotePath` to produce a Cloudinary public_id.
   * Cloudinary stores the extension separately; including it in public_id causes
   * double-extension issues (e.g. "image.jpg.jpg").
   */
  private buildPublicId(remotePath: string): string {
    const ext = extensionOf(remotePath);
    return ext ? remotePath.slice(0, -(ext.length + 1)) : remotePath;
  }

  /**
   * Prepend the configured folder prefix to a path (used for listFiles).
   */
  private buildFolder(path: string): string {
    const base = this.config.folder?.replace(/\/$/, '') ?? '';
    return base ? `${base}/${path}` : path;
  }
}
