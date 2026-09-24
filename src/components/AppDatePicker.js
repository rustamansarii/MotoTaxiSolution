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
 * @param {string} value - date string in YYYY-MM-DD
 * @param {Function} onConfirm - (dateString: 'YYYY-MM-DD') => void
 * @param {Function} onCancel - () => void
 * @param {string} title - title for date picker
 */
export const AppDatePicker = ({
  open,
  value,
  onConfirm,
  onCancel,
  title = 'Select Date',
}) => {
  const nativeAvailable = useMemo(() => isNativeDatePickerAvailable(), []);

  // Parse YYYY-MM-DD into Date object for react-native-date-picker
  const dateObj = useMemo(() => {
    if (value && typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
      const [year, month, day] = value.split('-').map(Number);
      return new Date(year, month - 1, day);
    }
    return new Date();
  }, [value]);

  const handleNativeConfirm = selectedDate => {
    const year = selectedDate.getFullYear();
    const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
    const day = String(selectedDate.getDate()).padStart(2, '0');
    const formatted = `${year}-${month}-${day}`;
    onConfirm(formatted);
  };

  if (nativeAvailable) {
    return (
      <DatePicker
        modal
        open={open}
        date={dateObj}
        mode="date"
        title={title}
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
      value={value}
      title={title}
      onSelectDate={onConfirm}
      onClose={onCancel}
    />
  );
};

export default AppDatePicker;
