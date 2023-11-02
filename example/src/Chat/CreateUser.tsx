import React, {useCallback, useRef, useState} from 'react';
import {Button, StyleSheet, Text, TextInput, View} from 'react-native';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';

import {
  checkUsernameExist,
  createUserProfile,
  FirestoreServices,
} from 'rn-firebase-chat';
import {SwitchWithTitle} from '../Components/SwitchWithTitle';

type CreateUserProps = NativeStackScreenProps<any>;

const FirestoreServicesInstance = FirestoreServices.getInstance();

export const CreateUser: React.FC<CreateUserProps> = ({navigation}) => {
  const [enableEncrypt, setEnableEncrypt] = useState<boolean>(false);
  const [enableTyping, setEnableTyping] = useState<boolean>(false);
  const usernameRef = useRef<string>('123');
  const displayNameRef = useRef<string>('');
  const memberIdRef = useRef<string>('456');

  const onStartChat = useCallback(() => {
    const username = usernameRef.current;
    const displayName = displayNameRef.current;
    const memberId = memberIdRef.current;

    const navigateToChatScreen = () => {
      FirestoreServicesInstance.setChatData(
        username,
        {
          id: username,
          name: displayName,
        },
        'ffCnpqQW2HG6ghcajdYO',
        enableEncrypt,
      );
      navigation.navigate('ChatScreen', {
        userInfo: {
          id: username,
          name: displayName,
        },
        conversationInfo: {
          id: 'ffCnpqQW2HG6ghcajdYO',
          members: {
            ['123']: 'users/123',
            ['456']: 'users/456',
          },
        },
        memberId,
        enableEncrypt,
        enableTyping,
      });
    };

    checkUsernameExist(username).then(isExist => {
      if (!isExist) {
        createUserProfile(username, displayName).then(() => {
          navigateToChatScreen();
        });
      } else {
        navigateToChatScreen();
      }
    });
    // signInAnonymous(
    //   user => {
    //     console.log('CreateUser', user);
    //     createUserProfile(user.user.uid, username).then(() => {
    //       navigation.navigate('ConversationsScreen');
    //     });
    //   },
    //   error => {
    //     console.error(error);
    //   },
    // ).then();
    //
    // .then(async user => {
    //
    // })
    // .catch(error => {
    //   if (error.code === 'auth/operation-not-allowed') {
    //     console.log('Enable anonymous in your firebase console.');
    //   }
    //
    //   console.error(error);
    // });
  }, [navigation, enableEncrypt, enableTyping]);

  // const navigateToChatScreen = useCallback(
  //   (username: string, displayName: string, memberId: string) => {
  //     navigation.navigate('ChatScreen', {
  //       userInfo: {
  //         id: username,
  //         name: displayName,
  //       },
  //       memberId,
  //     });
  //   },
  //   [navigation],
  // );

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
