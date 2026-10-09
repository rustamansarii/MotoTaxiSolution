import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Platform,
  Keyboard,
  Animated,
  Pressable,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets, SafeAreaProvider } from 'react-native-safe-area-context';
import { COLORS } from '../theme/colors';
import { RADIUS, SPACING } from '../theme/spacing';
import { TYPOGRAPHY } from '../theme/typography';
import { responsiveFont } from '../utils/responsive';
import Icon from './Icon';
import { useTranslation } from 'react-i18next';
import { KeyboardTextInput, CustomKeyboard, KeyboardProvider, useKeyboard } from './keyboard';

const CountryPickerModalInner = ({
  visible,
  onClose,
  countries = [],
  selectedCountry,
  onSelectCountry,
  loading = false,
  bottomOffset = 0,
}) => {
  const { t } = useTranslation();
  const { keyboardVisible, keyboardHeight, hideKeyboard, theme } = useKeyboard();
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef(null);
  const paddingAnim = useRef(new Animated.Value(0)).current;

  const isDark = theme === 'dark';
  const keyboardBg = isDark ? '#18181B' : '#D1D5DB';

  // Block native keyboard completely whenever modal is open
  useEffect(() => {
    if (visible) {
      Keyboard.dismiss();
      const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
      const sub = Keyboard.addListener(showEvent, () => {
        Keyboard.dismiss();
      });
      return () => sub.remove();
    }
  }, [visible]);

  // Reset search query and hide keyboard whenever modal closes
  useEffect(() => {
    if (!visible) {
      setSearchQuery('');
      hideKeyboard();
    }
  }, [visible, hideKeyboard]);

  // Animate content padding to ensure list items are not obscured by the custom keyboard
  const targetPadding = keyboardVisible ? (keyboardHeight || 303) + bottomOffset : 0;
  useEffect(() => {
    Animated.timing(paddingAnim, {
      toValue: targetPadding,
      duration: 180,
      useNativeDriver: false,
    }).start();
  }, [targetPadding, paddingAnim]);

  // Filter countries by name, iso2, or dial_code
  const filteredCountries = useMemo(() => {
    if (!searchQuery.trim()) {
      return countries;
    }
    const q = searchQuery.trim().toLowerCase().replace('+', '');
    return countries.filter(item => {
      const nameMatch = item.name?.toLowerCase().includes(q);
      const isoMatch = item.iso2?.toLowerCase().includes(q);
      const dialMatch = item.dial_code?.replace('+', '').includes(q);
      return nameMatch || isoMatch || dialMatch;
    });
  }, [countries, searchQuery]);

  // Single tap: closes keyboard AND selects the item
  const handleSelect = (country) => {
    hideKeyboard();
    onSelectCountry(country);
    setSearchQuery('');
    onClose();
  };

  const handleClose = () => {
    hideKeyboard();
    setSearchQuery('');
    onClose();
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    searchInputRef.current?.clear?.();
  };

  const renderItem = ({ item }) => {
    const isSelected =
      selectedCountry &&
      (selectedCountry.iso2 === item.iso2 ||
        (selectedCountry.dial_code === item.dial_code &&
          selectedCountry.name === item.name));

    return (
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => handleSelect(item)}
        style={[styles.itemRow, isSelected && styles.selectedItemRow]}
      >
        <Text style={styles.flagText}>{item.flag}</Text>

        <View style={styles.countryInfo}>
          <Text style={[styles.countryName, isSelected && styles.selectedCountryName]}>
            {item.name}
          </Text>
          <Text style={styles.isoCode}>{item.iso2}</Text>
        </View>

        <View style={styles.dialCodeBadge}>
          <Text style={[styles.dialCodeText, isSelected && styles.selectedDialCodeText]}>
            {item.dial_code}
          </Text>
        </View>

        {isSelected && (
          <View style={styles.checkIcon}>
            <Icon name="check" size={18} color={COLORS.primary} />
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <Animated.View style={{ flex: 1, paddingBottom: paddingAnim }}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={handleClose}
            style={styles.closeBtn}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Icon name="arrow-left" size={22} color={COLORS.text} />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>
            {t('auth.selectCountryCode', 'Select Country Code')}
          </Text>

          <View style={{ width: 36 }} />
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Icon name="search" size={18} color={COLORS.textLight} style={styles.searchIcon} />
          <KeyboardTextInput
            ref={searchInputRef}
            id="country_picker_search_input"
            style={styles.searchInput}
            placeholder={t('auth.searchCountryPlaceholder', 'Search country name or code (+91, India)...')}
            placeholderTextColor={COLORS.textLight}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
            autoCorrect={false}
            clearButtonMode="never"
            returnKeyType="search"
            showSoftInputOnFocus={false}
            contextMenuHidden={true}
            onFocus={() => {
              Keyboard.dismiss();
            }}
            onTouchStart={() => {
              Keyboard.dismiss();
            }}
            onSubmitEditing={() => hideKeyboard()}
          />
          {searchQuery ? (
            <TouchableOpacity
              onPress={handleClearSearch}
              style={styles.clearSearchBtn}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Icon name="close" size={16} color={COLORS.textLight} />
            </TouchableOpacity>
          ) : null}
        </View>

        {/* List of Countries */}
        {loading && countries.length === 0 ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.loadingText}>
              {t('common.loading', 'Loading country codes...')}
            </Text>
          </View>
        ) : (
          <FlatList
            data={filteredCountries}
            keyExtractor={(item, index) => `${item.iso2 || index}_${item.dial_code}`}
            renderItem={renderItem}
            keyboardShouldPersistTaps="always"
            onScrollBeginDrag={() => {
              hideKeyboard();
            }}
            contentContainerStyle={styles.listContent}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Icon name="alert-circle" size={32} color={COLORS.textLight} />
                <Text style={styles.emptyText}>
                  {t('auth.noCountriesFound', 'No country codes found')}
                </Text>
                <Text style={styles.emptySubText}>
                  {t('auth.trySearchingAnother', 'Try searching for another country name or dial code')}
                </Text>
              </View>
            }
          />
        )}
      </Animated.View>

      {/* Custom Keyboard placed comfortably above the navigation buttons */}
      {visible && (
        <View
          style={[
            styles.keyboardWrapper,
            { bottom: bottomOffset },
          ]}
          pointerEvents="box-none"
        >
          <CustomKeyboard isInModal={true} />
        </View>
      )}

      {/* Matching bottom spacer so there is no awkward floating gap */}
      {visible && keyboardVisible && bottomOffset > 0 && (
        <View
          style={[
            styles.bottomSpacer,
            {
              height: bottomOffset,
              backgroundColor: keyboardBg,
            },
          ]}
          pointerEvents="none"
        />
      )}
    </View>
  );
};

