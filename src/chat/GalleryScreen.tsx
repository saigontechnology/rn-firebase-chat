import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  ImageRequireSource,
} from 'react-native';
import FastImage from 'react-native-fast-image';
import { FirestoreServices } from '../services/firebase';
import { MessageTypes, type MediaFile } from '../interfaces';
import ThumbnailVideoPlayer from './components/camera/ThumbnailVideoPlayer';
import SelectedViewModal from './components/camera/SelectedViewModal';
import { GalleryType } from '../interfaces/gallery';
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
}

export const GalleryScreen: React.FC<GalleryModalProps> = ({
  renderCustomHeader,
  renderCustomMedia,
  renderCustomFile,
  renderCustomLink,
  iconCloseModal,
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
      <View style={styles.tabContainer}>
        {[GalleryType.MEDIA, GalleryType.FILE, GalleryType.LINK].map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.activeTab]}
            onPress={() => setActiveTab(tab)}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === tab && styles.activeTabText,
              ]}
            >
              {tab.toUpperCase()}
            </Text>
            {activeTab === tab && <View style={styles.tabIndicator} />}
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
    <View style={styles.container}>
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
