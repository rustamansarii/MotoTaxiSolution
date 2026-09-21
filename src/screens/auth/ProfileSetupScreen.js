import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ScrollView,
} from 'react-native';
import { COLORS } from '../../theme/colors';
import { SPACING } from '../../theme/spacing';
import { TYPOGRAPHY } from '../../theme/typography';
import Header from '../../components/Header';
import CustomInput from '../../components/CustomInput';
import CustomButton from '../../components/CustomButton';
import ProfileAvatar from '../../components/ProfileAvatar';
import { useResponsive } from '../../utils/responsive';

export const ProfileSetupScreen = ({ navigation, route }) => {
  const role = route.params?.role || 'rider';
  const isDriver = role === 'driver';
  const { isFoldableOrTablet, insets } = useResponsive();

  const [fullName, setFullName] = useState(isDriver ? 'Marcus Vance' : 'Alex Morgan');
  const [email, setEmail] = useState(isDriver ? 'marcus.drive@example.com' : 'alex.morgan@example.com');
  const [city, setCity] = useState('New York, NY');
  const [loading, setLoading] = useState(false);

  const handleComplete = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      if (isDriver) {
        navigation.navigate('VehicleSetup');
      } else {
        navigation.replace('RiderNav');
      }
    }, 600);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />
      <Header
        title="Set Up Profile"
        onBack={() => navigation.goBack()}
      />

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: Math.max(insets.bottom, SPACING.xxxl) },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.innerWrapper, { maxWidth: isFoldableOrTablet ? 520 : '100%' }]}>
          <View style={styles.avatarSection}>
          <ProfileAvatar
            name={fullName}
            size={90}
            showEdit={true}
            onEditPress={() => {}}
          />
          <Text style={styles.avatarHint}>Tap to change profile photo</Text>
        </View>

        <View style={styles.formSection}>
          <CustomInput
            label="Full Name"
            value={fullName}
            onChangeText={setFullName}
            placeholder="First and last name"
            leftIcon="user"
          />

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
            label="Home City"
            value={city}
            onChangeText={setCity}
            placeholder="e.g. New York, NY"
            leftIcon="map-pin"
          />
        </View>

          <CustomButton
            title={isDriver ? 'Continue to Vehicle Setup' : 'Start Riding'}
            onPress={handleComplete}
            loading={loading}
            icon="arrow-right"
            iconPosition="right"
            style={styles.submitBtn}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  innerWrapper: {
    width: '100%',
    alignSelf: 'center',
  },
  content: {
    padding: SPACING.xl,
    paddingBottom: SPACING.xxxl,
  },
  avatarSection: {
    alignItems: 'center',
    marginVertical: SPACING.lg,
  },
  avatarHint: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textLight,
    marginTop: SPACING.sm,
  },
  formSection: {
    marginTop: SPACING.md,
  },
  submitBtn: {
    marginTop: SPACING.lg,
  },
});

export default ProfileSetupScreen;
