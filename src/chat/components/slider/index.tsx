import React, { useCallback, useState } from 'react';
import {
  View,
  PanResponder,
  Animated,
  StyleSheet,
  GestureResponderEvent,
  PanResponderGestureState,
  StyleProp,
  ViewStyle,
} from 'react-native';

interface CustomSliderProps {
  duration: number;
  currentTime: number;
  onSlideRelease: (value: number) => void;
  onSlideStart?: () => void;
  onSlideMove?: (
    e: GestureResponderEvent,
    gestureState: PanResponderGestureState
  ) => void;
  sliderContainer?: StyleProp<ViewStyle>;
  sliderTrack?: StyleProp<ViewStyle>;
  sliderThumb?: StyleProp<ViewStyle>;
}

const CustomSlider: React.FC<CustomSliderProps> = ({
  duration,
  currentTime,
  onSlideRelease,
  onSlideStart,
  onSlideMove,
  sliderContainer,
  sliderTrack,
  sliderThumb,
}) => {
  const [sliderWidth, setSliderWidth] = useState(0);

  const getSliderPosition = useCallback(() => {
    if (duration === 0) {
      return 0;
    }
    return Math.round((currentTime / duration) * sliderWidth);
  }, [currentTime, duration, sliderWidth]);

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onPanResponderGrant: () => {
      onSlideStart?.();
    },
    onPanResponderMove: (e, gestureState) => {
      onSlideMove?.(e, gestureState);
    },
    onPanResponderRelease: (e, gestureState) => {
      const newCalValue =
        Math.round((gestureState.dx / sliderWidth) * duration) + currentTime;
      onSlideRelease(newCalValue);
    },
  });

  return (
    <View
      style={[styles.sliderContainer, sliderContainer]}
      onLayout={(event) => {
        setSliderWidth(event.nativeEvent.layout.width - 20);
      }}
    >
      <View style={[styles.sliderTrack, sliderTrack]} />
      <Animated.View
        {...panResponder.panHandlers}
        style={[
          [styles.sliderThumb, sliderThumb],
          { transform: [{ translateX: getSliderPosition() }] },
        ]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  sliderContainer: {
    flex: 1,
    height: 20,
    justifyContent: 'center',
  },
  sliderTrack: {
    height: 4,
    backgroundColor: 'gray',
    borderRadius: 2,
  },
  sliderThumb: {
    width: 20,
    height: 20,
    backgroundColor: 'white',
    borderRadius: 10,
    position: 'absolute',
  },
});

export default CustomSlider;
