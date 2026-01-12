import React from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  StyleProp,
  ViewStyle,
  TextStyle,
  ImageStyle,
  TextInputProps,
} from 'react-native';
import { PressableIcon } from './PressableIcon';

const ImageURL = {
  close: require('../../images/close.png'),
};

export interface ISearchBarProps extends Omit<TextInputProps, 'style'> {
  /** Current search text value */
  value: string;
  /** Callback when search text changes */
  onChangeText: (text: string) => void;
  /** Placeholder text for the search input */
  placeholder?: string;
  /** Style for the outer container */
  containerStyle?: StyleProp<ViewStyle>;
  /** Style for the text input */
  inputStyle?: StyleProp<TextStyle>;
  /** Left icon source (e.g., search icon) */
  leftIcon?: string;
  /** Style for the left icon */
  leftIconStyle?: StyleProp<ImageStyle>;
  /** Callback when left icon is pressed */
  onLeftIconPress?: () => void;
  /** Style for the clear icon */
  clearIconStyle?: StyleProp<ImageStyle>;
  /** Custom clear icon source */
  clearIcon?: string;
  /** Whether to show the clear button when there's text */
  showClearButton?: boolean;
  /** Callback when clear button is pressed */
  onClear?: () => void;
}

export const SearchBar: React.FC<ISearchBarProps> = ({
  value,
  onChangeText,
  placeholder = 'Search...',
  containerStyle,
  inputStyle,
  leftIcon,
  leftIconStyle,
  onLeftIconPress,
  clearIconStyle,
  clearIcon = ImageURL.close,
  showClearButton = true,
  onClear,
  ...textInputProps
}) => {
  const handleClear = () => {
    onChangeText('');
    onClear?.();
  };

  return (
    <View style={[styles.container, containerStyle]}>
      {leftIcon && (
        <PressableIcon
          icon={leftIcon}
          iconStyle={[styles.leftIcon, leftIconStyle]}
          onPress={onLeftIconPress}
          disabled={!onLeftIconPress}
        />
      )}
      <TextInput
        style={[styles.input, leftIcon && styles.inputWithLeftIcon, inputStyle]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#999"
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType="search"
        {...textInputProps}
      />
      {showClearButton && value.length > 0 && (
        <PressableIcon
          icon={clearIcon}
          iconStyle={[styles.clearIcon, clearIconStyle]}
          onPress={handleClear}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
    paddingHorizontal: 12,
    marginHorizontal: 15,
    marginBottom: 10,
    height: 40,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    paddingVertical: 8,
  },
  inputWithLeftIcon: {
    marginLeft: 8,
  },
  leftIcon: {
    width: 20,
    height: 20,
    tintColor: '#999',
  },
  clearIcon: {
    width: 18,
    height: 18,
    tintColor: '#999',
  },
});

export default SearchBar;
