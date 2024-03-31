/**
 * Created by NL on 01/07/21.
 */
import React from 'react';
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

  return (
    <TouchableOpacity onPress={() => onPress?.(data)} style={styles.container}>
      <View style={styles.row}>
        <View style={styles.avatarContainer}>
          {data.image && (
            <Avatar style={styles.avatar} source={{ uri: data.image }} />
          )}
        </View>
        {renderMessage ? (
          renderMessage()
        ) : (
          <View style={styles.contentContainer}>
            <Text style={[titleStyle]}>{data?.name}</Text>
            <Text style={[lastMessageStyle]}>{data?.latestMessage?.text}</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {},
  row: {
    flexDirection: 'row',
  },
  avatarContainer: {
    width: 40,
    height: 40,
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
});
