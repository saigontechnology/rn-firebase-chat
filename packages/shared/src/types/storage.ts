export interface UploadResult {
  downloadUrl: string;
  fullPath: string;
}

export interface StorageFile {
  name: string;
  downloadUrl: string;
}

export interface StorageProvider {
  uploadFile(localPath: string, remotePath: string): Promise<UploadResult>;
  getDownloadUrl(remotePath: string): Promise<string>;
  listFiles(directoryPath: string): Promise<StorageFile[]>;
}
