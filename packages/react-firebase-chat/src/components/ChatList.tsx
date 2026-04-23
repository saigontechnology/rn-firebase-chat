import React, { useState, useMemo, useRef, useEffect } from 'react';
import { format, isToday, isYesterday } from 'date-fns';
import { UserAvatar } from './UserAvatar';
import { ConversationProps } from '../types';
import { useChatContext } from '../context/ChatProvider';
import { useDebounce } from '../hooks/useDebounce';
import './ChatScreen.css';

const formatConversationTime = (ts?: number): string => {
  if (!ts) return '';
  const date = new Date(ts);
  if (isToday(date)) return format(date, 'h:mm a');
  if (isYesterday(date)) return 'Yesterday';
  return format(date, 'MMM d');
};

export interface ChatListProps {
  openNewChatFunc: () => void;
  conversations: ConversationProps[];
  selectedConversationId: string;
  handleSelectConversation: (conversation: ConversationProps) => void;
  /** Enable search bar (matching rn-firebase-chat ListConversationScreen) */
  hasSearchBar?: boolean;
  /** Search bar placeholder text */
  searchPlaceholder?: string;
  /** Debounce delay in ms (default: 300) */
  searchDebounceDelay?: number;
  /** Called when the user taps Logout in the avatar menu */
  onLogout?: () => void;
}

export const ChatList: React.FC<ChatListProps> = ({
  openNewChatFunc,
  conversations,
  selectedConversationId,
  handleSelectConversation,
  hasSearchBar = true,
  searchPlaceholder = 'Search conversations...',
  searchDebounceDelay = 300,
  onLogout,
}) => {
  const { currentUser } = useChatContext();
  const [searchText, setSearchText] = useState('');
  const debouncedSearch = useDebounce(searchText, searchDebounceDelay);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close the menu when clicking outside
  useEffect(() => {
    if (!menuOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [menuOpen]);

  const filteredConversations = useMemo(() => {
    if (!debouncedSearch.trim()) return conversations;
    const query = debouncedSearch.toLowerCase();
    return conversations.filter((c) => {
      const nameMatch = c.name?.toLowerCase().includes(query);
      const messageMatch = c.latestMessage?.text?.toLowerCase().includes(query);
      return nameMatch || messageMatch;
    });
  }, [conversations, debouncedSearch]);

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="sidebar-title-row">
          {/* Current user avatar — left slot, opens profile menu */}
          {currentUser && (
            <div className="avatar-menu-anchor" ref={menuRef}>
              <button
                className="avatar-menu-trigger"
                onClick={() => setMenuOpen((o) => !o)}
                aria-label="Profile menu"
                aria-expanded={menuOpen}
              >
                <UserAvatar
                  user={{
                    id: String(currentUser.id),
                    name: currentUser.name,
                    avatar: currentUser.avatar,
                  }}
                  size="small"
                />
              </button>

              {menuOpen && (
                <div className="avatar-menu-popup">
                  <div className="avatar-menu-user">
                    <UserAvatar
                      user={{
                        id: String(currentUser.id),
                        name: currentUser.name,
                        avatar: currentUser.avatar,
                      }}
                      size="medium"
                    />
                    <div className="avatar-menu-user-info">
                      <span className="avatar-menu-name">
                        {currentUser.name || 'Me'}
                      </span>
                    </div>
                  </div>
                  <div className="avatar-menu-divider" />
                  {onLogout && (
                    <button
                      className="avatar-menu-item avatar-menu-item--danger"
                      onClick={() => {
                        setMenuOpen(false);
                        onLogout();
                      }}
                    >
                      <svg
                        width="16"
                        height="16"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                        />
                      </svg>
                      Log out
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          <h2 className="sidebar-title">Messages</h2>

          {/* Compose icon — right slot (new chat) */}
          <button
            className="sidebar-icon-btn"
            onClick={openNewChatFunc}
            aria-label="New conversation"
          >
            <svg
              width="22"
              height="22"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
              />
            </svg>
          </button>
        </div>

        {hasSearchBar && (
          <div className="search-bar-wrapper">
            <svg
              className="search-icon"
              width="16"
              height="16"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
              type="text"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder={searchPlaceholder}
            />
            {searchText && (
              <button
                onClick={() => setSearchText('')}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#9ca3af',
                  fontSize: '16px',
                  padding: '0',
                  lineHeight: '1',
                }}
              >
                &times;
              </button>
            )}
          </div>
        )}
      </div>
      <div className="conversation-list">
        {filteredConversations.map((c) => {
          const isGroup = (c.members ?? []).length > 2;
          const partnerId = isGroup
            ? ''
            : (c.members ?? []).find(
                (m: string) => m !== String(currentUser?.id)
              ) || '';
          // Groups use the shared name field; 1:1 uses the per-member names map so each
          // side sees the other person's name regardless of who created the conversation.
          const displayName = isGroup
            ? (c.name ?? 'Group')
            : (c.names?.[partnerId] ?? 'Unknown');
          return (
            <button
              key={c.id}
              className={`conversation-item ${
                selectedConversationId === c.id ? 'active' : ''
              }`}
              onClick={() => {
                handleSelectConversation(c);
              }}
            >
              <div className="conversation-avatar">
                <UserAvatar
                  user={{
                    name: displayName,
                    id: partnerId,
                    avatar: c.image,
                  }}
                  size="medium"
                />
              </div>
              <div className="conversation-meta">
                <div className="conversation-top">
                  <span className="conversation-name">{displayName}</span>
                  <span className="conversation-time">
                    {formatConversationTime(c.updatedAt)}
                  </span>
                </div>
                <div className="conversation-bottom">
                  <span className="conversation-last">
                    {c?.latestMessage?.text || ''}
                  </span>
                </div>
              </div>
              {selectedConversationId !== c.id &&
                (c.unRead?.[String(currentUser?.id ?? '')] || 0) > 0 && (
                  <span className="unread-badge">
                    {c.unRead?.[String(currentUser?.id ?? '')] || 0}
                  </span>
                )}
            </button>
          );
        })}
        {debouncedSearch && filteredConversations.length === 0 && (
          <div
            style={{
              padding: '16px',
              textAlign: 'center',
              color: '#9ca3af',
              fontSize: '14px',
            }}
          >
            No conversations found
          </div>
        )}
      </div>
    </aside>
  );
};

export default ChatList;
