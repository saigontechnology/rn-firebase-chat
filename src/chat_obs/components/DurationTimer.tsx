import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
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
      interval.current = setInterval(() => {
        setDuration((prevDuration) => prevDuration + 1);
      }, 1000);
    }
  }, [isRecording]);

  useEffect(() => {
    return () => {
      stopRecordingTimer();
    };
  }, [isRecording]);

  return (
    <View style={styles.viewDuration}>
      <Text style={styles.durationText}>{formatTime(duration)}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  viewDuration: {
    marginLeft: 10,
  },
  durationText: {
    color: '#000',
    fontSize: 16,
    zIndex: 1,
  },
});

export default React.memo(DurationTimer);
