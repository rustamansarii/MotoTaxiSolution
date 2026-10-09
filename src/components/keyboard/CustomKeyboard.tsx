import React, { useEffect, useRef, useMemo } from 'react';
import { StyleSheet, Animated, View, Platform, Pressable, TouchableOpacity, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useKeyboard } from './KeyboardContext';
import { KeyboardRow } from './KeyboardRow';
import { KeyboardKey } from './KeyboardKey';
import { englishNormalLayout, englishShiftLayout } from './layouts/english';
import { frenchNormalLayout, frenchShiftLayout } from './layouts/french';
import { numericOnlyLayout, numbersGeneralLayout } from './layouts/numbers';
import { symbolsPage1Layout, symbolsPage2Layout } from './layouts/symbols';
import Icon from '../Icon';
import { COLORS } from '../../theme/colors';
import { responsiveFont } from '../../utils/responsive';

interface CustomKeyboardProps {
  isInModal?: boolean;
}

const KEYBOARD_HEIGHT = 265;
const ACCESSORY_HEIGHT = 38;

export const CustomKeyboard: React.FC<CustomKeyboardProps> = React.memo(({ isInModal = false }) => {
  const insets = useSafeAreaInsets();
  const {
    keyboardVisible,
    activeLayout,
    isShiftActive,
    isCapsLock,
    symbolsPage,
    theme,
    handleKeyPress,
    isNumericOnly,
    hideKeyboard,
    setKeyboardHeight,
    moveCursor,
    registerRepeatCanceler,
  } = useKeyboard();

  const totalHeight = KEYBOARD_HEIGHT + ACCESSORY_HEIGHT + (insets.bottom || 8);
  const slideAnim = useRef(new Animated.Value(totalHeight + 60)).current;

  useEffect(() => {
    setKeyboardHeight(totalHeight);
  }, [totalHeight, setKeyboardHeight]);

  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: keyboardVisible ? 0 : totalHeight + 60,
      duration: 180, // Snappy 180ms response
      useNativeDriver: true,
    }).start();
  }, [keyboardVisible, totalHeight]);

  // Determine which layout to render (English or French)
  const layout = useMemo(() => {
    if (isNumericOnly) {
      return numericOnlyLayout;
    }

    switch (activeLayout) {
      case 'french':
        return isShiftActive || isCapsLock ? frenchShiftLayout : frenchNormalLayout;
      case 'numbers':
        return numbersGeneralLayout;
      case 'symbols':
        return symbolsPage === 'page1' ? symbolsPage1Layout : symbolsPage2Layout;
      case 'english':
      default:
        return isShiftActive || isCapsLock ? englishShiftLayout : englishNormalLayout;
    }
  }, [isNumericOnly, activeLayout, isShiftActive, isCapsLock, symbolsPage]);

  const renderedRows = useMemo(() => {
    return layout.map((row, rowIndex) => (
      <KeyboardRow key={`row-${rowIndex}`}>
        {row.map((keyConfig, keyIndex) => (
          <KeyboardKey
            key={`key-${rowIndex}-${keyIndex}`}
            config={keyConfig}
            theme={theme}
            isShiftActive={isShiftActive}
            isCapsLock={isCapsLock}
            onPress={handleKeyPress}
            registerRepeatCanceler={registerRepeatCanceler}
          />
        ))}
      </KeyboardRow>
    ));
  }, [layout, theme, isShiftActive, isCapsLock, handleKeyPress, registerRepeatCanceler]);

  const isDark = theme === 'dark';
  const containerBackgroundColor = isDark ? '#18181B' : '#D1D5DB';
  const borderTopColor = isDark ? '#27272A' : '#94A3B8';
  const accessoryBg = isDark ? '#27272A' : '#E2E8F0';

  return (
    <Animated.View
      pointerEvents={keyboardVisible ? 'auto' : 'none'}
      style={[
        styles.keyboardContainer,
        {
          height: totalHeight,
          backgroundColor: containerBackgroundColor,
          borderTopColor: borderTopColor,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      {/* Top Accessory Bar */}
      <View
        style={[
          styles.accessoryBar,
          {
            backgroundColor: accessoryBg,
            borderBottomColor: borderTopColor,
          },
        ]}
      >
        <View style={styles.accessoryLeft}>
          <View style={styles.layoutBadge}>
            <Text style={[styles.layoutBadgeText, { color: isDark ? '#A1A1AA' : '#475569' }]}>
              {isNumericOnly ? '123' : activeLayout === 'numbers' ? 'NUM' : activeLayout.toUpperCase()}
            </Text>
          </View>

          {/* Cursor Step Left / Right Buttons */}
          <View style={styles.cursorRow}>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => moveCursor('left')}
              style={[
                styles.shortcutChip,
                { backgroundColor: isDark ? '#3F3F46' : '#FFFFFF' },
              ]}
              hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
            >
              <Icon name="chevron-left" size={13} color={isDark ? '#FFFFFF' : '#0F172A'} />
            </TouchableOpacity>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => moveCursor('right')}
              style={[
                styles.shortcutChip,
                { backgroundColor: isDark ? '#3F3F46' : '#FFFFFF' },
              ]}
              hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
            >
              <Icon name="chevron-right" size={13} color={isDark ? '#FFFFFF' : '#0F172A'} />
            </TouchableOpacity>
          </View>

          {/* Quick Shortcuts for faster typing */}
          <View style={styles.shortcutsRow}>
            {['@', '.', '-', '_'].map((char) => (
              <TouchableOpacity
                key={char}
                activeOpacity={0.7}
                onPress={() => handleKeyPress({ label: char, action: 'char', value: char })}
                style={[
                  styles.shortcutChip,
                  { backgroundColor: isDark ? '#3F3F46' : '#FFFFFF' },
                ]}
              >
                <Text style={[styles.shortcutText, { color: isDark ? '#FFFFFF' : '#0F172A' }]}>
                  {char}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Hide / Done Button with vector icon */}
        <TouchableOpacity
          onPress={() => {
            hideKeyboard();
          }}
          activeOpacity={0.6}
          style={styles.doneButton}
          hitSlop={{ top: 12, bottom: 12, left: 16, right: 16 }}
        >
          <Text style={styles.doneButtonText}>Done</Text>
          <Icon name="keyboard-hide" size={16} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      <Pressable style={{ flex: 1, paddingTop: 4, paddingBottom: insets.bottom || 8 }}>
        <View style={styles.keyboardInner}>
          {renderedRows}
        </View>
      </Pressable>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  keyboardContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopWidth: StyleSheet.hairlineWidth,
    zIndex: 9999,
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: -3 },
        shadowOpacity: 0.15,
        shadowRadius: 5,
      },
      android: {
        elevation: 12,
      },
    }),
  },
  accessoryBar: {
    height: ACCESSORY_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  accessoryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  layoutBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.06)',
    marginRight: 8,
  },
  layoutBadgeText: {
    fontSize: responsiveFont(10),
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  cursorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 6,
  },
  shortcutsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  shortcutChip: {
    width: 28,
    height: 24,
    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 1,
  },
  shortcutText: {
    fontSize: responsiveFont(13),
    fontWeight: '600',
  },
  doneButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(23, 186, 161, 0.12)',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 14,
  },
  doneButtonText: {
    color: COLORS.primary,
    fontWeight: '700',
    fontSize: responsiveFont(13),
    marginRight: 4,
  },
  keyboardInner: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 3,
  },
});

export default CustomKeyboard;
