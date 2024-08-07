import React, {useCallback, useLayoutEffect} from 'react';
import {SafeAreaView} from 'react-native-safe-area-context';
import {ActivityIndicator, Button, StyleSheet, View} from 'react-native';
import AvatarName from '../../Components/AvatarName';
import {ChatScreen as BaseChatScreen} from 'rn-firebase-chat';
import {PropsChat} from '../../navigation/type';
import {useUserContext} from '../../Context/UserProvider';

export const ChatScreen: React.FC<PropsChat> = ({route, navigation }) => {
  const {conversation} = route.params;

  const renderRightButton = useCallback(
    () => (
      <Button
        onPress={() => {
          navigation.navigate('GalleryViewScreen');
        }}
        title="Gallery"
        color="#000"
      />
    ),
    [navigation],
  );

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: renderRightButton,
    });
  }, [navigation, renderRightButton]);

  return (
    <SafeAreaView edges={['bottom']} style={styles.containter}>
      <BaseChatScreen
        partners={conversation?.partners}
        memberIds={conversation?.members}
        renderLoadEarlier={() => {
          return <ActivityIndicator style={styles.loadEarlier} />;
        }}
        hasCamera
        hasGallery
        renderAvatar={() => <AvatarName fullName={'React Native'} />}
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
