import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TypingUser } from '../types';

interface TypingIndicatorProps {
  typingUsers: TypingUser[];
  className?: string;
}

const TypingDots: React.FC = () => (
  <div className="flex space-x-1">
    {[0, 1, 2].map((i) => (
      <motion.div
        key={i}
        className="w-2 h-2 bg-gray-400 rounded-full"
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.5, 1, 0.5],
        }}
        transition={{
          duration: 0.8,
          repeat: Infinity,
          delay: i * 0.2,
        }}
      />
    ))}
  </div>
);

export const TypingIndicator: React.FC<TypingIndicatorProps> = ({
  typingUsers,
  className = '',
}) => {
  if (typingUsers.length === 0) return null;

  const getTypingText = (): string => {
    if (typingUsers.length === 1) {
      return `${typingUsers[0].displayName} is typing`;
    } else if (typingUsers.length === 2) {
      return `${typingUsers[0].displayName} and ${typingUsers[1].displayName} are typing`;
    } else {
      return `${typingUsers[0].displayName} and ${typingUsers.length - 1} others are typing`;
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.2 }}
        className={`flex items-center space-x-2 text-sm text-gray-500 px-4 py-2 ${className}`}
      >
        <TypingDots />
        <span className="italic">{getTypingText()}</span>
      </motion.div>
    </AnimatePresence>
  );
};
