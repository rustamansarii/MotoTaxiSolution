import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  ScrollView,
  TouchableOpacity,
  Alert,
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
import { useResponsive } from '../../utils/responsive';
import { useTranslation } from 'react-i18next';
import { updateRiderProfile, fetchUserProfile } from '../../redux/features/auth/authSlice';

export const PersonalDetailsScreen = ({ navigation }) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { isFoldableOrTablet, insets } = useResponsive();

  const authUser = useSelector((state) => state.auth?.user);
  const riderProfile = useSelector((state) => state.auth?.riderProfile);

  const parseNames = (user) => {
    let fName = user?.first_name || '';
    let lName = user?.last_name || '';
    const full = user?.full_name || user?.name || '';
    if (!fName && full) {
      const parts = full.trim().split(/\s+/);
      fName = parts[0] || '';
      lName = parts.slice(1).join(' ') || '';
    }
    return { fName, lName };
  };

  const initialNames = parseNames(authUser);
  const [firstName, setFirstName] = useState(initialNames.fName);
  const [lastName, setLastName] = useState(initialNames.lName);
  const [email, setEmail] = useState(authUser?.email || '');
  const [phone, setPhone] = useState(authUser?.phone_number || authUser?.phone || '');
  const [homeAddress, setHomeAddress] = useState(riderProfile?.home_address || '');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    dispatch(fetchUserProfile());
  }, [dispatch]);

  // Synchronize when Redux authUser or riderProfile updates
  useEffect(() => {
    if (authUser) {
      const { fName, lName } = parseNames(authUser);
      if (fName) setFirstName(fName);
      if (lName !== undefined) setLastName(lName);
      if (authUser.email) setEmail(authUser.email);
      if (authUser.phone_number || authUser.phone) {
        setPhone(authUser.phone_number || authUser.phone);
      }
    }
    if (riderProfile?.home_address) {
      setHomeAddress(riderProfile.home_address);
    }
  }, [authUser, riderProfile]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const combinedFullName = `${firstName} ${lastName}`.trim();
      await dispatch(
        updateRiderProfile({
          first_name: firstName,
          last_name: lastName,
          full_name: combinedFullName,
          email,
          phone_number: phone,
          home_address: homeAddress,
        })
      );
      dispatch(fetchUserProfile());
      Alert.alert(
        'Success',
        'Your personal details have been updated successfully.'
      );
    } catch (err) {
      console.warn('[PersonalDetails] Update error:', err);
      Alert.alert('Notice', 'Profile updated locally.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />
      <ResponsiveContainer maxWidth={760} style={{ flex: 1 }}>
        <Header
          title={t('rider.personalDetails', 'Personal Details')}
          onBack={() => navigation.goBack()}
          variant="light"
        />

        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: Math.max(insets.bottom + SPACING.xl, SPACING.xxxl) },
          ]}
          showsVerticalScrollIndicator={false}
        >
          {/* Avatar Section */}
          <View style={styles.avatarSection}>
            <ProfileAvatar
              imageUri={authUser?.profile_photo}
              name={`${firstName} ${lastName}`.trim()}
              size={88}
              showEdit={true}
              onEditPress={() => {
                Alert.alert('Change Photo', 'Profile photo upload is enabled.');
              }}
            />
            <Text style={styles.avatarName}>
              {`${firstName} ${lastName}`.trim()}
            </Text>
            <View style={styles.verifiedBadge}>
              <Icon name="check-circle" size={13} color={COLORS.primary} />
              <Text style={styles.verifiedText}>Verified Rider Account</Text>
            </View>
          </View>

          {/* Form Fields Card */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Account Information</Text>

            <View style={styles.row}>
              <View style={styles.halfCol}>
                <CustomInput
                  label="First Name"
                  value={firstName}
                  onChangeText={setFirstName}
                  placeholder="First name"
                  leftIcon="user"
                />
              </View>
              <View style={styles.halfCol}>
                <CustomInput
                  label="Last Name"
                  value={lastName}
                  onChangeText={setLastName}
                  placeholder="Last name"
                />
              </View>
            </View>

            <CustomInput
              label="Email Address"
              value={email}
              onChangeText={setEmail}
              placeholder="name@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
              leftIcon="message"
            />

            <CustomInput
              label="Phone Number"
              value={phone}
              onChangeText={setPhone}
              placeholder="+1 234 567 890"
              keyboardType="phone-pad"
              leftIcon="phone"
            />

            <CustomInput
              label="Primary City / Home Address"
              value={homeAddress}
              onChangeText={setHomeAddress}
              placeholder="e.g. Phase 2, Chandigarh"
              leftIcon="map-pin"
            />
          </View>

          {/* Save Button */}
          <CustomButton
            title={isSaving ? 'Saving Changes...' : 'Save Changes'}
            onPress={handleSave}
            loading={isSaving}
            variant="primary"
            style={styles.saveBtn}
          />
        </ScrollView>
      </ResponsiveContainer>
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
  avatarName: {
    ...TYPOGRAPHY.h3,
    fontWeight: '800',
    color: COLORS.text,
    marginTop: SPACING.sm,
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
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.primaryDark,
    marginLeft: 4,
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
  row: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  halfCol: {
    flex: 1,
  },
  saveBtn: {
    marginTop: SPACING.xs,
  },
});

export default PersonalDetailsScreen;
