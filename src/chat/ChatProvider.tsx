import React, {
  createContext,
  PropsWithChildren,
  useEffect,
  useReducer,
} from 'react';
import { FirestoreServices, createUserProfile } from '../services/firebase';
import type { IChatContext } from '../interfaces';
import {
  chatReducer,
  setListConversation,
  updateConversation,
} from '../reducer';

const firestoreServices = FirestoreServices.getInstance();

type ChatProviderProps = IChatContext & PropsWithChildren;

export const ChatContext = createContext<IChatContext>({} as IChatContext);
export const ChatProvider: React.FC<ChatProviderProps> = ({
  userInfo,
  children,
  blackListWords,
  encryptionFuncProps,
  prefix = '',
  storageProvider,
  CustomImageComponent,
  enableEncrypt = true,
  encryptKey = 'saigontechnology@2026',
  encryptionOptions = { salt: '' },
  ...props
}) => {
  const [state, dispatch] = useReducer(chatReducer, {});

  useEffect(() => {
    let unsubscribeListener = () => {};
    if (userInfo?.id) {
      firestoreServices.configuration({ userInfo });
      createUserProfile(userInfo.id, userInfo.name).then(() => {
        firestoreServices.getListConversation().then((res) => {
          dispatch(setListConversation(res));
        });
        unsubscribeListener = firestoreServices.listenConversationUpdate(
          (data) => {
            dispatch(updateConversation(data));
          }
        );
      });
    }
    return () => {
      unsubscribeListener();
    };
  }, [userInfo]);

  useEffect(() => {
    if (encryptionFuncProps) {
      firestoreServices.createEncryptionsFunction(encryptionFuncProps);
    }
    if (enableEncrypt && encryptKey && encryptionOptions) {
      firestoreServices.configurationEncryption({
        encryptKey,
        enableEncrypt: enableEncrypt as true,
        encryptionOptions,
      });
    }
  }, [enableEncrypt, encryptKey, encryptionOptions, encryptionFuncProps]);

  useEffect(() => {
    firestoreServices.configuration({ blackListWords });
  }, [blackListWords]);

  useEffect(() => {
    firestoreServices.configuration({ prefix });
  }, [prefix]);

  useEffect(() => {
    if (storageProvider) {
      firestoreServices.setStorageProvider(storageProvider);
    }
  }, [storageProvider]);

  return (
    <ChatContext.Provider
      value={
        {
          userInfo,
          blackListWords,
          CustomImageComponent,
          enableEncrypt,
          encryptKey,
          encryptionOptions,
          ...props,
          chatState: state,
          chatDispatch: dispatch,
        } as IChatContext
      }
    >
      {children}
    </ChatContext.Provider>
  );
};
