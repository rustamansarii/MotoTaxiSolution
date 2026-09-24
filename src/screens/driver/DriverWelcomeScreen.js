import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { COLORS } from '../../theme/colors';
import { RADIUS, SPACING } from '../../theme/spacing';
import { TYPOGRAPHY } from '../../theme/typography';
import Header from '../../components/Header';
import CustomButton from '../../components/CustomButton';
import Icon from '../../components/Icon';
import { useResponsive } from '../../utils/responsive';
import { useTranslation } from 'react-i18next';

export const DriverWelcomeScreen = ({ navigation }) => {
  const { t } = useTranslation();
  const { isFoldableOrTablet, insets } = useResponsive();

  const perks = [
    {
      icon: 'dollar-sign',
      title: t('driver.todayEarnings', 'Top Earnings & Tips'),
      description:
        'Keep 100% of rider tips with low platform commission and instant daily cash outs.',
    },
    {
      icon: 'clock',
      title: t('driver.hoursOnline', 'Drive on Your Schedule'),
      description:
        'Turn on Driver Mode whenever you are ready. No minimum weekly hours required.',
    },
    {
      icon: 'shield',
      title: t('driver.documents', 'Comprehensive Protection'),
      description:
        'Every trip includes full insurance coverage, 24/7 support, and rider ratings.',
    },
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      <Header
        title={t('driver.driverProfile', 'Driver Partner')}
        onBack={() => navigation.navigate('RoleSelection')}
        variant="light"
      />

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: Math.max(insets.bottom, SPACING.xxxl) },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View
          style={[
            styles.innerWrapper,
            { maxWidth: isFoldableOrTablet ? 580 : '100%' },
          ]}
        >
          {/* Hero Card */}
          <View style={styles.heroCard}>
            <View style={styles.iconCircle}>
              <Icon name="bike" size={32} color={COLORS.primaryDark} />
            </View>

            <Text style={styles.heroTitle}>
              {t('driver.welcomeDriver', 'Drive & Earn on Your Terms')}
            </Text>
            <Text style={styles.heroSubtitle}>
              {t('driver.welcomeDriverDesc', 'Join thousands of independent driver partners powering reliable urban mobility.')}
            </Text>

            <View style={styles.earningsEstimate}>
              <Text style={styles.estLabel}>
                {t('driver.todayEarnings', 'Average Partner Earnings')}
              </Text>
              <Text style={styles.estAmount}>$28 - $36 / hr</Text>
            </View>
          </View>

          {/* Perks */}
          <View style={styles.perksList}>
            {perks.map((perk, index) => (
              <View key={index} style={styles.perkItem}>
                <View style={styles.perkIconBox}>
                  <Icon name={perk.icon} size={22} color={COLORS.primaryDark} />
                </View>
                <View style={styles.perkTextCol}>
                  <Text style={styles.perkTitle}>{perk.title}</Text>
                  <Text style={styles.perkDescription}>{perk.description}</Text>
                </View>
              </View>
            ))}
          </View>

          {/* Action Buttons */}
          <View style={styles.actions}>
            <CustomButton
              title={t('auth.driverRoleTitle', 'Register as Driver')}
              onPress={() => navigation.navigate('DriverLogin')}
              variant="primary"
              icon="arrow-right"
              iconPosition="right"
            />

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => navigation.navigate('DriverNav')}
              style={styles.directDashboardBtn}
            >
              <Text style={styles.directDashboardText}>
                {t('driver.homeTitle', 'Direct to Driver Dashboard')} ›
              </Text>
            </TouchableOpacity>
          </View>
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
  heroCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.extraLarge,
    padding: SPACING.xl,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    marginBottom: SPACING.xl,
    shadowColor: COLORS.text,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  iconCircle: {
    width: 68,
    height: 68,
    borderRadius: RADIUS.round,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: 'rgba(69, 221, 177, 0.3)',
  },
  heroTitle: {
    ...TYPOGRAPHY.h2,
    fontWeight: '800',
    color: COLORS.text,
    textAlign: 'center',
  },
  heroSubtitle: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.textLight,
    textAlign: 'center',
    marginTop: SPACING.xs,
    lineHeight: 20,
  },
  earningsEstimate: {
    marginTop: SPACING.lg,
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.sm + 2,
    borderRadius: RADIUS.large,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(69, 221, 177, 0.4)',
  },
  estLabel: {
    ...TYPOGRAPHY.caption,
    fontWeight: '700',
    color: COLORS.textLight,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontSize: 10,
  },
  estAmount: {
    ...TYPOGRAPHY.h3,
    fontWeight: '800',
    color: COLORS.primaryDark,
    marginTop: 2,
    fontSize: 20,
  },
  perksList: {
    gap: SPACING.md,
    marginBottom: SPACING.xl,
  },
  perkItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: COLORS.white,
    padding: SPACING.lg,
    borderRadius: RADIUS.large,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: COLORS.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  perkIconBox: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.medium,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  perkTextCol: {
    flex: 1,
  },
  perkTitle: {
    ...TYPOGRAPHY.bodyMedium,
    fontWeight: '700',
    color: COLORS.text,
  },
  perkDescription: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textLight,
    marginTop: 3,
    lineHeight: 18,
    fontSize: 12,
  },
  actions: {
    marginTop: SPACING.sm,
  },
  directDashboardBtn: {
    alignItems: 'center',
    marginTop: SPACING.md,
    padding: SPACING.xs,
  },
  directDashboardText: {
    ...TYPOGRAPHY.bodySmall,
    fontWeight: '600',
    color: COLORS.textLight,
  },
});

export default DriverWelcomeScreen;
