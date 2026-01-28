import storage, {
  FirebaseStorageTypes,
} from '@react-native-firebase/storage';

/**
 * Generate a unique ID using timestamp and random string
 * to prevent filename collisions during concurrent uploads
 */
const generateUniqueId = (): string => {
  const timestamp = new Date().getTime();
  const randomStr = Math.random().toString(36).substring(2, 8);
  return `${timestamp}_${randomStr}`;
};

/**
 * Normalize file path for Firebase Storage upload
 * Removes file:// prefix if present on Android
 */
const normalizePath = (path: string): string => {
  if (path.startsWith('file://')) {
    return path.replace('file://', '');
  }
  return path;
};

const uploadFileToFirebase = (
  path: string,
  conversation: string,
  extension: string
): Promise<FirebaseStorageTypes.TaskSnapshot> => {
  return new Promise((resolve, reject) => {
    const fileName = `${conversation}/${generateUniqueId()}.${extension}`;
    const storageRef = storage().ref(fileName);
    const normalizedPath = normalizePath(path);

    const task = storageRef.putFile(normalizedPath);

    task.on(
      'state_changed',
      () => {
        // Progress tracking (optional)
      },
      (error) => {
        console.error('Upload error:', error);
        reject(error);
      },
      () => {
        // Upload completed successfully
        resolve(task.snapshot as FirebaseStorageTypes.TaskSnapshot);
      }
    );
  });
};

export { uploadFileToFirebase };
