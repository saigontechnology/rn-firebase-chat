import React, {useState} from 'react';
import {SafeAreaView} from 'react-native-safe-area-context';
import {ActivityIndicator, StyleSheet} from 'react-native';
import type {InputToolbarProps} from 'react-native-gifted-chat';
import type {IMessage as IGiftedChatMessage} from 'react-native-gifted-chat/lib/Models';
import AvatarName from '../../Components/AvatarName';
import {ChatScreen as BaseChatScreen, useChatContext} from 'rn-firebase-chat';
import CustomInputMessage from '../Component/CustomInputMessage';
import {PropsChat} from '../../navigation/type';

export const ChatScreen: React.FC<PropsChat> = ({route}) => {
  const {conversation} = route.params;
  const {userInfo} = useChatContext();

  const partner =
    userInfo?.id === 'Test1'
      ? [{id: 'Test2', name: 'Test2'}]
      : [{id: 'Test1', name: 'Test1'}]; //This hard code to get from API
  console.log('partner: ', partner);
  const [isShowPhotoGallery, setIsShowPhotoGallery] = useState<boolean>(false);

  const renderInputToolbar = (props: InputToolbarProps<IGiftedChatMessage>) => (
    <CustomInputMessage
      {...props}
      isShowPhotoGallery={isShowPhotoGallery}
      togglePhotoGallery={value => {
        setIsShowPhotoGallery(value);
      }}
    />
  );

  return (
    <SafeAreaView edges={['bottom']} style={styles.containter}>
      <BaseChatScreen
        partners={[userInfo, ...partner]}
        memberIds={conversation?.members}
        renderLoadEarlier={() => {
          return <ActivityIndicator style={styles.loadEarlier} />;
        }}
        renderAvatar={() => <AvatarName fullName={'React Native'} />}
        renderInputToolbar={renderInputToolbar}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  containter: {
    flex: 1,
    backgroundColor: 'white',
  },
  loadEarlier: {
    marginVertical: 20,
  },
});

export default ChatScreen;
