import storage from '@react-native-firebase/storage';

const uploadFileToFirebase = (
  path: string,
  conversation: string,
  extension: string,
  type: string
) => {
  const fileName = `${conversation}/${type}/${new Date().getTime()}.${extension}`;
  let storageRef = storage().ref(fileName);
  return storageRef.putFile(path);
};

export { uploadFileToFirebase };
