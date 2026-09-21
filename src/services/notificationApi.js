import AsyncStorage from "@react-native-async-storage/async-storage";

// Replace with your actual base URL or environment variable
export const BASE_URL = "https://your-api-domain.com/api";

/**
 * Helper to get Bearer token from local storage and return request headers
 */
const getAuthHeaders = async () => {
  try {
    const token = await AsyncStorage.getItem("token");
    return {
      Accept: "application/json",
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  } catch (error) {
    console.error("Error getting auth token:", error);
    return {
      Accept: "application/json",
      "Content-Type": "application/json",
    };
  }
};

/**
 * 1. List Notifications (Paginated)
 * GET /notifications?page={page}
 * Returns: { success: boolean, items: Array, currentPage: number, lastPage: number, hasMore: boolean }
 */
export const listNotifications = async (page = 1) => {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${BASE_URL}/notifications?page=${page}`, {
      method: "GET",
      headers,
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch notifications: ${response.status}`);
    }

    const result = await response.json();

    // Standard Laravel paginator structure: result.data.data or result.data
    const items = Array.isArray(result?.data?.data)
      ? result.data.data
      : Array.isArray(result?.data)
      ? result.data
      : [];

    const currentPage = result?.data?.current_page || page;
    const lastPage = result?.data?.last_page || 1;
    const hasMore = currentPage < lastPage;

    return {
      success: true,
      items,
      currentPage,
      lastPage,
      hasMore,
      raw: result,
    };
  } catch (error) {
    console.error("listNotifications error:", error);
    return {
      success: false,
      items: [],
      currentPage: page,
      lastPage: 1,
      hasMore: false,
      error: error.message,
    };
  }
};

/**
 * 2. Get Unread Count for Badge
 * GET /notifications/unread-count
 * Returns: { success: boolean, unread: number }
 */
export const getUnreadCount = async () => {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${BASE_URL}/notifications/unread-count`, {
      method: "GET",
      headers,
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch unread count: ${response.status}`);
    }

    const result = await response.json();
    const unread = result?.data?.unread ?? 0;

    return {
      success: true,
      unread,
      raw: result,
    };
  } catch (error) {
    console.error("getUnreadCount error:", error);
    return {
      success: false,
      unread: 0,
      error: error.message,
    };
  }
};

/**
 * 3. Mark a Single Notification As Read
 * POST /notifications/{notificationId}/read
 * Call when user taps the notification, then navigate.
 */
export const markNotificationAsRead = async (notificationId) => {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${BASE_URL}/notifications/${notificationId}/read`, {
      method: "POST",
      headers,
    });

    if (!response.ok) {
      throw new Error(`Failed to mark notification read: ${response.status}`);
    }

    const result = await response.json();
    return {
      success: true,
      raw: result,
    };
  } catch (error) {
    console.error(`markNotificationAsRead error for ID ${notificationId}:`, error);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * 4. Mark All Notifications As Read
 * POST /notifications/read-all
 * Clears every unread notification for the current user in one call.
 */
export const markAllNotificationsAsRead = async () => {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${BASE_URL}/notifications/read-all`, {
      method: "POST",
      headers,
    });

    if (!response.ok) {
      throw new Error(`Failed to mark all notifications read: ${response.status}`);
    }

    const result = await response.json();
    return {
      success: true,
      raw: result,
    };
  } catch (error) {
    console.error("markAllNotificationsAsRead error:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};
