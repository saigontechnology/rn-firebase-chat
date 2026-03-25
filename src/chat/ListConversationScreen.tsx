import React, { useCallback, useMemo } from 'react';
import {
  FlatList,
  StyleSheet,
  View,
  Animated,
  TouchableOpacity,
  Image,
  StyleProp,
  ViewStyle,
} from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import {
  ConversationItem,
  IConversationItemProps,
} from './components/ConversationItem';
import type { ConversationProps } from '../interfaces';
import { useChatContext, useChatSelector } from '../hooks';
import { setConversation } from '../reducer';
import { getListConversation } from '../reducer/selectors';
import Images from '../asset';

type ListItem = {
  item: ConversationProps;
  index: number;
};

export interface IListConversationProps {
  hasSearchBar?: boolean;
  onPress?: (conversation: ConversationProps) => void;
  onDelete?: (conversation: ConversationProps) => void;
  renderCustomItem?: ({ item, index }: ListItem) => React.JSX.Element | null;
  conversationItemProps?: Omit<IConversationItemProps, 'data' | 'onPress'>; // remove default prop 'data' and 'onPress'
  enableSwipeToDelete?: boolean;
  deleteButtonColor?: string;
  renderDeleteIcon?: () => React.ReactNode;
  containerStyle?: StyleProp<ViewStyle>;
  contentContainerStyle?: StyleProp<ViewStyle>;
}

export const ListConversationScreen: React.FC<IListConversationProps> = ({
  // hasSearchBar,
  onPress,
  onDelete,
  renderCustomItem,
  conversationItemProps,
  enableSwipeToDelete = true,
  deleteButtonColor = '#FF3B30',
  renderDeleteIcon,
  containerStyle,
  contentContainerStyle,
}) => {
  const { chatDispatch, userInfo } = useChatContext();
  const listConversation = useChatSelector(getListConversation);

  const data = useMemo(() => {
    //TODO: handle search
    return listConversation;
  }, [listConversation]);

  const handleConversationPressed = useCallback(
    (item: ConversationProps) => {
      chatDispatch?.(setConversation(item));
      onPress?.(item);
    },
    [chatDispatch, onPress]
  );

  const handleDelete = useCallback(
    (item: ConversationProps) => {
      onDelete?.(item);
    },
    [onDelete]
  );

  const renderRightActions = useCallback(
    (
      item: ConversationProps,
      progress: Animated.AnimatedInterpolation<number>,
      dragX: Animated.AnimatedInterpolation<number>
    ) => {
      const translateX = dragX.interpolate({
        inputRange: [-100, 0],
        outputRange: [0, 100],
        extrapolate: 'clamp',
      });

      const opacity = progress.interpolate({
        inputRange: [0, 1],
        outputRange: [0, 1],
      });

      return (
        <Animated.View
          style={[
            styles.deleteAction,
            {
              transform: [{ translateX }],
              opacity,
            },
          ]}
        >
          <TouchableOpacity
            style={[
              styles.deleteButton,
              { backgroundColor: deleteButtonColor },
            ]}
            onPress={() => handleDelete(item)}
            activeOpacity={0.7}
          >
            <Animated.View
              style={[
                styles.deleteContent,
                {
                  transform: [
                    {
                      scale: progress.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.8, 1],
                      }),
                    },
                  ],
                },
              ]}
            >
              {renderDeleteIcon ? (
                renderDeleteIcon()
              ) : (
                <View style={styles.defaultDeleteIcon}>
                  <Image
                    source={Images.trash}
                    style={styles.trashIcon}
                    resizeMode="contain"
                  />
                </View>
              )}
            </Animated.View>
          </TouchableOpacity>
        </Animated.View>
      );
    },
    [deleteButtonColor, handleDelete, renderDeleteIcon]
  );

  const renderItem = useCallback(
    ({ item, index }: ListItem) => {
      const itemContent = renderCustomItem ? (
        renderCustomItem({ item, index })
      ) : (
        <ConversationItem
          data={item}
          onPress={handleConversationPressed}
          {...(conversationItemProps || {})}
          userInfo={userInfo}
        />
      );

      if (!enableSwipeToDelete) {
        return itemContent;
      }

      return (
        <Swipeable
          key={item.id}
          renderRightActions={(progress, dragX) =>
            renderRightActions(item, progress, dragX)
          }
          overshootRight={false}
          friction={2}
          enableTrackpadTwoFingerGesture
        >
          {itemContent}
        </Swipeable>
      );
    },
    [
      conversationItemProps,
      handleConversationPressed,
      renderCustomItem,
      userInfo,
      enableSwipeToDelete,
      renderRightActions,
    ]
  );

  return (
    <View style={[styles.container, containerStyle]}>
      <FlatList<ConversationProps>
        contentContainerStyle={[contentContainerStyle]}
        keyExtractor={(item, index) => item.id || index.toString()}
        data={data}
        renderItem={renderItem}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },

  deleteAction: {
    justifyContent: 'center',
    alignItems: 'flex-end',
    minWidth: 100,
  },
  deleteButton: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    height: '100%',
    minWidth: 100,
  },
  deleteContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  defaultDeleteIcon: {
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  trashIcon: {
    width: 28,
    height: 28,
  },
});
