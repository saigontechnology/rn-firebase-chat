import storage from '@react-native-firebase/storage';

const uploadFileToFirebase = (path: string, mime: string, location: string) => {
  const comps = mime.split('/');
  let fileName = '';
  if (mime.includes('video')) {
    let name = path.split('/');
    fileName = `${location}/${name[name.length - 1]}`;
  } else {
    fileName = `${location}/${new Date().getTime()}.${comps[1]}`;
  }
  let storageRef = storage().ref(fileName);
  return storageRef.putFile(path);
};

export { uploadFileToFirebase };
