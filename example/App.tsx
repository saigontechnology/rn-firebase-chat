/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React, {useRef} from 'react';
import {StatusBar} from 'react-native';
import {NavigationContainer} from '@react-navigation/native';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {createNativeStackNavigator} from '@react-navigation/native-stack';

import {ChatScreen} from './src/Chat/ChatScreen';
import {CreateUser} from './src/Chat/CreateUser';
// import {ConversationsScreen} from './src/Chat/ConversationsScreen';

const Stack = createNativeStackNavigator();

function App(): JSX.Element {
  const navigationRef = useRef<any>();
  return (
    <SafeAreaProvider>
      <NavigationContainer ref={navigationRef}>
        <StatusBar barStyle={'dark-content'} />
        <Stack.Navigator>
          <Stack.Screen
            name="CreateUser"
            component={CreateUser}
            options={{
              title: 'Create User',
              headerTitleAlign: 'center',
              headerBackTitleVisible: false,
            }}
          />
          {/*<Stack.Screen*/}
          {/*  name="ConversationsScreen"*/}
          {/*  component={ConversationsScreen}*/}
          {/*  options={{*/}
          {/*    title: 'Conversations',*/}
          {/*    headerTitleAlign: 'center',*/}
          {/*    headerRight: () => {*/}
          {/*      return (*/}
          {/*        <TouchableOpacity*/}
          {/*          onPress={() => {*/}
          {/*            // signOut();*/}
          {/*            // navigationRef.current.navigate('CreateUser')*/}
          {/*          }}>*/}
          {/*          <Text>Log out</Text>*/}
          {/*        </TouchableOpacity>*/}
          {/*      );*/}
          {/*    },*/}
          {/*  }}*/}
          {/*/>*/}
          <Stack.Screen
            name="ChatScreen"
            component={ChatScreen}
            options={{
              title: 'Chat Screen',
              headerTitleAlign: 'center',
            }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

export default App;
