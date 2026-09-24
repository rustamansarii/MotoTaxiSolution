import React, { forwardRef, useEffect, useRef, useImperativeHandle } from 'react';
import { TextInput, TextInputProps, NativeSyntheticEvent, Platform, Keyboard } from 'react-native';
import { useKeyboard } from './KeyboardContext';
import { colors } from '../../theme/colors';

export interface KeyboardTextInputProps extends TextInputProps {
  id?: string;
  customKeyboardEnabled?: boolean;
}

export const KeyboardTextInput = forwardRef<any, KeyboardTextInputProps>(({
  id: propId,
  customKeyboardEnabled = true,
  value = '',
  onChangeText,
  onSelectionChange,
  onFocus,
  onBlur,
  maxLength,
  onSubmitEditing,
  keyboardType = 'default',
  showSoftInputOnFocus,
  editable = true,
  ...props
}, ref) => {
  const fallbackIdRef = useRef(`input_${Math.random().toString(36).substring(2, 9)}`);
  const id = propId || fallbackIdRef.current;

  const {
    activeInputId,
    selection,
    onFocus: contextOnFocus,
    onBlur: contextOnBlur,
    onSelectionChange: contextOnSelectionChange,
    onValueChange: contextOnValueChange,
    registerInput,
    unregisterInput,
  } = useKeyboard();

  const inputRef = useRef<any>(null);

  // Expose the native text input methods to parent refs
  useImperativeHandle(ref, () => inputRef.current);

  const isActive = activeInputId === id;
  const lastSentValueRef = useRef(value);
  const userTappedRef = useRef(false);
  const touchTimeoutRef = useRef<any>(null);

  // Update registered callbacks when they change, without unregistering
  useEffect(() => {
    registerInput(id, {
      id,
      keyboardType,
      maxLength,
      onChangeText: (text) => {
        lastSentValueRef.current = text;
        if (onChangeText) {
          onChangeText(text);
        }
      },
      onSubmitEditing: () => {
        if (onSubmitEditing) {
          onSubmitEditing({} as any);
        }
      },
      onBlur: () => {
        if (onBlur) {
          onBlur(null as any);
        }
      },
      blur: () => {
        inputRef.current?.blur();
      },
    });
  }, [id, keyboardType, maxLength, onChangeText, onSubmitEditing, onBlur, registerInput]);

  // Unregister only when component unmounts
  useEffect(() => {
    return () => {
      unregisterInput(id);
      if (touchTimeoutRef.current) {
        clearTimeout(touchTimeoutRef.current);
      }
    };
  }, [id, unregisterInput]);

  // Sync ref if value changes externally while inactive
  useEffect(() => {
    if (!isActive) {
      lastSentValueRef.current = value;
    }
  }, [value, isActive]);

  // Keep value synced in context when it changes externally
  useEffect(() => {
    if (isActive && value !== lastSentValueRef.current) {
      contextOnValueChange(id, value);
      lastSentValueRef.current = value;
    }
  }, [value, isActive, id, contextOnValueChange]);

  const handleFocus = (e: any) => {
    // Set initial selection state
    const currentSelection = {
      start: value ? value.length : 0,
      end: value ? value.length : 0,
    };

    if (customKeyboardEnabled) {
      Keyboard.dismiss();
      contextOnFocus(id, value, currentSelection);
    }

    if (onFocus) {
      onFocus(e);
    }
  };

  const handleBlur = (e: any) => {
    if (onBlur) {
      onBlur(e);
    }
  };

  const handleSelectionChange = (e: NativeSyntheticEvent<any>) => {
    const newSelection = e.nativeEvent.selection;
    if (customKeyboardEnabled && isActive) {
      // Only sync selection natively when user explicitly touched the input recently
      if (userTappedRef.current) {
        contextOnSelectionChange(id, newSelection);
      }
    }
    if (onSelectionChange) {
      onSelectionChange(e);
    }
  };

  const handleTouchStart = () => {
    userTappedRef.current = true;
    if (touchTimeoutRef.current) {
      clearTimeout(touchTimeoutRef.current);
    }
    touchTimeoutRef.current = setTimeout(() => {
      userTappedRef.current = false;
    }, 500);

    if (customKeyboardEnabled) {
      Keyboard.dismiss();
      const currentSelection = {
        start: value ? value.length : 0,
        end: value ? value.length : 0,
      };
      contextOnFocus(id, value, currentSelection);
    }
  };

  return (
    <TextInput
      ref={inputRef}
      value={value}
      onChangeText={onChangeText}
      onFocus={handleFocus}
      onBlur={handleBlur}
      onTouchStart={handleTouchStart}
      maxLength={maxLength}
      onSelectionChange={handleSelectionChange}
      onSubmitEditing={onSubmitEditing}
      showSoftInputOnFocus={customKeyboardEnabled ? false : showSoftInputOnFocus}
      editable={Platform.OS === 'ios' && customKeyboardEnabled ? false : editable}
      keyboardType={keyboardType}
      selection={
        customKeyboardEnabled && isActive && (selection.start !== value.length || selection.end !== value.length)
          ? selection
          : undefined
      }
      placeholderTextColor={props.placeholderTextColor || colors.text.secondary}
      {...props}
      style={[{ color: colors.text.primary }, props.style]}
    />
  );
});

KeyboardTextInput.displayName = 'KeyboardTextInput';
export default KeyboardTextInput;
