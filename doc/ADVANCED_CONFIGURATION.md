# Advanced Configuration

This document covers advanced configuration options for `rn-firebase-chat`, including encryption, custom functions, and environment-specific settings.

## Table of Contents

- [Encryption Setup](#encryption-setup)
- [Environment Configuration](#environment-configuration)
- [Custom Encryption Functions](#custom-encryption-functions)
- [Blacklist Configuration](#blacklist-configuration)
- [Performance Optimization](#performance-optimization)

## Encryption Setup

`rn-firebase-chat` supports AES encryption for secure messaging. This feature can be enabled globally for all messages.

### Basic Encryption

```javascript
import { ChatProvider } from 'rn-firebase-chat';

const userInfo = {
  id: 'user123',
  name: 'John Doe',
  avatar: 'https://example.com/avatar.jpg'
};

function App() {
  return (
    <ChatProvider 
      userInfo={userInfo}
      enableEncrypt={true}
      encryptKey="your-secret-key-here"
    >
      <AppNavigation />
    </ChatProvider>
  );
}
```

### Advanced Encryption Options

```javascript
import { ChatProvider } from 'rn-firebase-chat';

const encryptionConfig = {
  enableEncrypt: true,
  encryptKey: 'your-secret-key-here',
  encryptionOptions: {
    algorithm: 'aes-256-cbc',
    keySize: 256,
    ivSize: 16
  }
};

function App() {
  return (
    <ChatProvider 
      userInfo={userInfo}
      {...encryptionConfig}
    >
      <AppNavigation />
    </ChatProvider>
  );
}
```

## Environment Configuration

Use the `prefix` prop to configure different environments and separate data between development, staging, and production.

### Environment-Specific Configuration

```javascript
import { ChatProvider } from 'rn-firebase-chat';

const getEnvironmentConfig = () => {
  switch (__DEV__ ? 'development' : process.env.NODE_ENV) {
    case 'development':
      return {
        prefix: 'dev_',
        enableEncrypt: false,
        blackListWords: []
      };
    case 'staging':
      return {
        prefix: 'staging_',
        enableEncrypt: true,
        encryptKey: process.env.STAGING_ENCRYPT_KEY,
        blackListWords: ['test', 'debug']
      };
    case 'production':
      return {
        prefix: 'prod_',
        enableEncrypt: true,
        encryptKey: process.env.PROD_ENCRYPT_KEY,
        blackListWords: ['spam', 'inappropriate', 'offensive']
      };
    default:
      return {
        prefix: '',
        enableEncrypt: false
      };
  }
};

function App() {
  const envConfig = getEnvironmentConfig();

  return (
    <ChatProvider 
      userInfo={userInfo}
      {...envConfig}
    >
      <AppNavigation />
    </ChatProvider>
  );
}
```

### Data Separation

The `prefix` prop affects:
- Collection names in Firestore
- Storage paths in Firebase Storage
- Cache keys for local storage

Example with prefix `'dev_'`:
- Conversations collection: `dev_conversations`
- Messages collection: `dev_messages`
- Storage path: `dev_chat_media/`

## Custom Encryption Functions

You can provide custom encryption and decryption functions for specialized use cases.

### Custom Encryption Implementation

```javascript
import CryptoJS from 'crypto-js';

const customEncryptionFunctions = {
  encrypt: async (text, key) => {
    try {
      const encrypted = CryptoJS.AES.encrypt(text, key).toString();
      return encrypted;
    } catch (error) {
      console.error('Encryption failed:', error);
      throw error;
    }
  },
  
  decrypt: async (encryptedText, key) => {
    try {
      const decrypted = CryptoJS.AES.decrypt(encryptedText, key);
      return decrypted.toString(CryptoJS.enc.Utf8);
    } catch (error) {
      console.error('Decryption failed:', error);
      throw error;
    }
  }
};

function App() {
  return (
    <ChatProvider 
      userInfo={userInfo}
      enableEncrypt={true}
      encryptKey="your-key"
      encryptionFuncProps={customEncryptionFunctions}
    >
      <AppNavigation />
    </ChatProvider>
  );
}
```

### Hybrid Encryption (RSA + AES)

```javascript
import { RSA } from 'react-native-crypto';

const hybridEncryptionFunctions = {
  encrypt: async (text, publicKey) => {
    // Generate AES key
    const aesKey = generateRandomKey(32);
    
    // Encrypt message with AES
    const encryptedMessage = await aesEncrypt(text, aesKey);
    
    // Encrypt AES key with RSA
    const encryptedKey = await RSA.encrypt(aesKey, publicKey);
    
    return {
      message: encryptedMessage,
      key: encryptedKey
    };
  },
  
  decrypt: async (encryptedData, privateKey) => {
    // Decrypt AES key with RSA
    const aesKey = await RSA.decrypt(encryptedData.key, privateKey);
    
    // Decrypt message with AES
    const decryptedMessage = await aesDecrypt(encryptedData.message, aesKey);
    
    return decryptedMessage;
  }
};
```

## Blacklist Configuration

Configure word filtering to automatically censor inappropriate content.

### Basic Blacklist

```javascript
const blacklistConfig = {
  blackListWords: [
    'spam',
    'inappropriate',
    'offensive',
    'harassment'
  ]
};

<ChatProvider 
  userInfo={userInfo}
  {...blacklistConfig}
>
  <AppNavigation />
</ChatProvider>
```

### Advanced Blacklist with Patterns

```javascript
const advancedBlacklistConfig = {
  blackListWords: [
    // Exact matches
    'spam',
    'inappropriate',
    
    // Pattern matches (using regex)
    '\\b\\w*spam\\w*\\b', // Words containing "spam"
    '\\b\\w*offensive\\w*\\b', // Words containing "offensive"
    
    // Common variations
    'sp@m',
    'sp4m',
    'in@ppropriate'
  ]
};
```

### Dynamic Blacklist Management

```javascript
import { useState, useEffect } from 'react';

const DynamicBlacklistApp = () => {
  const [blacklistWords, setBlacklistWords] = useState([]);

  useEffect(() => {
    // Fetch blacklist from your server
    fetchBlacklistFromServer().then(words => {
      setBlacklistWords(words);
    });
  }, []);

  return (
    <ChatProvider 
      userInfo={userInfo}
      blackListWords={blacklistWords}
    >
      <AppNavigation />
    </ChatProvider>
  );
};

const fetchBlacklistFromServer = async () => {
  try {
    const response = await fetch('https://your-api.com/blacklist');
    const data = await response.json();
    return data.words;
  } catch (error) {
    console.error('Failed to fetch blacklist:', error);
    return [];
  }
};
```

## Performance Optimization

### Message Pagination

Configure message loading for optimal performance:

```javascript
<ChatScreen
  memberIds={memberIds}
  partners={partners}
  maxPageSize={15} // Load 15 messages per page
  onStartLoad={() => console.log('Loading messages...')}
  onLoadEnd={() => console.log('Messages loaded')}
/>
```

### Lazy Loading

```javascript
const LazyChatScreen = ({ route }) => {
  const [isReady, setIsReady] = useState(false);
  const { memberIds, partners } = route.params;

  useEffect(() => {
    // Preload essential data
    preloadChatData(memberIds).then(() => {
      setIsReady(true);
    });
  }, [memberIds]);

  if (!isReady) {
    return <LoadingScreen />;
  }

  return (
    <ChatScreen
      memberIds={memberIds}
      partners={partners}
      maxPageSize={10}
    />
  );
};
```

### Memory Management

```javascript
const OptimizedChatScreen = ({ route }) => {
  const { memberIds, partners } = route.params;

  return (
    <ChatScreen
      memberIds={memberIds}
      partners={partners}
      maxPageSize={20} // Reasonable page size
      enableTyping={true}
      typingTimeoutSeconds={3} // Shorter timeout for better performance
      messageStatusEnable={true}
      timeoutSendNotify={2} // Faster notification timeout
    />
  );
};
```

## Error Handling

### Encryption Error Handling

```javascript
const ErrorHandlingChatProvider = ({ children }) => {
  const [encryptionError, setEncryptionError] = useState(null);

  const handleEncryptionError = (error) => {
    console.error('Encryption error:', error);
    setEncryptionError(error);
    
    // Fallback to unencrypted mode
    return false;
  };

  if (encryptionError) {
    return (
      <View style={styles.errorContainer}>
        <Text>Encryption failed. Using unencrypted mode.</Text>
        <TouchableOpacity onPress={() => setEncryptionError(null)}>
          <Text>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ChatProvider 
      userInfo={userInfo}
      enableEncrypt={true}
      encryptKey="your-key"
      onEncryptionError={handleEncryptionError}
    >
      {children}
    </ChatProvider>
  );
};
```

### Network Error Handling

```javascript
const NetworkAwareChatScreen = ({ route }) => {
  const [isOnline, setIsOnline] = useState(true);
  const { memberIds, partners } = route.params;

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsOnline(state.isConnected);
    });

    return unsubscribe;
  }, []);

  if (!isOnline) {
    return (
      <View style={styles.offlineContainer}>
        <Text>You're offline. Messages will be sent when connected.</Text>
      </View>
    );
  }

  return (
    <ChatScreen
      memberIds={memberIds}
      partners={partners}
      onStartLoad={() => console.log('Loading...')}
      onLoadEnd={() => console.log('Loaded')}
    />
  );
};
```

This advanced configuration guide covers the most complex use cases and optimization strategies for `rn-firebase-chat`. For basic usage, refer to the main [README](../README.md) and [Props Reference](./PROPS_REFERENCE.md). 