export const CountryPickerModal = ({
  visible,
  onClose,
  countries = [],
  selectedCountry,
  onSelectCountry,
  loading = false,
  ...restProps
}) => {
  const outerInsets = useSafeAreaInsets();
  // Safe, user-friendly bottom clearance:
  // On Android, 20dp keeps spacebar and ?123 clear of navigation buttons without floating too high.
  // On iOS, uses outerInsets.bottom (34dp on modern iPhones, 0 on Home button devices).
  const bottomOffset = Platform.OS === 'android'
    ? 20
    : (outerInsets?.bottom || 0);

  const handleRequestClose = () => {
    if (onClose) {
      onClose();
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={handleRequestClose}
      {...restProps}
    >
      <SafeAreaProvider>
        <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
          <KeyboardProvider>
            <CountryPickerModalInner
              visible={visible}
              onClose={onClose}
              countries={countries}
              selectedCountry={selectedCountry}
              onSelectCountry={onSelectCountry}
              loading={loading}
              bottomOffset={bottomOffset}
            />
          </KeyboardProvider>
        </SafeAreaView>
      </SafeAreaProvider>
    </Modal>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    maxWidth: 540,
    width: '100%',
    alignSelf: 'center',
    position: 'relative',
  },
  keyboardWrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 9999,
  },
  bottomSpacer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9998,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F5F5F5',
  },
  headerTitle: {
    ...TYPOGRAPHY.h3,
    fontSize: responsiveFont(18),
    fontWeight: '700',
    color: COLORS.text,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F6F8',
    borderRadius: RADIUS.medium,
    marginHorizontal: SPACING.lg,
    marginVertical: SPACING.md,
    paddingHorizontal: SPACING.md,
    height: 46,
    borderWidth: 1,
    borderColor: '#E8EAED',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: '100%',
    fontSize: responsiveFont(15),
    color: COLORS.text,
    paddingVertical: 0,
  },
  clearSearchBtn: {
    padding: 4,
  },
  listContent: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xxxl,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  selectedItemRow: {
    backgroundColor: '#E8F8F5',
  },
  flagText: {
    fontSize: responsiveFont(26),
    marginRight: 14,
  },
  countryInfo: {
    flex: 1,
  },
  countryName: {
    fontSize: responsiveFont(15),
    fontWeight: '600',
    color: COLORS.text,
  },
  selectedCountryName: {
    color: COLORS.primaryDark,
    fontWeight: '700',
  },
  isoCode: {
    fontSize: responsiveFont(12),
    color: COLORS.textLight,
    marginTop: 2,
  },
  dialCodeBadge: {
    backgroundColor: '#F0F2F5',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    marginRight: 8,
  },
  dialCodeText: {
    fontSize: responsiveFont(14),
    fontWeight: '700',
    color: '#444444',
  },
  selectedDialCodeText: {
    color: COLORS.primaryDark,
  },
  checkIcon: {
    marginLeft: 4,
  },
  separator: {
    height: 1,
    backgroundColor: '#F4F4F4',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.xxxl,
  },
  loadingText: {
    marginTop: 12,
    fontSize: responsiveFont(14),
    color: COLORS.textLight,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: responsiveFont(16),
    fontWeight: '600',
    color: COLORS.text,
    marginTop: 12,
  },
  emptySubText: {
    fontSize: responsiveFont(13),
    color: COLORS.textLight,
    marginTop: 4,
    textAlign: 'center',
  },
});

export default CountryPickerModal;