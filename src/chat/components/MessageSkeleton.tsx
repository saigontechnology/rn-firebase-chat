import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';

const SKELETON_ITEMS = [
  { align: 'right', widths: [180, 120] },
  { align: 'left', widths: [220, 80] },
  { align: 'right', widths: [140] },
  { align: 'left', widths: [200, 160, 60] },
  { align: 'right', widths: [100, 180] },
  { align: 'left', widths: [160] },
  { align: 'right', widths: [200, 140] },
];

const SkeletonLine = ({
  width,
  opacity,
}: {
  width: number;
  opacity: Animated.Value;
}) => <Animated.View style={[styles.line, { width, opacity }]} />;

const SkeletonBubble = ({
  align,
  widths,
  opacity,
}: {
  align: 'left' | 'right';
  widths: number[];
  opacity: Animated.Value;
}) => (
  <View
    style={[
      styles.bubbleRow,
      align === 'right' ? styles.rowRight : styles.rowLeft,
    ]}
  >
    {align === 'left' && <Animated.View style={[styles.avatar, { opacity }]} />}
    <Animated.View
      style={[
        styles.bubble,
        align === 'right' ? styles.bubbleRight : styles.bubbleLeft,
        { opacity },
      ]}
    >
      {widths.map((w, i) => (
        <SkeletonLine key={i} width={w} opacity={opacity} />
      ))}
    </Animated.View>
  </View>
);

const MessageSkeleton: React.FC = () => {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [opacity]);

  return (
    <View style={styles.container}>
      {SKELETON_ITEMS.map((item, index) => (
        <SkeletonBubble
          key={index}
          align={item.align as 'left' | 'right'}
          widths={item.widths}
          opacity={opacity}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 8,
    paddingVertical: 12,
    justifyContent: 'flex-end',
  },
  bubbleRow: {
    flexDirection: 'row',
    marginVertical: 6,
    alignItems: 'flex-end',
  },
  rowRight: {
    justifyContent: 'flex-end',
  },
  rowLeft: {
    justifyContent: 'flex-start',
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#d0d0d0',
    marginRight: 8,
  },
  bubble: {
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 6,
  },
  bubbleRight: {
    backgroundColor: '#c8e0ff',
    borderBottomRightRadius: 4,
  },
  bubbleLeft: {
    backgroundColor: '#e0e0e0',
    borderBottomLeftRadius: 4,
  },
  line: {
    height: 12,
    borderRadius: 6,
    backgroundColor: '#b0b0b0',
  },
});

export default MessageSkeleton;
