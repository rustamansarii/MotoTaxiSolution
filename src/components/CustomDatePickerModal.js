import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { COLORS } from '../theme/colors';
import { RADIUS, SPACING } from '../theme/spacing';
import { TYPOGRAPHY } from '../theme/typography';
import { responsiveFont } from '../utils/responsive';
import Icon from './Icon';

const GREEN = '#17baa1';

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const MONTH_SHORT = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

const DAY_NAMES = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

// Generates years from current year - 100 to current year + 25 (supports DOB & future dates)
const generateYears = () => {
  const currentYear = new Date().getFullYear();
  const start = currentYear - 100;
  const end = currentYear + 25;
  const years = [];
  for (let y = start; y <= end; y++) {
    years.push(y);
  }
  return years;
};

const YEARS_LIST = generateYears();

export const CustomDatePickerModal = ({
  visible,
  onClose,
  onSelectDate,
  value, // string 'YYYY-MM-DD'
  title = 'Select Date',
  minDate = null,
  maxDate = null,
}) => {
  // Parse initial date
  const parseDateString = str => {
    if (str && typeof str === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(str)) {
      const parts = str.split('-').map(p => parseInt(p, 10));
      return new Date(parts[0], parts[1] - 1, parts[2]);
    }
    return new Date();
  };

  const [selectedDate, setSelectedDate] = useState(() => parseDateString(value));
  const [viewYear, setViewYear] = useState(() => selectedDate.getFullYear());
  const [viewMonth, setViewMonth] = useState(() => selectedDate.getMonth()); // 0-11
  const [pickerMode, setPickerMode] = useState('calendar'); // 'calendar' | 'year' | 'month'

  useEffect(() => {
    if (visible) {
      const d = parseDateString(value);
      setSelectedDate(d);
      setViewYear(d.getFullYear());
      setViewMonth(d.getMonth());
      setPickerMode('calendar');
    }
  }, [visible, value]);

  // Format YYYY-MM-DD
  const formatDateISO = d => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(v => v - 1);
    } else {
      setViewMonth(v => v - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(v => v + 1);
    } else {
      setViewMonth(v => v + 1);
    }
  };

  const handleSelectDay = day => {
    const newDate = new Date(viewYear, viewMonth, day);
    setSelectedDate(newDate);
  };

  const handleApplyPreset = yearsToAdd => {
    const base = new Date();
    const target = new Date(
      base.getFullYear() + yearsToAdd,
      base.getMonth(),
      base.getDate()
    );
    setSelectedDate(target);
    setViewYear(target.getFullYear());
    setViewMonth(target.getMonth());
  };

  const handleConfirm = () => {
    const formatted = formatDateISO(selectedDate);
    onSelectDate(formatted);
    onClose();
  };

  // Build days matrix for the viewYear & viewMonth
  const calendarDays = useMemo(() => {
    const firstDayIndex = new Date(viewYear, viewMonth, 1).getDay(); // 0 = Sunday
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const daysInPrevMonth = new Date(viewYear, viewMonth, 0).getDate();

    const days = [];

    // Prev month padding
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      days.push({
        day: daysInPrevMonth - i,
        isCurrentMonth: false,
        isPrev: true,
      });
    }

    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({
        day: i,
        isCurrentMonth: true,
      });
    }

    // Next month padding to fill rows of 7
    const remaining = 42 - days.length; // 6 rows of 7
    if (remaining < 7) {
      for (let i = 1; i <= remaining; i++) {
        days.push({
          day: i,
          isCurrentMonth: false,
          isNext: true,
        });
      }
    }

    return days;
  }, [viewYear, viewMonth]);

  const isSameDay = (d1, d2) => {
    return (
      d1.getFullYear() === d2.getFullYear() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getDate() === d2.getDate()
    );
  };

  const today = new Date();

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        activeOpacity={1}
        onPress={onClose}
        style={styles.backdrop}
      >
        <TouchableOpacity
          activeOpacity={1}
          style={styles.card}
          onPress={e => e.stopPropagation()}
        >
          {/* Top Title & Close Bar */}
          <View style={styles.header}>
            <View>
              <Text style={styles.modalTitle}>{title}</Text>
              <Text style={styles.selectedDateBadge}>
                {selectedDate.toLocaleDateString('en-US', {
                  weekday: 'short',
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Icon name="close" size={20} color="#64748B" />
            </TouchableOpacity>
          </View>

          {/* Quick Presets for Vehicle Documents */}
          <View style={styles.presetsRow}>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => handleApplyPreset(0)}
              style={styles.presetChip}
            >
              <Text style={styles.presetChipText}>Today</Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => handleApplyPreset(1)}
              style={styles.presetChip}
            >
              <Text style={styles.presetChipText}>+1 Year</Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => handleApplyPreset(5)}
              style={styles.presetChip}
            >
              <Text style={styles.presetChipText}>+5 Years</Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => handleApplyPreset(15)}
              style={[styles.presetChip, styles.presetChipRc]}
            >
              <Text style={[styles.presetChipText, styles.presetChipRcText]}>
                +15 Yrs (RC)
              </Text>
            </TouchableOpacity>
          </View>

          {/* Month & Year Navigation Row */}
          <View style={styles.navRow}>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={handlePrevMonth}
              style={styles.navArrowBtn}
            >
              <Icon name="chevron-left" size={18} color="#0F172A" />
            </TouchableOpacity>

            <View style={styles.navCenterToggle}>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() =>
                  setPickerMode(pickerMode === 'month' ? 'calendar' : 'month')
                }
                style={[
                  styles.navToggleBtn,
                  pickerMode === 'month' && styles.navToggleBtnActive,
                ]}
              >
                <Text
                  style={[
                    styles.navToggleText,
                    pickerMode === 'month' && styles.navToggleTextActive,
                  ]}
                >
                  {MONTH_NAMES[viewMonth]} ▾
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() =>
                  setPickerMode(pickerMode === 'year' ? 'calendar' : 'year')
                }
                style={[
                  styles.navToggleBtn,
                  pickerMode === 'year' && styles.navToggleBtnActive,
                ]}
              >
                <Text
                  style={[
                    styles.navToggleText,
                    pickerMode === 'year' && styles.navToggleTextActive,
                  ]}
                >
                  {viewYear} ▾
                </Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={handleNextMonth}
              style={styles.navArrowBtn}
            >
              <Icon name="chevron-right" size={18} color="#0F172A" />
            </TouchableOpacity>
          </View>

          {/* VIEW 1: CALENDAR VIEW */}
          {pickerMode === 'calendar' && (
            <View style={styles.calendarContainer}>
              {/* Day Name Columns */}
              <View style={styles.weekdaysRow}>
                {DAY_NAMES.map((dn, idx) => (
                  <Text key={idx} style={styles.weekdayLabel}>
                    {dn}
                  </Text>
                ))}
              </View>

              {/* Day Numbers Grid */}
              <View style={styles.daysGrid}>
                {calendarDays.map((item, index) => {
                  if (!item.isCurrentMonth) {
                    return (
                      <View key={index} style={styles.dayCell}>
                        <Text style={styles.dayTextInactive}>{item.day}</Text>
                      </View>
                    );
                  }

                  const cellDate = new Date(viewYear, viewMonth, item.day);
                  const isSelected = isSameDay(cellDate, selectedDate);
                  const isCurrentToday = isSameDay(cellDate, today);

                  return (
                    <TouchableOpacity
                      key={index}
                      activeOpacity={0.7}
                      onPress={() => handleSelectDay(item.day)}
                      style={[
                        styles.dayCell,
                        isSelected && styles.dayCellSelected,
                        !isSelected && isCurrentToday && styles.dayCellToday,
                      ]}
                    >
                      <Text
                        style={[
                          styles.dayText,
                          isSelected && styles.dayTextSelected,
                          !isSelected && isCurrentToday && styles.dayTextToday,
                        ]}
                      >
                        {item.day}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}

          {/* VIEW 2: MONTH PICKER GRID */}
          {pickerMode === 'month' && (
            <View style={styles.pickerGridContainer}>
              <Text style={styles.pickerGridHeading}>Select Month</Text>
              <View style={styles.monthsGrid}>
                {MONTH_NAMES.map((mName, idx) => {
                  const isCurrent = viewMonth === idx;
                  return (
                    <TouchableOpacity
                      key={idx}
                      activeOpacity={0.7}
                      onPress={() => {
                        setViewMonth(idx);
                        setPickerMode('calendar');
                      }}
                      style={[
                        styles.monthChip,
                        isCurrent && styles.monthChipActive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.monthChipText,
                          isCurrent && styles.monthChipTextActive,
                        ]}
                      >
                        {MONTH_SHORT[idx]}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}

          {/* VIEW 3: YEAR PICKER GRID */}
          {pickerMode === 'year' && (
            <View style={styles.pickerGridContainer}>
              <Text style={styles.pickerGridHeading}>Select Year</Text>
              <ScrollView
                style={styles.yearsScrollView}
                contentContainerStyle={styles.yearsGrid}
                showsVerticalScrollIndicator={true}
              >
                {YEARS_LIST.map(y => {
                  const isCurrent = viewYear === y;
                  return (
                    <TouchableOpacity
                      key={y}
                      activeOpacity={0.7}
                      onPress={() => {
                        setViewYear(y);
                        setPickerMode('calendar');
                      }}
                      style={[
                        styles.yearChip,
                        isCurrent && styles.yearChipActive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.yearChipText,
                          isCurrent && styles.yearChipTextActive,
                        ]}
                      >
                        {y}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          )}

          {/* Action Buttons */}
          <View style={styles.footerActions}>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={onClose}
              style={styles.cancelBtn}
            >
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.85}
              onPress={handleConfirm}
              style={styles.confirmBtn}
            >
              <Text style={styles.confirmBtnText}>Confirm Date</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#FFFFFF',
    borderRadius: RADIUS.large,
    padding: SPACING.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.md,
  },
  modalTitle: {
    fontSize: responsiveFont(16),
    fontWeight: '800',
    color: '#0F172A',
  },
  selectedDateBadge: {
    fontSize: responsiveFont(13),
    fontWeight: '700',
    color: GREEN,
    marginTop: 2,
  },
  closeBtn: {
    padding: 6,
    borderRadius: RADIUS.round,
    backgroundColor: '#F1F5F9',
  },
  presetsRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: SPACING.md,
    flexWrap: 'wrap',
  },
  presetChip: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: RADIUS.round,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  presetChipText: {
    fontSize: responsiveFont(11),
    fontWeight: '700',
    color: '#475569',
  },
  presetChipRc: {
    backgroundColor: '#E6FAF7',
    borderColor: '#B7F5E5',
  },
  presetChipRcText: {
    color: '#0e7061',
  },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderRadius: RADIUS.medium,
    paddingHorizontal: 6,
    paddingVertical: 4,
    marginBottom: SPACING.md,
  },
  navArrowBtn: {
    padding: 8,
    borderRadius: RADIUS.round,
  },
  navCenterToggle: {
    flexDirection: 'row',
    gap: 6,
  },
  navToggleBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: RADIUS.medium,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  navToggleBtnActive: {
    backgroundColor: '#E6FAF7',
    borderColor: GREEN,
  },
  navToggleText: {
    fontSize: responsiveFont(13),
    fontWeight: '700',
    color: '#0F172A',
  },
  navToggleTextActive: {
    color: '#0e7061',
  },
  calendarContainer: {
    marginBottom: SPACING.md,
  },
  weekdaysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
    paddingHorizontal: 2,
  },
  weekdayLabel: {
    width: 40,
    textAlign: 'center',
    fontSize: responsiveFont(12),
    fontWeight: '700',
    color: '#94A3B8',
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  dayCell: {
    width: 40,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 2,
  },
  dayCellSelected: {
    backgroundColor: GREEN,
    shadowColor: GREEN,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 3,
  },
  dayCellToday: {
    borderWidth: 1.5,
    borderColor: GREEN,
  },
  dayText: {
    fontSize: responsiveFont(13),
    fontWeight: '600',
    color: '#0F172A',
  },
  dayTextSelected: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  dayTextToday: {
    color: GREEN,
    fontWeight: '800',
  },
  dayTextInactive: {
    fontSize: responsiveFont(12),
    color: '#CBD5E1',
  },
  pickerGridContainer: {
    height: 250,
    marginBottom: SPACING.md,
  },
  pickerGridHeading: {
    fontSize: responsiveFont(12),
    fontWeight: '700',
    color: '#64748B',
    marginBottom: 8,
    textAlign: 'center',
  },
  monthsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
    paddingVertical: 10,
  },
  monthChip: {
    width: '30%',
    paddingVertical: 12,
    backgroundColor: '#F8FAFC',
    borderRadius: RADIUS.medium,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  monthChipActive: {
    backgroundColor: '#E6FAF7',
    borderColor: GREEN,
  },
  monthChipText: {
    fontSize: responsiveFont(13),
    fontWeight: '700',
    color: '#334155',
  },
  monthChipTextActive: {
    color: '#0e7061',
  },
  yearsScrollView: {
    flex: 1,
  },
  yearsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
    paddingBottom: 16,
  },
  yearChip: {
    width: '30%',
    paddingVertical: 11,
    backgroundColor: '#F8FAFC',
    borderRadius: RADIUS.medium,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  yearChipActive: {
    backgroundColor: '#E6FAF7',
    borderColor: GREEN,
  },
  yearChipText: {
    fontSize: responsiveFont(13),
    fontWeight: '700',
    color: '#334155',
  },
  yearChipTextActive: {
    color: '#0e7061',
  },
  footerActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: RADIUS.medium,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
  },
  cancelBtnText: {
    fontSize: responsiveFont(14),
    fontWeight: '700',
    color: '#475569',
  },
  confirmBtn: {
    flex: 1.6,
    paddingVertical: 12,
    borderRadius: RADIUS.medium,
    backgroundColor: GREEN,
    alignItems: 'center',
    shadowColor: GREEN,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 2,
  },
  confirmBtnText: {
    fontSize: responsiveFont(14),
    fontWeight: '800',
    color: '#FFFFFF',
  },
});

export default CustomDatePickerModal;
