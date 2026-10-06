import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { COLORS } from '../theme/colors';
import { TYPOGRAPHY } from '../theme/typography';
import { useResponsive } from '../utils/responsive';
import { useTranslation } from 'react-i18next';
import Icon from '../components/Icon';

// Screens
import RiderHomeScreen from '../screens/rider/RiderHomeScreen';
import ActivityScreen from '../screens/rider/ActivityScreen';
import WalletScreen from '../screens/rider/WalletScreen';
import RiderProfileScreen from '../screens/rider/RiderProfileScreen';
import DestinationSearchScreen from '../screens/rider/DestinationSearchScreen';
import PickupLocationScreen from '../screens/rider/PickupLocationScreen';
import RideOptionsScreen from '../screens/rider/RideOptionsScreen';
import ConfirmRideScreen from '../screens/rider/ConfirmRideScreen';
import SearchingDriverScreen from '../screens/rider/SearchingDriverScreen';
import DriverAssignedScreen from '../screens/rider/DriverAssignedScreen';
import RideInProgressScreen from '../screens/rider/RideInProgressScreen';
import TripCompletedScreen from '../screens/rider/TripCompletedScreen';
import RatingScreen from '../screens/rider/RatingScreen';
import SavedPlacesScreen from '../screens/rider/SavedPlacesScreen';
import PersonalDetailsScreen from '../screens/rider/PersonalDetailsScreen';
import DeleteAccountScreen from '../screens/rider/DeleteAccountScreen';
import PaymentMethodScreen from '../screens/payment/PaymentMethodScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const RiderTabs = () => {
  const { t } = useTranslation();
  const { insets, isLandscape, isFoldableOrTablet } = useResponsive();

  const tabBarStyle = {
    backgroundColor: COLORS.white,
    borderTopColor: COLORS.border,
    borderTopWidth: 1,
    height: 56 + Math.max(insets.bottom, 6),
    paddingBottom: Math.max(insets.bottom, 6),
    paddingTop: 6,
    paddingHorizontal: isLandscape ? Math.max(insets.left, insets.right, 16) : 0,
  };

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.iconLight,
        tabBarStyle: tabBarStyle,
        tabBarLabelStyle: styles.tabLabel,
        tabBarItemStyle: isFoldableOrTablet ? { maxWidth: 180 } : undefined,
      }}
    >
      <Tab.Screen
        name="RiderHome"
        component={RiderHomeScreen}
        options={{
          tabBarLabel: t('tabs.home', 'Home'),
          tabBarIcon: ({ color, focused }) => (
            <Icon name="bike" size={22} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Activity"
        component={ActivityScreen}
        options={{
          tabBarLabel: t('tabs.live', 'Live'),
          tabBarIcon: ({ color, focused }) => (
            <Icon name="live" size={22} color={color} />
          ),
        }}
      />

      <Tab.Screen
        name="RiderProfile"
        component={RiderProfileScreen}
        options={{
          tabBarLabel: t('tabs.profile', 'Profile'),
          tabBarIcon: ({ color, focused }) => (
            <Icon name="user" size={22} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

export const RiderNavigator = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="RiderTabs" component={RiderTabs} />
      <Stack.Screen name="RiderHome" component={RiderTabs} />
      <Stack.Screen name="DestinationSearch" component={DestinationSearchScreen} />
      <Stack.Screen name="PickupLocation" component={PickupLocationScreen} />
      <Stack.Screen name="RideOptions" component={RideOptionsScreen} />
      <Stack.Screen name="ConfirmRide" component={ConfirmRideScreen} />
      <Stack.Screen name="SearchingDriver" component={SearchingDriverScreen} />
      <Stack.Screen name="DriverAssigned" component={DriverAssignedScreen} />
      <Stack.Screen name="RideInProgress" component={RideInProgressScreen} />
      <Stack.Screen name="TripCompleted" component={TripCompletedScreen} />
      <Stack.Screen name="PaymentMethod" component={PaymentMethodScreen} />
      <Stack.Screen name="Rating" component={RatingScreen} />
      <Stack.Screen name="SavedPlaces" component={SavedPlacesScreen} />
      <Stack.Screen name="PersonalDetails" component={PersonalDetailsScreen} />
      <Stack.Screen name="DeleteAccount" component={DeleteAccountScreen} />
    </Stack.Navigator>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: COLORS.white,
    borderTopColor: COLORS.border,
    borderTopWidth: 1,
    height: 62,
    paddingBottom: 8,
    paddingTop: 6,
  },
  tabLabel: {
    ...TYPOGRAPHY.caption,
    fontWeight: '600',
    fontSize: 11,
  },
});

export default RiderNavigator;
