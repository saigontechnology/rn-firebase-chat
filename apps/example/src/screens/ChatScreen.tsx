import React, { useCallback } from 'react';
import {
  ChatScreen as BaseChatScreen,
  MessageTypes,
  type ImagePickerValue,
} from 'rn-firebase-chat';
import { launchImageLibrary } from 'react-native-image-picker';
import { useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { RootStackParamList } from '../navigation/RouteKey';
import RouteKey from '../navigation/RouteKey';

type Route = RouteProp<RootStackParamList, typeof RouteKey.ChatScreen>;

export const ChatScreen: React.FC = () => {
  const route = useRoute<Route>();
  const { conversationId, otherUserId, memberIds, names, name } = route.params;

  const partner = {
    id: otherUserId ?? '',
    name: name ?? 'User ' + (otherUserId ?? '').slice(0, 6),
    avatar: 'https://i.pravatar.cc/150?img=2',
  };

  const resolvedMemberIds = memberIds ?? (partner.id ? [partner.id] : []);

  const onPressGallery = useCallback(async (): Promise<
    ImagePickerValue | void
  > => {
    const result = await launchImageLibrary({
      mediaType: 'mixed',
      selectionLimit: 1,
    });

    if (result.didCancel || !result.assets?.length) return;
    const asset = result.assets[0];
    if (!asset?.uri) return;

    const isVideo = asset.type?.startsWith('video') ?? false;
    const extension =
      asset.fileName?.split('.').pop()?.toLowerCase() ??
      (isVideo ? 'mp4' : 'jpg');

    return {
      type: isVideo ? MessageTypes.video : MessageTypes.image,
      path: asset.uri,
      extension,
    };
  }, []);

  return (
    <BaseChatScreen
      memberIds={resolvedMemberIds}
      partners={[partner]}
      customConversationInfo={{
        id: conversationId ?? '',
        names,
      }}
      inputToolbarProps={{ hasGallery: true, onPressGallery }}
    />
  );
};
