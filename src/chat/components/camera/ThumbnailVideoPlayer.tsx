import React, { useState } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Video, { OnLoadData } from 'react-native-video';
import { formatTime } from '../../../utilities';

const { width } = Dimensions.get('window');

interface ThumbnailVideoPlayerProps {
  videoUrl: string;
}

export const ThumbnailVideoPlayer: React.FC<ThumbnailVideoPlayerProps> = ({
  videoUrl,
}) => {
  const [duration, setDuration] = useState<number>(0);

  const handleLoad = (meta: OnLoadData) => {
    setDuration(meta.duration);
  };

  return (
    <View style={styles.container}>
      <Video
        source={{ uri: videoUrl }}
        style={styles.video}
        onLoad={handleLoad}
        resizeMode="stretch"
        paused
        controls={false}
      />
      <View style={styles.durationContainer}>
        <Text style={styles.durationText}>{formatTime(duration)}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  video: {
    width: width / 3 - 5,
    height: width / 3,
  },
  durationContainer: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 10,
    paddingVertical: 2,
    paddingHorizontal: 5,
  },
  durationText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
});
