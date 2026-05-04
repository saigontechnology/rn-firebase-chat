import React, {
  forwardRef,
  useImperativeHandle,
  useState,
  useCallback,
  useMemo,
  useEffect,
} from 'react';
import UserService from '../services/user';
import { ButtonMaterialIcon } from './ButtonMaterialIcon';
import { useChatContext } from '../context/ChatProvider';
import { IUser } from '../types';

export interface ChatNewModalProps {
  onUserSelect: (user: IUser) => void;
  onClose?: () => void;
}

export interface ChatNewModalRef {
  show: () => void;
  hide: () => void;
}

export const ChatNewModal = forwardRef<ChatNewModalRef, ChatNewModalProps>(
  ({ onUserSelect, onClose }, ref) => {
    const { currentUser } = useChatContext();

    const [isOpen, setIsOpen] = useState(false);
    const [allUsers, setAllUsers] = useState<Array<IUser>>([]);
    const [userSearch, setUserSearch] = useState('');

    const filteredUsers = useMemo(() => {
      const q = userSearch.trim().toLowerCase();
      if (!q)
        return [] as Array<{
          id: string;
          name: string;
          avatar?: string;
          status?: string;
        }>;
      return allUsers
        .filter(
          (u) =>
            u.id !== `${currentUser?.id}` &&
            (u.name || '').toLowerCase().includes(q)
        )
        .slice(0, 3);
    }, [userSearch, allUsers, currentUser?.id]);

    // Load all users for search once when modal opens first time
    useEffect(() => {
      if (!isOpen || allUsers.length > 0) return;
      const loadUsers = async () => {
        try {
          const userService = UserService.getInstance();
          const users = await userService.getAllUsers();
          setAllUsers(users as IUser[]);
        } catch (e) {
          console.error('Failed to load users', e);
        }
      };
      loadUsers();
    }, [isOpen, allUsers.length]);

    const show = useCallback(() => {
      setIsOpen(true);
    }, []);

    const hide = useCallback(() => {
      setIsOpen(false);
      setUserSearch('');
      onClose?.();
    }, [onClose]);

    useImperativeHandle(
      ref,
      () => ({
        show,
        hide,
      }),
      [show, hide]
    );

    if (!isOpen) return null;

    return (
      <div className="uploader-modal" role="dialog" aria-modal="true">
        <div className="uploader-content">
          <h3>Start new chat</h3>
          <input
            className="newchat-input"
            placeholder="Type a name..."
            value={userSearch}
            onChange={(e) => setUserSearch(e.target.value)}
          />
          {userSearch.trim() && (
            <div className="user-dropdown">
              {filteredUsers.map((u) => (
                <button
                  key={u.id}
                  className="user-option"
                  onClick={() => onUserSelect(u)}
                >
                  {u.avatar && (
                    <img
                      className="user-option-avatar"
                      src={u.avatar}
                      alt={u.name}
                    />
                  )}
                  <span
                    style={{
                      flex: 1,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {u.name}
                  </span>
                </button>
              ))}
              {filteredUsers.length === 0 && (
                <div className="no-results">No users found</div>
              )}
            </div>
          )}
          <ButtonMaterialIcon
            className="close-uploader"
            size={16}
            title="Close new chat"
            icon="close"
            onClick={hide}
          />
        </div>
      </div>
    );
  }
);

ChatNewModal.displayName = 'ChatNewModal';

export default ChatNewModal;
