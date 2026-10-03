import { API_URL } from './apiUrl';
import { getAccessToken } from './storage';

/**
 * Compute the driver WebSocket URL based on API_URL or localhost
 * @param {string} token - JWT access token
 * @param {string} [customUrl] - Optional explicit WebSocket URL
 */
export const getDriverSocketUrl = (token, customUrl = null) => {
  if (customUrl) {
    if (customUrl.includes('?token=')) return customUrl;
    return `${customUrl}?token=${token}`;
  }

  let wsProto = 'ws://';
  let wsHost = '127.0.0.1:8000';

  if (API_URL) {
    if (API_URL.startsWith('https://')) {
      wsProto = 'wss://';
      wsHost = API_URL.replace('https://', '').split('/')[0];
    } else if (API_URL.startsWith('http://')) {
      wsProto = 'ws://';
      wsHost = API_URL.replace('http://', '').split('/')[0];
    }
  }

  return `${wsProto}${wsHost}/ws/driver/?token=${token}`;
};

class DriverWebSocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.isConnecting = false;
    this.reconnectTimer = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.listeners = new Set();
    this.pendingLocation = null;
    this.lastSentLocation = null;
    this.manualClose = false;
    this.token = null;
  }

  /**
   * Connect to Driver WebSocket
   * @param {string} [providedToken] - JWT access token (optional, will read from storage if omitted)
   * @param {string} [customUrl] - Optional custom URL
   */
  async connect(providedToken = null, customUrl = null) {
    if (this.socket && (this.isConnected || this.isConnecting)) {
      console.log('[DriverWS] Already connected or connecting, skipping');
      return;
    }

    this.manualClose = false;
    this.token = providedToken || (await getAccessToken());

    if (!this.token) {
      console.warn('[DriverWS] No access token available, cannot connect');
      this.emit('error', 'Authentication token missing');
      return;
    }

    const wsUrl = getDriverSocketUrl(this.token, customUrl);
    console.log(`[DriverWS] Connecting to: ${wsUrl}`);

    this.isConnecting = true;
    this.emit('connecting');

    try {
      this.socket = new WebSocket(wsUrl);

      this.socket.onopen = () => {
        console.log('[DriverWS] WebSocket connected successfully');
        this.isConnected = true;
        this.isConnecting = false;
        this.reconnectAttempts = 0;
        this.emit('open');

        // Notify server of online status over WebSocket
        try {
          this.socket.send(JSON.stringify({ type: 'online' }));
        } catch (e) {
          // ignore
        }

        // Flush pending location update if one was queued
        if (this.pendingLocation) {
          const { lat, lng } = this.pendingLocation;
          this.pendingLocation = null;
          this.sendLocation(lat, lng);
        }
      };

      this.socket.onmessage = (event) => {
        try {
          const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
          console.log('[DriverWS] Received message:', data);
          if (
            data?.type === 'error' &&
            typeof data?.detail === 'string' &&
            data.detail.toLowerCase().includes('online')
          ) {
            console.warn('[DriverWS] Backend requires driver to be online:', data.detail);
            this.emit('offline_error', data);
          }
          this.emit('message', data);
        } catch (e) {
          console.log('[DriverWS] Raw message received:', event.data);
          this.emit('message', { raw: event.data });
        }
      };

      this.socket.onerror = (error) => {
        console.warn('[DriverWS] WebSocket error:', error?.message || error);
        this.emit('error', error?.message || 'WebSocket connection error');
      };

      this.socket.onclose = (event) => {
        console.log(`[DriverWS] WebSocket closed: code=${event.code}, reason=${event.reason}`);
        this.isConnected = false;
        this.isConnecting = false;
        this.socket = null;
        this.emit('close', event);

        // Auto-reconnect unless intentionally closed
        if (!this.manualClose && this.reconnectAttempts < this.maxReconnectAttempts) {
          this.reconnectAttempts += 1;
          const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 10000);
          console.log(`[DriverWS] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
          this.reconnectTimer = setTimeout(() => {
            this.connect(this.token, customUrl);
          }, delay);
        }
      };
    } catch (err) {
      console.error('[DriverWS] Failed to initialize WebSocket:', err);
      this.isConnecting = false;
      this.isConnected = false;
      this.emit('error', err.message || 'Initialization failed');
    }
  }

  /**
   * Send live GPS location update over WebSocket
   * Payload format:
   * {
   *   "type": "location_update",
   *   "lat": 30.7046,
   *   "lng": 76.8016
   * }
   * @param {number} lat
   * @param {number} lng
   */
  sendLocation(lat, lng) {
    if (lat === undefined || lat === null || lng === undefined || lng === null) {
      console.warn('[DriverWS] Invalid lat/lng for location_update:', { lat, lng });
      return false;
    }

    const numLat = Number(lat);
    const numLng = Number(lng);

    if (isNaN(numLat) || isNaN(numLng)) {
      return false;
    }

    // Debounce rapid bursts under 1.2s while allowing periodic 2s updates
    const now = Date.now();
    if (
      this.lastSentLocation &&
      now - this.lastSentLocation.time < 1200 &&
      Math.abs(this.lastSentLocation.lat - numLat) < 0.00003 &&
      Math.abs(this.lastSentLocation.lng - numLng) < 0.00003
    ) {
      return false;
    }

    const payload = {
      type: 'location_update',
      lat: numLat,
      lng: numLng,
    };

    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      const jsonString = JSON.stringify(payload);
      this.socket.send(jsonString);
      this.lastSentLocation = { lat: numLat, lng: numLng, time: now };
      console.log('[DriverWS] Sent location update:', payload);
      this.emit('location_sent', payload);
      return true;
    }

    console.log('[DriverWS] Socket not open, buffering location update:', payload);
    this.pendingLocation = { lat: numLat, lng: numLng };

    // If disconnected and not closed manually, initiate connection
    if (!this.isConnected && !this.isConnecting && !this.manualClose) {
      this.connect();
    }

    return false;
  }

  /**
   * Send generic message over WebSocket
   * @param {Object} data
   */
  sendMessage(data) {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(data));
      return true;
    }
    console.warn('[DriverWS] Cannot send message, socket not open:', data);
    return false;
  }

  /**
   * Accept an incoming ride request:
   * {"type": "accept_ride", "ride_id": 1}
   * @param {number|string} rideId
   */
  acceptRide(rideId) {
    return this.sendMessage({
      type: 'accept_ride',
      ride_id: Number(rideId),
    });
  }

  /**
   * Reject an incoming ride request:
   * {"type": "reject_ride", "ride_id": 1}
   * @param {number|string} rideId
   */
  rejectRide(rideId) {
    return this.sendMessage({
      type: 'reject_ride',
      ride_id: Number(rideId),
    });
  }

  /**
   * Notify server driver has arrived at pickup:
   * {"type": "arrived", "ride_id": 1}
   * @param {number|string} rideId
   */
  markArrived(rideId) {
    return this.sendMessage({
      type: 'arrived',
      ride_id: Number(rideId),
    });
  }

  /**
   * Start trip with rider OTP:
   * {"type": "start_trip", "ride_id": 1, "otp": "1234"}
   * @param {number|string} rideId
   * @param {string|number} otp
   */
  startTrip(rideId, otp) {
    return this.sendMessage({
      type: 'start_trip',
      ride_id: Number(rideId),
      otp: String(otp),
    });
  }

  /**
   * Complete trip:
   * {"type": "complete_trip", "ride_id": 1}
   * @param {number|string} rideId
   * @param {Object} [extraPayload]
   */
  completeTrip(rideId, extraPayload = {}) {
    return this.sendMessage({
      type: 'complete_trip',
      ride_id: Number(rideId),
      ...extraPayload,
    });
  }

  /**
   * Cancel ride:
   * {"type": "cancel_ride", "ride_id": 1, "reason": "Vehicle issue"}
   * @param {number|string} rideId
   * @param {string} [reason]
   */
  cancelRide(rideId, reason = 'Vehicle issue') {
    return this.sendMessage({
      type: 'cancel_ride',
      ride_id: Number(rideId),
      reason: String(reason || 'Vehicle issue'),
    });
  }

  /**
   * Close WebSocket connection intentionally
   */
  disconnect() {
    console.log('[DriverWS] Disconnecting WebSocket intentionally');
    this.manualClose = true;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.socket) {
      try {
        this.socket.close(1000, 'Driver closed connection');
      } catch (e) {
        // ignore
      }
      this.socket = null;
    }
    this.isConnected = false;
    this.isConnecting = false;
    this.reconnectAttempts = 0;
    this.lastSentLocation = null;
    this.emit('close', { code: 1000, reason: 'Manual disconnect' });
  }

  /**
   * Subscribe to WebSocket events
   * @param {Function} listener - (event, payload) => void
   * @returns {Function} unsubscribe function
   */
  addListener(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  emit(event, payload) {
    this.listeners.forEach((listener) => {
      try {
        listener(event, payload);
      } catch (e) {
        console.error('[DriverWS] Listener error:', e);
      }
    });
  }
}

export const driverWebSocket = new DriverWebSocketService();
export default driverWebSocket;
