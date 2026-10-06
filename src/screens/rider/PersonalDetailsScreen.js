import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
  ActivityIndicator,
  Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';
import { COLORS } from '../../theme/colors';
import { RADIUS, SPACING } from '../../theme/spacing';
import { TYPOGRAPHY } from '../../theme/typography';
import Header from '../../components/Header';
import ProfileAvatar from '../../components/ProfileAvatar';
import CustomInput from '../../components/CustomInput';
import CustomButton from '../../components/CustomButton';
import Icon from '../../components/Icon';
import ResponsiveContainer from '../../components/ResponsiveContainer';
import { useResponsive, responsiveFont } from '../../utils/responsive';
import { useTranslation } from 'react-i18next';
import {
  updateUserProfile,
  updateRiderProfile,
  fetchUserProfile,
  fetchCountryCodes,
} from '../../redux/features/auth/authSlice';
import AppDatePicker from '../../components/AppDatePicker';
import { pickFromGallery, captureFromCamera } from '../../utils/imagePickerHelper';
import { CountryPickerModal } from '../../components/CountryPickerModal';
import { isGuestMode, getRole } from '../../utils/storage';
import { CustomAlertPopup } from '../../components/CustomAlertPopup';

const DEFAULT_COUNTRY = {
  name: 'India',
  iso2: 'IN',
  dial_code: '+91',
  flag: '🇮🇳',
};

/**
 * Parses a phone string like +919812345678 into { country, digits }
 */
const parsePhoneAndCountry = (fullPhone, countriesList = []) => {
  if (!fullPhone || typeof fullPhone !== 'string') {
    return { country: DEFAULT_COUNTRY, digits: '' };
  }
  const clean = fullPhone.trim();
  const list = Array.isArray(countriesList) && countriesList.length > 0 ? countriesList : [];
  if (clean.startsWith('+')) {
    const sorted = [...list].sort(
      (a, b) => (b.dial_code?.length || 0) - (a.dial_code?.length || 0)
    );
    for (const c of sorted) {
      if (c.dial_code && clean.startsWith(c.dial_code)) {
        return {
          country: c,
          digits: clean.slice(c.dial_code.length).trim(),
        };
      }
    }
    if (clean.startsWith('+91')) {
      return {
        country: DEFAULT_COUNTRY,
        digits: clean.slice(3).trim(),
      };
    }
  }
  return {
    country: DEFAULT_COUNTRY,
    digits: clean.replace(/^\+91/, '').trim(),
  };
};

/**
 * Converts API format (YYYY-MM-DD) or ISO string to UI format (DD-MM-YYYY)
 */
const formatDateToDisplay = (dateStr) => {
  if (!dateStr || typeof dateStr !== 'string') return '';
  const clean = dateStr.trim().split('T')[0];
  // Check if YYYY-MM-DD
  const ymdMatch = clean.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/);
  if (ymdMatch) {
    const [, y, m, d] = ymdMatch;
    return `${d.padStart(2, '0')}-${m.padStart(2, '0')}-${y}`;
  }
  // If already DD-MM-YYYY
  const dmyMatch = clean.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/);
  if (dmyMatch) {
    const [, d, m, y] = dmyMatch;
    return `${d.padStart(2, '0')}-${m.padStart(2, '0')}-${y}`;
  }
  return clean;
};

/**
 * Converts UI format (DD-MM-YYYY) to API format (YYYY-MM-DD)
 */
const formatDateToApi = (dateStr) => {
  if (!dateStr || typeof dateStr !== 'string') return null;
  const clean = dateStr.trim();
  // Check if DD-MM-YYYY
  const dmyMatch = clean.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/);
  if (dmyMatch) {
    const [, d, m, y] = dmyMatch;
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }
  // Check if YYYY-MM-DD
  const ymdMatch = clean.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/);
  if (ymdMatch) {
    const [, y, m, d] = ymdMatch;
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }
  return clean;
};

/**
 * Formats user input as DD-MM-YYYY automatically while typing digits
 */
const formatDobInput = (text) => {
  if (!text) return '';
  const digits = text.replace(/\D/g, '').slice(0, 8);
  if (digits.length <= 2) {
    return digits;
  }
  if (digits.length <= 4) {
    return `${digits.slice(0, 2)}-${digits.slice(2)}`;
  }
  return `${digits.slice(0, 2)}-${digits.slice(2, 4)}-${digits.slice(4)}`;
};

