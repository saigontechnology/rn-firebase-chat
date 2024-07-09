import React, { createContext, useEffect, useReducer } from 'react';
import { FirestoreServices } from '../services/firebase';
import type { IChatContext } from '../interfaces';
import {
  chatReducer,
  setListConversation,
  updateConversation,
} from '../reducer';

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
  blackListWords = null,
}) => {
  const [state, dispatch] = useReducer(chatReducer, {});

  useEffect(() => {
    if (userInfo?.id) {
      const firestoreServices = FirestoreServices.getInstance();
      firestoreServices.configuration({
        userInfo,
        enableEncrypt,
        encryptKey,
        blackListWords,
      });
      firestoreServices.getListConversation().then((res) => {
        dispatch(setListConversation(res));
      });

      firestoreServices.listenConversationUpdate((data) => {
        dispatch(updateConversation(data));
      });
    }
  }, [enableEncrypt, encryptKey, blackListWords, userInfo]);

  return (
    <ChatContext.Provider
      value={{
        userInfo,
        chatState: state,
        chatDispatch: dispatch,
        blackListWords,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};
