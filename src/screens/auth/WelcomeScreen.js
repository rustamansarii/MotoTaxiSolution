import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  ScrollView,
  Image,
} from 'react-native';
import { COLORS } from '../../theme/colors';
import { RADIUS, SPACING } from '../../theme/spacing';
import { TYPOGRAPHY } from '../../theme/typography';
import Icon from '../../components/Icon';
import { useResponsive } from '../../utils/responsive';

const ONBOARDING_SLIDES = [
  {
    id: 1,
    icon: 'car',
    image: require('../../assets/images/onboarding_ride.jpg'),
    title: 'Ride in Minutes',
    description:
      'Reliable doorstep pickups at the touch of a button, anywhere in your city.',
  },
  {
    id: 2,
    icon: 'shield',
    image: require('../../assets/images/onboarding_safety.jpg'),
    title: 'Safe & Verified',
    description:
      'Every driver is background checked with 24/7 in-app emergency assistance.',
  },
  {
    id: 3,
    icon: 'wallet',
    image: require('../../assets/images/onboarding_pricing.jpg'),
    title: 'Transparent Pricing',
    description:
      'Upfront rates with zero surprise charges. Multiple convenient payment options.',
  },
];

export const WelcomeScreen = ({ navigation }) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const { isCompact, isLandscape, isFoldableOrTablet, insets, width, height } =
    useResponsive();

  const handleNext = () => {
    if (currentSlide < ONBOARDING_SLIDES.length - 1) {
      setCurrentSlide(currentSlide + 1);
    } else {
      navigation.navigate('RoleSelection');
    }
  };

  const slide = ONBOARDING_SLIDES[currentSlide];

  // Proportional responsive sizing for hero illustration
  const imageSize = isLandscape
    ? Math.min(height * 0.60, 200)
    : isCompact
    ? Math.min(width * 0.80, 230)
    : isFoldableOrTablet
    ? 300
    : Math.min(width * 0.90, 275);

  const isLastSlide = currentSlide === ONBOARDING_SLIDES.length - 1;

  // Split title to apply RideGo teal emphasis to the final word
  const renderSlideTitle = (title) => {
    const words = title.split(' ');
    if (words.length <= 1) {
      return (
        <Text style={[styles.slideTitle, isCompact && styles.slideTitleCompact]}>
          {title}
        </Text>
      );
    }
    const lastWord = words.pop();
    const firstWords = words.join(' ');
    return (
      <Text style={[styles.slideTitle, isCompact && styles.slideTitleCompact]}>
        {firstWords}{' '}
        <Text style={styles.titleHighlight}>{lastWord}</Text>
      </Text>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      <ScrollView
        contentContainerStyle={[
          styles.scrollContainer,
          {
            paddingTop: Math.max(insets.top, SPACING.xs),
            paddingBottom: Math.max(insets.bottom + 8, SPACING.lg),
          },
        ]}
        bounces={false}
        showsVerticalScrollIndicator={false}
      >
        <View
          style={[
            styles.responsiveWrapper,
            { maxWidth: isFoldableOrTablet ? 500 : '100%' },
          ]}
        >
          {/* =========================================
              1. TOP BAR (Logo + Skip)
          ========================================= */}
          <View style={styles.topBar}>
            {/* RideGo Logo */}
            <View style={styles.logoRow}>
              <View style={styles.logoIconBadge}>
                <Icon name="navigation" size={15} color={COLORS.white} />
              </View>
              <Text style={styles.logoText}>
                Ride<Text style={styles.logoTextAccent}>Go</Text>
              </Text>
            </View>

            {/* Skip Button */}
            {!isLastSlide ? (
              <TouchableOpacity
                onPress={() => navigation.navigate('RoleSelection')}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                style={styles.skipButton}
                activeOpacity={0.7}
              >
                <Text style={styles.skipText}>Skip</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.skipPlaceholder} />
            )}
          </View>

          {/* =========================================
              2. HERO ILLUSTRATION (Clean, Integrated)
          ========================================= */}
          <View
            style={[
              styles.heroContainer,
              (isCompact || isLandscape) && styles.heroContainerCompact,
            ]}
          >
            {/* Soft curved pastel backdrop behind illustration */}
            <View
              style={[
                styles.backdropCircleOuter,
                {
                  width: imageSize * 1.08,
                  height: imageSize * 1.08,
                  borderRadius: (imageSize * 1.06) / 2,
                },
              ]}
            >
              <View
                style={[
                  styles.backdropCircleInner,
                  {
                    width: imageSize * 0.86,
                    height: imageSize * 0.86,
                    borderRadius: (imageSize * 0.86) / 2,
                  },
                ]}
              />
            </View>

            {/* Seamless 3D Hero Artwork without heavy box borders */}
            <Image
              source={slide.image}
              style={{
                width: imageSize,
                height: imageSize,
              }}
              resizeMode="contain"
            />
          </View>

          {/* =========================================
              3. CONTENT AREA (Headline + Description)
          ========================================= */}
          <View style={styles.textContainer}>
            {renderSlideTitle(slide.title)}
            <Text
              style={[
                styles.slideDescription,
                isCompact && styles.slideDescriptionCompact,
              ]}
            >
              {slide.description}
            </Text>

            {/* 4. PAGINATION INDICATOR (Progress) */}
            <View style={styles.indicatorRow}>
              {ONBOARDING_SLIDES.map((_, index) => {
                const isActive = currentSlide === index;
                return (
                  <TouchableOpacity
                    key={index}
                    onPress={() => setCurrentSlide(index)}
                    activeOpacity={0.8}
                    hitSlop={{ top: 10, bottom: 10, left: 6, right: 6 }}
                    style={[
                      styles.dot,
                      isActive ? styles.activeDot : styles.inactiveDot,
                    ]}
                  />
                );
              })}
            </View>
          </View>

          {/* =========================================
              5. BOTTOM CTA (Continue Button + Direct Link)
          ========================================= */}
          <View style={styles.bottomSection}>
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={handleNext}
              style={[
                styles.primaryButton,
                isCompact && styles.primaryButtonCompact,
              ]}
            >
              <Text style={styles.primaryButtonText}>
                {isLastSlide ? 'Get Started' : 'Continue'}
              </Text>
              <Icon name="arrow-right" size={18} color={COLORS.white} />
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => navigation.navigate('RoleSelection')}
              style={styles.secondaryAction}
              hitSlop={{ top: 8, bottom: 8, left: 16, right: 16 }}
            >
              <Text style={styles.secondaryActionText}>
                Choose role directly{' '}
                <Text style={styles.secondaryActionChevron}>›</Text>
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
    backgroundColor: '#FFFFFF',
  },
  scrollContainer: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  responsiveWrapper: {
    width: '100%',
    flex: 1,
    justifyContent: 'space-between',
    alignSelf: 'center',
  },

  /* ========================================
     TOP BAR
  ======================================== */
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.xs,
    paddingBottom: SPACING.xs,
    minHeight: 46,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoIconBadge: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  logoText: {
    ...TYPOGRAPHY.title,
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
    marginLeft: SPACING.xs + 2,
    letterSpacing: -0.4,
  },
  logoTextAccent: {
    color: COLORS.primary,
  },
  skipButton: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: RADIUS.round,
    backgroundColor: '#F1F5F9',
  },
  skipText: {
    ...TYPOGRAPHY.caption,
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  skipPlaceholder: {
    width: 44,
  },

  /* ========================================
     HERO ILLUSTRATION
  ======================================== */
  heroContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginVertical: SPACING.sm,
    paddingHorizontal: SPACING.lg,
  },
  heroContainerCompact: {
    marginVertical: SPACING.xs,
  },
  backdropCircleOuter: {
    position: 'absolute',
    backgroundColor: '#F0FBF7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backdropCircleInner: {
    backgroundColor: '#E1F7EE',
  },

  /* ========================================
     CONTENT AREA & TYPOGRAPHY
  ======================================== */
  textContainer: {
    alignItems: 'center',
    paddingHorizontal: SPACING.xxl,
    marginVertical: SPACING.xs,
  },
  slideTitle: {
    ...TYPOGRAPHY.h2,
    fontSize: 27,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
    letterSpacing: -0.5,
    lineHeight: 33,
    marginBottom: SPACING.xs,
  },
  slideTitleCompact: {
    fontSize: 23,
    lineHeight: 28,
  },
  titleHighlight: {
    color: COLORS.primary,
  },
  slideDescription: {
    ...TYPOGRAPHY.body,
    fontSize: 15,
    fontWeight: '400',
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 320,
  },
  slideDescriptionCompact: {
    fontSize: 13,
    lineHeight: 19,
    maxWidth: 290,
  },

  /* ========================================
     PAGINATION DOTS
  ======================================== */
  indicatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    marginTop: SPACING.lg,
    marginBottom: SPACING.xs,
  },
  dot: {
    height: 7,
    borderRadius: 3.5,
  },
  inactiveDot: {
    width: 7,
    backgroundColor: '#E2E8F0',
  },
  activeDot: {
    width: 22,
    backgroundColor: COLORS.primary,
  },

  /* ========================================
     BOTTOM SECTION & CTA
  ======================================== */
  bottomSection: {
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.sm,
    width: '100%',
  },
  primaryButton: {
    height: 54,
    borderRadius: 27,
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.xl,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 10,
    elevation: 4,
  },
  primaryButtonCompact: {
    height: 48,
    borderRadius: 24,
  },
  primaryButtonText: {
    ...TYPOGRAPHY.bodyMedium,
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.white,
    marginRight: SPACING.xs,
    letterSpacing: 0.2,
  },
  secondaryAction: {
    marginTop: SPACING.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.xs,
  },
  secondaryActionText: {
    ...TYPOGRAPHY.caption,
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  secondaryActionChevron: {
    color: COLORS.primary,
    fontWeight: '700',
    fontSize: 15,
  },
});

export default WelcomeScreen;
