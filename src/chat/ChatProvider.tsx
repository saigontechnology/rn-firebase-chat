import React, { createContext, useEffect, useReducer } from 'react';
import { FirestoreServices } from '../services/firebase';
import type { IChatContext } from '../interfaces';
import { chatReducer, setListConversation } from '../reducer';

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

  useEffect(() => {
    if (userInfo?.id) {
      const firestoreServices = FirestoreServices.getInstance();
      firestoreServices.setChatData({ userInfo, enableEncrypt });
      firestoreServices.getListConversation().then((res) => {
        dispatch(setListConversation(res));
      });

      firestoreServices.listenConversationUpdate((data) => {
        //TODO: handle update conversation changed
        console.log(data);
      });
    }
  }, [enableEncrypt, userInfo]);

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
