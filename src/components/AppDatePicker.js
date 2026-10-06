import React, { useMemo } from 'react';
import { NativeModules, TurboModuleRegistry, Platform } from 'react-native';
import DatePicker from 'react-native-date-picker';
import CustomDatePickerModal from './CustomDatePickerModal';

/**
 * Check if react-native-date-picker native module is registered and compiled in the running APK/app
 */
export const isNativeDatePickerAvailable = () => {
  try {
    if (Platform.OS === 'android') {
      const turbo = TurboModuleRegistry?.get?.('RNDatePicker');
      const legacy = NativeModules?.RNDatePicker;
      return Boolean(turbo || legacy);
    }
    if (Platform.OS === 'ios') {
      return Boolean(NativeModules?.RNDatePicker);
    }
    return false;
  } catch {
    return false;
  }
};

/**
 * AppDatePicker
 * Integrates `react-native-date-picker` with graceful fallback to CustomDatePickerModal
 * when running without a fresh native compilation.
 *
 * @param {boolean} open - whether modal is open
 * @param {string|Date} value - date string in DD-MM-YYYY or YYYY-MM-DD, or Date object
 * @param {Function} onConfirm - (dateString: formatted string) => void
 * @param {Function} onCancel - () => void
 * @param {string} title - title for date picker
 * @param {string} returnFormat - 'DD-MM-YYYY' | 'YYYY-MM-DD' (default: 'YYYY-MM-DD')
 * @param {Date} maximumDate - optional upper bound for selectable date
 * @param {Date} minimumDate - optional lower bound for selectable date
 * @param {Date} defaultDate - optional fallback date when value is empty
 * @param {string} mode - 'date' | 'time' | 'datetime'
 */
export const AppDatePicker = ({
  open,
  value,
  onConfirm,
  onCancel,
  title = 'Select Date',
  returnFormat = 'YYYY-MM-DD',
  maximumDate,
  minimumDate,
  defaultDate,
  mode = 'date',
}) => {
  const nativeAvailable = useMemo(() => isNativeDatePickerAvailable(), []);

  // Parse YYYY-MM-DD or DD-MM-YYYY into Date object for react-native-date-picker
  const dateObj = useMemo(() => {
    if (value instanceof Date && !isNaN(value.getTime())) {
      return value;
    }
    if (value && typeof value === 'string' && value.trim()) {
      const clean = value.trim().split('T')[0];
      // Match DD-MM-YYYY or DD/MM/YYYY
      const dmyMatch = clean.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/);
      if (dmyMatch) {
        const [, d, m, y] = dmyMatch.map(Number);
        const parsed = new Date(y, m - 1, d);
        if (!isNaN(parsed.getTime())) return parsed;
      }
      // Match YYYY-MM-DD or YYYY/MM/DD
      const ymdMatch = clean.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/);
      if (ymdMatch) {
        const [, y, m, d] = ymdMatch.map(Number);
        const parsed = new Date(y, m - 1, d);
        if (!isNaN(parsed.getTime())) return parsed;
      }
    }
    if (defaultDate instanceof Date && !isNaN(defaultDate.getTime())) {
      return defaultDate;
    }
    return new Date();
  }, [value, defaultDate]);

  const handleNativeConfirm = selectedDate => {
    const year = selectedDate.getFullYear();
    const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
    const day = String(selectedDate.getDate()).padStart(2, '0');
    if (returnFormat === 'DD-MM-YYYY') {
      onConfirm(`${day}-${month}-${year}`);
    } else {
      onConfirm(`${year}-${month}-${day}`);
    }
  };

  const fallbackIsoValue = useMemo(() => {
    if (!value || typeof value !== 'string') return '';
    const clean = value.trim().split('T')[0];
    const dmyMatch = clean.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/);
    if (dmyMatch) {
      const [, d, m, y] = dmyMatch;
      return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
    }
    return clean;
  }, [value]);

  const handleFallbackConfirm = isoDateStr => {
    if (returnFormat === 'DD-MM-YYYY' && typeof isoDateStr === 'string') {
      const ymdMatch = isoDateStr.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/);
      if (ymdMatch) {
        const [, y, m, d] = ymdMatch;
        onConfirm(`${d.padStart(2, '0')}-${m.padStart(2, '0')}-${y}`);
        return;
      }
    }
    onConfirm(isoDateStr);
  };

  if (nativeAvailable) {
    return (
      <DatePicker
        modal
        open={open}
        date={dateObj}
        mode={mode}
        title={title}
        maximumDate={maximumDate}
        minimumDate={minimumDate}
        confirmText="Confirm"
        cancelText="Cancel"
        onConfirm={handleNativeConfirm}
        onCancel={onCancel}
      />
    );
  }

  return (
    <CustomDatePickerModal
      visible={open}
      value={fallbackIsoValue}
      title={title}
      minDate={minimumDate}
      maxDate={maximumDate}
      onSelectDate={handleFallbackConfirm}
      onClose={onCancel}
    />
  );
};

export default AppDatePicker;
