import React from 'react';
import { StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { COLORS } from '../theme/colors';
import { TYPOGRAPHY } from '../theme/typography';
import { useResponsive, responsiveFont } from '../utils/responsive';
import { useTranslation } from 'react-i18next';
import Icon from '../components/Icon';

// Screens
import DriverHomeScreen from '../screens/driver/DriverHomeScreen';
import DriverTripsScreen from '../screens/driver/DriverTripsScreen';
import DriverEarningsScreen from '../screens/driver/DriverEarningsScreen';
import DriverProfileScreen from '../screens/driver/DriverProfileScreen';
import RideRequestScreen from '../screens/driver/RideRequestScreen';
import DriverAcceptedRideScreen from '../screens/driver/DriverAcceptedRideScreen';
import DriverArrivedScreen from '../screens/driver/DriverArrivedScreen';
import DriverTripScreen from '../screens/driver/DriverTripScreen';
import DriverTripCompletedScreen from '../screens/driver/DriverTripCompletedScreen';
import DriverMapScreen from '../screens/driver/DriverMapScreen';
import VehicleSetupScreen from '../screens/driver/VehicleSetupScreen';
import DocumentUploadScreen from '../screens/driver/DocumentUploadScreen';
import PaymentMethodScreen from '../screens/payment/PaymentMethodScreen';
import RatingScreen from '../screens/rider/RatingScreen';
import PersonalDetailsScreen from '../screens/rider/PersonalDetailsScreen';
import DeleteAccountScreen from '../screens/rider/DeleteAccountScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const DriverTabs = () => {
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
        tabBarInactiveTintColor: COLORS.textLight,
        tabBarStyle: tabBarStyle,
        tabBarLabelStyle: styles.tabLabel,
        tabBarItemStyle: isFoldableOrTablet ? { maxWidth: 180 } : undefined,
      }}
    >
      <Tab.Screen
        name="DriverHome"
        component={DriverHomeScreen}
        options={{
          tabBarLabel: t('tabs.dashboard', 'Dashboard'),
          tabBarIcon: ({ color }) => (
            <Icon name="navigation" size={22} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="DriverTrips"
        component={DriverTripsScreen}
        options={{
          tabBarLabel: t('tabs.trips', 'Trips'),
          tabBarIcon: ({ color }) => (
            <Icon name="time" size={22} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="DriverEarnings"
        component={DriverEarningsScreen}
        options={{
          tabBarLabel: t('tabs.earnings', 'Earnings'),
          tabBarIcon: ({ color }) => (
            <Icon name="wallet" size={22} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="DriverProfile"
        component={DriverProfileScreen}
        options={{
          tabBarLabel: t('tabs.account', 'Account'),
          tabBarIcon: ({ color }) => (
            <Icon name="user" size={22} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

export const DriverNavigator = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="DriverTabs" component={DriverTabs} />
      <Stack.Screen name="DriverHome" component={DriverTabs} />
      <Stack.Screen name="RideRequest" component={RideRequestScreen} />
      <Stack.Screen name="DriverAcceptedRide" component={DriverAcceptedRideScreen} />
      <Stack.Screen name="DriverArrived" component={DriverArrivedScreen} />
      <Stack.Screen name="DriverRideOtp" component={DriverArrivedScreen} />
      <Stack.Screen name="DriverTrip" component={DriverTripScreen} />
      <Stack.Screen name="DriverTripCompleted" component={DriverTripCompletedScreen} />
      <Stack.Screen name="DriverMap" component={DriverMapScreen} />
      <Stack.Screen name="PaymentMethod" component={PaymentMethodScreen} />
      <Stack.Screen name="Rating" component={RatingScreen} />
      <Stack.Screen name="VehicleSetup" component={VehicleSetupScreen} />
      <Stack.Screen name="DocumentUpload" component={DocumentUploadScreen} />
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
    fontSize: responsiveFont(11),
  },
});

export default DriverNavigator;
