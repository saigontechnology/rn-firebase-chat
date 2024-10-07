import React, { useCallback, useEffect, useState } from 'react';
import {
  Image,
  ImageResizeMode,
  ImageStyle,
  LayoutAnimation,
  LayoutChangeEvent,
  Linking,
  StyleProp,
  StyleSheet,
  Text,
  TouchableWithoutFeedback,
  TouchableWithoutFeedbackProps,
  View,
  ViewStyle,
} from 'react-native';
import { PreviewData, PreviewDataImage } from '../../../interfaces';
import { getPreviewData } from '../../../utilities';

export interface LinkPreviewProps {
  containerStyle?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
  enableAnimation?: boolean;
  thumbnailResizeMode?: ImageResizeMode;
  thumbnailStyle?: StyleProp<ImageStyle>;
  metadataContainerStyle?: StyleProp<ViewStyle>;
  metadataTextContainerStyle?: StyleProp<ViewStyle>;
  onPreviewDataFetched?: (previewData: PreviewData) => void;
  previewData?: PreviewData;
  requestTimeout?: number;
  text: string;
  textContainerStyle?: StyleProp<ViewStyle>;
  touchableWithoutFeedbackProps?: TouchableWithoutFeedbackProps;
}

export const LinkPreview = ({
  containerStyle,
  contentStyle,
  enableAnimation,
  metadataContainerStyle,
  metadataTextContainerStyle,
  onPreviewDataFetched,
  previewData,
  requestTimeout = 5000,
  text,
  textContainerStyle,
  touchableWithoutFeedbackProps,
  thumbnailResizeMode = 'contain',
  thumbnailStyle,
}: LinkPreviewProps) => {
  const [containerWidth, setContainerWidth] = useState(0);
  const [data, setData] = useState(previewData);
  const aspectRatio = data?.image
    ? data.image.width / data.image.height
    : undefined;

  useEffect(() => {
    let isCancelled = false;
    if (previewData) {
      setData(previewData);
      return;
    }

    const fetchData = async () => {
      setData(undefined);
      const newData = await getPreviewData(text, requestTimeout);
      if (!isCancelled) {
        if (enableAnimation) {
          LayoutAnimation.easeInEaseOut();
        }
        setData(newData);
        onPreviewDataFetched?.(newData);
      }
    };

    fetchData();
    return () => {
      isCancelled = true;
    };
  }, [
    enableAnimation,
    onPreviewDataFetched,
    previewData,
    requestTimeout,
    text,
  ]);

  const handleContainerLayout = useCallback((event: LayoutChangeEvent) => {
    setContainerWidth(event.nativeEvent.layout.width);
  }, []);

  const handlePress = useCallback(() => {
    if (data?.link) {
      Linking.openURL(data.link);
    }
  }, [data?.link]);

  const renderDescriptionNode = useCallback((description: string) => {
    return (
      <Text numberOfLines={4} style={styles.description}>
        {description}
      </Text>
    );
  }, []);

  const renderImageNode = useCallback(
    (image: PreviewDataImage) => {
      const ar = aspectRatio ?? 1;
      return (
        <Image
          accessibilityRole="image"
          resizeMode={thumbnailResizeMode}
          source={{ uri: image.url }}
          style={StyleSheet.flatten([
            styles.image,
            ar < 1
              ? {
                  height: containerWidth,
                  minWidth: 170,
                  width: containerWidth * ar,
                }
              : {
                  height: containerWidth / ar,
                  maxHeight: containerWidth,
                  width: containerWidth,
                },
            thumbnailStyle,
          ])}
        />
      );
    },
    [aspectRatio, containerWidth, thumbnailResizeMode, thumbnailStyle]
  );

  const renderTitleNode = useCallback(
    (title: string) => (
      <Text numberOfLines={3} style={styles.title}>
        {title}
      </Text>
    ),
    []
  );

  const renderLinkPreviewNode = useCallback(
    () => (
      <View style={contentStyle}>
        {data?.image &&
          (aspectRatio !== 1 || (!data?.description && !data.title)) &&
          renderImageNode(data.image)}
        <View
          style={StyleSheet.flatten([styles.textContainer, textContainerStyle])}
        >
          {(data?.description ||
            (data?.image && (data?.description || data?.title)) ||
            data?.title) && (
            <View
              style={StyleSheet.flatten([
                styles.metadataContainer,
                metadataContainerStyle,
              ])}
            >
              <View
                style={StyleSheet.flatten([
                  styles.metadataTextContainer,
                  metadataTextContainerStyle,
                ])}
              >
                {data?.title && renderTitleNode(data.title)}
                {data?.description && renderDescriptionNode(data.description)}
              </View>
            </View>
          )}
        </View>
      </View>
    ),
    [
      contentStyle,
      textContainerStyle,
      data?.description,
      data?.image,
      data?.title,
      aspectRatio,
      metadataContainerStyle,
      metadataTextContainerStyle,
      renderTitleNode,
      renderDescriptionNode,
      renderImageNode,
    ]
  );

  return (
    <TouchableWithoutFeedback
      accessibilityRole="button"
      onPress={handlePress}
      {...touchableWithoutFeedbackProps}
    >
      <View onLayout={handleContainerLayout} style={containerStyle}>
        {renderLinkPreviewNode()}
      </View>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  description: {
    marginTop: 4,
  },
  image: {
    alignSelf: 'center',
    backgroundColor: '#f7f7f8',
  },
  metadataContainer: {
    flexDirection: 'row',
    marginTop: 16,
  },
  metadataTextContainer: {
    flex: 1,
  },
  textContainer: {
    marginHorizontal: 24,
    marginVertical: 16,
  },
  title: {
    fontWeight: 'bold',
  },
});
