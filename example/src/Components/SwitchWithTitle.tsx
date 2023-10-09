/**
 * Created by NL on 6/11/23.
 */
import React from 'react';
import {
  StyleProp,
  StyleSheet,
  Switch,
  SwitchProps,
  Text,
  View,
  ViewStyle,
} from 'react-native';

interface ISwitchWithTitle extends SwitchProps {
  title: string;
  style?: StyleProp<ViewStyle>;
}

export const SwitchWithTitle: React.FC<ISwitchWithTitle> = ({
  value,
  onValueChange,
  title,
  style,
}) => {
  return (
    <View style={StyleSheet.flatten([styles.container, style])}>
      <Text style={styles.title}>{title}</Text>
      <Switch value={value} onValueChange={onValueChange} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    flex: 1,
  },
});
