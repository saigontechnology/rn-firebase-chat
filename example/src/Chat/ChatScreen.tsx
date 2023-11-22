import React, {useState} from 'react';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import {SafeAreaView} from 'react-native-safe-area-context';
import {ActivityIndicator, StyleSheet} from 'react-native';
import type {InputToolbarProps} from 'react-native-gifted-chat';
import {ChatProvider} from '../../../src';
import type {IMessage as IGiftedChatMessage} from 'react-native-gifted-chat/lib/Models';

import AvatarName from '../Components/AvatarName';
import CustomInputMessage from './Component/CustomInputMessage';

interface ChatScreenProps extends NativeStackScreenProps<any> {}

export const ChatScreen: React.FC<ChatScreenProps> = ({route}) => {
  const {userInfo, conversationInfo, memberId, enableEncrypt, enableTyping} =
    route.params || {};

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
    <SafeAreaView
      edges={['bottom']}
      style={{flex: 1, backgroundColor: 'white'}}>
      <ChatProvider
        enableEncrypt={enableEncrypt}
        enableTyping={enableTyping}
        userInfo={userInfo}
        conversationInfo={conversationInfo}
        memberId={memberId}
        renderLoadEarlier={() => {
          return <ActivityIndicator style={styles.loadEarlier} />;
        }}
        renderAvatar={() => <AvatarName fullName={'React Native'} />}
        // renderMessage={props => {
        //   const {renderAvatar, ...res} = props;
        //   return (
        //     <Message
        //       imageStyle={{
        //         left: {
        //           width: 30,
        //           height: 30,
        //         },
        //       }}
        //       renderAvatar={() => <AvatarName fullName={'React Native'} />}
        //       {...res}
        //     />
        //   );
        // }}
        renderInputToolbar={renderInputToolbar}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  loadEarlier: {
    marginVertical: 20,
  },
});
