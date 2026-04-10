import type { BaseEntity } from './base';

export type UserStatus = 'online' | 'offline';

export interface IUserInfo {
  id: string;
  name: string;
  avatar: string;
}

export interface IUser {
  id: string;
  name?: string;
  avatar?: string;
}

export interface UserProfileProps extends BaseEntity {
  name: string;
  status: UserStatus;
  created?: number;
  updated?: number;
}
