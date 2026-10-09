import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
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
import DriverRequestListScreen from '../screens/driver/DriverRequestListScreen';
import DriverRequestDetailsScreen from '../screens/driver/DriverRequestDetailsScreen';
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
    borderTopColor: '#E2E8F0',
    borderTopWidth: StyleSheet.hairlineWidth,
    height: (isFoldableOrTablet ? 60 : 54) + Math.max(insets.bottom, 6),
    paddingBottom: Math.max(insets.bottom, 6),
    paddingTop: 5,
    paddingHorizontal: 0,
    width: '100%',
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
      },
      android: {
        elevation: 8,
      },
    }),
  };

  const iconSize = isFoldableOrTablet ? 22 : 21;

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: '#64748B',
        tabBarLabelPosition: 'below-icon',
        tabBarStyle: tabBarStyle,
        tabBarLabelStyle: styles.tabLabel,
        tabBarItemStyle: styles.tabBarItem,
      }}
    >
      <Tab.Screen
        name="DriverHome"
        component={DriverHomeScreen}
        options={{
          tabBarLabel: t('tabs.dashboard', 'Dashboard'),
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.iconPill, focused && styles.iconPillActive]}>
              <Icon name="navigation" size={iconSize} color={color} />
            </View>
          ),
        }}
      />
      <Tab.Screen
        name="DriverTrips"
        component={DriverTripsScreen}
        options={{
          tabBarLabel: t('tabs.trips', 'Trips'),
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.iconPill, focused && styles.iconPillActive]}>
              <Icon name="time" size={iconSize} color={color} />
            </View>
          ),
        }}
      />
      <Tab.Screen
        name="DriverEarnings"
        component={DriverEarningsScreen}
        options={{
          tabBarLabel: t('tabs.earnings', 'Earnings'),
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.iconPill, focused && styles.iconPillActive]}>
              <Icon name="wallet" size={iconSize} color={color} />
            </View>
          ),
        }}
      />
      <Tab.Screen
        name="DriverProfile"
        component={DriverProfileScreen}
        options={{
          tabBarLabel: t('tabs.account', 'Account'),
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.iconPill, focused && styles.iconPillActive]}>
              <Icon name="user" size={iconSize} color={color} />
            </View>
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
      <Stack.Screen name="DriverRequestList" component={DriverRequestListScreen} />
      <Stack.Screen name="DriverRequestDetails" component={DriverRequestDetailsScreen} />
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
  tabBarItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 2,
  },
  iconPill: {
    paddingHorizontal: 16,
    paddingVertical: 3,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconPillActive: {
    backgroundColor: 'rgba(23, 186, 161, 0.12)',
  },
  tabLabel: {
    ...TYPOGRAPHY.caption,
    fontWeight: '600',
    fontSize: responsiveFont(11),
    lineHeight: Math.round(responsiveFont(11) * 1.3),
    marginTop: 2,
  },
});

export default DriverNavigator;
