import axios from "axios";
import { API_URL } from "./apiUrl";
import { getAccessToken } from "./storage";

/**
 * Pre-configured Axios instance for MotoTaxi API
 */
// eslint-disable-next-line import/no-named-as-default-member
export const apiClient = axios.create({
  baseURL: API_URL || "https://af94-2405-201-5020-c056-808d-9efb-cb84-1c67.ngrok-free.app/api/v1/",
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

// Request Interceptor: Attach Sanctum/Bearer Token & Log Request
apiClient.interceptors.request.use(
  async (config) => {
    try {
      const token = await getAccessToken();
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
