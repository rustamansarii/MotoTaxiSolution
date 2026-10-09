import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { COLORS } from '../theme/colors';
import { RADIUS, SPACING } from '../theme/spacing';
import { TYPOGRAPHY } from '../theme/typography';
import Icon from './Icon';
import { KeyboardTextInput } from './keyboard/KeyboardTextInput';
import { useKeyboardSafe } from './keyboard/KeyboardContext';

export const CustomInput = ({
  id,
  label,
  value,
  onChangeText,
  placeholder,
  placeholderTextColor = COLORS.textLight,
  secureTextEntry = false,
  leftIcon,
  rightIcon,
  onRightIconPress,
  error,
  helperText,
  hideErrorText = false,
  keyboardType = 'default',
  autoCapitalize = 'none',
  editable = true,
  multiline = false,
  numberOfLines = 1,
  style,
  containerStyle,
  onFocus,
  onBlur,
  maxLength,
  customKeyboardEnabled = true,
  required = false, // NEW: show red asterisk when true
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(!secureTextEntry);
  const autoIdRef = useRef(`input_${Math.random().toString(36).substring(2, 9)}`);
  const effectiveId = id || autoIdRef.current;

  const keyboard = useKeyboardSafe ? useKeyboardSafe() : null;
  const isCustomKeyboardActive = keyboard?.keyboardVisible && keyboard?.activeInputId === effectiveId;
  const isInputActive = isFocused || (customKeyboardEnabled && isCustomKeyboardActive);

  const handleFocus = (e) => {
    setIsFocused(true);
    if (onFocus) onFocus(e);
  };

  const handleBlur = (e) => {
    setIsFocused(false);
    if (onBlur) onBlur(e);
  };

  const textInputRef = useRef(null);

  return (
    <View style={[styles.wrapper, containerStyle]}>
      {label ? (
        <View style={styles.labelRow}>
          <Text style={styles.label}>{label}</Text>
          {required ? <Text style={styles.requiredAsterisk}>*</Text> : null}
        </View>
      ) : null}

      <View
        style={[
          styles.inputContainer,
          isInputActive && styles.inputFocused,
          error ? styles.inputError : null,
          !editable && styles.inputDisabled,
          multiline && { height: 100, alignItems: 'flex-start', paddingTop: SPACING.md },
          style,
        ]}
      >
        {leftIcon && (
          <View style={styles.leftIconContainer}>
            <Icon
              name={leftIcon}
              size={18}
              color={isInputActive ? COLORS.primary : COLORS.iconLight}
            />
          </View>
        )}

        <KeyboardTextInput
          ref={textInputRef}
          id={effectiveId}
          customKeyboardEnabled={customKeyboardEnabled}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={placeholderTextColor}
          secureTextEntry={secureTextEntry && !isPasswordVisible}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          editable={editable}
          multiline={multiline}
          numberOfLines={numberOfLines}
          onFocus={handleFocus}
          onBlur={handleBlur}
          maxLength={maxLength}
          style={[
            styles.inputField,
            !editable && styles.disabledText,
          ]}
        />

        {secureTextEntry ? (
          <TouchableOpacity
            onPress={() => setIsPasswordVisible(!isPasswordVisible)}
            style={styles.rightIconContainer}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Icon
              name={isPasswordVisible ? 'eye-off' : 'eye'}
              size={18}
              color={isInputActive ? COLORS.primary : COLORS.iconLight}
            />
          </TouchableOpacity>
        ) : rightIcon ? (
          <TouchableOpacity
            onPress={onRightIconPress}
            disabled={!onRightIconPress}
            style={styles.rightIconContainer}
          >
            <Icon
              name={rightIcon}
              size={18}
              color={COLORS.iconLight}
            />
          </TouchableOpacity>
        ) : value && value.length > 0 && editable ? (
          <TouchableOpacity
            onPress={() => onChangeText('')}
            style={styles.rightIconContainer}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Icon name="x" size={14} color={COLORS.iconLight} />
          </TouchableOpacity>
        ) : null}
      </View>

      {error && !hideErrorText ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : helperText ? (
        <Text style={styles.helperText}>{helperText}</Text>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: SPACING.lg,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  label: {
    ...TYPOGRAPHY.bodySmall,
    fontWeight: '600',
    color: COLORS.text,
  },
  requiredAsterisk: {
    ...TYPOGRAPHY.bodySmall,
    fontWeight: '700',
    color: COLORS.danger, // red *
    marginLeft: 2,
  },
  inputContainer: {
    height: 54,
    backgroundColor: COLORS.inputBg,
    borderRadius: RADIUS.medium,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
  },
  inputFocused: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.white,
  },
  inputError: {
    borderColor: COLORS.danger,
  },
  inputDisabled: {
    opacity: 0.7,
  },
  leftIconContainer: {
    marginRight: SPACING.sm,
  },
  rightIconContainer: {
    marginLeft: SPACING.sm,
    padding: SPACING.xs,
  },
  inputField: {
    flex: 1,
    height: '100%',
    ...TYPOGRAPHY.body,
    color: COLORS.text,
    paddingVertical: 0,
  },
  disabledText: {
    color: COLORS.textLight,
  },
  errorText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.danger,
    marginTop: SPACING.xs,
  },
  helperText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textLight,
    marginTop: SPACING.xs,
  },
});

export default CustomInput;