import React, { useEffect, useRef } from 'react';
import { Modal as RNModal, ModalProps, View, StyleSheet, Animated, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CustomKeyboard } from './CustomKeyboard';
import { useKeyboard, KeyboardProvider } from './KeyboardContext';

export interface KeyboardModalProps extends ModalProps {
  children: React.ReactNode;
}

const KeyboardModalInner: React.FC<KeyboardModalProps> = ({
  children,
  visible,
  onRequestClose,
  onDismiss,
  ...props
}) => {
  const { hideKeyboard, keyboardVisible } = useKeyboard();
  const insets = useSafeAreaInsets();
  const paddingAnim = useRef(new Animated.Value(0)).current;

  const targetPadding = keyboardVisible ? 270 + (insets.bottom || 10) : 0;

  // Hide the keyboard when the modal visibility changes or when it unmounts
  useEffect(() => {
    if (!visible) {
      hideKeyboard();
    }
    return () => {
      hideKeyboard();
    };
  }, [visible, hideKeyboard]);

  useEffect(() => {
    Animated.timing(paddingAnim, {
      toValue: targetPadding,
      duration: 250,
      useNativeDriver: false,
    }).start();
  }, [targetPadding, paddingAnim]);

  const handleRequestClose = (e: any) => {
    hideKeyboard();
    if (onRequestClose) {
      onRequestClose(e);
    }
  };

  return (
    <RNModal
      visible={visible}
      onRequestClose={handleRequestClose}
      onDismiss={() => {
        hideKeyboard();
        if (onDismiss) {
          onDismiss();
        }
      }}
      {...props}
    >
      <Pressable
        style={{ flex: 1 }}
        onPress={() => hideKeyboard()}
        disabled={!keyboardVisible}
        accessible={false}
      >
        <View style={styles.container}>
          <Animated.View style={{ flex: 1, paddingBottom: paddingAnim }}>
            {children}
          </Animated.View>
          {visible && <CustomKeyboard isInModal={true} />}
        </View>
      </Pressable>
    </RNModal>
  );
};

export const KeyboardModal: React.FC<KeyboardModalProps> = (props) => {
  return (
    <KeyboardProvider>
      <KeyboardModalInner {...props} />
    </KeyboardProvider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
});

export default KeyboardModal;
