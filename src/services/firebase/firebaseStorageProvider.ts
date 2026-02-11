import type {
  StorageProvider,
  UploadResult,
  StorageFile,
} from '../../interfaces/storage';

/**
 * Firebase Storage implementation of StorageProvider.
 * Requires @react-native-firebase/storage to be installed.
 */
export class FirebaseStorageProvider implements StorageProvider {
  private storage: any;

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
      result.items.map(async (fileRef: any) => ({
        name: fileRef.name,
        downloadUrl: await fileRef.getDownloadURL(),
      }))
    );
    return files;
  }
}
