import React, {useCallback, useLayoutEffect} from 'react';
import {SafeAreaView} from 'react-native-safe-area-context';
import {ActivityIndicator, Button, StyleSheet} from 'react-native';
import AvatarName from '../../Components/AvatarName';
import {ChatScreen as BaseChatScreen} from 'rn-firebase-chat';
import {PropsChat} from '../../navigation/type';
import {useUserContext} from '../../Context/UserProvider';

export const ChatScreen: React.FC<PropsChat> = ({route, navigation}) => {
  const {conversation} = route.params;
  const {userInfo} = useUserContext();
  console.log('userInfo: ', userInfo);
  const partner =
    userInfo?.id === 'Test1'
      ? [{id: 'Test2', name: 'Test2'}]
      : [{id: 'Test1', name: 'Test1'}]; //This hard code to get from API
  console.log('partner: ', partner);

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
        partners={[userInfo, ...partner]}
        memberIds={conversation?.members}
        renderLoadEarlier={() => {
          return <ActivityIndicator style={styles.loadEarlier} />;
        }}
        hasCamera
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
