// Web-specific entry point for rn-firebase-chat
// This keeps web code separate from React Native bundle

export * from './types/index';
export * from './services/firebase';
export * from './services/chat';
export * from './services/user';
export * from './components/ChatScreen';
export * from './components/ChatHeader';
export * from './components/MessageList';
export * from './components/MessageInput';
export * from './components/UserAvatar';
export * from './components/TypingIndicator';
export { ConnectionStatus as ConnectionStatusComponent } from './components/ConnectionStatus';
export { useChat } from './hooks/useChat';
export type { UseChatProps } from './hooks/useChat';
export * from './hooks/useMessages';
export * from './hooks/useTyping';
export { useDebounce } from './hooks/useDebounce';
export { useChatSelector } from './hooks/useChatSelector';
export {
  ChatProvider as WebChatProvider,
  useChatContext as useWebChatContext,
} from './context/ChatProvider';
