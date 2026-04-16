import React from 'react';
import { motion } from 'framer-motion';
import { ConnectionStatus as Status } from '../types';

interface ConnectionStatusProps {
  status: Status;
  className?: string;
}

const statusConfig = {
  connected: {
    icon: '●',
    text: 'Connected',
    className: 'text-green-500',
  },
  connecting: {
    icon: '●',
    text: 'Connecting...',
    className: 'text-yellow-500',
  },
  disconnected: {
    icon: '●',
    text: 'Disconnected',
    className: 'text-red-500',
  },
  error: {
    icon: '●',
    text: 'Connection Error',
    className: 'text-red-600',
  },
};

export const ConnectionStatus: React.FC<ConnectionStatusProps> = ({
  status,
  className = '',
}) => {
  const config = statusConfig[status];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={`flex items-center space-x-2 text-xs ${className}`}
    >
      <motion.span
        className={`${config.className}`}
        animate={status === 'connecting' ? { opacity: [1, 0.3, 1] } : {}}
        transition={{
          duration: 1,
          repeat: status === 'connecting' ? Infinity : 0,
        }}
      >
        {config.icon}
      </motion.span>
      <span className={config.className}>{config.text}</span>
    </motion.div>
  );
};
