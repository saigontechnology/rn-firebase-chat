import React, {useState} from 'react';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import {SafeAreaView} from 'react-native-safe-area-context';
import {ActivityIndicator, Image, Pressable, StyleSheet} from 'react-native';
import {Bubble, type InputToolbarProps} from 'react-native-gifted-chat';
import {ChatProvider} from '../../../src';
import type {IMessage as IGiftedChatMessage} from 'react-native-gifted-chat/lib/Models';
import RNFS from 'react-native-fs';
import FileViewer from 'react-native-file-viewer';
import AvatarName from '../Components/AvatarName';
import CustomInputMessage from './Component/CustomInputMessage';
import {MessageProps} from '../../../src/interfaces';

interface ChatScreenProps extends NativeStackScreenProps<any> { }

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

  const onFilePress = (url: string) => {
    const extension = url.split(/[#?]/)[0].split('.').pop().trim();
    // Feel free to change main path according to your requirements.
    const localFile = `${RNFS.DocumentDirectoryPath}/temporaryfile.${extension}`;

    const options = {
      fromUrl: url,
      toFile: localFile,
    };
    RNFS.downloadFile(options).promise.then(() => FileViewer.open(localFile));
  };

  const renderBubble = (props: Bubble<MessageProps>['props']) => {
    const imageUrl = props.currentMessage?.imageUrl;

    return (
      <Bubble
        {...props}
        renderCustomView={() => {
          if (imageUrl) {
            return (
              <Pressable
                style={styles.image}
                onPress={() => onFilePress(imageUrl)}>
                <Image
                  source={{uri: imageUrl}}
                  style={styles.image}
                  resizeMode="contain"
                />
              </Pressable>
            );
          }
        }}
        wrapperStyle={{
          left: styles.left,
          right: styles.right,
        }}
      />
    );
  };
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
        renderBubble={renderBubble}
        renderAvatar={() => <AvatarName fullName={'React Native'} />}
        renderInputToolbar={renderInputToolbar}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  loadEarlier: {
    marginVertical: 20,
  },
  image: {width: 150, height: 150},
  left: {
    backgroundColor: 'gray',
    marginVertical: 0,
  },
  right: {
    padding: 0,
  }
});
