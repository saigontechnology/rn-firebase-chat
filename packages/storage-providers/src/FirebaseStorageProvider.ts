import type {
  StorageProvider,
  UploadResult,
  StorageFile,
} from '@saigontechnology/firebase-chat-shared';
import type { FirebaseStorageTypes } from '@react-native-firebase/storage';

/**
 * Firebase Storage implementation of StorageProvider.
 * Requires @react-native-firebase/storage to be installed as a peer dependency.
 *
 * Usage:
 * ```ts
 * import { FirebaseStorageProvider } from '@saigontechnology/chat-storage-providers';
 *
 * <ChatProvider storageProvider={new FirebaseStorageProvider()}>
 * ```
 */
export class FirebaseStorageProvider implements StorageProvider {
  private storage: () => FirebaseStorageTypes.Module;

  constructor() {
    try {
      const storageModule = require('@react-native-firebase/storage');
      this.storage = storageModule.default;
    } catch {
      throw new Error(
        'FirebaseStorageProvider requires @react-native-firebase/storage. ' +
          'Install it with: yarn add @react-native-firebase/storage'
      );
    }
  }

  async uploadFile(
    localPath: string,
    remotePath: string
  ): Promise<UploadResult> {
    const storageRef = this.storage().ref(remotePath);
    await storageRef.putFile(localPath);
    const downloadUrl = await storageRef.getDownloadURL();
    return { downloadUrl, fullPath: remotePath };
  }

  async getDownloadUrl(remotePath: string): Promise<string> {
    return this.storage().ref(remotePath).getDownloadURL();
  }

  async listFiles(directoryPath: string): Promise<StorageFile[]> {
    const listRef = this.storage().ref(directoryPath);
    const result = await listRef.listAll();
    const files: StorageFile[] = await Promise.all(
      result.items.map(async (fileRef: FirebaseStorageTypes.Reference) => ({
        name: fileRef.name,
        downloadUrl: await fileRef.getDownloadURL(),
      }))
    );
    return files;
  }
}
