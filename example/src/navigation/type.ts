import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {ConversationProps} from 'rn-firebase-chat';

export interface IInfo {
  id: string;
  name: string;
  avatar?: string;
}

export type RootStackParamList = {
  LoginScreen: undefined;
  CreateUser: undefined;
  UserListScreen: undefined;
  ChatScreen: {conversation: ConversationProps};
};

export type LoginScreenNavigationProp = NativeStackScreenProps<
  RootStackParamList,
  'LoginScreen'
>;

export type PropsCreateUser = NativeStackScreenProps<
  RootStackParamList,
  'CreateUser'
>;
export type PropsUserList = NativeStackScreenProps<
  RootStackParamList,
  'UserListScreen'
>;
export type PropsChat = NativeStackScreenProps<
  RootStackParamList,
  'ChatScreen'
>;
