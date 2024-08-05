import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  ImageRequireSource,
  StyleProp,
  ViewStyle,
} from 'react-native';
import FastImage from 'react-native-fast-image';
import { FirestoreServices } from '../services/firebase';
import { MessageTypes, type MediaFile } from '../interfaces';
import { GalleryType } from '../interfaces/gallery';
import { VideoRef } from 'react-native-video';
import { SelectedViewModal, ThumbnailVideoPlayer } from './components/camera';
type MediaItem = {
  item: MediaFile;
  index: number;
};

const { width } = Dimensions.get('window');

interface GalleryModalProps {
  renderCustomHeader?: () => JSX.Element;
  renderCustomMedia?: ({ item, index }: MediaItem) => JSX.Element | null;
  renderCustomFile?: () => JSX.Element;
  renderCustomLink?: () => JSX.Element;
  iconCloseModal?: ImageRequireSource;
  customSlider?: (
    currentTime: number,
    duration: number,
    paused: boolean,
    videoRef: VideoRef | null
  ) => React.ReactNode;
  headerStyle?: StyleProp<ViewStyle>;
  tabStyle?: StyleProp<ViewStyle>;
  activeTabStyle?: StyleProp<ViewStyle>;
  tabTextStyle?: StyleProp<ViewStyle>;
  activeTabTextStyle?: StyleProp<ViewStyle>;
  tabIndicatorStyle?: StyleProp<ViewStyle>;
  containerStyle?: StyleProp<ViewStyle>;
}

export const GalleryScreen: React.FC<GalleryModalProps> = ({
  renderCustomHeader,
  renderCustomMedia,
  renderCustomFile,
  renderCustomLink,
  iconCloseModal,
  customSlider,
  headerStyle,
  tabStyle,
  activeTabStyle,
  tabTextStyle,
  activeTabTextStyle,
  tabIndicatorStyle,
  containerStyle,
}) => {
  const [activeTab, setActiveTab] = useState(GalleryType.MEDIA);
  const [media, setMedia] = useState<MediaFile[]>([]);
  const firebaseInstance = useRef(FirestoreServices.getInstance()).current;
  const [mediaSelected, setMediaSelected] = useState<MediaFile>();

  useEffect(() => {
    if (activeTab === GalleryType.MEDIA) {
      const loadImages = async () => {
        const urls = await firebaseInstance.getMediaFilesByConversationId();
        setMedia(urls);
      };
      loadImages();
    }
  }, [activeTab, firebaseInstance]);

  const renderImage = ({ item, index }: MediaItem) => {
    if (renderCustomMedia) return renderCustomMedia({ item, index });
    return (
      <TouchableOpacity onPress={() => setMediaSelected(item)}>
        {item.type === MessageTypes.video ? (
          <ThumbnailVideoPlayer videoUrl={item.path} />
        ) : (
          <FastImage source={{ uri: item.path }} style={styles.image} />
        )}
      </TouchableOpacity>
    );
  };

  const renderHeader = (): JSX.Element => {
    if (renderCustomHeader) return renderCustomHeader();
    return (
      <View style={[styles.tabContainer, headerStyle]}>
        {[GalleryType.MEDIA, GalleryType.FILE, GalleryType.LINK].map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, tabStyle, activeTab === tab && activeTabStyle]}
            onPress={() => setActiveTab(tab)}
          >
            <Text
              style={[
                styles.tabText,
                tabTextStyle,
                (activeTab === tab && styles.activeTabText) ||
                  activeTabTextStyle,
              ]}
            >
              {tab.toUpperCase()}
            </Text>
            {activeTab === tab && (
              <View style={[styles.tabIndicator, tabIndicatorStyle]} />
            )}
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const renderContent = () => {
    switch (activeTab) {
      case GalleryType.MEDIA:
        return (
          <View>
            <FlatList
              data={media}
              renderItem={renderImage}
              keyExtractor={(item) => item.id}
              numColumns={3}
            />
            <SelectedViewModal
              url={mediaSelected?.path}
              type={mediaSelected?.type}
              onClose={() => setMediaSelected(undefined)}
              iconClose={iconCloseModal}
              customSlider={customSlider}
            />
          </View>
        );
      case GalleryType.FILE:
        if (renderCustomFile) return renderCustomFile();
        return (
          <View style={styles.centeredView}>
            <Text>No Files Available</Text>
          </View>
        );
      case GalleryType.LINK:
        if (renderCustomLink) return renderCustomLink();
        return (
          <View style={styles.centeredView}>
            <Text>No Links Available</Text>
          </View>
        );
      default:
        return null;
    }
  };

  return (
    <View style={[styles.container, containerStyle]}>
      {renderHeader()}
      {renderContent()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  tabContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    position: 'relative',
  },
  tabText: {
    color: '#8888',
    fontSize: 16,
  },
  activeTabText: {
    color: 'black',
  },
  activeTab: {},
  tabIndicator: {
    position: 'absolute',
    bottom: -1,
    height: 2,
    width: '100%',
    backgroundColor: 'gray',
  },
  image: {
    width: width / 3,
    height: width / 3,
    margin: 1,
  },
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
