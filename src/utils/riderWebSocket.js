import { API_URL } from './apiUrl';
import { getAccessToken } from './storage';

/**
 * Compute the rider WebSocket URL based on API_URL or localhost
 * @param {string} token - JWT access token
 * @param {string} [customUrl] - Optional explicit WebSocket URL
 */
export const getRiderSocketUrl = (token, customUrl = null) => {
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

  return `${wsProto}${wsHost}/ws/rider/?token=${token}`;
};

class RiderWebSocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.isConnecting = false;
    this.reconnectTimer = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.listeners = new Set();
    this.manualClose = false;
    this.token = null;
  }

  /**
   * Connect to Rider WebSocket (ws/rider/?token=...)
   * @param {string} [providedToken] - JWT access token (optional, reads from storage if omitted)
   * @param {string} [customUrl] - Optional custom URL
   */
  async connect(providedToken = null, customUrl = null) {
    if (this.socket && (this.isConnected || this.isConnecting)) {
      console.log('[RiderWS] Already connected or connecting, skipping');
      return;
    }

    this.manualClose = false;
    this.token = providedToken || (await getAccessToken());

    if (!this.token) {
      console.warn('[RiderWS] ⚠️ No access token available, cannot connect');
      this.emit('error', 'Authentication token missing');
      return;
    }

    const wsUrl = getRiderSocketUrl(this.token, customUrl);
    console.log(`[RiderWS] 🚀 Connecting to: ${wsUrl}`);

    this.isConnecting = true;
    this.emit('connecting');

    try {
      this.socket = new WebSocket(wsUrl);

      this.socket.onopen = () => {
        console.log(`[RiderWS] 🟢 WebSocket CONNECTED successfully to: ${wsUrl}`);
        this.isConnected = true;
        this.isConnecting = false;
        this.reconnectAttempts = 0;
        this.emit('open');
      };

      this.socket.onmessage = (event) => {
        try {
          const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
          console.log('[RiderWS] 📥 RECEIVED MESSAGE:', JSON.stringify(data, null, 2));
          this.emit('message', data);
        } catch (e) {
          console.log('[RiderWS] 📥 RAW MESSAGE RECEIVED:', event.data);
          this.emit('message', { raw: event.data });
        }
      };

      this.socket.onerror = (error) => {
        console.warn('[RiderWS] ❌ WebSocket ERROR:', error?.message || error);
        this.emit('error', error?.message || 'WebSocket connection error');
      };

      this.socket.onclose = (event) => {
        console.log(`[RiderWS] 🔴 WebSocket CLOSED: code=${event.code}, reason="${event.reason || 'None'}"`);
        this.isConnected = false;
        this.isConnecting = false;
        this.socket = null;
        this.emit('close', event);

        // Auto-reconnect unless intentionally closed
        if (!this.manualClose && this.reconnectAttempts < this.maxReconnectAttempts) {
          this.reconnectAttempts += 1;
          const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 10000);
          console.log(`[RiderWS] ⏳ Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
          this.reconnectTimer = setTimeout(() => {
            this.connect(this.token, customUrl);
          }, delay);
        }
      };
    } catch (err) {
      console.error('[RiderWS] ❌ Failed to initialize WebSocket:', err);
      this.isConnecting = false;
      this.isConnected = false;
      this.emit('error', err.message || 'Initialization failed');
    }
  }

  /**
   * Send generic message over WebSocket
   * @param {Object} data
   */
  sendMessage(data) {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      const payload = typeof data === 'string' ? data : JSON.stringify(data);
      this.socket.send(payload);
      console.log('[RiderWS] 📤 SENT MESSAGE:', JSON.stringify(data, null, 2));
      return true;
    }
    console.warn('[RiderWS] ⚠️ Cannot send message, socket not open:', data);
    return false;
  }

  /**
   * Cancel ride:
   * {"type": "cancel_ride", "ride_id": 1, "reason": "Changed my mind"}
   * @param {number|string} rideId
   * @param {string} [reason]
   */
  cancelRide(rideId, reason = 'Changed my mind') {
    console.log(`[RiderWS] 🛑 Cancelling ride ID: ${rideId} (Reason: ${reason})`);
    return this.sendMessage({
      type: 'cancel_ride',
      ride_id: Number(rideId),
      reason: String(reason || 'Changed my mind'),
    });
  }

  /**
   * Close WebSocket connection intentionally
   */
  disconnect() {
    console.log('[RiderWS] 🔌 Disconnecting WebSocket intentionally');
    this.manualClose = true;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.socket) {
      try {
        this.socket.close(1000, 'Rider closed connection');
      } catch (e) {
        // ignore
      }
      this.socket = null;
    }
    this.isConnected = false;
    this.isConnecting = false;
    this.reconnectAttempts = 0;
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
        console.error('[RiderWS] Listener error:', e);
      }
    });
  }
}

export const riderWebSocket = new RiderWebSocketService();
export default riderWebSocket;
