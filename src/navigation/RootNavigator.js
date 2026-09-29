import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// Auth & Onboarding Screens
import SplashScreen from '../screens/auth/SplashScreen';
import WelcomeScreen from '../screens/auth/WelcomeScreen';
import RoleSelectionScreen from '../screens/auth/RoleSelectionScreen';
import LoginScreen from '../screens/auth/LoginScreen';
import OTPScreen from '../screens/auth/OTPScreen';
import ProfileSetupScreen from '../screens/auth/ProfileSetupScreen';
import RiderSignupScreen from '../screens/auth/RiderSignupScreen';
import DriverSignupScreen from '../screens/auth/DriverSignupScreen';

// Driver Onboarding Screens
import DriverWelcomeScreen from '../screens/driver/DriverWelcomeScreen';
import DriverLoginScreen from '../screens/driver/DriverLoginScreen';
import DriverOTPScreen from '../screens/driver/DriverOTPScreen';
import DriverProfileSetupScreen from '../screens/driver/DriverProfileSetupScreen';
import DriverLicenseCheckScreen from '../screens/driver/DriverLicenseCheckScreen';
import VehicleSetupScreen from '../screens/driver/VehicleSetupScreen';
import DocumentUploadScreen from '../screens/driver/DocumentUploadScreen';
import VehicleDocumentBulkUploadScreen from '../screens/driver/VehicleDocumentBulkUploadScreen';

// Main Flow Navigators
import RiderNavigator from './RiderNavigator';
import DriverNavigator from './DriverNavigator';

const Stack = createNativeStackNavigator();

export const RootNavigator = () => {
  return (
    <Stack.Navigator
      initialRouteName="Splash"
      screenOptions={{
        headerShown: false,
        animation: 'fade',
      }}
    >
      {/* Launch & Role Selection */}
      <Stack.Screen name="Splash" component={SplashScreen} />
      {/* <Stack.Screen name="Welcome" component={WelcomeScreen} /> */}
      <Stack.Screen name="RoleSelection" component={RoleSelectionScreen} />

      {/* Auth */}
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="RiderSignup" component={RiderSignupScreen} />
      <Stack.Screen name="DriverSignup" component={DriverSignupScreen} />
      <Stack.Screen name="OTP" component={OTPScreen} />
      <Stack.Screen name="ProfileSetup" component={ProfileSetupScreen} />

      {/* Driver Onboarding */}
      <Stack.Screen name="DriverWelcome" component={DriverWelcomeScreen} />
      <Stack.Screen name="DriverLogin" component={DriverLoginScreen} />
      <Stack.Screen name="DriverOTP" component={DriverOTPScreen} />
      <Stack.Screen name="DriverProfileSetup" component={DriverProfileSetupScreen} />
      <Stack.Screen name="DriverLicenseCheck" component={DriverLicenseCheckScreen} />
      <Stack.Screen name="VehicleSetup" component={VehicleSetupScreen} />
      <Stack.Screen name="DocumentUpload" component={DocumentUploadScreen} />
      <Stack.Screen name="VehicleDocumentBulkUpload" component={VehicleDocumentBulkUploadScreen} />

      {/* Core Role Navigators */}
      <Stack.Screen name="RiderNav" component={RiderNavigator} />
      <Stack.Screen name="DriverNav" component={DriverNavigator} />
    </Stack.Navigator>
  );
};

export default RootNavigator;
