/**
 * Created by NL on 01/07/21.
 */
import React from 'react';
import { Text, StyleSheet, View, TouchableOpacity } from 'react-native';
import type { ConversationProps } from '../../interfaces';

export interface IConversationItemProps {
  data: ConversationProps;
  onPress?: (_: ConversationProps) => void;
}

export const ConversationItem: React.FC<IConversationItemProps> = ({
  data,
  onPress,
}) => {
  return (
    <TouchableOpacity onPress={() => onPress?.(data)} style={styles.container}>
      <View style={styles.row}>
        <View style={styles.avatarContainer}></View>
        <View style={styles.contentContainer}>
          <Text>{data?.name}</Text>
          <Text>{data?.latestMessage?.text}</Text>
        </View>
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
    width: 100,
    height: 100,
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
});
