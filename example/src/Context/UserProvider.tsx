import React, {ReactNode, createContext, useContext, useState} from 'react';
import {IInfo} from '../navigation/type';

interface UserContextProps {
  userInfo: IInfo | null;
  setUserInfo: React.Dispatch<React.SetStateAction<IInfo | null>>;
}
const UserContext = createContext<UserContextProps | undefined>(undefined);

const UserProvider: React.FC<{children: ReactNode}> = ({children}) => {
  const [userInfo, setUserInfo] = useState<IInfo | null>(null);

  return (
    <UserContext.Provider value={{userInfo, setUserInfo}}>
      {children}
    </UserContext.Provider>
  );
};

const useUserContext = (): UserContextProps => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUserContext must be used within a UserProvider');
  }
  return context;
};

export {UserProvider, useUserContext};
