# Custom Styling

This document covers all aspects of customizing the appearance and styling of `rn-firebase-chat` components.

## Table of Contents

- [Basic Styling](#basic-styling)
- [Theme Customization](#theme-customization)
- [Component-Specific Styling](#component-specific-styling)
- [Input Toolbar Customization](#input-toolbar-customization)
- [Message Bubble Styling](#message-bubble-styling)
- [Gallery Customization](#gallery-customization)
- [Dark Mode Support](#dark-mode-support)
- [Responsive Design](#responsive-design)

## Basic Styling

### ChatScreen Container Styling

```javascript
import { ChatScreen } from 'rn-firebase-chat';

const ChatScreenComponent = ({ route }) => {
  const { memberIds, partners } = route.params;

  return (
    <ChatScreen
      memberIds={memberIds}
      partners={partners}
      style={{
        backgroundColor: '#f8f9fa',
        flex: 1
      }}
      customContainerStyle={{
        backgroundColor: '#ffffff',
        paddingHorizontal: 10
      }}
      customTextStyle={{
        fontSize: 16,
        color: '#333333',
        lineHeight: 22
      }}
    />
  );
};
```

### ListConversationScreen Styling

```javascript
import { ListConversationScreen } from 'rn-firebase-chat';

const ListConversationScreenComponent = () => {
  return (
    <ListConversationScreen
      hasSearchBar={true}
      onPress={handleConversationPress}
      conversationItemProps={{
        containerStyle: {
          backgroundColor: '#ffffff',
          borderBottomWidth: 1,
          borderBottomColor: '#e0e0e0',
          paddingVertical: 15,
          paddingHorizontal: 20
        },
        titleStyle: {
          fontSize: 18,
          fontWeight: '600',
          color: '#333333'
        },
        subtitleStyle: {
          fontSize: 14,
          color: '#666666',
          marginTop: 4
        },
        timestampStyle: {
          fontSize: 12,
          color: '#999999'
        }
      }}
    />
  );
};
```

## Theme Customization

### Creating a Custom Theme

```javascript
// theme.js
export const chatTheme = {
  colors: {
    primary: '#007AFF',
    secondary: '#5856D6',
    background: '#F2F2F7',
    surface: '#FFFFFF',
    text: '#000000',
    textSecondary: '#8E8E93',
    border: '#C6C6C8',
    success: '#34C759',
    error: '#FF3B30',
    warning: '#FF9500'
  },
  typography: {
    title: {
      fontSize: 18,
      fontWeight: '600'
    },
    body: {
      fontSize: 16,
      fontWeight: '400'
    },
    caption: {
      fontSize: 14,
      fontWeight: '400'
    },
    small: {
      fontSize: 12,
      fontWeight: '400'
    }
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32
  },
  borderRadius: {
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16
  }
};

// Using the theme
const ThemedChatScreen = ({ route }) => {
  const { memberIds, partners } = route.params;

  return (
    <ChatScreen
      memberIds={memberIds}
      partners={partners}
      style={{
        backgroundColor: chatTheme.colors.background
      }}
      customContainerStyle={{
        backgroundColor: chatTheme.colors.surface,
        paddingHorizontal: chatTheme.spacing.md
      }}
      customTextStyle={{
        fontSize: chatTheme.typography.body.fontSize,
        color: chatTheme.colors.text,
        fontWeight: chatTheme.typography.body.fontWeight
      }}
    />
  );
};
```

### Theme Provider Pattern

```javascript
import React, { createContext, useContext } from 'react';

const ThemeContext = createContext();

export const ThemeProvider = ({ children, theme }) => {
  return (
    <ThemeContext.Provider value={theme}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const theme = useContext(ThemeContext);
  if (!theme) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return theme;
};

// App.js
const App = () => {
  return (
    <ThemeProvider theme={chatTheme}>
      <ChatProvider userInfo={userInfo}>
        <AppNavigation />
      </ChatProvider>
    </ThemeProvider>
  );
};

// Using theme in components
const ThemedComponent = () => {
  const theme = useTheme();
  
  return (
    <ChatScreen
      memberIds={memberIds}
      partners={partners}
      style={{
        backgroundColor: theme.colors.background
      }}
    />
  );
};
```

## Component-Specific Styling

### ChatScreen Advanced Styling

```javascript
const AdvancedChatScreen = ({ route }) => {
  const { memberIds, partners } = route.params;

  return (
    <ChatScreen
      memberIds={memberIds}
      partners={partners}
      // Container styling
      style={{
        backgroundColor: '#f8f9fa',
        flex: 1
      }}
      // Message container styling
      customContainerStyle={{
        backgroundColor: '#ffffff',
        marginVertical: 2,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: {
          width: 0,
          height: 1,
        },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2
      }}
      // Text message styling
      customTextStyle={{
        fontSize: 16,
        color: '#333333',
        lineHeight: 22,
        paddingHorizontal: 16,
        paddingVertical: 12
      }}
      // Custom conversation info
      customConversationInfo={{
        title: 'Custom Chat Title',
        subtitle: 'Online',
        avatar: 'https://example.com/avatar.jpg',
        status: 'online'
      }}
    />
  );
};
```

### Message Status Customization

```javascript
const CustomMessageStatus = ({ hasUnread }) => {
  const theme = useTheme();
  
  return (
    <View style={styles.statusContainer}>
      {hasUnread ? (
        <View style={[styles.unreadIndicator, { backgroundColor: theme.colors.primary }]}>
          <Text style={[styles.unreadText, { color: theme.colors.surface }]}>
            New
          </Text>
        </View>
      ) : (
        <View style={styles.readIndicator}>
          <Text style={[styles.readText, { color: theme.colors.success }]}>
            ✓✓
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4
  },
  unreadIndicator: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    minWidth: 20,
    alignItems: 'center'
  },
  unreadText: {
    fontSize: 10,
    fontWeight: '600'
  },
  readIndicator: {
    paddingHorizontal: 4
  },
  readText: {
    fontSize: 12
  }
});

// Using custom message status
<ChatScreen
  memberIds={memberIds}
  partners={partners}
  messageStatusEnable={true}
  customMessageStatus={CustomMessageStatus}
/>
```

## Input Toolbar Customization

### Basic Input Toolbar Styling

```javascript
const inputToolbarConfig = {
  hasCamera: true,
  hasGallery: true,
  containerStyle: {
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    paddingHorizontal: 16,
    paddingVertical: 12
  },
  composeWrapperStyle: {
    backgroundColor: '#f8f9fa',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    flex: 1,
    marginRight: 12
  },
  composerTextInputStyle: {
    fontSize: 16,
    color: '#333333',
    paddingVertical: 8,
    maxHeight: 100
  },
  iconStyle: {
    width: 24,
    height: 24,
    tintColor: '#007AFF'
  }
};

<ChatScreen
  memberIds={memberIds}
  partners={partners}
  inputToolbarProps={inputToolbarConfig}
/>
```

### Advanced Input Toolbar with Custom Views

```javascript
const AdvancedInputToolbar = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [isTyping, setIsTyping] = useState(false);

  const renderLeftCustomView = () => (
    <View style={styles.leftToolbar}>
      <TouchableOpacity 
        style={styles.attachButton}
        onPress={() => console.log('Attach pressed')}
      >
        <Text style={styles.attachIcon}>📎</Text>
      </TouchableOpacity>
      <TouchableOpacity 
        style={styles.emojiButton}
        onPress={() => console.log('Emoji pressed')}
      >
        <Text style={styles.emojiIcon}>😊</Text>
      </TouchableOpacity>
    </View>
  );

  const renderRightCustomView = () => (
    <View style={styles.rightToolbar}>
      {isTyping ? (
        <TouchableOpacity 
          style={styles.voiceButton}
          onPress={() => setIsRecording(!isRecording)}
        >
          <Text style={styles.voiceIcon}>🎤</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity 
          style={styles.sendButton}
          onPress={() => console.log('Send pressed')}
        >
          <Text style={styles.sendIcon}>📤</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const inputToolbarProps = {
    hasCamera: true,
    hasGallery: true,
    containerStyle: {
      backgroundColor: '#ffffff',
      borderTopWidth: 1,
      borderTopColor: '#e0e0e0',
      paddingHorizontal: 16,
      paddingVertical: 12,
      flexDirection: 'row',
      alignItems: 'center'
    },
    composeWrapperStyle: {
      backgroundColor: '#f8f9fa',
      borderRadius: 20,
      paddingHorizontal: 16,
      paddingVertical: 8,
      flex: 1,
      marginHorizontal: 8
    },
    composerTextInputStyle: {
      fontSize: 16,
      color: '#333333',
      paddingVertical: 8,
      maxHeight: 100
    },
    renderLeftCustomView,
    renderRightCustomView
  };

  return (
    <ChatScreen
      memberIds={memberIds}
      partners={partners}
      inputToolbarProps={inputToolbarProps}
    />
  );
};

const styles = StyleSheet.create({
  leftToolbar: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  rightToolbar: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  attachButton: {
    padding: 8,
    marginRight: 8
  },
  emojiButton: {
    padding: 8
  },
  voiceButton: {
    padding: 8,
    backgroundColor: '#FF3B30',
    borderRadius: 20,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center'
  },
  sendButton: {
    padding: 8,
    backgroundColor: '#007AFF',
    borderRadius: 20,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center'
  },
  attachIcon: {
    fontSize: 20
  },
  emojiIcon: {
    fontSize: 20
  },
  voiceIcon: {
    fontSize: 16,
    color: '#ffffff'
  },
  sendIcon: {
    fontSize: 16,
    color: '#ffffff'
  }
});
```

## Message Bubble Styling

### Custom Message Bubble Components

```javascript
const CustomMessageBubble = ({ message, position }) => {
  const theme = useTheme();
  const isOwnMessage = position === 'right';

  const bubbleStyle = {
    backgroundColor: isOwnMessage ? theme.colors.primary : theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    marginVertical: theme.spacing.xs,
    maxWidth: '80%',
    alignSelf: isOwnMessage ? 'flex-end' : 'flex-start',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2
  };

  const textStyle = {
    color: isOwnMessage ? theme.colors.surface : theme.colors.text,
    fontSize: theme.typography.body.fontSize,
    lineHeight: 22
  };

  return (
    <View style={bubbleStyle}>
      <Text style={textStyle}>{message.text}</Text>
      <Text style={[styles.timestamp, { color: theme.colors.textSecondary }]}>
        {formatTime(message.createdAt)}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  timestamp: {
    fontSize: 12,
    marginTop: 4,
    alignSelf: 'flex-end'
  }
});

// Using custom message bubble
<ChatScreen
  memberIds={memberIds}
  partners={partners}
  customMessageBubble={CustomMessageBubble}
/>
```

## Gallery Customization

### Custom Gallery Header

```javascript
const CustomGalleryHeader = () => {
  const theme = useTheme();
  
  return (
    <View style={[styles.galleryHeader, { backgroundColor: theme.colors.surface }]}>
      <View style={styles.headerContent}>
        <Text style={[styles.galleryTitle, { color: theme.colors.text }]}>
          Shared Media
        </Text>
        <Text style={[styles.gallerySubtitle, { color: theme.colors.textSecondary }]}>
          Tap to view full size
        </Text>
      </View>
      <TouchableOpacity style={styles.closeButton}>
        <Text style={[styles.closeIcon, { color: theme.colors.text }]}>✕</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  galleryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0'
  },
  headerContent: {
    flex: 1
  },
  galleryTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4
  },
  gallerySubtitle: {
    fontSize: 14
  },
  closeButton: {
    padding: 8
  },
  closeIcon: {
    fontSize: 20,
    fontWeight: '600'
  }
});

// Using custom gallery header
<GalleryScreen
  renderCustomHeader={CustomGalleryHeader}
  headerStyle={{
    backgroundColor: '#ffffff',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4
  }}
/>
```

### Custom Media Items

```javascript
const CustomMediaItem = ({ item, index }) => {
  const theme = useTheme();
  
  if (item.type === 'image') {
    return (
      <TouchableOpacity style={styles.mediaItem}>
        <Image 
          source={{ uri: item.url }} 
          style={[styles.mediaImage, { borderRadius: theme.borderRadius.md }]}
          resizeMode="cover"
        />
        <View style={styles.mediaOverlay}>
          <Text style={[styles.mediaCaption, { color: theme.colors.surface }]}>
            {item.name}
          </Text>
        </View>
      </TouchableOpacity>
    );
  }
  
  if (item.type === 'video') {
    return (
      <TouchableOpacity style={styles.mediaItem}>
        <View style={[styles.videoContainer, { borderRadius: theme.borderRadius.md }]}>
          <Image 
            source={{ uri: item.thumbnail }} 
            style={styles.videoThumbnail}
            resizeMode="cover"
          />
          <View style={styles.playButton}>
            <Text style={styles.playIcon}>▶️</Text>
          </View>
        </View>
        <Text style={[styles.mediaCaption, { color: theme.colors.text }]}>
          {item.name}
        </Text>
      </TouchableOpacity>
    );
  }
  
  return null;
};

const styles = StyleSheet.create({
  mediaItem: {
    margin: 8,
    borderRadius: 8,
    overflow: 'hidden'
  },
  mediaImage: {
    width: 120,
    height: 120
  },
  mediaOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 8
  },
  mediaCaption: {
    fontSize: 12,
    fontWeight: '500'
  },
  videoContainer: {
    width: 120,
    height: 120,
    position: 'relative'
  },
  videoThumbnail: {
    width: '100%',
    height: '100%'
  },
  playButton: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -15 }, { translateY: -15 }],
    width: 30,
    height: 30,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center'
  },
  playIcon: {
    fontSize: 16
  }
});

// Using custom media items
<GalleryScreen
  renderCustomMedia={CustomMediaItem}
  containerStyle={{
    backgroundColor: '#f8f9fa',
    padding: 16
  }}
/>
```

## Dark Mode Support

### Dark Theme Configuration

```javascript
import { useColorScheme } from 'react-native';

const darkTheme = {
  colors: {
    primary: '#0A84FF',
    secondary: '#5E5CE6',
    background: '#000000',
    surface: '#1C1C1E',
    text: '#FFFFFF',
    textSecondary: '#8E8E93',
    border: '#38383A',
    success: '#30D158',
    error: '#FF453A',
    warning: '#FF9F0A'
  },
  // ... rest of theme
};

const lightTheme = {
  colors: {
    primary: '#007AFF',
    secondary: '#5856D6',
    background: '#F2F2F7',
    surface: '#FFFFFF',
    text: '#000000',
    textSecondary: '#8E8E93',
    border: '#C6C6C8',
    success: '#34C759',
    error: '#FF3B30',
    warning: '#FF9500'
  },
  // ... rest of theme
};

const ThemeAwareApp = () => {
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? darkTheme : lightTheme;

  return (
    <ThemeProvider theme={theme}>
      <ChatProvider userInfo={userInfo}>
        <AppNavigation />
      </ChatProvider>
    </ThemeProvider>
  );
};
```

### Dark Mode Chat Screen

```javascript
const DarkModeChatScreen = ({ route }) => {
  const theme = useTheme();
  const { memberIds, partners } = route.params;

  return (
    <ChatScreen
      memberIds={memberIds}
      partners={partners}
      style={{
        backgroundColor: theme.colors.background
      }}
      customContainerStyle={{
        backgroundColor: theme.colors.surface,
        borderColor: theme.colors.border
      }}
      customTextStyle={{
        color: theme.colors.text,
        fontSize: 16
      }}
      inputToolbarProps={{
        containerStyle: {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.border
        },
        composeWrapperStyle: {
          backgroundColor: theme.colors.background
        },
        composerTextInputStyle: {
          color: theme.colors.text
        }
      }}
    />
  );
};
```

## Responsive Design

### Responsive Chat Screen

```javascript
import { Dimensions } from 'react-native';

const ResponsiveChatScreen = ({ route }) => {
  const { width, height } = Dimensions.get('window');
  const { memberIds, partners } = route.params;
  
  const isTablet = width > 768;
  const isLandscape = width > height;

  const responsiveStyles = {
    container: {
      backgroundColor: '#f8f9fa',
      flex: 1,
      paddingHorizontal: isTablet ? 20 : 10
    },
    messageContainer: {
      backgroundColor: '#ffffff',
      marginVertical: isTablet ? 4 : 2,
      borderRadius: isTablet ? 16 : 12,
      paddingHorizontal: isTablet ? 20 : 16,
      paddingVertical: isTablet ? 16 : 12
    },
    textStyle: {
      fontSize: isTablet ? 18 : 16,
      lineHeight: isTablet ? 26 : 22
    }
  };

  return (
    <ChatScreen
      memberIds={memberIds}
      partners={partners}
      style={responsiveStyles.container}
      customContainerStyle={responsiveStyles.messageContainer}
      customTextStyle={responsiveStyles.textStyle}
      maxPageSize={isTablet ? 30 : 20}
    />
  );
};
```

### Adaptive Layout

```javascript
const AdaptiveLayout = () => {
  const { width } = Dimensions.get('window');
  const isTablet = width > 768;

  if (isTablet) {
    return (
      <View style={styles.tabletLayout}>
        <View style={styles.sidebar}>
          <ListConversationScreen onPress={handleConversationPress} />
        </View>
        <View style={styles.chatArea}>
          <ChatScreen memberIds={memberIds} partners={partners} />
        </View>
      </View>
    );
  }

  return (
    <Stack.Navigator>
      <Stack.Screen name="Conversations" component={ListConversationScreen} />
      <Stack.Screen name="Chat" component={ChatScreen} />
    </Stack.Navigator>
  );
};

const styles = StyleSheet.create({
  tabletLayout: {
    flex: 1,
    flexDirection: 'row'
  },
  sidebar: {
    width: 320,
    borderRightWidth: 1,
    borderRightColor: '#e0e0e0'
  },
  chatArea: {
    flex: 1
  }
});
```

This comprehensive styling guide covers all aspects of customizing the appearance of `rn-firebase-chat` components. For basic usage and API reference, see the main [README](../README.md) and [Props Reference](./PROPS_REFERENCE.md). 