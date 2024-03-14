/**
 * Created by NL on 6/27/23.
 */
import type { BaseEntity } from './base';

type UserStatus = 'online' | 'offline';

interface UserProfileProps extends BaseEntity {
  created?: number;
  name: string;
  status?: UserStatus;
  updated?: number;
  conversations?: string[];
  unRead?: {
    [conversationId: string]: number;
  };
}

export { UserProfileProps };
