import React, { forwardRef, useState, useEffect, useRef, useImperativeHandle } from 'react';
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
    onFocus: contextOnFocus,
    onBlur: contextOnBlur,
    onSelectionChange: contextOnSelectionChange,
    onValueChange: contextOnValueChange,
    registerInput,
    unregisterInput,
    showKeyboard,
  } = useKeyboard();

  const inputRef = useRef<any>(null);
  const isActive = activeInputId === id;

  // Local state for instant visual feedback on typing without app-wide context re-renders
  const [localText, setLocalText] = useState(value);
  const [localSelection, setLocalSelection] = useState<{ start: number; end: number } | undefined>(undefined);
  const lastSentValueRef = useRef(value);
  const userTappedRef = useRef(false);
  const touchTimeoutRef = useRef<any>(null);

  // Expose the native text input methods to parent refs
  useImperativeHandle(ref, () => ({
    ...inputRef.current,
    focus: () => {
      inputRef.current?.focus();
      if (customKeyboardEnabled) {
        Keyboard.dismiss();
        const valLen = value ? value.length : 0;
        setLocalText(value);
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
      setLocalText('');
      setLocalSelection({ start: 0, end: 0 });
      if (customKeyboardEnabled && isActive) {
        contextOnValueChange(id, '');
      }
    },
  }));

  // Auto focus into global custom keyboard on mount if requested
  useEffect(() => {
    if (props.autoFocus && customKeyboardEnabled) {
      const timer = setTimeout(() => {
        const valLen = value ? value.length : 0;
        setLocalText(value);
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
        if (onChangeText) {
          onChangeText(text);
        }
      },
      onImmediateUpdate: (newText, newSelection) => {
        lastSentValueRef.current = newText;
        setLocalText(newText);
        setLocalSelection(newSelection);
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
        if (onBlur) {
          onBlur(null as any);
        }
      },
      focus: () => {
        inputRef.current?.focus();
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

  // Sync localText when incoming prop value changes externally
  useEffect(() => {
    if (value !== localText) {
      setLocalText(value);
      lastSentValueRef.current = value;
      if (isActive) {
        contextOnValueChange(id, value);
      }
    }
  }, [value, isActive, id, contextOnValueChange]);

  const handleFocus = (e: any) => {
    if (customKeyboardEnabled) {
      Keyboard.dismiss();
      if (!isActive) {
        const valLen = value ? value.length : 0;
        const currentSelection = localSelection || {
          start: valLen,
          end: valLen,
        };
        setLocalText(value);
        contextOnFocus(id, value, currentSelection);
      } else {
        showKeyboard();
      }
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
    if (newSelection) {
      setLocalSelection(newSelection);
      if (customKeyboardEnabled) {
        const isManualUserTap = userTappedRef.current;
        userTappedRef.current = false;
        contextOnSelectionChange(id, newSelection, isManualUserTap);
      }
    }
    if (onSelectionChange) {
      onSelectionChange(e);
    }
  };

  const handleNativeChangeText = (text: string) => {
    lastSentValueRef.current = text;
    setLocalText(text);
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
    }, 250);

    if (customKeyboardEnabled) {
      Keyboard.dismiss();
      if (!isActive) {
        const valLen = value ? value.length : 0;
        const currentSelection = localSelection || {
          start: valLen,
          end: valLen,
        };
        setLocalText(value);
        contextOnFocus(id, value, currentSelection);
      } else {
        showKeyboard();
      }
    }
  };

  const displayValue = customKeyboardEnabled && isActive ? localText : value;
  const valLen = typeof displayValue === 'string' ? displayValue.length : 0;
  const safeSelection =
    customKeyboardEnabled && isActive && localSelection
      ? {
          start: Math.max(0, Math.min(localSelection.start, valLen)),
          end: Math.max(0, Math.min(localSelection.end, valLen)),
        }
      : undefined;

  return (
    <TextInput
      ref={inputRef}
      value={displayValue}
      onChangeText={handleNativeChangeText}
      onFocus={handleFocus}
      onBlur={handleBlur}
      onTouchStart={handleTouchStart}
      maxLength={maxLength}
      onSelectionChange={handleSelectionChange}
      onSubmitEditing={onSubmitEditing}
      showSoftInputOnFocus={customKeyboardEnabled ? false : showSoftInputOnFocus}
      editable={editable}
      keyboardType={keyboardType}
      selection={safeSelection}
      cursorColor={colors.primary}
      selectionColor={colors.primary}
      placeholderTextColor={props.placeholderTextColor || colors.text.secondary}
      {...props}
      style={[{ color: colors.text.primary }, props.style]}
    />
  );
});

KeyboardTextInput.displayName = 'KeyboardTextInput';
export default KeyboardTextInput;
