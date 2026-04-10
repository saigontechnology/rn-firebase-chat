import React, {
  createContext,
  Dispatch,
  PropsWithChildren,
  useEffect,
  useLayoutEffect,
  useReducer,
} from 'react';
import { FirestoreServices, createUserProfile } from '../services/firebase';
import type { IChatContext } from '../interfaces';
import {
  chatReducer,
  setListConversation,
  updateConversation,
  type ChatAction,
  type ChatState,
} from '../reducer';

const firestoreServices = FirestoreServices.getInstance();

type ChatProviderProps = Omit<IChatContext, 'chatState' | 'chatDispatch'> & {
  chatState?: ChatState;
  chatDispatch?: Dispatch<ChatAction>;
} & PropsWithChildren;

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
  encryptionOptions = { salt: 'saigontechnology@2026' },
  ...props
}) => {
  const [state, dispatch] = useReducer(chatReducer, {});

  /** Run synchronously before children's useEffect so this.userInfo is set
   * before ChatScreen calls getMessageHistory / sendMessage */
  useLayoutEffect(() => {
    if (userInfo?.id) {
      firestoreServices.configuration({ userInfo }).catch((error) => {
        console.error('Failed to configure FirestoreServices:', error);
      });
    }
  }, [userInfo]);

  useEffect(() => {
    let unsubscribeListener = () => {};
    if (userInfo?.id) {
      createUserProfile(userInfo.id, userInfo.name)
        .then(() => {
          firestoreServices.getListConversation().then((res) => {
            dispatch(setListConversation(res));
          });
          unsubscribeListener = firestoreServices.listenConversationUpdate(
            (data) => {
              dispatch(updateConversation(data));
            }
          );
        })
        .catch((error) => {
          console.error('Failed to initialize chat:', error);
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
      firestoreServices
        .configurationEncryption({
          encryptKey,
          enableEncrypt: enableEncrypt as true,
          encryptionOptions,
        })
        .catch((error) => {
          console.error('Failed to configure encryption:', error);
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
