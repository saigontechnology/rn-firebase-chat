import React, { useCallback, useState } from 'react';
import { View, LayoutChangeEvent } from 'react-native';
import { StyleSheet } from 'react-native';
import DurationTimer from './DurationTimer';
import { Rect, Svg } from 'react-native-svg';

interface WaveFormProps {
  isRecording: boolean;
  data: number[];
}

const WaveForm: React.FC<WaveFormProps> = ({ data, isRecording }) => {
  const [widthChart, setWidthChart] = useState(0);

  const height = 20;
  const barWidth = 3;
  const barMargin = 2;
  const numBars = Math.floor(widthChart / (barWidth + barMargin));

  const onLayout = useCallback((event: LayoutChangeEvent) => {
    const { width } = event.nativeEvent.layout;
    setWidthChart(width - 40);
  }, []);

  const renderChart = () => (
    <View onLayout={onLayout} style={styles.chart}>
      <Svg height={height} width={widthChart}>
        {data.slice(-numBars).map((value, index) => {
          const barHeight = value * 0.5;
          const x = index * (barWidth + barMargin);
          const y = height - barHeight;

          return (
            <Rect
              key={index.toString()}
              x={x}
              y={y}
              width={barWidth}
              height={barHeight}
              fill="blue"
            />
          );
        })}
      </Svg>
    </View>
  );

  return (
    <View style={styles.waveformContainer}>
      {/* <View style={styles.viewWave}>{renderChart()}</View> */}
      <DurationTimer
        isRecording={isRecording}
        getDuration={(number) => {
          console.log('number', number);
        }}
      />
    </View>
  );
};

export default WaveForm;

const styles = StyleSheet.create({
  waveformContainer: {
    height: 40,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    backgroundColor: '#E6F3FF',
    borderRadius: 25,
    paddingHorizontal: 15,
    paddingVertical: 5,
    marginBottom: 20,
  },
  viewWave: {
    flex: 1,
  },
  chart: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
