import React, { useRef, useEffect } from 'react';
import { Animated, ViewProps, StyleSheet } from 'react-native';
import { useKeyboard } from './KeyboardContext';

export interface CustomKeyboardAvoidingViewProps extends ViewProps {
  children: React.ReactNode;
  offset?: number;
}

export const CustomKeyboardAvoidingView: React.FC<CustomKeyboardAvoidingViewProps> = ({
  children,
  offset = 0,
  style,
  ...props
}) => {
  const { keyboardVisible, keyboardHeight } = useKeyboard();
  const bottomOffsetAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(bottomOffsetAnim, {
      toValue: keyboardVisible ? keyboardHeight + offset : 0,
      duration: 250,
      useNativeDriver: false,
    }).start();
  }, [keyboardVisible, keyboardHeight, offset]);

  return (
    <Animated.View
      style={[
        styles.container,
        style,
        { marginBottom: bottomOffsetAnim },
      ]}
      {...props}
    >
      {children}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default CustomKeyboardAvoidingView;
