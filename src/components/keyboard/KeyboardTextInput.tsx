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
  useImperativeHandle(ref, () => ({
    ...inputRef.current,
    focus: () => {
      inputRef.current?.focus();
      if (customKeyboardEnabled) {
        Keyboard.dismiss();
        const valLen = value ? value.length : 0;
        contextOnFocus(id, value, { start: valLen, end: valLen });
      }
    },
    blur: () => {
      inputRef.current?.blur();
      if (customKeyboardEnabled && isActive) {
        contextOnBlur(id);
      }
    },
    isFocused: () => inputRef.current?.isFocused?.() || isActive,
    clear: () => {
      inputRef.current?.clear?.();
      if (customKeyboardEnabled && isActive) {
        contextOnValueChange(id, '');
      }
    },
  }));

  const isActive = activeInputId === id;
  const lastSentValueRef = useRef(value);
  const pendingSentValuesRef = useRef<Set<string>>(new Set());
  const userTappedRef = useRef(false);
  const touchTimeoutRef = useRef<any>(null);

  // Auto focus into global custom keyboard on mount if requested
  useEffect(() => {
    if (props.autoFocus && customKeyboardEnabled) {
      const timer = setTimeout(() => {
        const valLen = value ? value.length : 0;
        contextOnFocus(id, value, { start: valLen, end: valLen });
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [id, customKeyboardEnabled, contextOnFocus, props.autoFocus]);

  // Update registered callbacks when they change, without unregistering
  useEffect(() => {
    registerInput(id, {
      id,
      keyboardType,
      maxLength,
      onChangeText: (text) => {
        lastSentValueRef.current = text;
        pendingSentValuesRef.current.add(text);
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
      pendingSentValuesRef.current.clear();
    }
  }, [value, isActive]);

  // Keep value synced in context when it changes externally
  useEffect(() => {
    if (!isActive) return;

    // If the incoming prop matches a pending keystroke from our keyboard, consume it and do not overwrite context
    if (pendingSentValuesRef.current.has(value)) {
      pendingSentValuesRef.current.delete(value);
      return;
    }

    // If there are still pending keystrokes in flight, ignore intermediate in-flight values from parent
    if (pendingSentValuesRef.current.size > 0) {
      return;
    }

    // External change (e.g. user selected an address suggestion or pressed the clear button)
    if (value !== lastSentValueRef.current) {
      lastSentValueRef.current = value;
      contextOnValueChange(id, value);
    }
  }, [value, isActive, id, contextOnValueChange]);

  const handleFocus = (e: any) => {
    const valLen = value ? value.length : 0;
    const currentSelection = {
      start: valLen,
      end: valLen,
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
    const newSelection = e.nativeEvent?.selection;
    if (customKeyboardEnabled && isActive && newSelection) {
      contextOnSelectionChange(id, newSelection);
    }
    if (onSelectionChange) {
      onSelectionChange(e);
    }
  };

  const handleNativeChangeText = (text: string) => {
    lastSentValueRef.current = text;
    pendingSentValuesRef.current.add(text);
    if (customKeyboardEnabled && isActive) {
      contextOnValueChange(id, text);
    }
    if (onChangeText) {
      onChangeText(text);
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
      const valLen = value ? value.length : 0;
      const currentSelection = {
        start: valLen,
        end: valLen,
      };
      contextOnFocus(id, value, currentSelection);
    }
  };

  const valLen = typeof value === 'string' ? value.length : 0;
  const isSelectionAtEnd =
    selection && selection.start === valLen && selection.end === valLen;
  const safeSelection =
    customKeyboardEnabled && isActive && selection && !isSelectionAtEnd
      ? {
          start: Math.max(0, Math.min(selection.start, valLen)),
          end: Math.max(0, Math.min(selection.end, valLen)),
        }
      : undefined;

  return (
    <TextInput
      ref={inputRef}
      value={value}
      onChangeText={handleNativeChangeText}
      onFocus={handleFocus}
      onBlur={handleBlur}
      onTouchStart={handleTouchStart}
      maxLength={maxLength}
      onSelectionChange={handleSelectionChange}
      onSubmitEditing={onSubmitEditing}
      showSoftInputOnFocus={customKeyboardEnabled ? false : showSoftInputOnFocus}
      editable={Platform.OS === 'ios' && customKeyboardEnabled ? false : editable}
      keyboardType={keyboardType}
      selection={safeSelection}
      placeholderTextColor={props.placeholderTextColor || colors.text.secondary}
      {...props}
      style={[{ color: colors.text.primary }, props.style]}
    />
  );
});

KeyboardTextInput.displayName = 'KeyboardTextInput';
export default KeyboardTextInput;
