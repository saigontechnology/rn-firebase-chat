import React, { useState, useRef, useCallback, useEffect } from 'react';
import TextareaAutosize from 'react-textarea-autosize';
import { MessageInputProps } from '../types';
import { ButtonMaterialIcon } from './ButtonMaterialIcon';
import { MAX_INPUT_LENGTH } from '../utils/constants';

export const MessageInput: React.FC<MessageInputProps> = ({
  onSendMessage,
  onTyping,
  disabled = false,
  placeholder = 'Type a message...',
  className = '',
  maxInputLength = MAX_INPUT_LENGTH,
  value: controlledValue,
  onValueChange,
}) => {
  const [internalMessage, setInternalMessage] = useState('');
  // Use controlled value when provided (edit mode), otherwise internal state
  const message =
    controlledValue !== undefined ? controlledValue : internalMessage;
  const setMessage = useCallback(
    (val: string) => {
      if (controlledValue !== undefined) {
        onValueChange?.(val);
      } else {
        setInternalMessage(val);
      }
    },
    [controlledValue, onValueChange]
  );

  const [isTyping, setIsTyping] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const typingTimeoutRef = useRef<number | null>(null);

  // Focus input when controlled value changes (e.g. edit mode activated)
  useEffect(() => {
    if (controlledValue !== undefined && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [controlledValue]);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      let value = e.target.value;

      // Enforce max input length (matching rn-firebase-chat)
      if (maxInputLength && value.length > maxInputLength) {
        value = value.slice(0, maxInputLength);
      }

      setMessage(value);

      // Handle typing indicator
      if (onTyping) {
        if (!isTyping && value.trim()) {
          setIsTyping(true);
          onTyping(true);
        }

        // Clear existing timeout
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
        }

        // Set new timeout to stop typing
        typingTimeoutRef.current = window.setTimeout(() => {
          setIsTyping(false);
          onTyping(false);
        }, 1000);
      }
    },
    [onTyping, isTyping, maxInputLength, setMessage]
  );

  const handleSend = useCallback(() => {
    const trimmedMessage = message.trim();
    if (trimmedMessage && !disabled) {
      onSendMessage(trimmedMessage);
      setMessage('');

      // Stop typing indicator
      if (isTyping && onTyping) {
        setIsTyping(false);
        onTyping(false);
      }

      // Clear timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = null;
      }

      // Focus back to input
      textareaRef.current?.focus();
    }
  }, [message, disabled, onSendMessage, isTyping, onTyping, setMessage]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend]
  );

  const handlePaste = useCallback(
    (_e: React.ClipboardEvent<HTMLTextAreaElement>) => {
      // Paste is allowed — max length is enforced on change
    },
    []
  );

  return (
    <div className={`w-full flex items-end gap-2 ${className}`}>
      <div className="flex-1 flex items-center bg-gray-100 rounded-3xl px-4 py-2 min-h-[40px]">
        <TextareaAutosize
          ref={textareaRef}
          value={message}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          placeholder={placeholder}
          disabled={disabled}
          maxRows={5}
          minRows={1}
          className={`
            flex-1 bg-transparent resize-none text-gray-900 placeholder-gray-400
            focus:outline-none focus:ring-0
            disabled:cursor-not-allowed
          `}
          style={{ border: 'none', outline: 'none', boxShadow: 'none' }}
        />
      </div>

      <ButtonMaterialIcon
        onClick={handleSend}
        disabled={disabled || !message.trim()}
        className="flex items-center justify-center flex-shrink-0"
        style={{
          background: disabled || !message.trim() ? '#e5e7eb' : '#3b82f6',
          color: disabled || !message.trim() ? '#9ca3af' : '#fff',
          borderRadius: '50%',
          width: '40px',
          height: '40px',
          border: 'none',
          cursor: disabled || !message.trim() ? 'not-allowed' : 'pointer',
          transition: 'background 0.15s ease',
        }}
        title="Send message (Enter)"
        icon="send"
        size={20}
      />
    </div>
  );
};
