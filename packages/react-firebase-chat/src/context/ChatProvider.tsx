import React, {
  createContext,
  useContext,
  ReactNode,
  useEffect,
  useRef,
  useState,
  useMemo,
} from 'react';
import { FirestoreServices } from '@saigontechnology/firebase-chat-shared';
import { initializeFirebase, firebaseService } from '../services/firebase';
import {
  FirebaseConfig,
  IUser,
  EncryptionOptions,
  EncryptionFunctions,
  StorageProvider,
} from '../types';
import UserService from '../services/user';
import { generateEncryptionKey } from '../utils/encryption';
import { generateBadWordsRegex } from '../utils/security';

export interface ChatContextValue {
  currentUser: IUser;
  firebaseConfig?: FirebaseConfig;
  encryptionKey?: string;
  derivedKey: string | null;
  enableEncrypt: boolean;
  encryptionOptions: EncryptionOptions;
  encryptionFuncProps?: EncryptionFunctions;
  blackListWords?: string[];
  blackListRegex?: RegExp;
  storageProvider?: StorageProvider;
  prefix: string;
}

export interface ChatProviderProps {
  children: ReactNode;
  currentUser: IUser;
  firebaseConfig?: FirebaseConfig;
  /** Encryption password/key (default: 'saigontechnology@2026') */
  encryptionKey?: string;
  /** Toggle encryption on/off (default: true) */
  enableEncrypt?: boolean;
  /** Configurable salt, iterations, keyLength (default salt: 'saigontechnology@2026') */
  encryptionOptions?: EncryptionOptions;
  /** Custom encryption/decryption function overrides */
  encryptionFuncProps?: EncryptionFunctions;
  /** Bad words to filter from messages */
  blackListWords?: string[];
  /** Custom storage provider (default: Firebase Storage) */
  storageProvider?: StorageProvider;
  /** Firestore collection prefix for multi-environment support */
  prefix?: string;
}

const ChatContext = createContext<ChatContextValue | null>(null);

export const ChatProvider: React.FC<ChatProviderProps> = ({
  children,
  currentUser,
  firebaseConfig,
  encryptionKey,
  enableEncrypt = true,
  encryptionOptions = { salt: 'saigontechnology@2026' },
  encryptionFuncProps,
  blackListWords,
  storageProvider,
  prefix = '',
}) => {
  const userServiceRef = useRef(UserService.getInstance());
  const [derivedKey, setDerivedKey] = useState<string | null>(null);

  const blackListRegex = useMemo(
    () => generateBadWordsRegex(blackListWords || []),
    [blackListWords]
  );

  useEffect(() => {
    if (firebaseService.isInitialized() || !firebaseConfig) {
      return;
    }

    const initializeApp = async () => {
      try {
        initializeFirebase(firebaseConfig);
      } catch (error) {
        console.error('Failed to initialize Firebase:', error);
      }
    };

    initializeApp();
  }, [firebaseConfig]);

  useEffect(() => {
    if (currentUser?.id) {
      const userPayload: { name: string; avatar?: string } = {
        name: currentUser.name ?? '',
      };
      if (currentUser.avatar !== undefined)
        userPayload.avatar = currentUser.avatar;
      userServiceRef.current.createUserIfNotExists(currentUser.id, userPayload);
    }
  }, [currentUser]);

  useEffect(() => {
    const svc = FirestoreServices.getInstance();
    if (!enableEncrypt) {
      svc.enableEncrypt = false;
      svc.encryptKey = '';
      setDerivedKey(null);
      return;
    }

    const password = encryptionKey || 'saigontechnology@2026';

    if (encryptionFuncProps?.generateKeyFunctionProp) {
      encryptionFuncProps
        .generateKeyFunctionProp(password)
        .then((key) => {
          svc.enableEncrypt = true;
          svc.encryptKey = key;
          if (
            encryptionFuncProps.encryptFunctionProp &&
            encryptionFuncProps.decryptFunctionProp
          ) {
            svc.createEncryptionsFunction({
              generateKeyFunctionProp:
                encryptionFuncProps.generateKeyFunctionProp!,
              encryptFunctionProp: encryptionFuncProps.encryptFunctionProp,
              decryptFunctionProp: encryptionFuncProps.decryptFunctionProp,
            });
          }
          setDerivedKey(key);
        })
        .catch((err) => {
          console.error('Custom key generation failed:', err);
          setDerivedKey(null);
        });
      return;
    }

    svc
      .configurationEncryption({ encryptKey: password, encryptionOptions })
      .then(() => {
        setDerivedKey(svc.encryptKey);
      })
      .catch((err) => {
        console.error('Failed to configure FirestoreServices encryption:', err);
        setDerivedKey(null);
      });
  }, [encryptionKey, enableEncrypt, encryptionOptions, encryptionFuncProps]);

  const value = useMemo<ChatContextValue>(
    () => ({
      currentUser,
      firebaseConfig,
      encryptionKey,
      derivedKey,
      enableEncrypt,
      encryptionOptions,
      encryptionFuncProps,
      blackListWords,
      blackListRegex,
      storageProvider,
      prefix,
    }),
    [
      currentUser,
      firebaseConfig,
      encryptionKey,
      derivedKey,
      enableEncrypt,
      encryptionOptions,
      encryptionFuncProps,
      blackListWords,
      blackListRegex,
      storageProvider,
      prefix,
    ]
  );

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};

export const useChatContext = (): ChatContextValue => {
  const context = useContext(ChatContext);
  if (context === null) {
    throw new Error('useChatContext must be used within a ChatProvider');
  }
  return context;
};
