import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { KeyboardKeyConfig } from './layouts';
import { useApp } from '../../context/AppContext';
import { BackHandler } from 'react-native';

export type KeyboardLanguage = 'english' | 'french';
export type KeyboardActiveLayout = 'english' | 'french' | 'numbers' | 'symbols';

export interface KeyboardInputMetadata {
  id: string;
  value: string;
  selection: { start: number; end: number };
  keyboardType: 'default' | 'numeric' | 'number-pad' | 'decimal-pad' | string;
  placeholder?: string;
  onChangeText: (text: string) => void;
  onSubmitEditing?: () => void;
  onBlur?: () => void;
  blur?: () => void;
  focus?: () => void;
  maxLength?: number;
}

export interface KeyboardContextType {
  activeInputId: string | null;
  value: string;
  selection: { start: number; end: number };
  keyboardVisible: boolean;
  keyboardHeight: number;
  setKeyboardHeight: (height: number) => void;
  activeLayout: KeyboardActiveLayout;
  isShiftActive: boolean;
  isCapsLock: boolean;
  symbolsPage: 'page1' | 'page2';
  theme: 'light' | 'dark';
  registerInput: (id: string, metadata: Omit<KeyboardInputMetadata, 'value' | 'selection'>) => void;
  unregisterInput: (id: string) => void;
  onFocus: (id: string, value: string, selection: { start: number; end: number }) => void;
  onBlur: (id: string) => void;
  onSelectionChange: (id: string, selection: { start: number; end: number }, isUserTap?: boolean) => void;
  onValueChange: (id: string, value: string) => void;
  handleKeyPress: (key: KeyboardKeyConfig) => boolean | void;
  moveCursor: (direction: 'left' | 'right') => void;
  hideKeyboard: () => void;
  showKeyboard: () => void;
  toggleTheme: () => void;
  isNumericOnly: boolean;
  getLastKeyPressTime: () => number;
  registerRepeatCanceler?: (canceler: (() => void) | null) => void;
  cancelActiveRepeat?: () => void;
}

const KeyboardContext = createContext<KeyboardContextType | undefined>(undefined);

