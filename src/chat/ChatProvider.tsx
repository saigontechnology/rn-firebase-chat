import React, { createContext, useEffect, useState } from 'react';
import { FirestoreServices } from '../services/firebase';
import type { ConversationProps, IChatContext } from '../interfaces';

interface ChatProviderProps extends Omit<IChatContext, 'listConversation'> {
  children: React.ReactNode;
}

export const ChatContext = createContext<IChatContext>({
  userInfo: { id: '', name: '', avatar: '' },
  listConversation: null,
});
export const ChatProvider: React.FC<ChatProviderProps> = ({
  userInfo,
  children,
}) => {
  const [listConversation, setListConversation] = useState<
    ConversationProps[] | null
  >(null);

  useEffect(() => {
    if (userInfo?.id) {
      const firestoreServices = new FirestoreServices({ userInfo });
      firestoreServices.getListConversation().then((res) => {
        setListConversation(res);
      });

      firestoreServices.listenConversationUpdate((data) => {
        //TODO: handle update conversation changed
        console.log(data);
      });
    }
  }, [userInfo]);

  return (
    <ChatContext.Provider
      value={{
        userInfo,
        listConversation,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};
