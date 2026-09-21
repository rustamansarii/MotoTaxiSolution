import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import { COLORS } from '../../theme/colors';
import { RADIUS, SPACING } from '../../theme/spacing';
import { TYPOGRAPHY } from '../../theme/typography';
import Header from '../../components/Header';
import LocationInput from '../../components/LocationInput';
import Icon from '../../components/Icon';
import ResponsiveContainer from '../../components/ResponsiveContainer';
import { useResponsive } from '../../utils/responsive';
import {
  CURRENT_LOCATION,
  POPULAR_DESTINATIONS,
  SAVED_PLACES,
} from '../../data/mockLocations';

export const DestinationSearchScreen = ({ navigation }) => {
  const { isFoldableOrTablet, insets } = useResponsive();
  const [pickup, setPickup] = useState(CURRENT_LOCATION.address);
  const [destination, setDestination] = useState('');

  const handleSelectLocation = (loc) => {
    navigation.navigate('RideOptions', {
      pickup: pickup || CURRENT_LOCATION.address,
      destination: loc.address || loc.title,
      destinationData: loc,
    });
  };

  const handleSwap = () => {
    const temp = pickup;
    setPickup(destination);
    setDestination(temp);
  };

  const renderDestinationItem = ({ item }) => (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={() => handleSelectLocation(item)}
      style={styles.resultItem}
    >
      <View style={styles.iconCircle}>
        <Icon
          name={item.icon || 'map-pin'}
          size={18}
          color={COLORS.secondPrimary}
        />
      </View>
      <View style={styles.resultDetails}>
        <Text style={styles.resultTitle}>{item.title}</Text>
        <Text numberOfLines={1} style={styles.resultAddress}>
          {item.address}
        </Text>
      </View>
      {item.estTime ? (
        <View style={styles.timeDistanceBadge}>
          <Text style={styles.estTimeText}>{item.estTime}</Text>
          <Text style={styles.estDistText}>{item.distance}</Text>
        </View>
      ) : (
        <Icon name="chevron-right" size={16} color={COLORS.iconLight} />
      )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />
      <ResponsiveContainer maxWidth={680} style={{ flex: 1 }}>
        <Header
          title="Choose Destination"
          onBack={() => navigation.goBack()}
        />

        {/* Dual Inputs */}
        <View style={styles.inputContainer}>
          <LocationInput
            pickupValue={pickup}
            destinationValue={destination}
            onPickupChange={setPickup}
            onDestinationChange={setDestination}
            onSwap={handleSwap}
            pickupPlaceholder="Pickup address"
            destinationPlaceholder="Where are you going?"
          />
        </View>

        {/* Set on map button */}
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => navigation.navigate('PickupLocation')}
          style={styles.setPinBtn}
        >
          <View style={styles.pinIconCircle}>
            <Icon name="map-pin" size={16} color={COLORS.primary} />
          </View>
          <Text style={styles.setPinText}>Set location on map</Text>
          <Icon name="chevron-right" size={16} color={COLORS.textLight} />
        </TouchableOpacity>

        {/* Saved & Popular Suggestions */}
        <View style={styles.listSection}>
          <Text style={styles.sectionHeader}>Saved & Popular Destinations</Text>
          <FlatList
            data={[...SAVED_PLACES, ...POPULAR_DESTINATIONS]}
            keyExtractor={(item) => item.id}
            renderItem={renderDestinationItem}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
          />
        </View>
      </ResponsiveContainer>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  inputContainer: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.white,
  },
  setPinBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.sm,
  },
  pinIconCircle: {
    width: 32,
    height: 32,
    borderRadius: RADIUS.round,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  setPinText: {
    ...TYPOGRAPHY.bodySmall,
    fontWeight: '600',
    color: COLORS.text,
    flex: 1,
  },
  listSection: {
    flex: 1,
    backgroundColor: COLORS.white,
    paddingTop: SPACING.md,
  },
  sectionHeader: {
    ...TYPOGRAPHY.caption,
    fontWeight: '700',
    color: COLORS.textLight,
    paddingHorizontal: SPACING.lg,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: SPACING.sm,
  },
  listContent: {
    paddingBottom: SPACING.xxxl,
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.round,
    backgroundColor: COLORS.inputBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  resultDetails: {
    flex: 1,
  },
  resultTitle: {
    ...TYPOGRAPHY.bodySmall,
    fontWeight: '700',
    color: COLORS.text,
  },
  resultAddress: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textLight,
    marginTop: 2,
  },
  timeDistanceBadge: {
    alignItems: 'flex-end',
  },
  estTimeText: {
    ...TYPOGRAPHY.caption,
    fontWeight: '700',
    color: COLORS.secondPrimary,
  },
  estDistText: {
    ...TYPOGRAPHY.caption,
    fontSize: 10,
    color: COLORS.textLight,
    marginTop: 2,
  },
  separator: {
    height: 1,
    backgroundColor: COLORS.border,
    marginLeft: 68,
  },
});

export default DestinationSearchScreen;
