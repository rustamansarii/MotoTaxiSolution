import axios from "axios";
import { API_URL } from "./apiUrl";
import { getAccessToken, clearTokens, isGuestMode } from "./storage";
import { resetToLogin } from "../navigation/navigationService";
import i18next from "../i18n/i18n";

/**
 * Helper to get the language parameter for APIs.
 * Defaults to 'fr' as requested (?lang=fr), or uses active i18next language if selected.
 */
export const getActiveLanguage = () => {
  try {
    const currentLang = i18next?.language;
    if (currentLang && currentLang !== "en") {
      return currentLang;
    }
  } catch {
    // fallback
  }
  return "fr";
};

/**
 * Pre-configured Axios instance for MotoTaxi API
 */
// eslint-disable-next-line import/no-named-as-default-member
export const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 30000,
  headers: {
    Accept: "application/json",
    "ngrok-skip-browser-warning": "true",
  },
});

/**
 * Helper to compute full URL including baseUrl, endpoint path, and query params
 */
export const getFullUrl = (config) => {
  if (!config?.url) return config?.baseURL || "";
  let baseAndPath = "";
  if (config.url.startsWith("http://") || config.url.startsWith("https://")) {
    baseAndPath = config.url;
  } else {
    const base = (config.baseURL || "").replace(/\/+$/, "");
    const path = config.url.replace(/^\/+/, "");
    baseAndPath = `${base}/${path}`;
  }

  // If config.params are provided as object, append them to full URL
  if (config.params && typeof config.params === "object") {
    const pairs = [];
    Object.entries(config.params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && String(v).trim() !== "") {
        pairs.push(`${encodeURIComponent(k)}=${encodeURIComponent(String(v).trim())}`);
      }
    });
    if (pairs.length > 0) {
      const qs = pairs.join("&");
      return baseAndPath.includes("?") ? `${baseAndPath}&${qs}` : `${baseAndPath}?${qs}`;
    }
  }

  return baseAndPath;
};

