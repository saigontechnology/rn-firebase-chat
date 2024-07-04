import React, { createContext, useEffect, useReducer, useRef } from 'react';
import { FirestoreServices } from '../services/firebase';
import { ConversationActions, type IChatContext } from '../interfaces';
import {
  chatReducer,
  removeConversation,
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
}) => {
  const [state, dispatch] = useReducer(chatReducer, {});
  const snapshotRefs = useRef<{ [key: string]: () => void }>({}).current;

  useEffect(() => {
    if (userInfo?.id) {
      const firestoreServices = FirestoreServices.getInstance();
      firestoreServices.configuration({ userInfo, enableEncrypt });
      firestoreServices.getListConversation().then((res) => {
        dispatch(setListConversation(res));
      });

      snapshotRefs[ConversationActions.update] =
        firestoreServices.listenConversationUpdate((data) => {
          dispatch(updateConversation(data));
        });

      snapshotRefs[ConversationActions.delete] =
        firestoreServices.listenConversationDelete((conversationId) => {
          dispatch(removeConversation(conversationId));
        });

      return () => {
        snapshotRefs[ConversationActions.update]?.();
        snapshotRefs[ConversationActions.delete]?.();
      };
    }
    return;
  }, [enableEncrypt, snapshotRefs, userInfo]);

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
