import React, { createContext, useEffect, useReducer } from 'react';
import { FirestoreServices, createUserProfile } from '../services/firebase';
import type { IChatContext } from '../interfaces';
import {
  chatReducer,
  deleteConversation,
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
  prefix = '',
}) => {
  const [state, dispatch] = useReducer(chatReducer, {});

  useEffect(() => {
    let unsubscribeUpdateListener = () => {};
    let unsubscribeDeleteListener = () => {};

    if (userInfo?.id) {
      firestoreServices.configuration({ userInfo });
      createUserProfile(userInfo.id, userInfo.name).then(() => {
        firestoreServices.getListConversation().then((res) => {
          dispatch(setListConversation(res));
        });
        unsubscribeUpdateListener = firestoreServices.listenConversationUpdate(
          (data) => {
            dispatch(updateConversation(data));
          }
        );
        unsubscribeDeleteListener = firestoreServices.listenConversationDelete(
          (id) => {
            dispatch(deleteConversation(id));
          }
        );
      });
    }
    return () => {
      unsubscribeUpdateListener();
    };
  }, [userInfo]);

  useEffect(() => {
    firestoreServices.configuration({ enableEncrypt });
  }, [enableEncrypt]);

  useEffect(() => {
    firestoreServices.configuration({ prefix });
  }, [prefix]);

  return (
    <ChatContext.Provider
      value={{
        userInfo,
        chatState: state,
        chatDispatch: dispatch,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};
