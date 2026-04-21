import React from 'react';
import { ChatScreen as BaseChatScreen } from 'rn-firebase-chat';
import { useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { RootStackParamList } from '../navigation/RouteKey';
import RouteKey from '../navigation/RouteKey';

type Route = RouteProp<RootStackParamList, typeof RouteKey.ChatScreen>;

export const ChatScreen: React.FC = () => {
  const route = useRoute<Route>();
  const { otherUserId } = route.params;

  const partner = {
    id: otherUserId ?? '',
    name: 'User ' + (otherUserId ?? '').slice(0, 6),
    avatar: 'https://i.pravatar.cc/150?img=2',
  };

  return (
    <BaseChatScreen
      memberIds={[partner.id]}
      partners={[partner]}
    />
  );
};
