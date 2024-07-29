import storage from '@react-native-firebase/storage';

const uploadFileToFirebase = (
  path: string,
  conversation: string,
  extension: string,
  type: string,
  callback?: (progress: number) => void
) => {
  const fileName = `${conversation}/${type}/${new Date().getTime()}.${extension}`;
  let storageRef = storage().ref(fileName);
  const task = storageRef.putFile(path);
  task.on('state_changed', (taskSnapshot) => {
    const progress =
      (taskSnapshot.bytesTransferred / taskSnapshot.totalBytes) * 100;
    callback?.(progress);
  });
  return task;
};

export { uploadFileToFirebase };
