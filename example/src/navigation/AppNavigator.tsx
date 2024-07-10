import React from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {StackNavigation} from './StackNavigation';
import {ChatProvider} from 'rn-firebase-chat';
import {useUserContext} from '../Context/UserProvider';
import Aes from 'react-native-aes-crypto';

const generateKey = (
  password: string,
  salt: string,
  cost: number,
  length: number
) => Aes.pbkdf2(password, salt, cost, length);

const encryptData = async (text: string, key: string) => {
  const iv = createIV();
  return await Aes.encrypt(text, '2b61e96343afc3e28e440da66899f910536b5a0c451e3e46f748a6294aa50394', iv, 'aes-256-cbc').then(
    (cipher) => iv + cipher
  );
};

const decryptData = (cipher: string, key: string) => {
  const iv = cipher.substring(0, 16);
  const encryptedText = cipher.substring(16, cipher.length);
  return Aes.decrypt(encryptedText, key, iv, 'aes-256-cbc');
};

const CHARACTERS =
  'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
const IV_LENGTH = 16;

const createIV = (length = IV_LENGTH) => {
  let result = '';
  const charactersLength = CHARACTERS.length;
  for (let i = 0; i < length; i++) {
    result += CHARACTERS.charAt(Math.floor(Math.random() * charactersLength));
  }

  return result;
};


const generateEncryptionKey = async (
  encryptKey: string,
): Promise<string> => {
  try {
    const key = await generateKey(encryptKey, 'salt', 5000, 256);
    return key;
  } catch (error) {
    console.error('Error generating encryption key:', error);
    throw error;
  }
};

const decryptedMessageData = async (text: string, key: string) => {
    try {
      const decryptedMessage = await decryptData(text, '2b61e96343afc3e28e440da66899f910536b5a0c451e3e46f748a6294aa50394');
      return decryptedMessage || text;
    } catch (error) {
      console.error('Error generating encryption key:', error);
      return text;
    }
  }


function AppNavigation(): React.ReactElement {
  const {userInfo} = useUserContext();
  const encryptionFunctions = {
    encryptFunctionProp: encryptData,
    decryptFunctionProp: decryptedMessageData,
    generateKeyFunctionProp: generateEncryptionKey
  };
  
  return (
    <ChatProvider userInfo={userInfo} >
      <NavigationContainer>
        <StackNavigation />
      </NavigationContainer>
    </ChatProvider>
  );
}

export default AppNavigation;
