/**
 * @deprecated Use StorageProvider interface with FirebaseStorageProvider instead.
 * This function will be removed in the next major version.
 */
const uploadFileToFirebase = (
  path: string,
  conversation: string,
  extension: string
) => {
  const storage = require('@react-native-firebase/storage').default;
  const fileName = `${conversation}/${new Date().getTime()}.${extension}`;
  const storageRef = storage().ref(fileName);
  return storageRef.putFile(path);
};

export { uploadFileToFirebase };
