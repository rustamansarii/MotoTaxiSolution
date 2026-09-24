import AsyncStorage from '@react-native-async-storage/async-storage';

export const STORAGE_KEYS = {
  ACCESS_TOKEN: 'access_token',
  REFRESH_TOKEN: 'refresh_token',
  TOKEN: 'token',
  API_TOKEN: 'api_token',
  USER: 'user',
};

/**
 * Store JWT access & refresh tokens in AsyncStorage
 * @param {Object} tokens - { access, refresh, token, api_token }
 */
export const saveTokens = async ({ access, refresh, token, api_token }) => {
  try {
    const accessToken = access || token || api_token;
    const promises = [];
    if (accessToken && typeof AsyncStorage?.setItem === 'function') {
      promises.push(AsyncStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, accessToken));
      promises.push(AsyncStorage.setItem(STORAGE_KEYS.TOKEN, accessToken));
      promises.push(AsyncStorage.setItem(STORAGE_KEYS.API_TOKEN, accessToken));
      promises.push(AsyncStorage.setItem('apiToken', accessToken));
    }
    if (refresh && typeof AsyncStorage?.setItem === 'function') {
      promises.push(AsyncStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refresh));
    }
    if (promises.length > 0) {
      await Promise.all(promises);
      console.log('[Storage] Saved access token to AsyncStorage ("access_token", "api_token", "token")');
    }
  } catch (error) {
    console.error('Error saving tokens to AsyncStorage:', error);
  }
};

/**
 * Store access token directly in AsyncStorage
 * @param {string} accessToken
 */
export const saveAccessToken = async (accessToken) => {
  return saveTokens({ access: accessToken });
};

/**
 * Retrieve the current access token for authenticated API calls
 */
export const getAccessToken = async () => {
  try {
    if (typeof AsyncStorage?.getItem === 'function') {
      let token = await AsyncStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
      if (token) return token;
      token = await AsyncStorage.getItem(STORAGE_KEYS.TOKEN);
      if (token) return token;
      token = await AsyncStorage.getItem(STORAGE_KEYS.API_TOKEN);
      if (token) return token;
      return await AsyncStorage.getItem('apiToken');
    }
    return null;
  } catch (error) {
    console.error('Error getting access token:', error);
    return null;
  }
};

export const getaccessToken = getAccessToken;

/**
 * Retrieve the refresh token
 */
export const getRefreshToken = async () => {
  try {
    if (typeof AsyncStorage?.getItem === 'function') {
      return await AsyncStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
    }
    return null;
  } catch (error) {
    console.error('Error getting refresh token:', error);
    return null;
  }
};

/**
 * Save user profile info
 */
export const saveUser = async (user) => {
  try {
    if (user && typeof AsyncStorage?.setItem === 'function') {
      await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
    }
  } catch (error) {
    console.error('Error saving user to AsyncStorage:', error);
  }
};

/**
 * Retrieve saved user
 */
export const getUser = async () => {
  try {
    if (typeof AsyncStorage?.getItem === 'function') {
      const raw = await AsyncStorage.getItem(STORAGE_KEYS.USER);
      return raw ? JSON.parse(raw) : null;
    }
    return null;
  } catch (error) {
    console.error('Error getting user from AsyncStorage:', error);
    return null;
  }
};

/**
 * Clear all auth data on logout
 */
export const clearTokens = async () => {
  try {
    if (typeof AsyncStorage?.removeItem === 'function') {
      await Promise.all([
        AsyncStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN),
        AsyncStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN),
        AsyncStorage.removeItem(STORAGE_KEYS.TOKEN),
        AsyncStorage.removeItem(STORAGE_KEYS.API_TOKEN),
        AsyncStorage.removeItem('apiToken'),
        AsyncStorage.removeItem(STORAGE_KEYS.USER),
      ]);
      console.log('[Storage] Cleared tokens from AsyncStorage');
    }
  } catch (error) {
    console.error('Error clearing tokens from AsyncStorage:', error);
  }
};

export const authStorage = {
  getToken: getAccessToken,
  getAccessToken,
  getaccessToken,
  saveTokens,
  saveAccessToken,
  getRefreshToken,
  saveUser,
  getUser,
  clearTokens,
};

export default {
  STORAGE_KEYS,
  saveTokens,
  getAccessToken,
  getaccessToken,
  getRefreshToken,
  saveUser,
  getUser,
  clearTokens,
  authStorage,
};

