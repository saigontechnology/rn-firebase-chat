import React, {useCallback, useRef, useState} from 'react';
import {Alert, Button, StyleSheet, Text, TextInput, View} from 'react-native';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';

import {
  checkUsernameExist,
  createUserProfile,
  FirestoreServices,
} from '../../../src';
import {SwitchWithTitle} from '../Components/SwitchWithTitle';

type CreateUserProps = NativeStackScreenProps<any>;

const FirestoreServicesInstance = FirestoreServices.getInstance();

export const CreateUser: React.FC<CreateUserProps> = ({navigation}) => {
  const [enableEncrypt, setEnableEncrypt] = useState<boolean>(false);
  const [enableTyping, setEnableTyping] = useState<boolean>(false);
  const usernameRef = useRef<string>('123');
  const displayNameRef = useRef<string>('');
  const memberIdRef = useRef<string>('456');

  const onStartChat = useCallback(async () => {
    const userId = usernameRef.current;
    const displayName = displayNameRef.current;
    const memberId = memberIdRef.current;

    const navigateToChatScreen = async () => {
      let conversationId = '';
      conversationId = await FirestoreServicesInstance.getConservation(
        userId,
        memberId,
      );
      if (conversationId) {
        FirestoreServicesInstance.setChatData({
          userId,
          userInfo: {
            id: userId,
            name: displayName,
          },
          enableEncrypt,
          conversationId: conversationId,
          memberId,
        });
        navigation.navigate('ChatScreen', {
          userInfo: {
            id: userId,
            name: displayName,
          },
          memberId,
          enableEncrypt,
          conversationInfo: {
            id: conversationId,
            members: {
              [userId]: `users/${userId}`,
              [memberId]: `users/${memberId}`,
            },
          },
          enableTyping,
        });
      } else {
        FirestoreServicesInstance.setChatData({
          userId,
          userInfo: {
            id: userId,
            name: displayName,
          },
          enableEncrypt,
          memberId,
        });
        const newId = await FirestoreServicesInstance.createConversation()

        navigation.navigate('ChatScreen', {
          userInfo: {
            id: userId,
            name: displayName,
          },
          memberId,
          enableEncrypt,
          conversationInfo: {
            id: newId.id,
            members: {
              [userId]: `users/${userId}`,
              [memberId]: `users/${memberId}`,
            },
          },
          enableTyping,
        });
      }
    };

    const checkUserExist = await checkUsernameExist(userId)
    const checkMemberExist = await checkUsernameExist(memberId)
    if (!checkMemberExist) {
      Alert.alert('Member dont exist')
    }
    if (!checkUserExist && checkMemberExist) {
      await createUserProfile(userId, displayName).then(() => {
        navigateToChatScreen();
      })
    } else if (checkUserExist && checkMemberExist) {
      navigateToChatScreen();
    } else {
      await createUserProfile(userId, displayName).then(() => {
        Alert.alert('Create user success')
      })
    }
  }, [navigation, enableEncrypt, enableTyping]);

  return (
    <View style={styles.container}>
      <Text style={styles.titleContainer}>Username</Text>
      <TextInput
        defaultValue={''}
        autoFocus
        style={styles.inputContainer}
        placeholder={'Username'}
        onChangeText={text => {
          usernameRef.current = text;
        }}
      />
      <Text style={styles.titleContainer}>Display Name</Text>
      <TextInput
        defaultValue={''}
        autoFocus
        style={styles.inputContainer}
        placeholder={'Display name'}
        onChangeText={text => {
          displayNameRef.current = text;
        }}
      />
      <Text style={styles.titleContainer}>Member Id</Text>
      <TextInput
        defaultValue={''}
        autoFocus
        style={styles.inputContainer}
        placeholder={'Member Id'}
        onChangeText={text => {
          memberIdRef.current = text;
        }}
      />
      <SwitchWithTitle
        title={'Encrypt Data'}
        value={enableEncrypt}
        onValueChange={value => {
          setEnableEncrypt(value);
        }}
      />
      <SwitchWithTitle
        style={{
          marginTop: 12,
        }}
        title={'Support Typing'}
        value={enableTyping}
        onValueChange={value => {
          setEnableTyping(value);
        }}
      />
      <Button title={'Start Chat'} onPress={onStartChat} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
    padding: 16,
  },
  inputContainer: {
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 8,
    marginBottom: 16,
  },
  titleContainer: {
    marginBottom: 8,
  },
});
