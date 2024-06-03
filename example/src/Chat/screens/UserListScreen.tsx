import React from 'react';
import {View, StyleSheet, TouchableOpacity, Text} from 'react-native';
import {ListConversationScreen, ConversationProps} from 'rn-firebase-chat';
import {PropsUserList} from '../../navigation/type';

export const UserListScreen: React.FC<PropsUserList> = ({
  navigation,
  route,
}) => {
  const onPressItem = (item: {item: ConversationProps}) => {
    navigation?.navigate('ChatScreen', {
      conversation: item,
    });
  };

  const onPressAddUser = () => {
    navigation.navigate('CreateUser');
  };

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
