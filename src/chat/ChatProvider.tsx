import React, { createContext, PropsWithChildren, useEffect, useReducer } from 'react';
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
  CustomImageComponent,
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
    encryptionFuncProps &&
      firestoreServices.createEncryptionsFunction(encryptionFuncProps);
    if (props.enableEncrypt && props.encryptKey) {
      firestoreServices.configurationEncryption({
        encryptKey: props.encryptKey,
        enableEncrypt: props.enableEncrypt,
        encryptionOptions: props.encryptionOptions,
      });
    }
  }, [props, encryptionFuncProps]);

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
        blackListWords,
        CustomImageComponent,
        ...props,
        chatState: state,
        chatDispatch: dispatch,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};
