import { Platform, PermissionsAndroid, NativeModules, TurboModuleRegistry } from 'react-native';

/**
 * Check if the native ImagePicker TurboModule / NativeModule is actually linked in the running binary.
 */
export const isImagePickerAvailable = () => {
  try {
    if (typeof global !== 'undefined' && global.__turboModuleProxy) {
      const turboModule = TurboModuleRegistry?.get?.('ImagePicker');
      if (turboModule && typeof turboModule.launchImageLibrary === 'function') {
        return true;
      }
    }
    if (
      NativeModules?.ImagePicker &&
      typeof NativeModules.ImagePicker.launchImageLibrary === 'function'
    ) {
      return true;
    }
    if (
      NativeModules?.ImagePickerManager &&
      typeof NativeModules.ImagePickerManager.launchImageLibrary === 'function'
    ) {
      return true;
    }
    return false;
  } catch (e) {
    return false;
  }
};

/**
 * Request camera permission on Android devices
 */
export const requestCameraPermission = async () => {
  if (Platform.OS !== 'android') return true;
  try {
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.CAMERA,
      {
        title: 'Camera Permission',
        message: 'Moto Taxi needs access to your camera to capture document photos.',
        buttonPositive: 'Allow',
        buttonNegative: 'Deny',
      }
    );
    return granted === PermissionsAndroid.RESULTS.GRANTED;
  } catch (err) {
    console.warn('Camera permission request error:', err);
    return false;
  }
};

const DEFAULT_OPTIONS = {
  mediaType: 'photo',
  quality: 0.85,
  maxWidth: 1600,
  maxHeight: 1600,
  includeBase64: false,
  saveToPhotos: false,
};

/**
 * Open native phone gallery to select an image.
 * Safely handles environments where the native module is not yet recompiled into the APK.
 */
export const pickFromGallery = async (customOptions = {}) => {
  if (!isImagePickerAvailable()) {
    return {
      success: false,
      isNativeUnavailable: true,
      error:
        'Native image picker is not linked in your running app build. Please rebuild the app (npx react-native run-android).',
    };
  }

  try {
    const { launchImageLibrary } = require('react-native-image-picker');
    const options = { ...DEFAULT_OPTIONS, ...customOptions };
    const result = await launchImageLibrary(options);

    if (result.didCancel) {
      return { success: false, didCancel: true };
    }

    if (result.errorCode) {
      return {
        success: false,
        error: result.errorMessage || 'Failed to select image from gallery',
      };
    }

    const asset = result.assets?.[0];
    if (asset && asset.uri) {
      const fileName =
        asset.fileName ||
        `document_${Date.now()}.${asset.type?.split('/')?.[1] || 'jpg'}`;

      return {
        success: true,
        uri: asset.uri,
        name: fileName,
        type: asset.type || 'image/jpeg',
        fileSize: asset.fileSize,
      };
    }

    return { success: false, error: 'No image selected' };
  } catch (error) {
    const msg = error?.message || '';
    const isMissing =
      msg.includes('launchImageLibrary') ||
      msg.includes('null') ||
      msg.includes('undefined') ||
      msg.includes('NativeImagePicker');

    if (isMissing) {
      return {
        success: false,
        isNativeUnavailable: true,
        error:
          'Native image picker is not linked in your running app build. Please rebuild the app (npx react-native run-android).',
      };
    }
    return { success: false, error: msg || 'Gallery error' };
  }
};

/**
 * Launch device camera to capture a new document photo.
 * Safely handles environments where the native module is not yet recompiled into the APK.
 */
export const captureFromCamera = async (customOptions = {}) => {
  try {
    const hasPermission = await requestCameraPermission();
    if (!hasPermission) {
      return {
        success: false,
        error: 'Camera permission denied. Please allow camera access in Settings.',
      };
    }

    if (!isImagePickerAvailable()) {
      return {
        success: false,
        isNativeUnavailable: true,
        error:
          'Native camera module is not linked in your running app build. Please rebuild the app (npx react-native run-android).',
      };
    }

    const { launchCamera } = require('react-native-image-picker');
    const options = { ...DEFAULT_OPTIONS, ...customOptions };
    const result = await launchCamera(options);

    if (result.didCancel) {
      return { success: false, didCancel: true };
    }

    if (result.errorCode) {
      return {
        success: false,
        error: result.errorMessage || 'Failed to capture photo with camera',
      };
    }

    const asset = result.assets?.[0];
    if (asset && asset.uri) {
      const fileName =
        asset.fileName ||
        `camera_${Date.now()}.${asset.type?.split('/')?.[1] || 'jpg'}`;

      return {
        success: true,
        uri: asset.uri,
        name: fileName,
        type: asset.type || 'image/jpeg',
        fileSize: asset.fileSize,
      };
    }

    return { success: false, error: 'No photo captured' };
  } catch (error) {
    const msg = error?.message || '';
    const isMissing =
      msg.includes('launchCamera') ||
      msg.includes('null') ||
      msg.includes('undefined') ||
      msg.includes('NativeImagePicker');

    if (isMissing) {
      return {
        success: false,
        isNativeUnavailable: true,
        error:
          'Native camera module is not linked in your running app build. Please rebuild the app (npx react-native run-android).',
      };
    }
    return { success: false, error: msg || 'Camera error' };
  }
};

export default {
  pickFromGallery,
  captureFromCamera,
  requestCameraPermission,
  isImagePickerAvailable,
};
