import React, { useRef, useEffect } from 'react';
import { StatusBar, Animated, View, Platform } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { navigationRef } from './src/navigation/navigationService';
import RootNavigator from './src/navigation/RootNavigator';
import './src/i18n/i18n';
import { Provider, useDispatch, useSelector } from 'react-redux';
import { store } from './src/redux/app/store';
import { AppProvider } from './src/context/AppContext';
import { PopupProvider } from './src/context/PopupContext';
import { KeyboardProvider, CustomKeyboard, useKeyboard } from './src/components/keyboard';
import SpInAppUpdates, { IAUUpdateKind } from 'sp-react-native-in-app-updates';
import { connectRiderWebSocket } from './src/redux/features/rider/riderSlice';
import { setCurrentCoords } from './src/redux/features/location/locationSlice';
import {
  getCurrentLocation,
  watchLocation,
  clearLocationWatch,
} from './src/utils/locationService';

// Set isDebug to __DEV__ to enable logs in development environment
const inAppUpdates = new SpInAppUpdates(__DEV__);

function AppNavigationContent(): React.JSX.Element {
  const dispatch = useDispatch();
  const authRole = useSelector((state: any) => state.auth?.role);
  const { keyboardVisible, keyboardHeight } = useKeyboard();
  const bottomOffsetAnim = useRef(new Animated.Value(0)).current;

  // Connect Rider WebSocket on app open only if not driver
  useEffect(() => {
    if (authRole !== 'DRIVER') {
      dispatch(connectRiderWebSocket() as any);
    }
  }, [dispatch, authRole]);

  // Fetch real GPS location on mount
  useEffect(() => {
    let watchId: number | null = null;

    const fetchGps = async () => {
      try {
        const loc = await getCurrentLocation();
        if (loc?.latitude && loc?.longitude) {
          dispatch(setCurrentCoords({ latitude: loc.latitude, longitude: loc.longitude }));
        }
      } catch (err) {
        console.warn('[App] Initial GPS failed:', err);
      }

      watchId = await watchLocation(
        (loc: any) => {
          if (loc?.latitude && loc?.longitude) {
            dispatch(setCurrentCoords({ latitude: loc.latitude, longitude: loc.longitude }));
          }
        },
        (err: any) => console.warn('[App] Location watch error:', err)
      );
    };

    fetchGps();

    return () => {
      if (watchId !== null) {
        clearLocationWatch(watchId);
      }
    };
  }, [dispatch]);

  useEffect(() => {
    Animated.timing(bottomOffsetAnim, {
      toValue: keyboardVisible ? keyboardHeight : 0,
      duration: 250,
      useNativeDriver: false,
    }).start();
  }, [keyboardVisible, keyboardHeight, bottomOffsetAnim]);

  return (
    <View style={{ flex: 1 }}>
      <Animated.View style={{ flex: 1, marginBottom: bottomOffsetAnim }}>
        <NavigationContainer ref={navigationRef}>
          <RootNavigator />
        </NavigationContainer>
      </Animated.View>
      <CustomKeyboard />
    </View>
  );
}

function App(): React.JSX.Element {
  useEffect(() => {
    checkForUpdates();
  }, []);

  const checkForUpdates = async () => {
    try {
      const result = await inAppUpdates.checkNeedsUpdate();
      console.log('Update Result:', result);

      if (result?.shouldUpdate) {
        if (Platform.OS === 'android') {
          await inAppUpdates.startUpdate({
            updateType: IAUUpdateKind.IMMEDIATE,
          });
        } else {
          // Provide customized alert options for iOS
          await inAppUpdates.startUpdate({
            title: 'Update Available',
            message:
              'A new version of the app is available. Please update to get the latest features and improvements.',
            buttonUpgradeText: 'Update Now',
            buttonCancelText: 'Later',
          });
        }
      }
    } catch (error) {
      console.log('Update Error:', error);
    }
  };

  return (
    <Provider store={store}>
      <SafeAreaView style={{ flex: 1 }}>
        <SafeAreaProvider>
          <StatusBar barStyle="light-content" />
          <AppProvider>
            <PopupProvider>
              <KeyboardProvider>
                <AppNavigationContent />
              </KeyboardProvider>
            </PopupProvider>
          </AppProvider>
        </SafeAreaProvider>
      </SafeAreaView>
    </Provider>
  );
}

export default App;
