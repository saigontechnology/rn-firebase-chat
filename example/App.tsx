/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React from 'react';
import AppNavigation from './src/navigation/AppNavigator';
import {UserProvider} from './src/Context/UserProvider';

function App(): JSX.Element {
  return (
    <UserProvider>
      <AppNavigation />
    </UserProvider>
  );
}

export default App;
