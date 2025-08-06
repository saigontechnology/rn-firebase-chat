# Props Reference

This document provides detailed information about all components, props, and interfaces available in `rn-firebase-chat`.

## Table of Contents

- [ChatProvider](#chatprovider)
- [ChatScreen](#chatscreen)
- [ListConversationScreen](#listconversationscreen)
- [GalleryScreen](#galleryscreen)
- [IInputToolbar](#iinputtoolbar)
- [Interfaces](#interfaces)

## ChatProvider

The main provider component that manages chat context and configurations. This component must wrap your entire app to provide chat functionality.

### Required Props

| Prop Name | Type | Description |
|-----------|------|-------------|
| `userInfo` | `IUserInfo` | Current user information object with `id`, `name`, and `avatar` |
| `children` | `React.ReactNode` | React children elements |

### Optional Props

> For advanced configuration options (such as encryption, environment prefixes, and custom encryption functions), see the [Advanced Configuration](./ADVANCED_CONFIGURATION.md) documentation.

| Prop Name | Type | Default | Description |
|-----------|------|---------|-------------|
| `enableEncrypt` | `boolean` | `false` | Enables message encryption using AES |
| `encryptKey` | `string` | `''` | Encryption key for secure messages |
| `blackListWords` | `string[]` | `[]` | Array of words to filter out from messages |
| `encryptionOptions` | `EncryptionOptions` | - | Advanced encryption configuration |
| `encryptionFuncProps` | `EncryptionFunctions` | - | Custom encryption functions |
| `prefix` | `string` | `''` | Prefix for different environments (dev/stage/prod) |

### Example

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
      encryptKey="your-secret-key"
      blackListWords={['spam', 'inappropriate']}
    >
      <AppNavigation />
    </ChatProvider>
  );
}
```

## ChatScreen

The main chat interface component for displaying and sending messages. This component handles real-time messaging, media sharing, and message status.

### Required Props

| Prop Name | Type | Description |
|-----------|------|-------------|
| `memberIds` | `string[]` | Array of member IDs in the chat |
| `partners` | `IUserInfo[]` | Array of user information for chat partners |

### Optional Props

| Prop Name | Type | Default | Description |
|-----------|------|---------|-------------|
| `style` | `StyleProp<ViewStyle>` | - | Custom style for the chat screen container |
| `hasCamera` | `boolean` | `false` | Enable camera functionality |
| `hasGallery` | `boolean` | `false` | Enable gallery functionality |
| `enableTyping` | `boolean` | `false` | Enable typing indicators |
| `messageStatusEnable` | `boolean` | `false` | Enable message status indicators |
| `maxPageSize` | `number` | `20` | Maximum number of messages to load per page |
| `typingTimeoutSeconds` | `number` | `3` | Timeout for typing indicator in seconds |
| `timeoutSendNotify` | `number` | `3` | Timeout for sending notifications in seconds |
| `inputToolbarProps` | `IInputToolbar` | - | Props for customizing the input toolbar |
| `customContainerStyle` | `StyleProp<ViewStyle>` | - | Custom style for the message container |
| `customTextStyle` | `StyleProp<ViewStyle>` | - | Custom style for text messages |
| `onStartLoad` | `() => void` | - | Callback function when loading starts |
| `onLoadEnd` | `() => void` | - | Callback function when loading ends |
| `onPressCamera` | `() => void` | - | Callback function for camera button press |
| `sendMessageNotification` | `() => void` | - | Callback function to send notification |
| `customMessageStatus` | `(hasUnread: boolean) => JSX.Element` | - | Custom component for message status |
| `unReadSentMessage` | `string` | - | Custom text for unread sent message |
| `unReadSeenMessage` | `string` | - | Custom text for unread seen message |
| `customImageVideoBubbleProps` | `CustomImageVideoBubbleProps` | - | Custom props for image and video bubbles |
| `customConversationInfo` | `CustomConversationInfo` | - | Custom information for the conversation |
| `iconsCamera` | `IconPaths` | - | Paths for various camera icons |

### Example

```javascript
import { ChatScreen } from 'rn-firebase-chat';

const ChatScreenComponent = ({ route }) => {
  const { memberIds, partners } = route.params;

  const handleStartLoad = () => {
    console.log('Loading messages...');
  };

  const handleLoadEnd = () => {
    console.log('Messages loaded');
  };

  return (
    <ChatScreen
      memberIds={memberIds}
      partners={partners}
      hasCamera={true}
      hasGallery={true}
      enableTyping={true}
      messageStatusEnable={true}
      maxPageSize={25}
      onStartLoad={handleStartLoad}
      onLoadEnd={handleLoadEnd}
      customContainerStyle={{
        backgroundColor: '#f8f9fa'
      }}
      customTextStyle={{
        fontSize: 16,
        color: '#333'
      }}
    />
  );
};
```

## ListConversationScreen

Displays a list of conversations with optional search functionality. This component shows all conversations for the current user.

### Props

| Prop Name | Type | Default | Description |
|-----------|------|---------|-------------|
| `hasSearchBar` | `boolean` | `false` | Enable search bar for filtering conversations |
| `onPress` | `(conversation: ConversationProps) => void` | - | Callback function when a conversation is pressed |
| `renderCustomItem` | `({ item, index }: ListItem) => JSX.Element` | - | Function to render custom conversation items |
| `conversationItemProps` | `Omit<IConversationItemProps, 'data' \| 'onPress'>` | - | Props for customizing conversation items |

### Example

```javascript
import { ListConversationScreen } from 'rn-firebase-chat';

const ListConversationScreenComponent = () => {
  const navigation = useNavigation();

  const handleConversationPress = (conversation) => {
    navigation.navigate('Chat', {
      memberIds: conversation.memberIds,
      partners: conversation.partners
    });
  };

  const renderCustomItem = ({ item, index }) => {
    return (
      <View style={customStyles.conversationItem}>
        <Text>{item.name}</Text>
        <Text>{item.lastMessage}</Text>
      </View>
    );
  };

  return (
    <ListConversationScreen
      hasSearchBar={true}
      onPress={handleConversationPress}
      renderCustomItem={renderCustomItem}
      conversationItemProps={{
        showAvatar: true,
        showLastMessage: true,
        showTimestamp: true
      }}
    />
  );
};
```

## GalleryScreen

Modal component for displaying media, files, and links shared in conversations. This component provides a gallery view for all shared content.

### Props

| Prop Name | Type | Description |
|-----------|------|-------------|
| `renderCustomHeader` | `() => JSX.Element` | Function to render custom header for the gallery modal |
| `renderCustomMedia` | `({ item, index }: MediaItem) => JSX.Element` | Function to render custom media items (images/videos) |
| `renderCustomFile` | `() => JSX.Element` | Function to render custom file items (documents) |
| `renderCustomLink` | `() => JSX.Element` | Function to render custom link items |
| `iconCloseModal` | `ImageRequireSource` | Icon to display for closing the modal |
| `customSlider` | `(currentTime: number, duration: number, paused: boolean, videoRef: VideoRef) => React.ReactNode` | Custom video slider component |
| `headerStyle` | `StyleProp<ViewStyle>` | Custom style for the header of the modal |
| `tabStyle` | `StyleProp<ViewStyle>` | Custom style for the tabs in the modal |
| `activeTabStyle` | `StyleProp<ViewStyle>` | Custom style for the active tab in the modal |
| `tabTextStyle` | `StyleProp<ViewStyle>` | Custom style for the tab text |
| `activeTabTextStyle` | `StyleProp<ViewStyle>` | Custom style for the text of the active tab |
| `tabIndicatorStyle` | `StyleProp<ViewStyle>` | Custom style for the tab indicator |
| `containerStyle` | `StyleProp<ViewStyle>` | Custom style for the main container of the modal |

### Example

```javascript
import { GalleryScreen } from 'rn-firebase-chat';

const GalleryScreenComponent = () => {
  const renderCustomHeader = () => (
    <View style={customStyles.header}>
      <Text style={customStyles.headerText}>Shared Media</Text>
    </View>
  );

  const renderCustomMedia = ({ item, index }) => (
    <View style={customStyles.mediaItem}>
      <Image source={{ uri: item.url }} style={customStyles.mediaImage} />
      <Text>{item.name}</Text>
    </View>
  );

  return (
    <GalleryScreen
      renderCustomHeader={renderCustomHeader}
      renderCustomMedia={renderCustomMedia}
      headerStyle={customStyles.galleryHeader}
      tabStyle={customStyles.galleryTab}
      activeTabStyle={customStyles.galleryActiveTab}
    />
  );
};
```

## IInputToolbar

Configuration object for customizing the input toolbar. This interface allows you to customize the appearance and behavior of the message input area.

### Properties

| Prop Name | Type | Description |
|-----------|------|-------------|
| `hasCamera` | `boolean` | Indicates whether the camera option is enabled |
| `hasGallery` | `boolean` | Indicates whether the gallery option is enabled |
| `onPressCamera` | `() => void` | Callback function triggered when the camera icon is pressed |
| `onPressGallery` | `() => void` | Callback function triggered when the gallery icon is pressed |
| `containerStyle` | `StyleProp<ViewStyle>` | Custom style for the toolbar container |
| `composeWrapperStyle` | `StyleProp<ViewStyle>` | Custom style for the compose wrapper |
| `composerTextInputStyle` | `StyleProp<ViewStyle>` | Custom style for the composer text input |
| `customViewStyle` | `StyleProp<ViewStyle>` | Custom style for the custom view |
| `cameraIcon` | `string` | Icon path for the camera button |
| `galleryIcon` | `string` | Icon path for the gallery button |
| `iconSend` | `string` | Icon path for the send button |
| `iconStyle` | `StyleProp<ImageStyle>` | Custom style for the icons |
| `renderLeftCustomView` | `() => React.ReactNode` | Function to render a custom view on the left side of the toolbar |
| `renderRightCustomView` | `() => React.ReactNode` | Function to render a custom view on the right side of the toolbar |

### Example

```javascript
const inputToolbarConfig = {
  hasCamera: true,
  hasGallery: true,
  onPressCamera: () => {
    console.log('Camera pressed');
  },
  onPressGallery: () => {
    console.log('Gallery pressed');
  },
  containerStyle: {
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    paddingHorizontal: 10,
    paddingVertical: 5
  },
  composerTextInputStyle: {
    backgroundColor: '#f8f9fa',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 8,
    fontSize: 16
  },
  cameraIcon: require('./assets/camera.png'),
  galleryIcon: require('./assets/gallery.png'),
  iconSend: require('./assets/send.png'),
  renderLeftCustomView: () => (
    <TouchableOpacity style={customStyles.attachButton}>
      <Text>📎</Text>
    </TouchableOpacity>
  )
};

<ChatScreen
  memberIds={memberIds}
  partners={partners}
  inputToolbarProps={inputToolbarConfig}
/>
```

## Interfaces

### IUserInfo

Interface for user information objects.

```typescript
interface IUserInfo {
  id: string;
  name: string;
  avatar?: string;
  image?: string; // Alternative to avatar
}
```

### ConversationProps

Interface for conversation data.

```typescript
interface ConversationProps {
  id: string;
  memberIds: string[];
  partners: IUserInfo[];
  lastMessage?: string;
  lastMessageTime?: Date;
  unreadCount?: number;
}
```

### ListItem

Interface for list item data.

```typescript
interface ListItem {
  item: ConversationProps;
  index: number;
}
```

### MediaItem

Interface for media item data.

```typescript
interface MediaItem {
  item: {
    id: string;
    url: string;
    name: string;
    type: 'image' | 'video' | 'file' | 'link';
  };
  index: number;
}
```

### EncryptionOptions

Interface for encryption configuration.

```typescript
interface EncryptionOptions {
  algorithm?: string;
  keySize?: number;
  ivSize?: number;
}
```

### EncryptionFunctions

Interface for custom encryption functions.

```typescript
interface EncryptionFunctions {
  encrypt?: (text: string, key: string) => Promise<string>;
  decrypt?: (encryptedText: string, key: string) => Promise<string>;
}
```

### CustomImageVideoBubbleProps

Interface for custom image/video bubble configuration.

```typescript
interface CustomImageVideoBubbleProps {
  imageStyle?: StyleProp<ImageStyle>;
  videoStyle?: StyleProp<ViewStyle>;
  playButtonStyle?: StyleProp<ViewStyle>;
  thumbnailStyle?: StyleProp<ImageStyle>;
}
```

### CustomConversationInfo

Interface for custom conversation information.

```typescript
interface CustomConversationInfo {
  title?: string;
  subtitle?: string;
  avatar?: string;
  status?: 'online' | 'offline' | 'away';
}
```

### IconPaths

Interface for camera icon paths.

```typescript
interface IconPaths {
  camera?: string;
  flashOn?: string;
  flashOff?: string;
  switchCamera?: string;
  close?: string;
}
```

### VideoRef

Type for video reference.

```typescript
type VideoRef = React.RefObject<any>;
```

## Advanced Usage Examples

### Custom Message Status Component

```javascript
const CustomMessageStatus = ({ hasUnread }) => (
  <View style={styles.statusContainer}>
    {hasUnread ? (
      <View style={styles.unreadIndicator}>
        <Text style={styles.unreadText}>New</Text>
      </View>
    ) : (
      <Text style={styles.readText}>✓✓</Text>
    )}
  </View>
);

<ChatScreen
  memberIds={memberIds}
  partners={partners}
  messageStatusEnable={true}
  customMessageStatus={CustomMessageStatus}
/>
```

### Custom Input Toolbar with Additional Features

```javascript
const CustomInputToolbar = () => {
  const [isRecording, setIsRecording] = useState(false);

  const inputToolbarProps = {
    hasCamera: true,
    hasGallery: true,
    renderRightCustomView: () => (
      <View style={styles.rightToolbar}>
        <TouchableOpacity 
          onPress={() => setIsRecording(!isRecording)}
          style={[styles.recordButton, isRecording && styles.recording]}
        >
          <Text>{isRecording ? '⏹️' : '🎤'}</Text>
        </TouchableOpacity>
      </View>
    ),
    containerStyle: {
      backgroundColor: '#f0f0f0',
      paddingHorizontal: 15,
      paddingVertical: 10
    }
  };

  return (
    <ChatScreen
      memberIds={memberIds}
      partners={partners}
      inputToolbarProps={inputToolbarProps}
    />
  );
};
```

### Custom Gallery with Filtering

```javascript
const CustomGallery = () => {
  const renderCustomMedia = ({ item, index }) => {
    if (item.type === 'image') {
      return (
        <TouchableOpacity style={styles.mediaItem}>
          <Image source={{ uri: item.url }} style={styles.mediaImage} />
          <Text style={styles.mediaCaption}>{item.name}</Text>
        </TouchableOpacity>
      );
    }
    return null;
  };

  return (
    <GalleryScreen
      renderCustomMedia={renderCustomMedia}
      renderCustomHeader={() => (
        <View style={styles.galleryHeader}>
          <Text style={styles.galleryTitle}>Shared Images</Text>
          <Text style={styles.gallerySubtitle}>Tap to view full size</Text>
        </View>
      )}
    />
  );
};
```

This API reference provides comprehensive documentation for all components and interfaces in the `rn-firebase-chat` library. For additional examples and use cases, refer to the main README file. 