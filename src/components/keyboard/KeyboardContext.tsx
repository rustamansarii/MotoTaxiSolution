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
  onSelectionChange: (id: string, selection: { start: number; end: number }) => void;
  onValueChange: (id: string, value: string) => void;
  handleKeyPress: (key: KeyboardKeyConfig) => void;
  hideKeyboard: () => void;
  showKeyboard: () => void;
  toggleTheme: () => void;
  isNumericOnly: boolean;
  getLastKeyPressTime: () => number;
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

  const registerInput = useCallback((id: string, metadata: Omit<KeyboardInputMetadata, 'value' | 'selection'>) => {
    inputsRef.current[id] = metadata;
  }, []);

  const unregisterInput = useCallback((id: string) => {
    delete inputsRef.current[id];
    if (activeInputIdRef.current === id) {
      setActiveInputId(null);
      setKeyboardVisible(false);
    }
  }, []);

  const onFocus = useCallback((id: string, initialValue: string, initialSelection: { start: number; end: number }) => {
    setActiveInputId(id);
    setValue(initialValue);
    setSelection(initialSelection);
    setKeyboardVisible(true);

    const input = inputsRef.current[id];
    if (input && isNumericType(input.keyboardType)) {
      setActiveLayout('numbers');
    } else {
      setActiveLayout(keyboardLanguageRef.current);
    }
    setIsShiftActive(false);
    setIsCapsLock(false);
  }, []);

  const onBlur = useCallback((id: string) => {
    if (activeInputIdRef.current === id) {
      // Trigger target input blur callback
      inputsRef.current[id]?.onBlur?.();
    }
  }, []);

  const onSelectionChange = useCallback((id: string, newSelection: { start: number; end: number }) => {
    if (activeInputIdRef.current === id) {
      setSelection(newSelection);
    }
  }, []);

  const onValueChange = useCallback((id: string, newValue: string) => {
    if (activeInputIdRef.current === id) {
      setValue(newValue);
    }
  }, []);

  const hideKeyboard = useCallback(() => {
    setKeyboardVisible(false);
    setActiveInputId(null);
    const activeId = activeInputIdRef.current;
    if (activeId) {
      const input = inputsRef.current[activeId];
      if (input && input.blur) {
        input.blur();
      }
    }
  }, []);

  const showKeyboard = useCallback(() => {
    const activeId = activeInputIdRef.current;
    if (activeId) {
      setKeyboardVisible(true);
    }
  }, []);

  const handleKeyPress = useCallback((key: KeyboardKeyConfig) => {
    lastKeyPressTimeRef.current = Date.now();
    const activeId = activeInputIdRef.current;
    if (!activeId) return;

    const input = inputsRef.current[activeId];
    if (!input) return;

    const val = valueRef.current;
    const sel = selectionRef.current;
    const isShift = isShiftActiveRef.current;
    const isCaps = isCapsLockRef.current;
    const keyboardLang = keyboardLanguageRef.current;

    switch (key.action) {
      case 'char': {
        const charToInsert = key.value !== undefined ? key.value : key.label;
        const start = sel.start;
        const end = sel.end;
        
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
        break;
      }
      case 'space': {
        const start = sel.start;
        const end = sel.end;

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
        break;
      }
      case 'backspace': {
        const start = sel.start;
        const end = sel.end;
        let newValue = val;
        let newSelection = { start, end };

        if (start === end) {
          if (start > 0) {
            newValue = val.substring(0, start - 1) + val.substring(start);
            newSelection = { start: start - 1, end: start - 1 };
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
        break;
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
      default:
        break;
    }
  }, [hideKeyboard]);

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
        hideKeyboard,
        showKeyboard,
        toggleTheme,
        isNumericOnly,
        getLastKeyPressTime: () => lastKeyPressTimeRef.current,
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
