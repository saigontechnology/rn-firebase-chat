//render login screen at here
import React, {useState} from 'react';
import {View, TextInput, Button, StyleSheet, Image} from 'react-native';
import {LoginScreenNavigationProp} from '../../navigation/type';
import {useUserContext} from '../../Context/UserProvider';

export const LoginScreen: React.FC<LoginScreenNavigationProp> = ({
  navigation,
}) => {
  const [memberId, setMemberID] = useState('');
  const [username, setUsername] = useState('');
  const {setUserInfo} = useUserContext();

  const handleMemberIDChange = (text: string) => {
    setMemberID(text);
  };

  const handleUsernameChange = (text: string) => {
    setUsername(text);
  };

  const handleLogin = () => {
    setUserInfo({
      id: memberId,
      name: username,
      avatar:
        'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a7/React-icon.svg/1200px-React-icon.svg.png',
    });

    navigation.navigate('UserListScreen');
  };

  return (
    <View style={styles.container}>
      <Image source={require('../../Assets/sts.png')} style={styles.icon} />
      <TextInput
        value={memberId}
        onChangeText={handleMemberIDChange}
        placeholder="Member ID"
        autoFocus
        style={styles.input}
      />
      <TextInput
        value={username}
        onChangeText={handleUsernameChange}
        placeholder="Username"
        style={styles.input}
      />
      <Button
        title="Login"
        disabled={!(memberId?.length && username?.length)}
        onPress={handleLogin}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  icon: {
    height: 50,
    width: 50,
    marginBottom: 30,
    borderRadius: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    width: '100%',
    padding: 10,
    marginBottom: 15,
    backgroundColor: '#fff',
  },
  button: {
    width: '100%',
    padding: 15,
    backgroundColor: '#517fa4',
  },
  forgotPassword: {
    marginTop: 20,
  },
});
