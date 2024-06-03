import React, {useCallback, useRef, useState} from 'react';
import {
  Button,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import {FirestoreServices, useChatContext} from 'rn-firebase-chat';
import {SwitchWithTitle} from '../../Components/SwitchWithTitle';
import {IInfo, PropsCreateUser} from '../../navigation/type';
import {getDetailArray} from '../../utilities/utils';

const FirestoreServicesInstance = FirestoreServices.getInstance();

export const CreateUser: React.FC<PropsCreateUser> = ({navigation}) => {
  const [enableEncrypt, setEnableEncrypt] = useState<boolean>(false);
  const [enableTyping, setEnableTyping] = useState<boolean>(false);
  const [enableChatGroup, setEnableChatGroup] = useState<boolean>(true);
  const [updateText, setUpdateText] = useState<boolean>(false);
  const [listMember, setListUser] = useState<string[]>([]);
  const membersInfo = useRef<IInfo[]>([]);

  const {userInfo} = useChatContext();

  const onCreateChat = useCallback(async () => {
    const memberIds = getDetailArray(membersInfo.current, 'id');
    const avtDefault =
      'https://upload.wikimedia.org/wikipedia/commons/5/51/Havelock_Island%2C_Mangrove_tree_on_the_beach%2C_Andaman_Islands.jpg';
    const converstation = await FirestoreServicesInstance.createConversation(
      memberIds,
      userInfo?.name,
      avtDefault,
    );
    if (converstation?.id) {
      // eslint-disable-next-line no-alert
      alert('Create Successfully');
    } else {
      // eslint-disable-next-line no-alert
      alert('Create Failed');
    }
  }, [userInfo?.name]);

  const switchedArr = [
    {
      title: 'Encrypt Data',
      value: enableEncrypt,
      onValueChange: setEnableEncrypt,
    },
    {
      title: 'Support Typing',
      value: enableTyping,
      onValueChange: setEnableTyping,
    },
    {
      title: 'Add Other User',
      value: enableChatGroup,
      onValueChange: setEnableChatGroup,
    },
  ];

  const handleInputChange = useCallback(
    (index: number, field: string, value: string) => {
      if (!membersInfo.current[index]) {
        membersInfo.current[index] = {
          id: '0',
          name: '',
        };
        if (!updateText) {
          setUpdateText(true);
        }
      }
      membersInfo.current[index][field] = value;
    },
    [updateText],
  );

  const renderMemberInputs = useCallback(
    () => (
      <>
        {listMember?.map((item, index) => (
          <View key={`${index} - ${item}`}>
            <Text style={styles.titleContainer}>User Id {index + 1}</Text>
            <TextInput
              defaultValue={''}
              autoFocus
              style={styles.inputContainer}
              placeholder={`Member Id ${index + 1}`}
              onChangeText={text => handleInputChange(index, 'id', text)}
            />
            <Text style={styles.titleContainer}>Member name {index + 1}</Text>
            <TextInput
              defaultValue={''}
              style={styles.inputContainer}
              placeholder={`Member Id ${index + 1}`}
              onChangeText={text => handleInputChange(index, 'name', text)}
            />
          </View>
        ))}
        <Button
          disabled={listMember?.length === 3}
          title="+ Add user"
          onPress={() => {
            if (listMember.length < 3) {
              const mbID = [...listMember];
              mbID.push('');
              setListUser(mbID);
            }
          }}
        />
      </>
    ),
    [handleInputChange, listMember],
  );

  return (
    <ScrollView style={styles.container}>
      <View style={styles.marginBt}>
        <Text
          style={[
            styles.margin,
            styles.accountStyle,
          ]}>{`Current ID: ${userInfo.id}- Name: ${userInfo.name}`}</Text>
        {enableChatGroup && renderMemberInputs()}
        {switchedArr.map((switchItem, index) => (
          <SwitchWithTitle
            key={index}
            style={styles.margin}
            title={switchItem.title}
            value={switchItem.value}
            onValueChange={switchItem.onValueChange}
          />
        ))}
        <Button
          disabled={membersInfo.current.length === 0}
          title={'Create Chat'}
          onPress={onCreateChat}
        />
        <View style={styles.margin} />
      </View>
    </ScrollView>
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
  margin: {
    marginTop: 12,
  },
  accountStyle: {
    marginBottom: 12,
    fontWeight: 'bold',
  },
  marginBt: {
    marginBottom: 20,
  },
});
