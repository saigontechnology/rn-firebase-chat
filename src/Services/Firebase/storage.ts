import storage from '@react-native-firebase/storage';
import {MEDIA_FILE_TYPE} from '../../Chat/constanst';

const uploadFileToFirebase = (path: string, mime: string, location: string) => {
  const comps = mime.split('/');
  let fileName = '';
  if (mime.includes(MEDIA_FILE_TYPE.video) || mime.includes(MEDIA_FILE_TYPE.file)) {
    let name = path.split('/');
    fileName = `${location}/${name[name.length - 1]}`;
  } else {
    fileName = `${location}/${new Date().getTime()}.${comps[1]}`;
  }
  let storageRef = storage().ref(fileName);
  return storageRef.putFile(path);
};

export {uploadFileToFirebase};
