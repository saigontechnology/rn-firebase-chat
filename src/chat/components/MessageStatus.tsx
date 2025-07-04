import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  StyleProp,
  ViewStyle,
  TextStyle,
} from 'react-native';

interface MessageStatusProps {
  userUnreadMessage: boolean;
  customContainerStyle?: StyleProp<ViewStyle>;
  customTextStyle?: StyleProp<TextStyle>;
  unReadSentMessage?: string;
  unReadSeenMessage?: string;
  customMessageStatus?: (hasUnread: boolean) => React.JSX.Element;
}

const MessageStatus: React.FC<MessageStatusProps> = ({
  userUnreadMessage,
  customContainerStyle,
  customTextStyle,
  unReadSentMessage = 'Sent',
  unReadSeenMessage = 'Seen',
  customMessageStatus,
}) => {
  return customMessageStatus ? (
    customMessageStatus(userUnreadMessage)
  ) : (
    <View style={[styles.statusContainer, customContainerStyle]}>
      <Text style={[styles.statusText, customTextStyle]}>
        {userUnreadMessage ? unReadSentMessage : unReadSeenMessage}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  statusContainer: {
    backgroundColor: '#a9a9a9',
    borderRadius: 10,
    paddingVertical: 2,
    paddingHorizontal: 14,
    alignSelf: 'flex-end',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  statusText: {
    fontSize: 12,
    color: 'white',
  },
});

export default MessageStatus;
