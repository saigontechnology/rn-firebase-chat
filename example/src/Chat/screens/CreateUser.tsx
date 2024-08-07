import React, {useCallback, useEffect, useLayoutEffect, useRef, useState} from 'react';
import {
  ActivityIndicator,
  Button,
  FlatList,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {FirestoreServices} from 'rn-firebase-chat';
import {IInfo, PropsCreateUser} from '../../navigation/type';
import axios from 'axios';

const api = axios.create({
  baseURL: 'https://665e9a4d1e9017dc16f09d07.mockapi.io'
});


const getUsers = async (): Promise<IInfo[]> => {
  try {
    const response = await api.get<IInfo[]>('/users');
    return response.data;
  } catch (error) {
    console.error('Error fetching users:', error);
    throw error;
  }
};

const FirestoreServicesInstance = FirestoreServices.getInstance();

export const CreateUser: React.FC<PropsCreateUser> = ({navigation}) => {
  const [users, setUsers] = useState<IInfo[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isSelectingGroup, setIsSelectingGroup] = useState<boolean>(false);
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());

  const renderRightButton = useCallback(
    () => (
      <TouchableOpacity
        onPress={() => {
          setIsSelectingGroup((prevIsSelectingGroup) => !prevIsSelectingGroup);
          console.log("Selected Users: ", Array.from(selectedUsers));
          if (isSelectingGroup) {
            const getPartners = users.filter((user) => selectedUsers.has(user.id));
            navigation.navigate('ChatScreen', { conversation: { members: Array.from(selectedUsers), partners: getPartners } });
          }
          // Example of navigating to a chat screen with selected users
          // navigation.navigate('ChatScreen', { conversation: { members: Array.from(selectedUsers) } });
        }}
      >
        <Text style={{ color: 'blue', fontSize: 16, marginRight: 5 }}>{isSelectingGroup ? "Done" : "Group"}</Text>
      </TouchableOpacity>
    ),
    [navigation, selectedUsers, isSelectingGroup]
  );

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: renderRightButton,
    });
  }, [navigation, renderRightButton, isSelectingGroup]);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const data = await getUsers();
        console.log('data: ', data);
        setUsers(data);
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  const toggleSelectUser = (user: IInfo) => {
    if(isSelectingGroup) {
      setSelectedUsers((prevSelectedUsers) => {
        const newSelectedUsers = new Set(prevSelectedUsers);
        if (newSelectedUsers.has(user.id)) {
          newSelectedUsers.delete(user.id);
        } else {
          newSelectedUsers.add(user.id);
        }
        return newSelectedUsers;
      });
    } else {
      // Example of navigating to a chat screen with a single user
      navigation.navigate('ChatScreen', { conversation: { members: [user.id], partners: [user] } });
    }
  };

  const renderItem = ({ item }: { item: IInfo }) => {
    const isSelected = isSelectingGroup && selectedUsers.has(item.id);
    return (
      <TouchableOpacity onPress={() => toggleSelectUser(item)}>
        <View style={[styles.itemContainer, isSelected && styles.itemSelected]}>
          <Image source={{ uri: item.avatar }} style={styles.avatar} />
          <Text style={styles.name}>{item.name}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  return (
    <FlatList
      data={users}
      keyExtractor={(item) => item.id}
      renderItem={renderItem}
      contentContainerStyle={styles.listContainer}
    />
  );
};

const styles = StyleSheet.create({
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  listContainer: {
    padding: 10
  },
  itemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3
  },
  itemSelected: {
    backgroundColor: '#d3d3d3',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 10
  },
  name: {
    fontSize: 18
  }
});
