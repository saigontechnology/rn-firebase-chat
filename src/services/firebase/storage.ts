import storage from '@react-native-firebase/storage';

/**
 * Generate a unique ID using timestamp and random string
 * to prevent filename collisions during concurrent uploads
 */
const generateUniqueId = (): string => {
  const timestamp = new Date().getTime();
  const randomStr = Math.random().toString(36).substring(2, 8);
  return `${timestamp}_${randomStr}`;
};

const uploadFileToFirebase = (
  path: string,
  conversation: string,
  extension: string
) => {
  const fileName = `${conversation}/${generateUniqueId()}.${extension}`;
  const storageRef = storage().ref(fileName);
  return storageRef.putFile(path);
};

export { uploadFileToFirebase };
