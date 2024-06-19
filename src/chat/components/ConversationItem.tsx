/**
 * Created by NL on 01/07/21.
 */
import React, { useMemo } from 'react';
import {
  Text,
  StyleSheet,
  View,
  TouchableOpacity,
  StyleProp,
  TextStyle,
  Image,
} from 'react-native';
import type { ConversationProps } from '../../interfaces';
import { randomColor } from '../../utilities';

export interface IConversationItemProps {
  data: ConversationProps;
  onPress?: (_: ConversationProps) => void;
  titleStyle?: StyleProp<TextStyle>;
  lastMessageStyle?: StyleProp<TextStyle>;
  CustomImage?: typeof Image;
  renderMessage?: () => React.ReactNode;
}

export const ConversationItem: React.FC<IConversationItemProps> = ({
  data,
  onPress,
  titleStyle,
  lastMessageStyle,
  CustomImage,
  renderMessage,
}) => {
  const Avatar = CustomImage ?? Image;

  const backgroundColor = useMemo(() => {
    if (!data.image) return randomColor(data.name || '');
    return undefined;
  }, [data.image, data.name]);

  return (
    <TouchableOpacity onPress={() => onPress?.(data)} style={styles.container}>
      <View style={styles.row}>
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
            <Text style={[styles.title, titleStyle]} numberOfLines={1}>
              {data?.name}
            </Text>
            <Text style={[styles.message, lastMessageStyle]} numberOfLines={1}>
              {data?.latestMessage?.type === 'text'
                ? data?.latestMessage?.text
                : data?.latestMessage?.type === 'photo'
                ? 'Photo'
                : 'Video'}
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  row: {
    flexDirection: 'row',
  },
  avatarContainer: {
    width: 50,
    height: 50,
  },
  avatarWrapper: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: '#acacac',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  title: {
    fontSize: 15,
    marginBottom: 2,
  },
  message: {
    fontSize: 10,
    color: '#909090',
  },
  textAvatar: {
    fontSize: 24,
    color: '#fff',
  },
});