export const KeyboardProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { language } = useApp();
  const [keyboardLanguage, setKeyboardLanguage] = useState<KeyboardLanguage>('english');
  const [activeInputId, setActiveInputId] = useState<string | null>(null);
  const [value, setValue] = useState('');
  const [selection, setSelection] = useState({ start: 0, end: 0 });
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(355);
  const [activeLayout, setActiveLayout] = useState<KeyboardActiveLayout>('english');
  const [isShiftActive, setIsShiftActive] = useState(false);
  const [isCapsLock, setIsCapsLock] = useState(false);
  const [symbolsPage, setSymbolsPage] = useState<'page1' | 'page2'>('page1');
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  const inputsRef = useRef<Record<string, Omit<KeyboardInputMetadata, 'value' | 'selection'>>>({});
  const lastShiftTapRef = useRef<number>(0);
  const lastKeyPressTimeRef = useRef<number>(0);

  // Sync keyboard language when app language changes (supports only 'en' and 'fr')
  useEffect(() => {
    setKeyboardLanguage(language === 'fr' ? 'french' : 'english');
  }, [language]);

  // Sync keyboard layout with local keyboard language
  useEffect(() => {
    if (activeInputId) {
      const input = inputsRef.current[activeInputId];
      if (input && isNumericType(input.keyboardType)) {
        setActiveLayout('numbers');
        return;
      }
    }
    setActiveLayout(keyboardLanguage);
  }, [keyboardLanguage, activeInputId]);

  const isNumericType = (type?: string) => {
    return type === 'numeric' || type === 'number-pad' || type === 'decimal-pad' || type === 'phone-pad';
  };

  const isNumericOnly = activeInputId
    ? isNumericType(inputsRef.current[activeInputId]?.keyboardType)
    : false;

  // Refs for tracking state to avoid rebuilding callbacks
  const activeInputIdRef = useRef(activeInputId);
  const valueRef = useRef(value);
  const selectionRef = useRef(selection);
  const isShiftActiveRef = useRef(isShiftActive);
  const isCapsLockRef = useRef(isCapsLock);
  const keyboardLanguageRef = useRef(keyboardLanguage);
  const activeLayoutRef = useRef(activeLayout);

  useEffect(() => { activeInputIdRef.current = activeInputId; }, [activeInputId]);
  useEffect(() => { valueRef.current = value; }, [value]);
  useEffect(() => { selectionRef.current = selection; }, [selection]);
  useEffect(() => { isShiftActiveRef.current = isShiftActive; }, [isShiftActive]);
  useEffect(() => { isCapsLockRef.current = isCapsLock; }, [isCapsLock]);
  useEffect(() => { keyboardLanguageRef.current = keyboardLanguage; }, [keyboardLanguage]);
  useEffect(() => { activeLayoutRef.current = activeLayout; }, [activeLayout]);

  // Back button handler to hide the keyboard on Android back press
  useEffect(() => {
    const handleBackButton = () => {
      if (keyboardVisible) {
        setKeyboardVisible(false);
        const activeId = activeInputIdRef.current;
        if (activeId) {
          const input = inputsRef.current[activeId];
          if (input && input.blur) {
            input.blur();
          }
        }
        return true; // prevent default back action (don't navigate back)
      }
      return false; // let default back action run
    };

    const subscription = BackHandler.addEventListener('hardwareBackPress', handleBackButton);

    return () => {
      subscription.remove();
    };
  }, [keyboardVisible]);

  const activeRepeatCancelerRef = useRef<(() => void) | null>(null);

  const cancelActiveRepeat = useCallback(() => {
    if (activeRepeatCancelerRef.current) {
      try {
        activeRepeatCancelerRef.current();
      } catch (e) {}
      activeRepeatCancelerRef.current = null;
    }
  }, []);

  const registerRepeatCanceler = useCallback((canceler: (() => void) | null) => {
    activeRepeatCancelerRef.current = canceler;
  }, []);

  const registerInput = useCallback((id: string, metadata: Omit<KeyboardInputMetadata, 'value' | 'selection'>) => {
    inputsRef.current[id] = metadata;
  }, []);

  const unregisterInput = useCallback((id: string) => {
    delete inputsRef.current[id];
    if (activeInputIdRef.current === id) {
      setActiveInputId(null);
      setKeyboardVisible(false);
      cancelActiveRepeat();
    }
  }, [cancelActiveRepeat]);

  const onFocus = useCallback((id: string, initialValue: string, initialSelection: { start: number; end: number }) => {
    cancelActiveRepeat();
    activeInputIdRef.current = id;
    const safeVal = typeof initialValue === 'string' ? initialValue : '';
    valueRef.current = safeVal;
    const valLen = safeVal.length;
    const safeSel = {
      start: Math.max(0, Math.min(initialSelection?.start ?? valLen, valLen)),
      end: Math.max(0, Math.min(initialSelection?.end ?? valLen, valLen)),
    };
    selectionRef.current = safeSel;

    setActiveInputId(id);
    setValue(safeVal);
    setSelection(safeSel);
    setKeyboardVisible(true);

    const input = inputsRef.current[id];
    if (input && isNumericType(input.keyboardType)) {
      setActiveLayout('numbers');
    } else {
      setActiveLayout(keyboardLanguageRef.current);
    }
    setIsShiftActive(false);
    setIsCapsLock(false);
  }, [cancelActiveRepeat]);

  const onBlur = useCallback((id: string) => {
    cancelActiveRepeat();
    if (activeInputIdRef.current === id) {
      // Trigger target input blur callback
      inputsRef.current[id]?.onBlur?.();
    }
  }, [cancelActiveRepeat]);

  const onSelectionChange = useCallback((id: string, newSelection: { start: number; end: number }, isUserTap?: boolean) => {
    if (activeInputIdRef.current === id) {
      // If this is an echo from typing (not an explicit manual touch on the input)
      // and a key was typed recently (< 300ms), ignore the echo to prevent jumbled letters!
      if (!isUserTap && Date.now() - lastKeyPressTimeRef.current < 300) {
        return;
      }

      // If user explicitly touched the text input, accept the selection and clear lastKeyPressTime
      if (isUserTap) {
        lastKeyPressTimeRef.current = 0;
      }

      const valLen = valueRef.current ? valueRef.current.length : 0;
      const safeSel = {
        start: Math.max(0, Math.min(newSelection.start, valLen)),
        end: Math.max(0, Math.min(newSelection.end, valLen)),
      };
      selectionRef.current = safeSel;
      setSelection(safeSel);
    }
  }, []);

  const onValueChange = useCallback((id: string, newValue: string) => {
    if (activeInputIdRef.current === id) {
      const safeVal = typeof newValue === 'string' ? newValue : '';
      valueRef.current = safeVal;
      const valLen = safeVal.length;
      const curSel = selectionRef.current;
      const safeStart = Math.max(0, Math.min(curSel?.start ?? valLen, valLen));
      const safeEnd = Math.max(0, Math.min(curSel?.end ?? valLen, valLen));
      const safeSel = { start: safeStart, end: safeEnd };
      selectionRef.current = safeSel;
      setValue(safeVal);
      setSelection(safeSel);
    }
  }, []);

  const hideKeyboard = useCallback(() => {
    cancelActiveRepeat();
    setKeyboardVisible(false);
    setActiveInputId(null);
    const activeId = activeInputIdRef.current;
    if (activeId) {
      const input = inputsRef.current[activeId];
      if (input && input.blur) {
        input.blur();
      }
    }
  }, [cancelActiveRepeat]);

  const showKeyboard = useCallback(() => {
    const activeId = activeInputIdRef.current;
    if (activeId) {
      setKeyboardVisible(true);
      inputsRef.current[activeId]?.focus?.();
    }
  }, []);

  const moveCursor = useCallback((direction: 'left' | 'right') => {
    const rawVal = valueRef.current;
    const val = typeof rawVal === 'string' ? rawVal : '';
    const valLen = val.length;
    const rawSel = selectionRef.current;
    const currentStart = rawSel?.start ?? valLen;
    const currentEnd = rawSel?.end ?? valLen;

    let newPos = currentStart;
    if (direction === 'left') {
      newPos = Math.max(0, currentStart - 1);
    } else {
      newPos = Math.min(valLen, currentEnd + 1);
    }

    const newSelection = { start: newPos, end: newPos };
    selectionRef.current = newSelection;
    setSelection(newSelection);

    const activeId = activeInputIdRef.current;
    if (activeId) {
      inputsRef.current[activeId]?.focus?.();
    }
  }, []);

  const handleKeyPress = useCallback((key: KeyboardKeyConfig): boolean | void => {
    lastKeyPressTimeRef.current = Date.now();

    // If ANY key other than backspace is pressed, cancel any repeating timer immediately
    if (key.action !== 'backspace') {
      cancelActiveRepeat();
    }

    const activeId = activeInputIdRef.current;
    if (!activeId) return false;

    const input = inputsRef.current[activeId];
    if (!input) return false;

    // Keep native input focused on each keypress so blinking cursor stays visible
    input.focus?.();

    const rawVal = valueRef.current;
    const val = typeof rawVal === 'string' ? rawVal : '';
    const rawSel = selectionRef.current;
    const valLen = val.length;
    const start = Math.max(0, Math.min(rawSel?.start ?? valLen, valLen));
    const end = Math.max(0, Math.min(rawSel?.end ?? valLen, valLen));
    const isShift = isShiftActiveRef.current;
    const isCaps = isCapsLockRef.current;
    const keyboardLang = keyboardLanguageRef.current;

    switch (key.action) {
      case 'char': {
        const charToInsert = key.value !== undefined ? key.value : key.label;
        
        if (input.maxLength !== undefined && input.maxLength !== null) {
          const lengthDiff = charToInsert.length - (end - start);
          if (val.length + lengthDiff > input.maxLength) {
            break;
          }
        }

        const newValue = val.substring(0, start) + charToInsert + val.substring(end);
        
        const newCursorPos = start + charToInsert.length;
        const newSelection = { start: newCursorPos, end: newCursorPos };

        // Synchronously update refs immediately for rapid burst typing
        valueRef.current = newValue;
        selectionRef.current = newSelection;

        setValue(newValue);
        setSelection(newSelection);
        input.onChangeText(newValue);

        // Turn off shift if it was active and not caps locked
        if (isShift && !isCaps) {
          setIsShiftActive(false);
          isShiftActiveRef.current = false;
        }
        return true;
      }
      case 'space': {
        if (input.maxLength !== undefined && input.maxLength !== null) {
          const lengthDiff = 1 - (end - start);
          if (val.length + lengthDiff > input.maxLength) {
            break;
          }
        }

        const newValue = val.substring(0, start) + ' ' + val.substring(end);
        const newCursorPos = start + 1;
        const newSelection = { start: newCursorPos, end: newCursorPos };

        // Synchronously update refs immediately
        valueRef.current = newValue;
        selectionRef.current = newSelection;

        setValue(newValue);
        setSelection(newSelection);
        input.onChangeText(newValue);
        return true;
      }
      case 'backspace': {
        if (valLen === 0 || (start === 0 && end === 0)) {
          // Already empty or cursor at start: nothing to delete!
          cancelActiveRepeat();
          return false;
        }

        let newValue = val;
        let newSelection = { start, end };

        if (start === end) {
          if (start > 0) {
            newValue = val.substring(0, start - 1) + val.substring(start);
            newSelection = { start: start - 1, end: start - 1 };
          } else {
            cancelActiveRepeat();
            return false;
          }
        } else {
          newValue = val.substring(0, start) + val.substring(end);
          newSelection = { start: start, end: start };
        }

        // Synchronously update refs immediately
        valueRef.current = newValue;
        selectionRef.current = newSelection;

        setValue(newValue);
        setSelection(newSelection);
        input.onChangeText(newValue);

        // If the resulting text is now empty, cancel any repeat immediately
        if (newValue.length === 0) {
          cancelActiveRepeat();
        }
        return true;
      }
      case 'shift': {
        const now = Date.now();
        if (now - lastShiftTapRef.current < 300) {
          // Double tap -> Caps Lock
          setIsCapsLock(!isCaps);
          setIsShiftActive(!isCaps);
        } else {
          // Single tap -> toggle Shift
          if (isCaps) {
            setIsCapsLock(false);
            setIsShiftActive(false);
          } else {
            setIsShiftActive(!isShift);
          }
        }
        lastShiftTapRef.current = now;
        break;
      }
      case 'switch': {
        if (key.value === 'numbers') {
          setActiveLayout('numbers');
        } else if (key.value === 'symbols') {
          setActiveLayout('symbols');
          setSymbolsPage('page1');
        } else if (key.value === 'alpha') {
          setActiveLayout(keyboardLang);
        }
        break;
      }
      case 'lang': {
        const nextLang: KeyboardLanguage = keyboardLang === 'french' ? 'english' : 'french';
        setKeyboardLanguage(nextLang);
        setActiveLayout(nextLang);
        break;
      }
      case 'page': {
        if (key.value === 'page1' || key.value === 'page2') {
          setSymbolsPage(key.value);
        }
        break;
      }
      case 'enter': {
        if (input.onSubmitEditing) {
          input.onSubmitEditing();
        }
        // By default, enter closes keyboard / finishes input
        hideKeyboard();
        break;
      }
      case 'hide': {
        hideKeyboard();
        break;
      }
      case 'cursor_left': {
        moveCursor('left');
        return true;
      }
      case 'cursor_right': {
        moveCursor('right');
        return true;
      }
      default:
        break;
    }
  }, [hideKeyboard, moveCursor, cancelActiveRepeat]);

  const toggleTheme = useCallback(() => {
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
  }, []);

  return (
    <KeyboardContext.Provider
      value={{
        activeInputId,
        value,
        selection,
        keyboardVisible,
        keyboardHeight,
        setKeyboardHeight,
        activeLayout,
        isShiftActive,
        isCapsLock,
        symbolsPage,
        theme,
        registerInput,
        unregisterInput,
        onFocus,
        onBlur,
        onSelectionChange,
        onValueChange,
        handleKeyPress,
        moveCursor,
        hideKeyboard,
        showKeyboard,
        toggleTheme,
        isNumericOnly,
        getLastKeyPressTime: () => lastKeyPressTimeRef.current,
        registerRepeatCanceler,
        cancelActiveRepeat,
      }}
    >
      {children}
    </KeyboardContext.Provider>
  );
};

export const useKeyboard = () => {
  const context = useContext(KeyboardContext);
  if (!context) {
    throw new Error('useKeyboard must be used within a KeyboardProvider');
  }
  return context;
};

export const useKeyboardSafe = () => {
  return useContext(KeyboardContext);
};
