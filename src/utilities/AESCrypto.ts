/**
 * Created by NL on 5/31/23.
 */
import Aes from 'react-native-aes-crypto';
const generateKey = (
  password: string,
  salt: string,
  cost: number,
  length: number
) => Aes.pbkdf2(password, salt, cost, length);
const encryptData = (text: string, key: string) => {
  const iv = createIV();
  return Aes.encrypt(text, key, iv, 'aes-256-cbc').then(
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

export { generateKey, encryptData, decryptData, createIV };
