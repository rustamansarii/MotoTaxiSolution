import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';
import { COLORS } from '../../theme/colors';
import { RADIUS, SPACING } from '../../theme/spacing';
import { TYPOGRAPHY } from '../../theme/typography';
import Header from '../../components/Header';
import Icon from '../../components/Icon';
import CustomButton from '../../components/CustomButton';
import ResponsiveContainer from '../../components/ResponsiveContainer';
import { useResponsive } from '../../utils/responsive';
import { useTranslation } from 'react-i18next';
import { getCurrentLocation } from '../../utils/locationService';
import {
  reverseGeocodeLocation,
  searchLocation,
  clearSearchResults,
} from '../../redux/features/location/locationSlice';
import {
  fetchRiderProfile,
  updateRiderProfile,
  setRiderProfile,
} from '../../redux/features/auth/authSlice';

export const SavedPlacesScreen = ({ navigation, route }) => {
  const { t } = useTranslation();
  const { insets } = useResponsive();
  const dispatch = useDispatch();

  const initialFocus = route?.params?.initialFocus || 'home';

  const {
    riderProfile,
    isRiderProfileLoading,
    isRiderProfileUpdating,
    riderProfileError,
  } = useSelector((state) => state.auth);

  const { searchResults, isSearching } = useSelector((state) => state.location);

  // Form state
  const [homeAddress, setHomeAddress] = useState('');
  const [homeLat, setHomeLat] = useState(null);
  const [homeLng, setHomeLng] = useState(null);

  const [workAddress, setWorkAddress] = useState('');
  const [workLat, setWorkLat] = useState(null);
  const [workLng, setWorkLng] = useState(null);

  const [activeField, setActiveField] = useState(initialFocus); // 'home' | 'work' | null
  const [loadingGpsFor, setLoadingGpsFor] = useState(null); // 'home' | 'work' | null
  const [saveSuccess, setSaveSuccess] = useState(false);

  const searchTimeoutRef = useRef(null);
  const homeInputRef = useRef(null);
  const workInputRef = useRef(null);

  // 1. Fetch initial rider profile on mount
  useEffect(() => {
    dispatch(fetchRiderProfile());
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
      dispatch(clearSearchResults());
    };
  }, [dispatch]);

  // 2. Synchronize profile data with local form state
  useEffect(() => {
    if (riderProfile) {
      if (riderProfile.home_address !== undefined && riderProfile.home_address !== null) {
        setHomeAddress(riderProfile.home_address || '');
      }
      if (riderProfile.home_lat !== undefined && riderProfile.home_lat !== null) {
        setHomeLat(riderProfile.home_lat);
      }
      if (riderProfile.home_lng !== undefined && riderProfile.home_lng !== null) {
        setHomeLng(riderProfile.home_lng);
      }

      if (riderProfile.work_address !== undefined && riderProfile.work_address !== null) {
        setWorkAddress(riderProfile.work_address || '');
      }
      if (riderProfile.work_lat !== undefined && riderProfile.work_lat !== null) {
        setWorkLat(riderProfile.work_lat);
      }
      if (riderProfile.work_lng !== undefined && riderProfile.work_lng !== null) {
        setWorkLng(riderProfile.work_lng);
      }
    }
  }, [riderProfile]);

  // 3. Auto-focus field if specified
  useEffect(() => {
    const timer = setTimeout(() => {
      if (initialFocus === 'home' && homeInputRef.current) {
        homeInputRef.current.focus();
      } else if (initialFocus === 'work' && workInputRef.current) {
        workInputRef.current.focus();
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [initialFocus]);

  // Handle typing with debounced search
  const handleAddressChange = (text, field) => {
    if (field === 'home') {
      setHomeAddress(text);
    } else {
      setWorkAddress(text);
    }

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (!text || text.trim().length < 2) {
      dispatch(clearSearchResults());
      return;
    }

    searchTimeoutRef.current = setTimeout(() => {
      dispatch(searchLocation({ query: text.trim() }));
    }, 350);
  };

  // Handle picking a search suggestion
  const handleSelectSuggestion = (item) => {
    if (activeField === 'home') {
      setHomeAddress(item.address);
      setHomeLat(item.latitude);
      setHomeLng(item.longitude);
    } else if (activeField === 'work') {
      setWorkAddress(item.address);
      setWorkLat(item.latitude);
      setWorkLng(item.longitude);
    }
    dispatch(clearSearchResults());
  };

  // Handle "Use Current Location" for Home or Work
  const handleUseCurrentLocation = async (field) => {
    setLoadingGpsFor(field);
    try {
      const loc = await getCurrentLocation();
      if (!loc?.latitude || !loc?.longitude) {
        Alert.alert('GPS Error', 'Could not retrieve your current location.');
        setLoadingGpsFor(null);
        return;
      }

      const res = await dispatch(
        reverseGeocodeLocation({
          latitude: loc.latitude,
          longitude: loc.longitude,
        })
      ).unwrap();

      const addressText = res?.display_name || res?.address || `${loc.latitude.toFixed(4)}, ${loc.longitude.toFixed(4)}`;
      const latVal = parseFloat(res?.latitude || loc.latitude);
      const lngVal = parseFloat(res?.longitude || loc.longitude);

      if (field === 'home') {
        setHomeAddress(addressText);
        setHomeLat(latVal);
        setHomeLng(lngVal);
      } else {
        setWorkAddress(addressText);
        setWorkLat(latVal);
        setWorkLng(lngVal);
      }
      dispatch(clearSearchResults());
    } catch (err) {
      console.warn('[SavedPlaces] GPS resolve error:', err);
      Alert.alert('Location Error', 'Unable to resolve address for current location.');
    } finally {
      setLoadingGpsFor(null);
    }
  };

  // Save the form to the backend
  const handleSave = async () => {
    if (!homeAddress.trim() && !workAddress.trim()) {
      Alert.alert(
        'Required',
        'Please enter at least a Home or Work address to save.'
      );
      return;
    }

    const payload = {
      home_address: homeAddress.trim(),
      home_lat: homeLat ? parseFloat(homeLat) : null,
      home_lng: homeLng ? parseFloat(homeLng) : null,
      work_address: workAddress.trim(),
      work_lat: workLat ? parseFloat(workLat) : null,
      work_lng: workLng ? parseFloat(workLng) : null,
    };

    try {
      await dispatch(updateRiderProfile(payload)).unwrap();
      // Update local slice state directly to ensure immediate UI freshness
      dispatch(setRiderProfile(payload));
      setSaveSuccess(true);

      // Return to home screen after brief confirmation
      setTimeout(() => {
        navigation.goBack();
      }, 700);
    } catch (err) {
      Alert.alert(
        'Save Failed',
        typeof err === 'string' ? err : 'Unable to save your places. Please try again.'
      );
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

      <Header
        title={t('rider.savedPlaces', 'Saved Places')}
        subtitle={t('rider.manageAddresses', 'Home & Work Addresses')}
        onBack={() => navigation.goBack()}
      />

      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: Math.max(insets.bottom, 20) + 90 },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <ResponsiveContainer maxWidth={650}>
            {/* Header Description */}
            <View style={styles.introCard}>
              <View style={styles.introIconBox}>
                <Icon name="map-pin" size={22} color={COLORS.primary} />
              </View>
              <View style={styles.introTextCol}>
                <Text style={styles.introTitle}>Quick-Access Locations</Text>
                <Text style={styles.introDesc}>
                  Save your daily destinations for faster 1-tap booking from the home screen.
                </Text>
              </View>
            </View>

            {/* Success Banner */}
            {saveSuccess && (
              <View style={styles.successBanner}>
                <Icon name="check-circle" size={18} color={COLORS.white} />
                <Text style={styles.successText}>Places saved successfully! Returning to home...</Text>
              </View>
            )}

            {/* Error Banner */}
            {riderProfileError && !saveSuccess && (
              <View style={styles.errorBanner}>
                <Icon name="alert-circle" size={18} color={COLORS.danger} />
                <Text style={styles.errorText}>
                  {typeof riderProfileError === 'string'
                    ? riderProfileError
                    : 'Failed to update rider profile'}
                </Text>
              </View>
            )}

            {/* HOME LOCATION CARD */}
            <View
              style={[
                styles.placeCard,
                activeField === 'home' && styles.placeCardActive,
              ]}
            >
              <View style={styles.placeCardHeader}>
                <View style={styles.cardHeaderLeft}>
                  <View style={[styles.cardIconBox, { backgroundColor: COLORS.primaryLight }]}>
                    <Icon name="home" size={20} color={COLORS.primary} />
                  </View>
                  <View>
                    <Text style={styles.cardTitle}>Home</Text>
                    <Text style={styles.cardSubtitle}>Your primary residence</Text>
                  </View>
                </View>

                {homeLat && homeLng ? (
                  <View style={styles.coordBadge}>
                    <Icon name="check" size={12} color={COLORS.primary} />
                    <Text style={styles.coordBadgeText}>GPS Set</Text>
                  </View>
                ) : null}
              </View>

              {/* Address Input */}
              <View style={styles.inputWrapper}>
                <Icon name="search" size={16} color={COLORS.textLight} style={styles.inputLeadingIcon} />
                <TextInput
                  ref={homeInputRef}
                  style={styles.textInput}
                  placeholder="Enter house, street, or landmark"
                  placeholderTextColor={COLORS.textLight}
                  value={homeAddress}
                  onChangeText={(text) => handleAddressChange(text, 'home')}
                  onFocus={() => setActiveField('home')}
                />
                {homeAddress ? (
                  <TouchableOpacity
                    onPress={() => {
                      setHomeAddress('');
                      setHomeLat(null);
                      setHomeLng(null);
                      dispatch(clearSearchResults());
                    }}
                    style={styles.clearBtn}
                  >
                    <Icon name="close" size={14} color={COLORS.textLight} />
                  </TouchableOpacity>
                ) : null}
              </View>

              {/* GPS Actions & Lat/Lng Info */}
              <View style={styles.actionRow}>
                <TouchableOpacity
                  activeOpacity={0.75}
                  onPress={() => handleUseCurrentLocation('home')}
                  disabled={loadingGpsFor === 'home'}
                  style={styles.gpsButton}
                >
                  {loadingGpsFor === 'home' ? (
                    <ActivityIndicator size="small" color={COLORS.primary} style={{ marginRight: 6 }} />
                  ) : (
                    <Icon name="crosshair" size={14} color={COLORS.primary} style={{ marginRight: 6 }} />
                  )}
                  <Text style={styles.gpsButtonText}>
                    {loadingGpsFor === 'home' ? 'Locating...' : 'Use Current GPS'}
                  </Text>
                </TouchableOpacity>

                {homeLat && homeLng ? (
                  <Text style={styles.coordsDisplay}>
                    {homeLat.toFixed(4)}, {homeLng.toFixed(4)}
                  </Text>
                ) : null}
              </View>
            </View>

            {/* WORK LOCATION CARD */}
            <View
              style={[
                styles.placeCard,
                activeField === 'work' && styles.placeCardActive,
                { marginTop: SPACING.md },
              ]}
            >
              <View style={styles.placeCardHeader}>
                <View style={styles.cardHeaderLeft}>
                  <View style={[styles.cardIconBox, { backgroundColor: COLORS.secondPrimaryLight }]}>
                    <Icon name="briefcase" size={20} color={COLORS.secondPrimary} />
                  </View>
                  <View>
                    <Text style={styles.cardTitle}>Work / Office</Text>
                    <Text style={styles.cardSubtitle}>Your regular office or workspace</Text>
                  </View>
                </View>

                {workLat && workLng ? (
                  <View style={[styles.coordBadge, { backgroundColor: COLORS.secondPrimaryLight }]}>
                    <Icon name="check" size={12} color={COLORS.secondPrimary} />
                    <Text style={[styles.coordBadgeText, { color: COLORS.secondPrimary }]}>GPS Set</Text>
                  </View>
                ) : null}
              </View>

              {/* Address Input */}
              <View style={styles.inputWrapper}>
                <Icon name="search" size={16} color={COLORS.textLight} style={styles.inputLeadingIcon} />
                <TextInput
                  ref={workInputRef}
                  style={styles.textInput}
                  placeholder="Enter office, building, or tech park"
                  placeholderTextColor={COLORS.textLight}
                  value={workAddress}
                  onChangeText={(text) => handleAddressChange(text, 'work')}
                  onFocus={() => setActiveField('work')}
                />
                {workAddress ? (
                  <TouchableOpacity
                    onPress={() => {
                      setWorkAddress('');
                      setWorkLat(null);
                      setWorkLng(null);
                      dispatch(clearSearchResults());
                    }}
                    style={styles.clearBtn}
                  >
                    <Icon name="close" size={14} color={COLORS.textLight} />
                  </TouchableOpacity>
                ) : null}
              </View>

              {/* GPS Actions & Lat/Lng Info */}
              <View style={styles.actionRow}>
                <TouchableOpacity
                  activeOpacity={0.75}
                  onPress={() => handleUseCurrentLocation('work')}
                  disabled={loadingGpsFor === 'work'}
                  style={styles.gpsButton}
                >
                  {loadingGpsFor === 'work' ? (
                    <ActivityIndicator size="small" color={COLORS.secondPrimary} style={{ marginRight: 6 }} />
                  ) : (
                    <Icon name="crosshair" size={14} color={COLORS.secondPrimary} style={{ marginRight: 6 }} />
                  )}
                  <Text style={[styles.gpsButtonText, { color: COLORS.secondPrimary }]}>
                    {loadingGpsFor === 'work' ? 'Locating...' : 'Use Current GPS'}
                  </Text>
                </TouchableOpacity>

                {workLat && workLng ? (
                  <Text style={styles.coordsDisplay}>
                    {workLat.toFixed(4)}, {workLng.toFixed(4)}
                  </Text>
                ) : null}
              </View>
            </View>

            {/* LIVE SEARCH AUTOCOMPLETE RESULTS */}
            {isSearching && (
              <View style={styles.searchStatusBox}>
                <ActivityIndicator size="small" color={COLORS.primary} />
                <Text style={styles.searchStatusText}>Searching matching locations...</Text>
              </View>
            )}

            {searchResults && searchResults.length > 0 && (
              <View style={styles.suggestionsContainer}>
                <View style={styles.suggestionsHeader}>
                  <Text style={styles.suggestionsTitle}>
                    SUGGESTIONS FOR {activeField?.toUpperCase() || 'ADDRESS'}
                  </Text>
                  <TouchableOpacity onPress={() => dispatch(clearSearchResults())}>
                    <Text style={styles.dismissText}>Dismiss</Text>
                  </TouchableOpacity>
                </View>

                {searchResults.map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    activeOpacity={0.7}
                    onPress={() => handleSelectSuggestion(item)}
                    style={styles.suggestionRow}
                  >
                    <View style={styles.suggestionIconCircle}>
                      <Icon name="map-pin" size={15} color={COLORS.primary} />
                    </View>
                    <View style={styles.suggestionTextCol}>
                      <Text style={styles.suggestionTitle}>{item.title}</Text>
                      <Text numberOfLines={2} style={styles.suggestionAddress}>
                        {item.address}
                      </Text>
                    </View>
                    {item.distance ? (
                      <Text style={styles.suggestionDist}>{item.distance}</Text>
                    ) : null}
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </ResponsiveContainer>
        </ScrollView>

        {/* BOTTOM SAVE BAR */}
        <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          <ResponsiveContainer maxWidth={650}>
            <CustomButton
              title={saveSuccess ? 'Saved!' : 'Save Places'}
              onPress={handleSave}
              loading={isRiderProfileUpdating}
              disabled={isRiderProfileUpdating || saveSuccess}
              icon={saveSuccess ? 'check' : undefined}
              size="large"
            />
          </ResponsiveContainer>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  keyboardContainer: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.md,
  },
  introCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    padding: SPACING.md,
    borderRadius: RADIUS.large,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.md,
  },
  introIconBox: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.round,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  introTextCol: {
    flex: 1,
  },
  introTitle: {
    ...TYPOGRAPHY.bodySmall,
    fontWeight: '700',
    color: COLORS.text,
  },
  introDesc: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textLight,
    marginTop: 2,
    lineHeight: 16,
  },
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    padding: SPACING.md,
    borderRadius: RADIUS.medium,
    marginBottom: SPACING.md,
    gap: 8,
  },
  successText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.white,
    fontWeight: '700',
    flex: 1,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FDEDEC',
    borderWidth: 1,
    borderColor: '#FADBD8',
    padding: SPACING.md,
    borderRadius: RADIUS.medium,
    marginBottom: SPACING.md,
    gap: 8,
  },
  errorText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.danger,
    fontWeight: '600',
    flex: 1,
  },
  placeCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.large,
    padding: SPACING.md,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    shadowColor: COLORS.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  placeCardActive: {
    borderColor: COLORS.primary,
  },
  placeCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardIconBox: {
    width: 38,
    height: 38,
    borderRadius: RADIUS.round,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.sm,
  },
  cardTitle: {
    ...TYPOGRAPHY.title,
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
  },
  cardSubtitle: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textLight,
  },
  coordBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADIUS.round,
    gap: 4,
  },
  coordBadgeText: {
    ...TYPOGRAPHY.caption,
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.primary,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.inputBg,
    borderRadius: RADIUS.medium,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.sm,
    height: 48,
    marginTop: 4,
  },
  inputLeadingIcon: {
    marginRight: 6,
  },
  textInput: {
    flex: 1,
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.text,
    height: '100%',
  },
  clearBtn: {
    padding: 6,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: SPACING.sm,
  },
  gpsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.round,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  gpsButtonText: {
    ...TYPOGRAPHY.caption,
    fontWeight: '600',
    color: COLORS.primary,
    fontSize: 12,
  },
  coordsDisplay: {
    ...TYPOGRAPHY.caption,
    fontSize: 11,
    color: COLORS.textLight,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  searchStatusBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.md,
    gap: 8,
  },
  searchStatusText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textLight,
  },
  suggestionsContainer: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.large,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginTop: SPACING.md,
    paddingVertical: SPACING.xs,
    shadowColor: COLORS.text,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
  },
  suggestionsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  suggestionsTitle: {
    ...TYPOGRAPHY.caption,
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.textLight,
    letterSpacing: 0.6,
  },
  dismissText: {
    ...TYPOGRAPHY.caption,
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.primary,
  },
  suggestionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  suggestionIconCircle: {
    width: 30,
    height: 30,
    borderRadius: RADIUS.round,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.sm,
  },
  suggestionTextCol: {
    flex: 1,
  },
  suggestionTitle: {
    ...TYPOGRAPHY.bodySmall,
    fontWeight: '600',
    color: COLORS.text,
  },
  suggestionAddress: {
    ...TYPOGRAPHY.caption,
    fontSize: 11,
    color: COLORS.textLight,
    marginTop: 1,
  },
  suggestionDist: {
    ...TYPOGRAPHY.caption,
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.secondPrimary,
    marginLeft: SPACING.xs,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.white,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderColor: COLORS.border,
    shadowColor: COLORS.text,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 8,
  },
});

export default SavedPlacesScreen;
