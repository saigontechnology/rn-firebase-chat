import React, { createContext, useEffect, useReducer } from 'react';
import { FirestoreServices, createUserProfile } from '../services/firebase';
import type { IChatContext } from '../interfaces';
import {
  chatReducer,
  setListConversation,
  updateConversation,
} from '../reducer';

const firestoreServices = FirestoreServices.getInstance();

interface ChatProviderProps
  extends Omit<IChatContext, 'chatState' | 'chatDispatch'> {
  children?: React.ReactNode;
}

export const ChatContext = createContext<IChatContext>({} as IChatContext);
export const ChatProvider: React.FC<ChatProviderProps> = ({
  userInfo,
  children,
  enableEncrypt = false,
  encryptKey = '',
  blackListWords,
  encryptionOptions,
  encryptionFuncProps,
  prefix = '',
  CustomImageComponent,
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
    encryptionFuncProps &&
      firestoreServices.createEncryptionsFunction(encryptionFuncProps);
    firestoreServices.configuration({
      encryptKey,
      enableEncrypt,
      encryptionOptions,
    });
  }, [encryptKey, enableEncrypt, encryptionOptions, encryptionFuncProps]);

  useEffect(() => {
    firestoreServices.configuration({ blackListWords });
  }, [blackListWords]);

  useEffect(() => {
    firestoreServices.configuration({ prefix });
  }, [prefix]);

  return (
    <ChatContext.Provider
      value={{
        userInfo,
        chatState: state,
        chatDispatch: dispatch,
        blackListWords,
        CustomImageComponent,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};
