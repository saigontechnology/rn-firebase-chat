import React, { useCallback, useState } from 'react';
import { View, Alert, StyleSheet, Text, ActivityIndicator } from 'react-native';
import { ChatScreen as BaseChatScreen } from 'rn-firebase-chat';
import {
  CameraView,
  useCamera,
  useEnhancedCamera,
  type CameraHookConfig,
  type CameraAnalytics,
  type MediaProcessingOptions,
} from 'rn-firebase-chat/src/addons/camera';

// Enhanced Chat Screen with Modern Camera Features
export const EnhancedChatScreen: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);

  // Analytics tracking (optional)
  const analytics: CameraAnalytics = {
    trackEvent: (event, properties) => {
      console.log('Camera Analytics:', event, properties);
      // Integrate with your analytics service (Firebase, Mixpanel, etc.)
    },
  };

  // Enhanced camera configuration
  const cameraConfig: CameraHookConfig = {
    enableAutoPermissionRequest: true,
    enableHapticFeedback: true,
    enableSoundEffects: false,
    compressionQuality: 0.8,
    thumbnailQuality: 0.3,
    maxFileSize: 25 * 1024 * 1024, // 25MB
  };

  // Use enhanced camera hook with modern features
  const {
    onPressCamera,
    onPressGallery: onPressGalleryEnhanced,
    isProcessing,
    lastError,
    clearError,
    hasPermission,
    requestCameraPermission,
  } = useEnhancedCamera(cameraConfig, analytics);

  // Media processing options
  const mediaProcessingOptions: MediaProcessingOptions = {
    compress: true,
    generateThumbnail: true,
    watermark: {
      text: 'MyApp',
      position: 'bottom-right',
    },
  };

  // Enhanced gallery handler with processing
  const handleGalleryPress = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await onPressGalleryEnhanced(mediaProcessingOptions);
      if (result) {
        console.log('Media selected and processed:', result);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to process media');
    } finally {
      setIsLoading(false);
    }
  }, [onPressGalleryEnhanced]);

  // Error handling
  React.useEffect(() => {
    if (lastError) {
      Alert.alert(
        'Camera Error',
        lastError.message,
        [
          { text: 'OK', onPress: clearError },
          ...(lastError.type === 'permission-denied'
            ? [{ text: 'Settings', onPress: () => requestCameraPermission() }]
            : []
          ),
        ]
      );
    }
  }, [lastError, clearError, requestCameraPermission]);

  return (
    <View style={styles.container}>
      {(isProcessing || isLoading) && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Processing media...</Text>
        </View>
      )}

      <BaseChatScreen
        memberIds={['partner-id']}
        partners={[{ id: 'partner-id', name: 'Partner Name' }]}
        inputToolbarProps={{
          hasCamera: true,
          hasGallery: true,
          onPressCamera,
          onPressGallery: handleGalleryPress,
          // Custom icons
          cameraIcon: require('./assets/custom-camera.png'),
          galleryIcon: require('./assets/custom-gallery.png'),
          // Custom styles
          iconStyle: styles.customIcon,
          containerStyle: styles.inputContainer,
        }}
        // Custom bubble rendering for enhanced media display
        renderBubble={(props) => (
          <EnhancedMediaBubble {...props} />
        )}
      >
        {({ onSend }) => (
          <CameraView
            onSend={onSend}
            iconProps={{
              back: require('./assets/custom-back.png'),
              cameraChange: require('./assets/custom-flip.png'),
              flashOn: require('./assets/custom-flash-on.png'),
              flashOff: require('./assets/custom-flash-off.png'),
            }}
          />
        )}
      </BaseChatScreen>
    </View>
  );
};

// Enhanced Media Bubble Component
const EnhancedMediaBubble: React.FC<any> = ({ currentMessage, ...props }) => {
  if (currentMessage?.image || currentMessage?.video) {
    return (
      <View style={styles.mediaBubble}>
        {/* Enhanced media rendering with thumbnails, loading states, etc. */}
        <Text>Enhanced Media Bubble</Text>
      </View>
    );
  }
  return null;
};

// Basic Chat Screen (Backward Compatible)
export const BasicChatScreen: React.FC = () => {
  // Simple usage with basic camera hook
  const { onPressCamera, onPressGallery } = useCamera();

  return (
    <BaseChatScreen
      memberIds={['partner-id']}
      partners={[{ id: 'partner-id', name: 'Partner Name' }]}
      inputToolbarProps={{
        hasCamera: true,
        hasGallery: true,
        onPressCamera,
        onPressGallery,
      }}
    >
      {({ onSend }) => <CameraView onSend={onSend} />}
    </BaseChatScreen>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  loadingText: {
    color: 'white',
    marginTop: 16,
    fontSize: 16,
  },
  customIcon: {
    width: 28,
    height: 28,
    tintColor: '#007AFF',
  },
  inputContainer: {
    backgroundColor: '#f8f9fa',
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
  },
  mediaBubble: {
    padding: 16,
    backgroundColor: '#f0f0f0',
    borderRadius: 12,
    margin: 8,
  },
});

export default EnhancedChatScreen;
