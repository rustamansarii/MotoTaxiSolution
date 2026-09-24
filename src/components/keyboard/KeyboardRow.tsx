import React from 'react';
import { StyleSheet, View, ViewStyle, StyleProp } from 'react-native';

interface KeyboardRowProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

export const KeyboardRow: React.FC<KeyboardRowProps> = React.memo(({ children, style }) => {
  return <View style={[styles.row, style]}>{children}</View>;
});

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
});
