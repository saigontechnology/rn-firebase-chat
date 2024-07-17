import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  // FlatList,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
// import FastImage from 'react-native-fast-image';
import { FirestoreServices } from '../services/firebase';
// import { MessageTypes, type MediaFile } from '../interfaces';
// import ThumbnailVideoPlayer from '../chat_obs/components/ThumbnailVideoPlayer';
// import SelectedViewModal from '../chat_obs/components/SelectedViewModal';
import { Links, SectionData } from './components/links/Links';
import { transformLinksDataForSectionList } from '../utilities/misc';
// type MediaItem = {
//   item: MediaFile;
//   index: number;
// };

const { width } = Dimensions.get('window');

interface GalleryModalProps {
  renderCustomHeader?: () => JSX.Element;
  // renderCustomMedia?: ({ item, index }: MediaItem) => JSX.Element | null;
  renderCustomFile?: () => JSX.Element;
  renderCustomLink?: () => JSX.Element;
}

export const GalleryScreen: React.FC<GalleryModalProps> = ({
  renderCustomHeader,
  // renderCustomMedia,
  renderCustomFile,
  renderCustomLink,
}) => {
  const [activeTab, setActiveTab] = useState('Media');
  // const [media, setMedia] = useState<MediaFile[]>([]);
  const [links, setLinks] = useState<SectionData[]>([]);
  const firebaseInstance = useRef(FirestoreServices.getInstance()).current;
  // const [mediaSelected, setMediaSelected] = useState<MediaFile>();

  useEffect(() => {
    switch (activeTab) {
      case 'Media':
        // {
        //   const loadImages = async () => {
        //     const urls = await firebaseInstance.getMediaFilesByConversationId();
        //     setMedia(urls);
        //   };
        //   loadImages();
        // }
        break;
      case 'File':
        break;
      case 'Link':
        const loadLinks = async () => {
          const getLinks = transformLinksDataForSectionList(
            await firebaseInstance.getUserLinks()
          );
          setLinks(getLinks);
        };
        loadLinks();
        break;
    }
  }, [activeTab, firebaseInstance]);

  // const renderImage = ({ item, index }: MediaItem) => {
  //   if (renderCustomMedia) return renderCustomMedia({ item, index });
  //   return (
  //     <TouchableOpacity onPress={() => setMediaSelected(item)}>
  //       {item.type === MessageTypes.video ? (
  //         <ThumbnailVideoPlayer videoUrl={item.path} />
  //       ) : (
  //         <FastImage source={{ uri: item.path }} style={styles.image} />
  //       )}
  //     </TouchableOpacity>
  //   );
  // };

  const renderHeader = (): JSX.Element => {
    if (renderCustomHeader) return renderCustomHeader();
    return (
      <View style={styles.tabContainer}>
        {['Media', 'File', 'Link'].map((tab) => (
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
      case 'Media':
        return (
          <View>
            {/* <FlatList
              data={media}
              renderItem={renderImage}
              keyExtractor={(item) => item.id}
              numColumns={3}
            />
            <SelectedViewModal
              url={mediaSelected?.path}
              type={mediaSelected?.type}
              onClose={() => setMediaSelected(undefined)}
            /> */}
          </View>
        );
      case 'File':
        if (renderCustomFile) return renderCustomFile();
        return (
          <View style={styles.centeredView}>
            <Text>No Files Available</Text>
          </View>
        );
      case 'Link':
        if (renderCustomLink) return renderCustomLink();
        return <Links links={links} />;
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
