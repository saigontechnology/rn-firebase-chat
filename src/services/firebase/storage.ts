import storage from '@react-native-firebase/storage';

const uploadFileToFirebase = (
  path: string,
  type: string,
  conversation: string,
  extension: string
) => {
  const fileName = `${conversation}/${new Date().getTime()}.${extension}`;
  let storageRef = storage().ref(fileName);
  return storageRef.putFile(path);
};

export { uploadFileToFirebase };
