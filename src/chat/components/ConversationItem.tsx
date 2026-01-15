/**
 * Created by NL on 01/07/21.
 */
import React, { useMemo } from 'react';
import { Text, StyleSheet, View, TouchableOpacity, Image } from 'react-native';
import type { StyleProp, TextStyle, ViewStyle } from 'react-native';
import {
  IUserInfo,
  MessageTypes,
  type ConversationProps,
} from '../../interfaces';
import { randomColor } from '../../utilities';

export interface IConversationItemProps {
  data: ConversationProps;
  onPress?: (_: ConversationProps) => void;
  containerStyle?: StyleProp<ViewStyle>;
  wrapperStyle?: StyleProp<ViewStyle>;
  titleStyle?: StyleProp<TextStyle>;
  lastMessageStyle?: StyleProp<TextStyle>;
  timeStyle?: StyleProp<TextStyle>;
  unReadWrapperStyle?: StyleProp<ViewStyle>;
  unReadStyle?: StyleProp<TextStyle>;
  CustomImage?: typeof Image;
  renderMessage?: () => React.ReactNode;
  userInfo?: IUserInfo;
}

export const ConversationItem: React.FC<IConversationItemProps> = ({
  data,
  onPress,
  containerStyle,
  wrapperStyle,
  titleStyle,
  lastMessageStyle,
  timeStyle,
  unReadWrapperStyle,
  unReadStyle,
  CustomImage,
  renderMessage,
  userInfo,
}) => {
  const Avatar = CustomImage ?? Image;

  const backgroundColor = useMemo(() => {
    if (!data.image) return randomColor(data.name || '');
    return undefined;
  }, [data.image, data.name]);

  const formatTime = (timestamp: number): string => {
    const now = new Date();
    const messageDate = new Date(timestamp);
    const diffInMs = now.getTime() - messageDate.getTime();
    const diffInMinutes = Math.floor(diffInMs / 60000);
    const diffInHours = Math.floor(diffInMs / 3600000);
    const diffInDays = Math.floor(diffInMs / 86400000);

    if (diffInMinutes < 1) {
      return 'Now';
    } else if (diffInMinutes < 60) {
      return `${diffInMinutes}m`;
    } else if (diffInHours < 24) {
      return `${diffInHours}h`;
    } else if (diffInDays < 7) {
      return `${diffInDays}d`;
    } else {
      const month = messageDate.getMonth() + 1;
      const day = messageDate.getDate();
      return `${month}/${day}`;
    }
  };

  const getInitialsChat = (type: string | undefined): string => {
    if (!data?.latestMessage || !type) return '';

    const { latestMessage } = data;
    const { senderId, text } = latestMessage;
    const isCurrentUser = senderId === userInfo?.id;

    const getMessageText = (messageType: string): string => {
      const senderInfo = `${
        isCurrentUser ? 'You' : data.latestMessage?.name
      } sent a`;

      switch (messageType) {
        case MessageTypes.text:
          return text;
        case MessageTypes.image:
          return `${senderInfo} Photo`;
        case MessageTypes.video:
          return `${senderInfo} Video`;
        case MessageTypes.voice:
          return `${senderInfo} Voice`;
        default:
          return '';
      }
    };

    return getMessageText(type);
  };

  return (
    <TouchableOpacity
      onPress={() => onPress?.(data)}
      style={[styles.container, StyleSheet.flatten(containerStyle)]}
    >
      <View style={[styles.row, StyleSheet.flatten(wrapperStyle)]}>
        <View style={styles.avatarContainer}>
          <View style={[styles.avatarWrapper, { backgroundColor }]}>
            {data.image ? (
              <Avatar style={styles.avatar} source={{ uri: data.image }} />
            ) : (
              <Text style={styles.textAvatar}>{data.name?.[0]}</Text>
            )}
          </View>
        </View>
        {renderMessage ? (
          renderMessage()
        ) : (
          <View style={styles.contentContainer}>
            <View style={styles.headerRow}>
              <Text
                style={[styles.title, StyleSheet.flatten(titleStyle)]}
                numberOfLines={1}
              >
                {data?.name}
              </Text>
              {data?.updatedAt && (
                <Text style={[styles.time, StyleSheet.flatten(timeStyle)]}>
                  {formatTime(data.updatedAt)}
                </Text>
              )}
            </View>
            <View style={styles.messageRow}>
              <Text
                style={[styles.message, StyleSheet.flatten(lastMessageStyle)]}
                numberOfLines={1}
              >
                {getInitialsChat(data?.latestMessage?.type)}
              </Text>
              {!!data.unRead && (
                <View
                  style={[
                    styles.unReadWrapper,
                    StyleSheet.flatten(unReadWrapperStyle),
                  ]}
                >
                  <Text
                    style={[styles.unRead, StyleSheet.flatten(unReadStyle)]}
                  >
                    {data.unRead}
                  </Text>
                </View>
              )}
            </View>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    width: 50,
    height: 50,
    marginRight: 12,
  },
  avatarWrapper: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  title: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
    marginRight: 8,
  },
  time: {
    fontSize: 12,
    color: '#8E8E93',
    fontWeight: '400',
  },
  message: {
    flex: 1,
    fontSize: 14,
    color: '#8E8E93',
    lineHeight: 18,
    marginRight: 8,
  },
  textAvatar: {
    fontSize: 26,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  unReadWrapper: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
  },
  unRead: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
