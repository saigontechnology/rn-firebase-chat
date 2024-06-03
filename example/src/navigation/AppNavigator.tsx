import React from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {StackNavigation} from './StackNavigation';
import {ChatProvider} from 'rn-firebase-chat';
import {useUserContext} from '../Context/UserProvider';

function AppNavigation(): React.ReactElement {
  const {userInfo} = useUserContext();

  return (
    <ChatProvider userInfo={userInfo} enableEncrypt={false}>
      <NavigationContainer>
        <StackNavigation />
      </NavigationContainer>
    </ChatProvider>
  );
}

export default AppNavigation;
