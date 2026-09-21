import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { COLORS } from '../../theme/colors';
import { RADIUS, SPACING } from '../../theme/spacing';
import { TYPOGRAPHY } from '../../theme/typography';
import CustomButton from '../../components/CustomButton';
import Icon from '../../components/Icon';
import { useResponsive } from '../../utils/responsive';

const ONBOARDING_SLIDES = [
  {
    id: 1,
    icon: 'car',
    title: 'Ride in Minutes',
    description: 'Reliable doorstep pickups at the touch of a button, anywhere in your city.',
  },
  {
    id: 2,
    icon: 'shield',
    title: 'Safe & Verified',
    description: 'Every driver is background checked with 24/7 in-app emergency assistance.',
  },
  {
    id: 3,
    icon: 'wallet',
    title: 'Transparent Pricing',
    description: 'Upfront rates with zero surprise charges. Multiple convenient payment options.',
  },
];

export const WelcomeScreen = ({ navigation }) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const { isCompact, isLandscape, isFoldableOrTablet, insets } = useResponsive();

  const handleNext = () => {
    if (currentSlide < ONBOARDING_SLIDES.length - 1) {
      setCurrentSlide(currentSlide + 1);
    } else {
      navigation.navigate('RoleSelection');
    }
  };

  const slide = ONBOARDING_SLIDES[currentSlide];
  const circleSize = isCompact || isLandscape ? 130 : 175;
  const innerCircleSize = isCompact || isLandscape ? 95 : 135;
  const iconSize = isCompact || isLandscape ? 46 : 64;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

      <ScrollView
        contentContainerStyle={[
          styles.scrollContainer,
          { paddingBottom: Math.max(insets.bottom, SPACING.lg) },
        ]}
        bounces={false}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.responsiveWrapper, { maxWidth: isFoldableOrTablet ? 540 : '100%' }]}>
          {/* Top Bar with Skip */}
          <View style={styles.topBar}>
            <View style={styles.brandBadge}>
              <Icon name="navigation" size={16} color={COLORS.primary} />
              <Text style={styles.brandBadgeText}>RideGo</Text>
            </View>

            {currentSlide < ONBOARDING_SLIDES.length - 1 && (
              <TouchableOpacity
                onPress={() => navigation.navigate('RoleSelection')}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Text style={styles.skipText}>Skip</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Main Content Hero */}
          <View style={[styles.heroContainer, (isCompact || isLandscape) && { paddingVertical: SPACING.md }]}>
            <View
              style={[
                styles.illustrationCircle,
                { width: circleSize, height: circleSize, marginBottom: isLandscape ? SPACING.md : SPACING.xl },
              ]}
            >
              <View
                style={[
                  styles.innerIllustrationCircle,
                  { width: innerCircleSize, height: innerCircleSize },
                ]}
              >
                <Icon name={slide.icon} size={iconSize} color={COLORS.primary} />
              </View>
            </View>

            <Text style={[styles.slideTitle, isCompact && { fontSize: 24, lineHeight: 28 }]}>
              {slide.title}
            </Text>
            <Text style={[styles.slideDescription, isCompact && { fontSize: 13, lineHeight: 18 }]}>
              {slide.description}
            </Text>

            {/* Indicator Dots */}
            <View style={[styles.indicatorRow, isLandscape && { marginTop: SPACING.md }]}>
              {ONBOARDING_SLIDES.map((_, index) => (
                <TouchableOpacity
                  key={index}
                  onPress={() => setCurrentSlide(index)}
                  style={[
                    styles.dot,
                    currentSlide === index && styles.activeDot,
                  ]}
                />
              ))}
            </View>
          </View>

          {/* Bottom CTA */}
          <View style={styles.bottomSection}>
            <CustomButton
              title={
                currentSlide === ONBOARDING_SLIDES.length - 1
                  ? 'Get Started'
                  : 'Continue'
              }
              onPress={handleNext}
              icon="arrow-right"
              iconPosition="right"
            />
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => navigation.navigate('RoleSelection')}
              style={styles.directLoginBtn}
            >
              <Text style={styles.directLoginText}>
                Choose role directly ›
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
  scrollContainer: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  responsiveWrapper: {
    width: '100%',
    flex: 1,
    justifyContent: 'space-between',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.md,
  },
  brandBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.backgroundglass,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.round,
  },
  brandBadgeText: {
    ...TYPOGRAPHY.bodySmall,
    fontWeight: '700',
    color: COLORS.white,
    marginLeft: SPACING.xs,
  },
  skipText: {
    ...TYPOGRAPHY.bodySmall,
    fontWeight: '600',
    color: COLORS.textLight,
  },
  heroContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.xxl,
  },
  illustrationCircle: {
    width: 180,
    height: 180,
    borderRadius: RADIUS.round,
    backgroundColor: COLORS.primaryLight,
    borderWidth: 2,
    borderColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.xxl,
  },
  innerIllustrationCircle: {
    width: 140,
    height: 140,
    borderRadius: RADIUS.round,
    backgroundColor: COLORS.backgroundglass,
    alignItems: 'center',
    justifyContent: 'center',
  },
  slideTitle: {
    ...TYPOGRAPHY.h1,
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: SPACING.sm,
  },
  slideDescription: {
    ...TYPOGRAPHY.body,
    color: COLORS.textLight,
    textAlign: 'center',
    lineHeight: 24,
  },
  indicatorRow: {
    flexDirection: 'row',
    gap: SPACING.xs,
    marginTop: SPACING.xxl,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: RADIUS.round,
    backgroundColor: COLORS.border,
  },
  activeDot: {
    backgroundColor: COLORS.primary,
    width: 24,
  },
  bottomSection: {
    paddingHorizontal: SPACING.xl,
    paddingBottom: SPACING.xl,
  },
  directLoginBtn: {
    marginTop: SPACING.md,
    alignItems: 'center',
  },
  directLoginText: {
    ...TYPOGRAPHY.caption,
    fontWeight: '600',
    color: COLORS.secondPrimary,
  },
});

export default WelcomeScreen;
