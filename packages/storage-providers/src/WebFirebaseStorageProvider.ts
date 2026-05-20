import type {
  StorageProvider,
  UploadResult,
  StorageFile,
} from '@saigontechnology/firebase-chat-shared';
import type { FirebaseApp } from 'firebase/app';
import {
  type FirebaseStorage,
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL,
  listAll,
} from 'firebase/storage';

/**
 * Firebase Web Storage implementation of StorageProvider.
 * Requires the `firebase` package to be installed.
 *
 * Usage:
 * ```ts
 * import { WebFirebaseStorageProvider } from '@saigontechnology/chat-storage-providers';
 * import { getStorage } from 'firebase/storage';
 *
 * const provider = new WebFirebaseStorageProvider(firebaseApp);
 * // or
 * const provider = new WebFirebaseStorageProvider(getStorage(firebaseApp));
 * ```
 */
export class WebFirebaseStorageProvider implements StorageProvider {
  private storage: FirebaseStorage;

  constructor(appOrStorage: FirebaseApp | FirebaseStorage) {
    // A FirebaseStorage instance exposes `maxUploadRetryTime`; a FirebaseApp does not.
    const isStorage =
      typeof (appOrStorage as FirebaseStorage).maxUploadRetryTime === 'number';
    this.storage = isStorage
      ? (appOrStorage as FirebaseStorage)
      : getStorage(appOrStorage as FirebaseApp);
  }

  async uploadFile(
    localPath: string,
    remotePath: string
  ): Promise<UploadResult> {
    const fileRef = ref(this.storage, remotePath);

    let blob: Blob;
    if (localPath.startsWith('blob:') || localPath.startsWith('http')) {
      const response = await fetch(localPath);
      blob = await response.blob();
    } else {
      throw new Error(
        'WebFirebaseStorageProvider.uploadFile: localPath must be a blob: or http URL on web'
      );
    }

    const snapshot = await uploadBytes(fileRef, blob);
    const downloadUrl = await getDownloadURL(snapshot.ref);
    return { downloadUrl, fullPath: remotePath };
  }

  async getDownloadUrl(remotePath: string): Promise<string> {
    return getDownloadURL(ref(this.storage, remotePath));
  }

  async listFiles(directoryPath: string): Promise<StorageFile[]> {
    const listRef = ref(this.storage, directoryPath);
    const result = await listAll(listRef);
    return Promise.all(
      result.items.map(async (fileRef) => ({
        name: fileRef.name,
        downloadUrl: await getDownloadURL(fileRef),
      }))
    );
  }
}
