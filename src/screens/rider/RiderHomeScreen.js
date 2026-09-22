import React from 'react';
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
import MapPlaceholder from '../../components/MapPlaceholder';
import ProfileAvatar from '../../components/ProfileAvatar';
import Icon from '../../components/Icon';
import { CURRENT_LOCATION, SAVED_PLACES } from '../../data/mockLocations';
import { useResponsive } from '../../utils/responsive';
import AdaptiveSplitView from '../../components/AdaptiveSplitView';

export const RiderHomeScreen = ({ navigation }) => {
  const { isSplitLayout, isFoldableOrTablet, insets, width } = useResponsive();

  const searchControls = (
    <View style={[styles.bottomCard, isSplitLayout && styles.sideCard]}>
      {/* Search Bar Trigger */}
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => navigation.navigate('DestinationSearch')}
        style={styles.searchBar}
      >
        <View style={styles.searchIconBox}>
          <Icon name="search" size={18} color={COLORS.primary} />
        </View>
        <Text style={styles.searchPlaceholder}>Where to?</Text>
        <View style={styles.timeBadge}>
          <Icon name="clock" size={12} color={COLORS.text} />
          <Text style={styles.timeText}>Now ⌄</Text>
        </View>
      </TouchableOpacity>

      {/* Saved Places */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.savedPlacesRow}
      >
        {SAVED_PLACES.map((place) => (
          <TouchableOpacity
            key={place.id}
            activeOpacity={0.7}
            onPress={() =>
              navigation.navigate('RideOptions', { destination: place })
            }
            style={styles.placePill}
          >
            <View style={styles.placeIconCircle}>
              <Icon
                name={place.icon || 'map-pin'}
                size={14}
                color={COLORS.secondPrimary}
              />
            </View>
            <View style={styles.placeTextCol}>
              <Text style={styles.placeTitle}>{place.title}</Text>
              <Text numberOfLines={1} style={styles.placeAddress}>
                {place.address}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Promotion Highlight Banner */}
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => navigation.navigate('DestinationSearch')}
        style={styles.promoBanner}
      >
        <View style={styles.promoIconCircle}>
          <Icon name="tag" size={18} color={COLORS.white} />
        </View>
        <View style={styles.promoTextCol}>
          <Text style={styles.promoTitle}>20% Off Eco-Friendly Rides</Text>
          <Text style={styles.promoSubtitle}>
            Ride electric today & reduce your carbon footprint.
          </Text>
        </View>
        <Icon name="chevron-right" size={18} color={COLORS.white} />
      </TouchableOpacity>
    </View>
  );

  const mapPane = (
    <View style={styles.mapArea}>
      <MapPlaceholder
        showRoute={false}
        showPickupMarker={true}
        showDestinationMarker={false}
        showDriverMarker={true}
        pickupLabel={CURRENT_LOCATION.shortAddress}
        driverEta="3 min"
        height="100%"
      />
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

      {/* Top Floating Header */}
      {/* <View
        style={[
          styles.topHeader,
          {
            top: Math.max(insets.top + 10, 30),
            maxWidth: isFoldableOrTablet ? 560 : width - 32,
            alignSelf: 'center',
          },
        ]}
      >
        <TouchableOpacity
          onPress={() => navigation.navigate('RiderProfile')}
          activeOpacity={0.8}
          style={styles.profileBtn}
        >
          <ProfileAvatar name="Alex Morgan" size={40} />
          <View style={styles.greetingCol}>
            <Text style={styles.greetingText}>Good morning,</Text>
            <Text style={styles.userName}>Alex Morgan</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => navigation.navigate('RoleSelection')}
          activeOpacity={0.8}
          style={styles.roleBadge}
        >
          <Icon name="refresh" size={14} color={COLORS.secondPrimary} />
          <Text style={styles.roleBadgeText}>Switch Role</Text>
        </TouchableOpacity>
      </View> */}

      <AdaptiveSplitView
        primaryPane={mapPane}
        secondaryPane={
          isSplitLayout ? (
            <ScrollView
              contentContainerStyle={styles.splitSecondaryScroll}
              showsVerticalScrollIndicator={false}
            >
              {searchControls}
            </ScrollView>
          ) : (
            searchControls
          )
        }
        primaryRatio={0.55}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  sideCard: {
    backgroundColor: COLORS.white,
    height: '100%',
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.xl,
    borderLeftWidth: 1,
    borderColor: COLORS.border,
  },
  splitSecondaryScroll: {
    flexGrow: 1,
    backgroundColor: COLORS.white,
  },
  topHeader: {
    position: 'absolute',
    top: 50,
    left: SPACING.lg,
    right: SPACING.lg,
    zIndex: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.white,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.extraLarge,
    shadowColor: COLORS.text,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  profileBtn: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  greetingCol: {
    marginLeft: SPACING.sm,
  },
  greetingText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textLight,
  },
  userName: {
    ...TYPOGRAPHY.bodySmall,
    fontWeight: '700',
    color: COLORS.text,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.inputBg,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 6,
    borderRadius: RADIUS.round,
  },
  roleBadgeText: {
    ...TYPOGRAPHY.caption,
    fontWeight: '700',
    color: COLORS.secondPrimary,
    marginLeft: 4,
  },
  mapArea: {
    flex: 1,
  },
  bottomCard: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: RADIUS.extraLarge,
    borderTopRightRadius: RADIUS.extraLarge,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.xl,
    shadowColor: COLORS.text,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 6,
    borderTopWidth: 1,
    borderColor: COLORS.border,
  },
  searchBar: {
    height: 54,
    backgroundColor: COLORS.inputBg,
    borderRadius: RADIUS.large,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.md,
  },
  searchIconBox: {
    width: 32,
    height: 32,
    borderRadius: RADIUS.round,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.sm,
  },
  searchPlaceholder: {
    ...TYPOGRAPHY.title,
    fontWeight: '600',
    color: COLORS.text,
    flex: 1,
  },
  timeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 6,
    borderRadius: RADIUS.round,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  timeText: {
    ...TYPOGRAPHY.caption,
    fontWeight: '600',
    color: COLORS.text,
    marginLeft: 4,
  },
  savedPlacesRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    paddingBottom: SPACING.md,
  },
  placePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.medium,
    padding: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
    maxWidth: 180,
  },
  placeIconCircle: {
    width: 30,
    height: 30,
    borderRadius: RADIUS.round,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.xs,
  },
  placeTextCol: {
    flex: 1,
  },
  placeTitle: {
    ...TYPOGRAPHY.caption,
    fontWeight: '700',
    color: COLORS.text,
  },
  placeAddress: {
    ...TYPOGRAPHY.caption,
    fontSize: 10,
    color: COLORS.textLight,
  },
  promoBanner: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.large,
    padding: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.border,
    shadowColor: COLORS.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  promoIconCircle: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.round,
    backgroundColor: COLORS.secondPrimaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  promoTextCol: {
    flex: 1,
  },
  promoTitle: {
    ...TYPOGRAPHY.bodySmall,
    fontWeight: '700',
    color: COLORS.text,
  },
  promoSubtitle: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textLight,
    marginTop: 2,
  },
});

export default RiderHomeScreen;
