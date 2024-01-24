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
import Video from 'react-native-video';
import {isImageUrl} from '../Utilities/utils';

type ChatScreenProps = NativeStackScreenProps<any>;

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
    try {
      const extension = url?.split(/[#?]/)[0]?.split('.').pop()?.trim();

      if (!extension) {
        throw new Error('Invalid file extension');
      }
      const localFile = `${RNFS.DocumentDirectoryPath}/temporaryfile.${extension}`;

      const options = {
        fromUrl: url,
        toFile: localFile,
      };
      RNFS.downloadFile(options).promise.then(() => FileViewer.open(localFile));
    } catch (error) {
      console.error('Error processing file:', error);
      // Handle the error as needed, e.g., show a user-friendly message.
    }
  };

  const renderCustomView = (
    imageUrl: string | undefined,
    width: number,
    height: number,
  ) => {
    const image = {width, height};
    if (imageUrl) {
      return (
        <Pressable style={image} onPress={() => onFilePress(imageUrl)}>
          {isImageUrl(imageUrl) ? (
            <Image
              source={{uri: imageUrl}}
              style={image}
              resizeMode="contain"
            />
          ) : (
            <Video source={{uri: imageUrl}} style={image} />
          )}
        </Pressable>
      );
    }
  };

  const renderBubble = (props: Bubble<MessageProps>['props']) => {
    const imageUrl = props.currentMessage?.imageUrl;
    const styleBuble = {
      left: styles.left,
      right: styles.padding,
    };

    return (
      <Bubble
        {...props}
        renderCustomView={() => renderCustomView(imageUrl, 150, 150)}
        wrapperStyle={styleBuble}
      />
    );
  };

  return (
    <SafeAreaView edges={['bottom']} style={styles.container}>
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
  left: {
    backgroundColor: 'gray',
    marginVertical: 0,
  },
  container: {flex: 1, backgroundColor: 'white'},
  padding: {
    padding: 0,
  },
});
