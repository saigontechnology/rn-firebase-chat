import React from 'react';
import {View, StyleSheet, TouchableOpacity, Text} from 'react-native';
import {ListConversationScreen, ConversationProps} from 'rn-firebase-chat';
import {PropsUserList} from '../../navigation/type';
import { useUserContext } from '../../Context/UserProvider';

export const UserListScreen: React.FC<PropsUserList> = ({
  navigation,
  route,
}) => {
  const {userInfo} = useUserContext();
  const [isFocused, setIsFocused] = React.useState(false);
  const onPressItem = (item: any) => {
    const memberIds = item?.members?.filter((id: string) => id !== userInfo?.id);
    const partners = memberIds?.map((member: string) => ({id: member, name: member}));
    navigation.navigate('ChatScreen', { conversation: { members: memberIds, partners: partners } });
  };

  console.log("Hello 123");

  const onPressAddUser = () => {
    navigation.navigate('CreateUser');
  };

  React.useEffect(() => {
    // const unsubscribe = navigation.addListener('focus', () => {
    //   // do something
    //   console.log("Hello 2222");
    //   setTimeout(() => {
    //     setIsFocused(true);
    //   }, 5000);
    // });

    // return unsubscribe;
  }, [navigation]);


  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.button} onPress={onPressAddUser}>
        <Text style={styles.buttonText}>+</Text>
      </TouchableOpacity>
      <View style={styles.viewListConverstation}>
        <ListConversationScreen onPress={onPressItem} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  viewListConverstation: {
    flex: 1,
  },
  button: {
    zIndex: 1,
    position: 'absolute',
    width: 60,
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
    right: 20,
    bottom: 30,
    backgroundColor: '#1E90FF',
    borderRadius: 30,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.8,
    shadowRadius: 2,
    elevation: 5,
  },
  buttonText: {
    color: 'white',
    fontSize: 24,
  },
});

export default UserListScreen;
