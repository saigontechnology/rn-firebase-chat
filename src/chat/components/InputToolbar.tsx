import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Composer, type ComposerProps } from 'react-native-gifted-chat';

export interface IInputToolbar extends ComposerProps {
  messagePlaceholder?: string;
  hasPhoto?: boolean;
  hasCamera?: boolean;
}

export const InputToolbar: React.FC<IInputToolbar> = ({
  messagePlaceholder = 'Type your message ...',
  ...props
}) => {
  return (
    <View>
      <View style={[styles.composeWrapper]}>
        <ScrollView scrollEnabled={false}>
          <Composer {...props} placeholder={messagePlaceholder} />
        </ScrollView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  textInput: {},
  composeWrapper: {
    flex: 1,
    borderRadius: 10,
    minHeight: 40,
    flexDirection: 'row',
  },
});
