import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { formatTime } from '../../utilities';

interface DurationTimerProps {
  getDuration: (duration: number) => void;
  isRecording: boolean;
  isReplay?: boolean;
}

const DurationTimer: React.FC<DurationTimerProps> = ({
  getDuration,
  isRecording,
  isReplay,
}) => {
  const [duration, setDuration] = useState<number>(0);
  const interval = useRef<NodeJS.Timeout>();
  const animRef = useRef(new Animated.Value(1)).current;

  const stopRecordingTimer = () => {
    if (interval.current) {
      clearInterval(interval.current);
    }
  };

  useEffect(() => {
    if (isReplay) {
      stopRecordingTimer();
      getDuration(duration);
    }
  }, [duration, getDuration, isReplay]);

  useEffect(() => {
    if (isRecording) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(animRef, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(animRef, {
            toValue: 0,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();
      interval.current = setInterval(() => {
        setDuration((prevDuration) => prevDuration + 1);
      }, 1000);
    }
  }, [animRef, isRecording]);

  useEffect(() => {
    return () => {
      stopRecordingTimer();
    };
  }, [isRecording]);

  return (
    <View style={styles.viewDuration}>
      <Animated.View style={[styles.indicator, { opacity: animRef }]} />
      <Text style={styles.durationText}>{formatTime(duration)}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  viewDuration: {
    height: 50,
    marginLeft: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  durationText: {
    color: '#000',
    fontSize: 16,
    zIndex: 1,
  },
  indicator: {
    width: 8,
    height: 8,
    marginRight: 8,
    borderRadius: 4,
    backgroundColor: 'red',
  },
});

export default React.memo(DurationTimer);
