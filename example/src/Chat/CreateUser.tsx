import React, { useCallback, useRef, useState } from 'react';
import { Alert, Button, StyleSheet, Text, TextInput, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import {
  checkUsernameExist,
  createUserProfile,
  FirestoreServices,
} from '../../../src';
import { SwitchWithTitle } from '../Components/SwitchWithTitle';

type CreateUserProps = NativeStackScreenProps<any>;

const FirestoreServicesInstance = FirestoreServices.getInstance();

export const CreateUser: React.FC<CreateUserProps> = ({ navigation }) => {
  const [enableEncrypt, setEnableEncrypt] = useState<boolean>(false);
  const [enableTyping, setEnableTyping] = useState<boolean>(false);
  const [enableChatGroup, setEnableChatGroup] = useState<boolean>(false);
  const [listMember, setListUser] = useState<string[]>([]);
  const usernameRef = useRef<string>('');
  const displayNameRef = useRef<string>('');
  const memberIdRef = useRef<string[]>([]);

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
        const newConversation =
          await FirestoreServicesInstance.createConversation();
        conversationId = newConversation.id;
      }
      const members = {
        [userId]: `users/${userId}`,
      };
      memberId.map((item, index) => {
        members[item] = `users/${item}`;
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
          members,
        },
        enableTyping,
      });
    };

    const checkUserExist = await checkUsernameExist(userId);
    let isAllMemberExist = true;
    memberId.forEach(async (item, index) => {
      const checkMemberExist = await checkUsernameExist(item);
      if (!checkMemberExist) {
        isAllMemberExist = false;
        return
      }
    });
    if (!isAllMemberExist) {
      Alert.alert('Member dont exist');
    }
    if (!checkUserExist && isAllMemberExist) {
      await createUserProfile(userId, displayName).then(() => {
        navigateToChatScreen();
      });
    } else if (checkUserExist && isAllMemberExist) {
      navigateToChatScreen();
    } else if (!checkUserExist) {
      await createUserProfile(userId, displayName).then(() => {
        Alert.alert('Create User Success');
      });
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
      {enableChatGroup &&
        listMember.length > 0 &&
        listMember.map((item, index) => (
          <>
            <Text style={styles.titleContainer}>Member Id {index + 1}</Text>
            <TextInput
              defaultValue={''}
              autoFocus
              style={styles.inputContainer}
              placeholder={'Member Id'}
              onChangeText={text => {
                memberIdRef.current[index] = text;
              }}
            />
          </>
        ))}

      {enableChatGroup && (
        <>
          <Button
            title={'+ add user'}
            onPress={() => {
              if (listMember.length < 3) {
                const tmp = [...listMember];
                tmp.push('');
                setListUser(tmp);
              }
            }}
          />
        </>
      )}
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
      <SwitchWithTitle
        style={{
          marginTop: 12,
        }}
        title={'Add Other User'}
        value={enableChatGroup}
        onValueChange={value => {
          setEnableChatGroup(value);
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
