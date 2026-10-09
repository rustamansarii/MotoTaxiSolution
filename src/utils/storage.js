import AsyncStorage from '@react-native-async-storage/async-storage';

export const STORAGE_KEYS = {
  ACCESS_TOKEN: 'access_token',
  REFRESH_TOKEN: 'refresh_token',
  TOKEN: 'token',
  API_TOKEN: 'api_token',
  USER: 'user',
  ROLE: 'user_role',
  IS_GUEST: 'is_guest_mode',
};

/**
 * Store JWT access & refresh tokens in AsyncStorage
 * @param {Object} tokens - { access, refresh, token, api_token, role }
 */
export const saveTokens = async ({ access, refresh, token, api_token, role }) => {
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
    if (role && typeof AsyncStorage?.setItem === 'function') {
      promises.push(AsyncStorage.setItem(STORAGE_KEYS.ROLE, String(role).trim().toUpperCase()));
    }
    if (typeof AsyncStorage?.removeItem === 'function') {
      promises.push(AsyncStorage.removeItem(STORAGE_KEYS.IS_GUEST));
    }
    if (promises.length > 0) {
      await Promise.all(promises);
      console.log('[Storage] Saved tokens to AsyncStorage ("access_token", "api_token", "token")');
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
 * Save user role directly to AsyncStorage
 * @param {string} role - 'DRIVER' or 'RIDER'
 */
export const saveRole = async (role) => {
  try {
    if (role && typeof AsyncStorage?.setItem === 'function') {
      const normalizedRole = String(role).trim().toUpperCase();
      await AsyncStorage.setItem(STORAGE_KEYS.ROLE, normalizedRole);
      console.log(`[Storage] Saved role: "${normalizedRole}" to AsyncStorage ("${STORAGE_KEYS.ROLE}")`);
    }
  } catch (error) {
    console.error('Error saving role to AsyncStorage:', error);
  }
};

/**
 * Retrieve saved user role from AsyncStorage
 */
export const getRole = async () => {
  try {
    if (typeof AsyncStorage?.getItem === 'function') {
      const storedRole = await AsyncStorage.getItem(STORAGE_KEYS.ROLE);
      if (storedRole) {
        return storedRole.trim().toUpperCase();
      }
      // Fallback: check saved user object
      const user = await getUser();
      if (user?.role) {
        return String(user.role).trim().toUpperCase();
      }
    }
    return null;
  } catch (error) {
    console.error('Error getting role from AsyncStorage:', error);
    return null;
  }
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
      if (user.role) {
        await saveRole(user.role);
      }
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
 * Set or unset guest mode flag in AsyncStorage
 * @param {boolean} isGuest
 */
export const setGuestMode = async (isGuest) => {
  try {
    if (typeof AsyncStorage?.setItem === 'function') {
      if (isGuest) {
        await Promise.all([
          AsyncStorage.setItem(STORAGE_KEYS.IS_GUEST, 'true'),
          AsyncStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN),
          AsyncStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN),
          AsyncStorage.removeItem(STORAGE_KEYS.TOKEN),
          AsyncStorage.removeItem(STORAGE_KEYS.API_TOKEN),
          AsyncStorage.removeItem('apiToken'),
          AsyncStorage.removeItem(STORAGE_KEYS.USER),
        ]);
        console.log('[Storage] Guest mode enabled in AsyncStorage and cleared old user/tokens');
      } else {
        await AsyncStorage.removeItem(STORAGE_KEYS.IS_GUEST);
        console.log('[Storage] Guest mode disabled in AsyncStorage');
      }
    }
  } catch (error) {
    console.error('Error setting guest mode in AsyncStorage:', error);
  }
};

/**
 * Check if the app is currently running in guest mode
 * @returns {Promise<boolean>}
 */
export const isGuestMode = async () => {
  try {
    if (typeof AsyncStorage?.getItem === 'function') {
      const val = await AsyncStorage.getItem(STORAGE_KEYS.IS_GUEST);
      return val === 'true';
    }
    return false;
  } catch {
    return false;
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
        AsyncStorage.removeItem(STORAGE_KEYS.ROLE),
        AsyncStorage.removeItem(STORAGE_KEYS.IS_GUEST),
      ]);
      console.log('[Storage] Cleared tokens & role from AsyncStorage');
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
  saveRole,
  getRole,
  saveUser,
  getUser,
  clearTokens,
  setGuestMode,
  isGuestMode,
};

export default {
  STORAGE_KEYS,
  saveTokens,
  saveAccessToken,
  getAccessToken,
  getaccessToken,
  getRefreshToken,
  saveRole,
  getRole,
  saveUser,
  getUser,
  clearTokens,
  setGuestMode,
  isGuestMode,
  authStorage,
};

