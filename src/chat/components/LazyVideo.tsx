import React, { forwardRef } from 'react';
import { View, Text, StyleSheet } from 'react-native';

let VideoComponent: any = null;
let videoLoadAttempted = false;

const loadVideoComponent = () => {
  if (VideoComponent) return VideoComponent;
  if (videoLoadAttempted) return null;
  videoLoadAttempted = true;
  try {
    VideoComponent = require('react-native-video').default;
    return VideoComponent;
  } catch {
    console.warn(
      'react-native-video is not installed. Video playback is unavailable. ' +
        'Install it with: yarn add react-native-video'
    );
    return null;
  }
};

export const LazyVideo = forwardRef<any, any>((props, ref) => {
  const Video = loadVideoComponent();
  if (!Video) {
    return (
      <View style={[props.style, styles.placeholder]}>
        <Text style={styles.placeholderText}>Video not available</Text>
      </View>
    );
  }
  return <Video ref={ref} {...props} />;
});

const styles = StyleSheet.create({
  placeholder: {
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    color: '#fff',
    fontSize: 14,
  },
});