/**
 * Formats ISO date string to human-readable month and year (e.g. Sep 2026)
 */
const formatJoinedDate = (dateStr) => {
  if (!dateStr) return null;
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return null;
    return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  } catch {
    return null;
  }
};

export const PersonalDetailsScreen = ({ navigation }) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { isFoldableOrTablet, insets } = useResponsive();

  const authUser = useSelector((state) => state.auth?.user);
  const riderProfile = useSelector((state) => state.auth?.riderProfile);
  const { countryCodes, countryCodesLoading } = useSelector((state) => state.auth);

  useEffect(() => {
    dispatch(fetchCountryCodes());
  }, [dispatch]);

  // Initial phone country & digits parsing
  const initialPhoneParsed = parsePhoneAndCountry(
    authUser?.phone_number || authUser?.phone || '',
    countryCodes
  );
  const initialEmergencyParsed = parsePhoneAndCountry(
    authUser?.emergency_contact_phone || '',
    countryCodes
  );

  const [phoneCountry, setPhoneCountry] = useState(initialPhoneParsed.country);
  const [phoneDigits, setPhoneDigits] = useState(initialPhoneParsed.digits);
  const [showPhoneCountryPicker, setShowPhoneCountryPicker] = useState(false);

  const [emergencyCountry, setEmergencyCountry] = useState(initialEmergencyParsed.country);
  const [emergencyPhoneDigits, setEmergencyPhoneDigits] = useState(initialEmergencyParsed.digits);
  const [showEmergencyCountryPicker, setShowEmergencyCountryPicker] = useState(false);

  // Form fields matching PATCH /api/v1/auth/me/ & rider-profile
  const [fullName, setFullName] = useState(
    authUser?.full_name ||
    (authUser?.first_name ? `${authUser.first_name} ${authUser.last_name || ''}`.trim() : null) ||
    authUser?.name ||
    ''
  );
  const [gender, setGender] = useState((authUser?.gender || 'MALE').toUpperCase());
  const [dateOfBirth, setDateOfBirth] = useState(
    formatDateToDisplay(authUser?.date_of_birth)
  );
  const [email, setEmail] = useState(authUser?.email || '');
  const [phone, setPhone] = useState(authUser?.phone_number || authUser?.phone || '');
  const [addressLine, setAddressLine] = useState(authUser?.address_line || '');
  const [city, setCity] = useState(authUser?.city || '');
  const [stateName, setStateName] = useState(authUser?.state || '');
  const [pincode, setPincode] = useState(authUser?.pincode || '');
  const [emergencyContactName, setEmergencyContactName] = useState(
    authUser?.emergency_contact_name || ''
  );
  const [emergencyContactPhone, setEmergencyContactPhone] = useState(
    authUser?.emergency_contact_phone || ''
  );
  const [homeAddress, setHomeAddress] = useState(riderProfile?.home_address || '');
  const [workAddress, setWorkAddress] = useState(riderProfile?.work_address || '');
  const [isSaving, setIsSaving] = useState(false);
  const [isProfileLoading, setIsProfileLoading] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [previewPhotoUri, setPreviewPhotoUri] = useState(authUser?.profile_photo || null);
  const [photoFile, setPhotoFile] = useState(null); // { uri, name, type }

  const [isGuestStored, setIsGuestStored] = useState(false);
  useEffect(() => {
    isGuestMode().then((val) => {
      if (val) setIsGuestStored(true);
    });
  }, []);
  const isGuest = !authUser || !authUser?.id || isGuestStored;

  const [guestLoginModal, setGuestLoginModal] = useState({
    visible: false,
    title: '',
    message: '',
  });

  const promptGuestLogin = useCallback(
    (
      msgKey = 'auth.loginRequiredProfileMsg',
      defMsg = 'Please log in first to edit and save your personal details.'
    ) => {
      Keyboard.dismiss();
      setGuestLoginModal({
        visible: true,
        title: t('auth.loginRequired', 'Login Required'),
        message: t(msgKey, defMsg),
      });
    },
    [t]
  );

  const handleLoginConfirm = useCallback(async () => {
    setGuestLoginModal({ visible: false, title: '', message: '' });
    try {
      const storedRole = await getRole();
      if (storedRole === 'DRIVER' || authUser?.role === 'DRIVER') {
        navigation.navigate('DriverLogin');
        return;
      }
    } catch (e) {}
    navigation.navigate('Login');
  }, [authUser, navigation]);

  const handleInputFocus = useCallback(() => {
    if (isGuest) {
      promptGuestLogin();
    }
  }, [isGuest, promptGuestLogin]);

  /**
   * Applies API response data (from GET /api/v1/auth/profile/) directly to form fields
   */
  const applyProfileToForm = useCallback((userObj, riderObj) => {
    if (!userObj && !riderObj) return;

    if (userObj) {
      const name =
        userObj.full_name ||
        (userObj.first_name ? `${userObj.first_name} ${userObj.last_name || ''}`.trim() : null) ||
        userObj.name ||
        '';
      if (name) setFullName(name);

      if (userObj.gender) {
        setGender(userObj.gender.toUpperCase());
      }

      if (userObj.date_of_birth) {
        setDateOfBirth(formatDateToDisplay(userObj.date_of_birth));
      }

      if (userObj.email) setEmail(userObj.email);
      if (userObj.phone_number || userObj.phone) {
        const rawPhone = userObj.phone_number || userObj.phone;
        setPhone(rawPhone);
        const parsed = parsePhoneAndCountry(rawPhone, countryCodes);
        setPhoneCountry(parsed.country);
        setPhoneDigits(parsed.digits);
      }
      if (userObj.address_line !== undefined && userObj.address_line !== null) {
        setAddressLine(userObj.address_line);
      }
      if (userObj.city !== undefined && userObj.city !== null) {
        setCity(userObj.city);
      }
      if (userObj.state !== undefined && userObj.state !== null) {
        setStateName(userObj.state);
      }
      if (userObj.pincode !== undefined && userObj.pincode !== null) {
        setPincode(userObj.pincode);
      }
      if (userObj.emergency_contact_name !== undefined && userObj.emergency_contact_name !== null) {
        setEmergencyContactName(userObj.emergency_contact_name);
      }
      if (userObj.emergency_contact_phone !== undefined && userObj.emergency_contact_phone !== null) {
        setEmergencyContactPhone(userObj.emergency_contact_phone);
        const parsed = parsePhoneAndCountry(userObj.emergency_contact_phone, countryCodes);
        setEmergencyCountry(parsed.country);
        setEmergencyPhoneDigits(parsed.digits);
      }
      if (userObj.profile_photo) {
        setPreviewPhotoUri(userObj.profile_photo);
      }
    }

    if (riderObj) {
      if (riderObj.home_address !== undefined && riderObj.home_address !== null) {
        setHomeAddress(riderObj.home_address);
      }
      if (riderObj.work_address !== undefined && riderObj.work_address !== null) {
        setWorkAddress(riderObj.work_address);
      }
    }
  }, []);

  /**
   * Fetches latest profile data from GET /api/v1/auth/profile/
   */
  const loadProfileData = useCallback(async () => {
    if (isGuest) return;
    setIsProfileLoading(true);
    try {
      console.log('[PersonalDetails] Fetching latest user profile from auth/profile/...');
      const response = await dispatch(fetchUserProfile()).unwrap();
      console.log('[PersonalDetails] Loaded profile response:', response);

      const userObj = response?.user || (response?.id ? response : null);
      const riderObj = response?.rider_profile || null;
      applyProfileToForm(userObj, riderObj);
    } catch (err) {
      console.warn('[PersonalDetails] Failed to fetch profile from auth/profile/:', err);
    } finally {
      setIsProfileLoading(false);
    }
  }, [dispatch, applyProfileToForm, isGuest]);

  // Load profile from auth/profile/ on mount
  useEffect(() => {
    loadProfileData();
  }, [loadProfileData]);

  // Secondary sync when Redux authUser or riderProfile updates
  useEffect(() => {
    if (authUser || riderProfile) {
      applyProfileToForm(authUser, riderProfile);
    }
  }, [authUser, riderProfile, applyProfileToForm]);

  const handlePickPhoto = () => {
    if (isGuest) {
      promptGuestLogin();
      return;
    }
    Alert.alert(
      t('profile.profilePhoto', 'Profile Photo'),
      t('profile.selectPhotoOption', 'Select an option to update your profile photo'),
      [
        {
          text: t('profile.takePhoto', 'Take Photo'),
          onPress: async () => {
            const res = await captureFromCamera();
            if (res.success && res.uri) {
              setPhotoFile({
                uri: res.uri,
                name: res.name || `profile_${Date.now()}.jpg`,
                type: res.type || 'image/jpeg',
              });
              setPreviewPhotoUri(res.uri);
            } else if (res.error && !res.didCancel) {
              Alert.alert(t('profile.camera', 'Camera'), res.error);
            }
          },
        },
        {
          text: t('profile.chooseFromGallery', 'Choose from Gallery'),
          onPress: async () => {
            const res = await pickFromGallery();
            if (res.success && res.uri) {
              setPhotoFile({
                uri: res.uri,
                name: res.name || `profile_${Date.now()}.jpg`,
                type: res.type || 'image/jpeg',
              });
              setPreviewPhotoUri(res.uri);
            } else if (res.error && !res.didCancel) {
              Alert.alert(t('profile.gallery', 'Gallery'), res.error);
            }
          },
        },
        {
          text: t('common.cancel', 'Cancel'),
          style: 'cancel',
        },
      ]
    );
  };

  const handleSave = async () => {
    if (isGuest) {
      promptGuestLogin();
      return;
    }
    if (!fullName.trim()) {
      Alert.alert(t('profile.required', 'Required'), t('profile.enterFullNameRequired', 'Please enter your full name.'));
      return;
    }

    setIsSaving(true);
    try {
      // 1. Convert DD-MM-YYYY to YYYY-MM-DD for PATCH /api/v1/auth/me/
      const apiDob = formatDateToApi(dateOfBirth);

      // Construct FormData for multipart/form-data
      const formData = new FormData();
      formData.append('full_name', fullName.trim());
      if (gender) {
        formData.append('gender', gender.toUpperCase());
      }
      if (apiDob) {
        formData.append('date_of_birth', apiDob);
      }
      if (addressLine.trim()) {
        formData.append('address_line', addressLine.trim());
      }
      if (city.trim()) {
        formData.append('city', city.trim());
      }
      if (stateName.trim()) {
        formData.append('state', stateName.trim());
      }
      if (pincode.trim()) {
        formData.append('pincode', pincode.trim());
      }
      if (emergencyContactName.trim()) {
        formData.append('emergency_contact_name', emergencyContactName.trim());
      }
      const fullEmergencyPhone = emergencyPhoneDigits.trim()
        ? `${emergencyCountry.dial_code}${emergencyPhoneDigits.trim().replace(/\s+/g, '')}`
        : emergencyContactPhone.trim();
      if (fullEmergencyPhone) {
        formData.append('emergency_contact_phone', fullEmergencyPhone);
      }
      const fullPhone = phoneDigits.trim()
        ? `${phoneCountry.dial_code}${phoneDigits.trim().replace(/\s+/g, '')}`
        : phone.trim();
      if (fullPhone) {
        formData.append('phone_number', fullPhone);
      }
      if (photoFile && photoFile.uri) {
        formData.append('profile_photo', {
          uri: photoFile.uri,
          name: photoFile.name || `profile_${Date.now()}.jpg`,
          type: photoFile.type || 'image/jpeg',
        });
      }

      console.log('[PersonalDetails] Updating via FormData multipart/form-data PATCH auth/me/');
      await dispatch(updateUserProfile(formData)).unwrap();
      setPhotoFile(null);

      // 2. Also update home address & work address on rider profile if changed
      const riderUpdates = {};
      if (homeAddress.trim() !== (riderProfile?.home_address || '')) {
        riderUpdates.home_address = homeAddress.trim();
      }
      if (workAddress.trim() !== (riderProfile?.work_address || '')) {
        riderUpdates.work_address = workAddress.trim();
      }
      if (Object.keys(riderUpdates).length > 0) {
        await dispatch(updateRiderProfile(riderUpdates));
      }

      // 3. Re-fetch latest complete profile to synchronize
      await loadProfileData();

      Alert.alert(
        t('common.success', 'Success'),
        t('profile.profileUpdatedSuccess', 'Your personal details have been updated successfully.')
      );
    } catch (err) {
      console.warn('[PersonalDetails] Update error:', err);
      const errMsg =
        typeof err === 'string'
          ? err
          : err?.detail || err?.message || 'Failed to update personal details. Please try again.';
      Alert.alert(t('profile.notice', 'Notice'), errMsg);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />
      <ResponsiveContainer maxWidth={760} style={{ flex: 1 }}>
        <Header
          title={t('profile.title', 'Personal Details')}
          onBack={() => navigation.goBack()}
          variant="light"
          showLanguage={true}
        />

        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: Math.max(insets.bottom + SPACING.xl, SPACING.xxxl) },
          ]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isProfileLoading}
              onRefresh={loadProfileData}
              colors={[COLORS.primary]}
              tintColor={COLORS.primary}
            />
          }
        >
          {/* Avatar & Welcome Section */}
          <View style={styles.avatarSection}>
            <ProfileAvatar
              imageUri={previewPhotoUri || authUser?.profile_photo}
              name={fullName || t('auth.guestUser', 'User')}
              size={88}
              showEdit={true}
              onEditPress={handlePickPhoto}
            />
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={handlePickPhoto}
              style={styles.changePhotoBtn}
            >
              <Text style={styles.changePhotoText}>{t('profile.changePhoto', 'Change Photo')}</Text>
            </TouchableOpacity>

            <Text style={styles.avatarName}>
              {fullName || t('auth.guestRider', 'Rider')}
            </Text>

            {/* Profile Stats from auth/profile/ */}
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Icon name="star" size={13} color="#F59E0B" />
                <Text style={styles.statText}>
                  {riderProfile?.rating_avg || '5.00'}
                </Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Icon name="navigation" size={13} color={COLORS.primary} />
                <Text style={styles.statText}>
                  {riderProfile?.total_rides !== undefined ? riderProfile.total_rides : 0} {t('profile.rides', 'Rides')}
                </Text>
              </View>
              {authUser?.date_joined ? (
                <>
                  <View style={styles.statDivider} />
                  <View style={styles.statItem}>
                    <Icon name="calendar" size={13} color={COLORS.textLight} />
                    <Text style={styles.statText}>
                      {t('profile.since', 'Since')} {formatJoinedDate(authUser.date_joined)}
                    </Text>
                  </View>
                </>
              ) : null}
            </View>

            {isGuest ? (
              <View style={styles.guestBadgePill}>
                <Icon name="user" size={12} color={COLORS.primary} />
                <Text style={styles.guestBadgeText}>
                  {t('auth.guestMode', 'GUEST MODE')}
                </Text>
              </View>
            ) : (
              <View style={styles.verifiedBadge}>
                <Icon name="check-circle" size={13} color={COLORS.primary} />
                <Text style={styles.verifiedText}>
                  {authUser?.is_active
                    ? t('profile.verifiedAccount', 'Verified Account')
                    : t('profile.activeAccount', 'Active Account')}
                </Text>
              </View>
            )}
          </View>

          {/* Card 1: Basic Information */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{t('profile.basicInformation', 'Basic Information')}</Text>

            <CustomInput
              label={t('profile.fullNameLabel', 'Full Name *')}
              value={fullName}
              onChangeText={setFullName}
              placeholder={t('profile.fullNamePlaceholder', 'e.g. Rahul Kumar Sharma')}
              leftIcon="user"
              onFocus={handleInputFocus}
            />

            {/* Gender Selection */}
            <Text style={styles.inputLabel}>{t('profile.gender', 'Gender')}</Text>
            <View style={styles.genderRow}>
              {[
                { label: t('profile.male', 'Male'), val: 'MALE' },
                { label: t('profile.female', 'Female'), val: 'FEMALE' },
                { label: t('profile.other', 'Other'), val: 'OTHER' },
              ].map((item) => {
                const isActive = gender === item.val;
                return (
                  <TouchableOpacity
                    key={item.val}
                    activeOpacity={0.8}
                    onPress={() => {
                      if (isGuest) {
                        promptGuestLogin();
                        return;
                      }
                      setGender(item.val);
                    }}
                    style={[
                      styles.genderPill,
                      isActive && styles.genderPillActive,
                    ]}
                  >
                    <Icon
                      name={isActive ? 'check-circle' : 'user'}
                      size={14}
                      color={isActive ? COLORS.primary : COLORS.textLight}
                    />
                    <Text
                      style={[
                        styles.genderText,
                        isActive && styles.genderTextActive,
                      ]}
                    >
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Date of Birth Picker (DD-MM-YYYY) */}
            <View style={styles.dobContainer}>
              <Text style={styles.inputLabel}>{t('profile.dobLabel', 'Date of Birth (DD-MM-YYYY)')}</Text>
              <TouchableOpacity
                activeOpacity={0.75}
                onPress={() => {
                  if (isGuest) {
                    promptGuestLogin();
                    return;
                  }
                  setShowDatePicker(true);
                }}
                style={[
                  styles.dobTriggerBtn,
                  showDatePicker && styles.dobTriggerBtnActive,
                ]}
              >
                <View style={styles.dobLeft}>
                  <Icon
                    name="calendar"
                    size={18}
                    color={dateOfBirth ? COLORS.primary : COLORS.iconLight}
                  />
                  <Text
                    style={[
                      styles.dobText,
                      !dateOfBirth && styles.dobPlaceholder,
                    ]}
                  >
                    {dateOfBirth || t('profile.dobPlaceholder', 'DD-MM-YYYY (e.g. 14-05-1998)')}
                  </Text>
                </View>
                <Icon name="calendar" size={18} color={COLORS.primary} />
              </TouchableOpacity>
              <Text style={styles.dobHelperText}>
                {t('profile.dobHelper', 'Tap to select your date of birth')}
              </Text>
            </View>

            <CustomInput
              label={t('profile.emailAddress', 'Email Address')}
              value={email}
              onChangeText={setEmail}
              placeholder="name@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
              leftIcon="message"
              editable={false}
              helperText={t('profile.emailLinkedHelper', 'Email is linked to your account')}
            />

            {/* Phone Number with Country Code */}
            <Text style={styles.inputLabel}>{t('profile.phoneNumber', 'Phone Number')}</Text>
            <View style={styles.phoneSection}>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => {
                  if (isGuest) {
                    promptGuestLogin();
                    return;
                  }
                  setShowPhoneCountryPicker(true);
                }}
                style={styles.countryBox}
              >
                <Text style={styles.flag}>{phoneCountry.flag || '🇮🇳'}</Text>
                <Text style={styles.countryCode}>{phoneCountry.dial_code || '+91'}</Text>
                <Text style={styles.arrow}>▾</Text>
              </TouchableOpacity>

              <View style={styles.phoneInput}>
                <CustomInput
                  value={phoneDigits}
                  onChangeText={setPhoneDigits}
                  placeholder="98765 43210"
                  keyboardType="phone-pad"
                  leftIcon="phone"
                  containerStyle={styles.inputNoMargin}
                  helperText={t('profile.phoneHelper', 'Registered phone number')}
                  onFocus={handleInputFocus}
                />
              </View>
            </View>
          </View>

          {/* Card 2: Residential Address */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{t('profile.residentialAddress', 'Residential Address')}</Text>

            <CustomInput
              label={t('profile.addressLine', 'Address Line')}
              value={addressLine}
              onChangeText={setAddressLine}
              placeholder={t('profile.addressPlaceholder', 'e.g. House 12, Sector 15')}
              leftIcon="home"
              onFocus={handleInputFocus}
            />

            <View style={styles.row}>
              <View style={styles.halfCol}>
                <CustomInput
                  label={t('profile.city', 'City')}
                  value={city}
                  onChangeText={setCity}
                  placeholder={t('profile.cityPlaceholder', 'e.g. Meerut')}
                  onFocus={handleInputFocus}
                />
              </View>
              <View style={styles.halfCol}>
                <CustomInput
                  label={t('profile.state', 'State')}
                  value={stateName}
                  onChangeText={setStateName}
                  placeholder={t('profile.statePlaceholder', 'e.g. Uttar Pradesh')}
                  onFocus={handleInputFocus}
                />
              </View>
            </View>

            <CustomInput
              label={t('profile.pincode', 'Pincode')}
              value={pincode}
              onChangeText={setPincode}
              placeholder={t('profile.pincodePlaceholder', 'e.g. 250001')}
              keyboardType="numeric"
              maxLength={6}
              leftIcon="map-pin"
              onFocus={handleInputFocus}
            />

            <CustomInput
              label={t('profile.savedHomeAddress', 'Saved Home Address (For Rides)')}
              value={homeAddress}
              onChangeText={setHomeAddress}
              placeholder={t('profile.savedHomePlaceholder', 'e.g. Phase 2, Chandigarh')}
              leftIcon="navigation"
              helperText={t('profile.savedHomeHelper', 'One-tap home destination on your home screen')}
              onFocus={handleInputFocus}
            />

            <CustomInput
              label={t('profile.savedWorkAddress', 'Saved Work Address (For Rides)')}
              value={workAddress}
              onChangeText={setWorkAddress}
              placeholder={t('profile.savedWorkPlaceholder', 'e.g. IT Park, Chandigarh')}
              leftIcon="briefcase"
              helperText={t('profile.savedWorkHelper', 'One-tap work destination on your home screen')}
              onFocus={handleInputFocus}
            />
          </View>

          {/* Card 3: Emergency Contact */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{t('profile.emergencyContact', 'Emergency Contact')}</Text>
            <Text style={styles.cardSubtitle}>
              {t(
                'profile.emergencySubtitle',
                'Shared with safety teams and emergency services during trips if SOS is triggered.'
              )}
            </Text>

            <CustomInput
              label={t('profile.contactName', 'Contact Name')}
              value={emergencyContactName}
              onChangeText={setEmergencyContactName}
              placeholder={t('profile.contactNamePlaceholder', 'e.g. Priya Sharma')}
              leftIcon="user"
              onFocus={handleInputFocus}
            />

            {/* Contact Phone with Country Code */}
            <Text style={styles.inputLabel}>{t('profile.contactPhone', 'Contact Phone')}</Text>
            <View style={styles.phoneSection}>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => {
                  if (isGuest) {
                    promptGuestLogin();
                    return;
                  }
                  setShowEmergencyCountryPicker(true);
                }}
                style={styles.countryBox}
              >
                <Text style={styles.flag}>{emergencyCountry.flag || '🇮🇳'}</Text>
                <Text style={styles.countryCode}>{emergencyCountry.dial_code || '+91'}</Text>
                <Text style={styles.arrow}>▾</Text>
              </TouchableOpacity>

              <View style={styles.phoneInput}>
                <CustomInput
                  value={emergencyPhoneDigits}
                  onChangeText={setEmergencyPhoneDigits}
                  placeholder="98123 45678"
                  keyboardType="phone-pad"
                  leftIcon="phone"
                  containerStyle={styles.inputNoMargin}
                  helperText={t('profile.emergencyPhoneHelper', 'Emergency contact phone number')}
                  onFocus={handleInputFocus}
                />
              </View>
            </View>
          </View>

          {/* Save Button */}
          <CustomButton
            title={isSaving ? t('profile.savingChanges', 'Saving Changes...') : t('profile.saveChanges', 'Save Changes')}
            onPress={handleSave}
            loading={isSaving}
            variant="primary"
            style={styles.saveBtn}
          />
        </ScrollView>
      </ResponsiveContainer>

      {/* REACT-NATIVE-DATE-PICKER MODAL */}
      <AppDatePicker
        open={showDatePicker}
        value={dateOfBirth}
        title={t('profile.selectDob', 'Select Date of Birth')}
        returnFormat="DD-MM-YYYY"
        maximumDate={new Date()}
        defaultDate={new Date(2000, 0, 1)}
        onConfirm={(formattedDob) => {
          setDateOfBirth(formattedDob);
          setShowDatePicker(false);
        }}
        onCancel={() => setShowDatePicker(false)}
      />

      {/* Country Picker for Contact Phone */}
      <CountryPickerModal
        visible={showEmergencyCountryPicker}
        onClose={() => setShowEmergencyCountryPicker(false)}
        countries={countryCodes}
        selectedCountry={emergencyCountry}
        onSelectCountry={(country) => {
          setEmergencyCountry(country);
          setShowEmergencyCountryPicker(false);
        }}
        loading={countryCodesLoading}
      />

      {/* Country Picker for Registered Phone */}
      <CountryPickerModal
        visible={showPhoneCountryPicker}
        onClose={() => setShowPhoneCountryPicker(false)}
        countries={countryCodes}
        selectedCountry={phoneCountry}
        onSelectCountry={(country) => {
          setPhoneCountry(country);
          setShowPhoneCountryPicker(false);
        }}
        loading={countryCodesLoading}
      />

      {/* Guest Mode Login Required Alert Popup */}
      <CustomAlertPopup
        visible={guestLoginModal.visible}
        type="warning"
        title={guestLoginModal.title || t('auth.loginRequired', 'Login Required')}
        message={guestLoginModal.message}
        confirmText={t('auth.login', 'Log In')}
        cancelText={t('common.cancel', 'Cancel')}
        onConfirm={handleLoginConfirm}
        onCancel={() => {
          setGuestLoginModal({ visible: false, title: '', message: '' });
        }}
        onClose={() => {
          setGuestLoginModal({ visible: false, title: '', message: '' });
        }}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  scrollContent: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.sm,
  },
  avatarSection: {
    alignItems: 'center',
    marginVertical: SPACING.lg,
  },
  changePhotoBtn: {
    marginTop: 6,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
  },
  changePhotoText: {
    ...TYPOGRAPHY.caption,
    fontWeight: '700',
    color: COLORS.primaryDark,
  },
  avatarName: {
    ...TYPOGRAPHY.h3,
    fontWeight: '800',
    color: COLORS.text,
    marginTop: 4,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: RADIUS.round,
    paddingHorizontal: SPACING.md,
    paddingVertical: 5,
    marginTop: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    ...TYPOGRAPHY.caption,
    fontWeight: '700',
    color: COLORS.text,
    fontSize: responsiveFont(12),
  },
  statDivider: {
    width: 1,
    height: 12,
    backgroundColor: COLORS.border,
    marginHorizontal: SPACING.sm,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 3,
    borderRadius: RADIUS.round,
    marginTop: 6,
  },
  verifiedText: {
    ...TYPOGRAPHY.caption,
    fontSize: responsiveFont(11),
    fontWeight: '700',
    color: COLORS.primaryDark,
    marginLeft: 4,
  },
  guestBadgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: COLORS.primaryLight || '#E8F5E9',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.round,
    marginTop: 6,
    alignSelf: 'center',
  },
  guestBadgeText: {
    ...TYPOGRAPHY.caption,
    fontWeight: '700',
    fontSize: responsiveFont(11),
    color: COLORS.primaryDark,
    letterSpacing: 0.5,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.large,
    padding: SPACING.md,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    marginBottom: SPACING.lg,
  },
  cardTitle: {
    ...TYPOGRAPHY.bodySmall,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  cardSubtitle: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textLight,
    marginTop: -4,
    marginBottom: SPACING.md,
    lineHeight: 18,
  },
  inputLabel: {
    ...TYPOGRAPHY.caption,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 6,
  },
  genderRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  genderPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: RADIUS.medium,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    backgroundColor: COLORS.white,
  },
  genderPillActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryLight,
  },
  genderText: {
    ...TYPOGRAPHY.caption,
    fontWeight: '700',
    color: COLORS.textLight,
    marginLeft: 6,
  },
  genderTextActive: {
    color: COLORS.primaryDark,
  },
  row: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  halfCol: {
    flex: 1,
  },
  dobContainer: {
    marginBottom: SPACING.md,
  },
  dobTriggerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 48,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: RADIUS.medium,
    paddingHorizontal: SPACING.md,
    backgroundColor: COLORS.white,
  },
  dobTriggerBtnActive: {
    borderColor: COLORS.primary,
  },
  dobLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  dobText: {
    ...TYPOGRAPHY.body,
    color: COLORS.text,
    fontWeight: '500',
    marginLeft: SPACING.sm,
  },
  dobPlaceholder: {
    color: COLORS.textLight,
    fontWeight: '400',
  },
  dobHelperText: {
    ...TYPOGRAPHY.caption,
    fontSize: responsiveFont(11),
    color: COLORS.textLight,
    marginTop: 4,
    marginLeft: 2,
  },
  saveBtn: {
    marginTop: SPACING.xs,
  },
  phoneSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: SPACING.md,
  },
  countryBox: {
    height: 52,
    minWidth: 88,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: RADIUS.medium,
    backgroundColor: '#FAFAFA',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  flag: {
    fontSize: responsiveFont(18),
    marginRight: 4,
  },
  countryCode: {
    ...TYPOGRAPHY.bodySmall,
    fontWeight: '700',
    color: COLORS.text,
  },
  arrow: {
    fontSize: responsiveFont(11),
    color: COLORS.textLight,
    marginLeft: 3,
  },
  phoneInput: {
    flex: 1,
  },
  inputNoMargin: {
    marginBottom: 0,
  },
});

export default PersonalDetailsScreen;