// Request Interceptor: Attach Sanctum/Bearer Token, Language Param & Log Request
apiClient.interceptors.request.use(
  async (config) => {
    // 1. Ensure ?lang=fr (or active language) is attached to all API requests
    const urlHasLang = typeof config.url === "string" && /[?&]lang=/.test(config.url);
    if (!urlHasLang) {
      if (typeof URLSearchParams !== "undefined" && config.params instanceof URLSearchParams) {
        if (!config.params.has("lang")) {
          config.params.append("lang", getActiveLanguage());
        }
      } else if (config.params && typeof config.params === "object") {
        if (!config.params.lang) {
          config.params.lang = getActiveLanguage();
        }
      } else if (!config.params) {
        config.params = { lang: getActiveLanguage() };
      }
    }

    try {
      const token = await getAccessToken();
      console.log("token", token);
      if (token) {
        config.headers = config.headers || {};
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (e) {
      console.warn("[API Request] Failed to retrieve auth token:", e);
    }

    // If body is FormData, ensure Content-Type is multipart/form-data
    if (config.data instanceof FormData) {
      config.headers = config.headers || {};
      config.headers["Content-Type"] = "multipart/form-data";
    }

    // Log full URL and HTTP method (suppressed if config.silent)
    if (!config.silent) {
      const method = (config.method || "GET").toUpperCase();
      const fullUrl = getFullUrl(config);
      console.log(`[API Request] Method: ${method} | URL: ${fullUrl}`);
      if (config.data && !(config.data instanceof FormData)) {
        console.log("[API Request Body]:", JSON.stringify(config.data, null, 2));
      }
    }

    return config;
  },
  (error) => Promise.reject(error)
);

let isLoggingOut = false;

const handleUnauthorized = async (config) => {
  const reqUrl = config?.url || '';
  // Don't auto-redirect if 401 is from authentication screen endpoints (e.g. login, verify-otp)
  const isAuthEndpoint =
    reqUrl.includes('auth/login') ||
    reqUrl.includes('auth/register') ||
    reqUrl.includes('auth/otp') ||
    reqUrl.includes('auth/country-codes');

  if (isAuthEndpoint) {
    return;
  }

  // If in guest mode, do NOT reset navigation to Login screen
  try {
    const isGuest = await isGuestMode();
    if (isGuest) {
      console.warn('[API 401] In Guest Mode: Suppressing redirect to Login for URL:', reqUrl);
      return;
    }
  } catch (e) {
    // ignore
  }

  // If request had no auth token or there's no token in storage, do NOT reset navigation
  try {
    const token = await getAccessToken();
    const hadAuthHeader = Boolean(config?.headers?.Authorization);
    if (!token && !hadAuthHeader) {
      console.warn('[API 401] Request had no auth token in storage: Suppressing redirect to Login for URL:', reqUrl);
      return;
    }
  } catch (e) {
    // ignore
  }

  if (isLoggingOut) return;
  isLoggingOut = true;

  try {
    console.warn('[API 401] Unauthorized: removing token and resetting navigation to Login...');
    await clearTokens();

    try {
      const { store } = require('../redux/app/store');
      store?.dispatch?.({ type: 'auth/logout' });
    } catch {
      // ignore
    }

    resetToLogin();
  } catch (err) {
    console.error('[API 401] Error during logout/reset:', err);
  } finally {
    setTimeout(() => {
      isLoggingOut = false;
    }, 2000);
  }
};

// Response Interceptor: Extract data and normalize errors
apiClient.interceptors.response.use(
  (response) => {
    if (!response.config?.silent) {
      const method = (response.config?.method || "GET").toUpperCase();
      const fullUrl = getFullUrl(response.config);
      console.log(`[API Success] Method: ${method} | URL: ${fullUrl} | Status: ${response.status}`);
      console.log("[API Response Data]:", JSON.stringify(response.data, null, 2));
    }
    return response.data;
  },
  async (error) => {
    console.log("error:-",error?.response?.status)
    if (!error.config?.silent) {
      const method = (error.config?.method || "GET").toUpperCase();
      const fullUrl = getFullUrl(error.config);
      console.log(`[API Error] Method: ${method} | URL: ${fullUrl} | Status: ${error.response?.status || "Network Error"}`);
      console.log("error:-", error);
      if (error.response?.data) {
        console.log("[API Error Response Data]:", JSON.stringify(error.response.data, null, 2));
      }
    }

    // Check for 401 Unauthorized
    if (error.response && error.response.status === 401) {
      console.warn("API 401 Unauthorized: token may be expired or invalid.");
      await handleUnauthorized(error.config);
    }

    // Extract helpful error message from response
    const message =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      "An unexpected network error occurred.";

    const customError = new Error(message);
    customError.status = error.response?.status;
    customError.data = error.response?.data;
    customError.errors = error.response?.data?.errors;

    return Promise.reject(customError);
  }
);

/**
 * Main unified API caller function
 * 
 * Usage:
 *   const data = await apiCall({ method: 'GET', url: 'drivers/profile/' });
 *   const data = await apiCall({ method: 'POST', url: 'auth/login/', data: { mobile, password } });
 */
export const apiCall = async ({
  method = "GET",
  url,
  data = null,
  params = null,
  headers = {},
  silent = false,
  ...rest
}) => {
  return apiClient({
    method,
    url,
    data,
    params,
    headers,
    silent,
    ...rest,
  });
};

// Shorthand helpers
export const apiGet = (url, params = null, config = {}) =>
  apiCall({ method: "GET", url, params, ...config });

export const apiPost = (url, data = null, config = {}) =>
  apiCall({ method: "POST", url, data, ...config });

export const apiPut = (url, data = null, config = {}) =>
  apiCall({ method: "PUT", url, data, ...config });

export const apiPatch = (url, data = null, config = {}) =>
  apiCall({ method: "PATCH", url, data, ...config });

export const apiDelete = (url, config = {}) =>
  apiCall({ method: "DELETE", url, ...config });

export default apiClient;
