/**
 * Created by NL on 6/27/23.
 */
type UserStatus = 'online' | 'offline';

interface UserProfileProps {
  created?: number;
  name: string;
  status?: UserStatus;
  updated?: number;
  conversations?: string[];
}

export { UserProfileProps };
