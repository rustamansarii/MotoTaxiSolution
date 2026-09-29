import React, { useState, useMemo } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  TextInput,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../theme/colors';
import { RADIUS, SPACING } from '../theme/spacing';
import { TYPOGRAPHY } from '../theme/typography';
import Icon from './Icon';
import { useTranslation } from 'react-i18next';

export const CountryPickerModal = ({
  visible,
  onClose,
  countries = [],
  selectedCountry,
  onSelectCountry,
  loading = false,
}) => {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');

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

  const handleSelect = (country) => {
    onSelectCountry(country);
    setSearchQuery('');
    onClose();
  };

  const handleClose = () => {
    setSearchQuery('');
    onClose();
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
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={handleClose}
    >
      <SafeAreaView style={styles.container}>
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
          <TextInput
            style={styles.searchInput}
            placeholder={t('auth.searchCountryPlaceholder', 'Search country name or code (+91, India)...')}
            placeholderTextColor={COLORS.textLight}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
            autoCorrect={false}
            clearButtonMode="while-editing"
          />
          {searchQuery ? (
            <TouchableOpacity
              onPress={() => setSearchQuery('')}
              style={styles.clearSearchBtn}
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
            keyboardShouldPersistTaps="handled"
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
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
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
    fontSize: 18,
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
    fontSize: 15,
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
    fontSize: 26,
    marginRight: 14,
  },
  countryInfo: {
    flex: 1,
  },
  countryName: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
  },
  selectedCountryName: {
    color: COLORS.primaryDark,
    fontWeight: '700',
  },
  isoCode: {
    fontSize: 12,
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
    fontSize: 14,
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
    padding: SPACING.xxl,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: COLORS.textLight,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginTop: 12,
  },
  emptySubText: {
    fontSize: 13,
    color: COLORS.textLight,
    marginTop: 4,
    textAlign: 'center',
  },
});

export default CountryPickerModal;
