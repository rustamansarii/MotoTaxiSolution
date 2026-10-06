import React, { useRef, useCallback } from 'react';
import { StyleSheet, Text, Pressable, Platform, View, ViewStyle } from 'react-native';
import { KeyboardKeyConfig } from './layouts';
import { colors } from '../../theme/colors';
import { responsiveFont } from '../../utils/responsive';
import Icon from '../Icon';

interface KeyboardKeyProps {
  config: KeyboardKeyConfig;
  onPress: (config: KeyboardKeyConfig) => void;
  theme: 'light' | 'dark';
  isShiftActive: boolean;
  isCapsLock: boolean;
}

export const KeyboardKey: React.FC<KeyboardKeyProps> = React.memo(({
  config,
  onPress,
  theme,
  isShiftActive,
  isCapsLock,
}) => {
  const isDark = theme === 'dark';
  const repeatIntervalRef = useRef<any>(null);
  const repeatTimeoutRef = useRef<any>(null);

  // Determine if this is a special function key
  const isSpecial = config.action !== 'char' && config.action !== 'space';
  const isShiftKey = config.action === 'shift';
  const isBackspaceKey = config.action === 'backspace';
  const isEnterKey = config.action === 'enter';
  const isLangKey = config.action === 'lang';
  const isShiftActiveOrCaps = isShiftActive || isCapsLock;

  // Immediate press trigger for ultra-fast typing response
  const triggerPress = useCallback(() => {
    onPress(config);
  }, [config, onPress]);

  // Handle press in: immediate key execution + backspace hold-to-repeat
  const handlePressIn = () => {
    triggerPress();

    if (isBackspaceKey) {
      // Auto-repeat backspace if held down
      repeatTimeoutRef.current = setTimeout(() => {
        repeatIntervalRef.current = setInterval(() => {
          triggerPress();
        }, 55); // 55ms rapid deletion
      }, 350); // 350ms initial hold delay
    }
  };

  const handlePressOut = () => {
    if (repeatTimeoutRef.current) {
      clearTimeout(repeatTimeoutRef.current);
      repeatTimeoutRef.current = null;
    }
    if (repeatIntervalRef.current) {
      clearInterval(repeatIntervalRef.current);
      repeatIntervalRef.current = null;
    }
  };

  // Color schemes
  const getKeyBackground = (isPressed: boolean) => {
    if (isDark) {
      if (isShiftKey && isShiftActiveOrCaps) {
        return colors.primary;
      }
      if (isEnterKey) {
        return isPressed ? '#0D9488' : colors.primary;
      }
      if (isSpecial) {
        return isPressed ? '#52525B' : '#3F3F46';
      }
      return isPressed ? '#52525B' : '#27272A';
    } else {
      if (isShiftKey && isShiftActiveOrCaps) {
        return colors.primary;
      }
      if (isEnterKey) {
        return isPressed ? '#0D9488' : colors.primary;
      }
      if (isSpecial) {
        return isPressed ? '#CBD5E1' : '#E2E8F0';
      }
      return isPressed ? '#E2E8F0' : '#FFFFFF';
    }
  };

  const getTextColor = () => {
    if (isShiftKey && isShiftActiveOrCaps) {
      return '#FFFFFF';
    }
    if (isEnterKey) {
      return '#FFFFFF';
    }
    return isDark ? '#FFFFFF' : '#0F172A';
  };

  const textColor = getTextColor();

  // Custom key flex width
  const customKeyStyle: ViewStyle = {
    flex: config.flex || 1,
  };

  // Render vector icons or text
  const renderKeyContent = () => {
    if (isBackspaceKey) {
      return (
        <Icon
          name="backspace"
          size={20}
          color={textColor}
        />
      );
    }

    if (isShiftKey) {
      return (
        <Icon
          name={isCapsLock ? 'caps-lock' : 'shift-key'}
          size={isCapsLock ? 20 : 19}
          color={textColor}
        />
      );
    }

    if (isEnterKey) {
      return (
        <Icon
          name="enter-key"
          size={18}
          color="#FFFFFF"
        />
      );
    }

    if (isLangKey) {
      return (
        <Icon
          name="globe"
          size={18}
          color={textColor}
        />
      );
    }

    if (config.action === 'space') {
      return (
        <Text style={[styles.spaceText, { color: isDark ? '#71717A' : '#94A3B8' }]}>
          space
        </Text>
      );
    }

    // Default character label
    return (
      <Text style={[styles.keyText, { color: textColor }]}>
        {config.label}
      </Text>
    );
  };

  return (
    <View style={[styles.keyWrapper, customKeyStyle]}>
      <Pressable
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        delayPressIn={0}
        delayPressOut={0}
        style={({ pressed }) => [
          styles.keyContainer,
          {
            backgroundColor: getKeyBackground(pressed),
            shadowOpacity: isDark ? 0 : pressed ? 0.08 : 0.22,
          },
        ]}
      >
        {renderKeyContent()}
      </Pressable>
    </View>
  );
});

const styles = StyleSheet.create({
  keyWrapper: {
    height: 44,
    marginHorizontal: 3,
    marginVertical: 3.5,
  },
  keyContainer: {
    flex: 1,
    borderRadius: 7,
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 1.5 },
        shadowRadius: 1.5,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  keyText: {
    fontSize: responsiveFont(18),
    fontWeight: '500',
    letterSpacing: -0.2,
  },
  spaceText: {
    fontSize: responsiveFont(12),
    fontWeight: '500',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
});

export default KeyboardKey;
