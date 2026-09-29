import { Platform, PermissionsAndroid } from 'react-native';
import Geolocation from 'react-native-geolocation-service';

/**
 * Request Location Permissions for iOS and Android
 */
export const requestLocationPermission = async () => {
  try {
    if (Platform.OS === 'ios') {
      const auth = await Geolocation.requestAuthorization('whenInUse');
      return auth === 'granted';
    }

    if (Platform.OS === 'android') {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        {
          title: 'Location Permission',
          message: 'Moto Taxi requires your location to show your position and book nearby rides.',
          buttonNeutral: 'Ask Later',
          buttonNegative: 'Cancel',
          buttonPositive: 'Allow',
        }
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    }

    return true;
  } catch (error) {
    console.warn('[Location] Permission request failed:', error);
    return false;
  }
};

/**
 * Get single current GPS location
 * @param {Object} options
 * @returns {Promise<{latitude: number, longitude: number, heading: number}>}
 */
export const getCurrentLocation = async (options = {}) => {
  const hasPermission = await requestLocationPermission();
  if (!hasPermission) {
    throw new Error('Location permission denied');
  }

  return new Promise((resolve, reject) => {
    Geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude, heading = 0, accuracy } = position.coords;
        console.log(`[Location] Current GPS: lat ${latitude}, lng ${longitude} (acc: ${accuracy}m)`);
        resolve({
          latitude,
          longitude,
          heading,
          accuracy,
        });
      },
      (error) => {
        console.warn('[Location] Error getting current position:', error);
        reject(error);
      },
      {
        enableHighAccuracy: true,
        timeout: 20000,
        maximumAge: 10000,
        ...options,
      }
    );
  });
};

/**
 * Watch continuous location updates as the user moves
 * @param {(coords: {latitude: number, longitude: number, heading: number}) => void} onUpdate
 * @param {(err: any) => void} onError
 * @param {Object} options
 * @returns {Promise<number | null>} watchId (pass to clearLocationWatch)
 */
export const watchLocation = async (onUpdate, onError, options = {}) => {
  const hasPermission = await requestLocationPermission();
  if (!hasPermission) {
    if (onError) onError(new Error('Location permission denied'));
    return null;
  }

  const watchId = Geolocation.watchPosition(
    (position) => {
      const { latitude, longitude, heading = 0, accuracy } = position.coords;
      onUpdate({
        latitude,
        longitude,
        heading,
        accuracy,
      });
    },
    (error) => {
      console.warn('[Location] Watch position error:', error);
      if (onError) onError(error);
    },
    {
      enableHighAccuracy: true,
      distanceFilter: 10, // Updates every 10 meters
      interval: 10000,
      fastestInterval: 5000,
      ...options,
    }
  );

  return watchId;
};

/**
 * Stop watching location
 * @param {number} watchId
 */
export const clearLocationWatch = (watchId) => {
  if (watchId !== null && watchId !== undefined) {
    Geolocation.clearWatch(watchId);
  }
};

export default {
  requestLocationPermission,
  getCurrentLocation,
  watchLocation,
  clearLocationWatch,
};
