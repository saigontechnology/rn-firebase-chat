import {
  createUserProfile,
  getUserById as sharedGetUserById,
  getAllUsers as sharedGetAllUsers,
} from '@saigontechnology/firebase-chat-shared';
import type { IUser, IUserInfo, UserProfileProps } from '../types';

export class UserService {
  private static instance: UserService;

  static getInstance(): UserService {
    if (!UserService.instance) {
      UserService.instance = new UserService();
    }
    return UserService.instance;
  }

  async createUserIfNotExists(
    userId: string,
    userData?: Partial<IUserInfo & Pick<UserProfileProps, 'status'>> &
      Record<string, unknown>
  ): Promise<void> {
    await createUserProfile(
      userId,
      (userData?.name as string) ?? '',
      userData?.avatar as string | undefined
    );
  }

  async getUserById(userId: string): Promise<IUser | null> {
    return sharedGetUserById(userId);
  }

  async getAllUsers(): Promise<IUser[]> {
    return sharedGetAllUsers();
  }
}

export default UserService;
