import storage from '@react-native-firebase/storage';

const uploadFileToFirebase = (path: string, mime: string, location: string) => {
  const comps = mime.split('/');
  let fileName = '';
  let newPath = path
  if (mime.includes('video')) {
    let name = path.split('/');
    fileName = `${location}/${name[name.length - 1]}`;
    newPath = newPath.replace('file://', '')
  } else {
    fileName = `${location}/${new Date().getTime()}.${comps[1]}`;
  }
  let storageRef = storage().ref(fileName);
  return storageRef.putFile(newPath);
};

export { uploadFileToFirebase };
