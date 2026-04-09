const RouteKey = {
  ListChatScreen: 'ListChatScreen',
  ChatScreen: 'ChatScreen',
} as const;

export type RootStackParamList = {
  [RouteKey.ListChatScreen]: undefined;
  [RouteKey.ChatScreen]: { conversationId: string; name?: string; otherUserId?: string };
};

export default RouteKey;
