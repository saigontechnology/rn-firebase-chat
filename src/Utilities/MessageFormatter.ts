/**
 * Created by NL on 6/1/23.
 */
import { decryptData, generateKey } from './AESCrypto';
import type { MessageProps } from '../interfaces';

const formatMessageData = (message: MessageProps, userName: string) => {
  return {
    _id: message.id,
    text: message.text,
    createdAt: message.created || Date.now(),
    user: {
      _id: message.senderId,
      name: userName,
      avatar:
        'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a7/React-icon.svg/1200px-React-icon.svg.png',
    },
    imageUrl: message.imageUrl,
    type: message.type,
    fileUrl: message.fileUrl,
    fileName: message?.fileName,
    fileSize: message?.fileSize,
    mine: message?.mine,
    senderId: message.senderId,
    readBy: message.readBy,
    id: message.id,
  };
};

const formatEncryptedMessageData = (
  message: MessageProps,
  userName: string
) => {
  return generateKey('Arnold', 'salt', 5000, 256).then((key) => {
    return decryptData(message.text, key)
      .then((decryptedMessage) => {
        return {
          _id: message.id,
          text: decryptedMessage ? decryptedMessage : message.text,
          createdAt: message.created || Date.now(),
          user: {
            _id: message.senderId,
            name: userName,
            avatar:
              'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a7/React-icon.svg/1200px-React-icon.svg.png',
          },
          imageUrl: message.imageUrl,
          type: message.type,
          fileUrl: message.fileUrl,
          fileName: message?.fileName,
          fileSize: message?.fileSize,
          mine: message?.mine,
          senderId: message.senderId,
          readBy: message.readBy,
          id: message.id,
        };
      })
      .catch((err) => {
        console.log('%c decryptData', 'color:#4AF82F', err);
        return {
          _id: message.id,
          // if fail to decrypt, return the original text
          text: message.text,
          createdAt: message.created || Date.now(),
          user: {
            _id: message.senderId,
            name: userName,
            avatar:
              'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a7/React-icon.svg/1200px-React-icon.svg.png',
          },
          imageUrl: message.imageUrl,
          type: message.type,
          fileUrl: message.fileUrl,
          fileName: message?.fileName,
          fileSize: message?.fileSize,
          mine: message?.mine,
          senderId: message.senderId,
          readBy: message.readBy,
          id: message.id,
        };
      });
  });
};

export { formatMessageData, formatEncryptedMessageData };
