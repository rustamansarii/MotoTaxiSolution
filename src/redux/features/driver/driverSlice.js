import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { apiPost } from '../../../utils/apiClient';
import ApiConstant from '../../../utils/apiConstant';
import { getAccessToken } from '../../../utils/storage';
import { driverWebSocket } from '../../../utils/driverWebSocket';

// Initial default Punjab/Chandigarh coordinate
const DEFAULT_COORDINATES = {
  lat: 30.7046,
  lng: 76.8016,
};

const initialState = {
  isOnline: true,
  onlineLoading: false,
  onlineError: null,

  // WebSocket Connection
  socketConnected: false,
  socketConnecting: false,
  socketError: null,

  // GPS Location
  currentLocation: DEFAULT_COORDINATES,
  lastLocationSent: null, // { lat, lng, timestamp }
  lastLocationAck: null, // { lat, lng, timestamp }

  // Ride State
  // 'idle' | 'requested' | 'accepted' | 'arrived' | 'in_progress' | 'completed' | 'cancelled'
  rideStatus: 'idle',
  incomingRideRequest: null, // {"type": "ride_request", "ride_id": .., "vehicle_type": .., "pickup_address": .., "pickup_lat": .., "pickup_lon": .., "drop_address": .., "distance_km": .., "driver_payout": .., "currency": ..}
  activeRide: null, // Currently active ride object
  completedRide: null, // Completed ride payload

  // Action status and notices
  actionLoading: false,
  actionError: null,
  actionSuccessNotice: null,
  rideTakenNotice: null, // {"type": "ride_taken", "ride_id": ..}
  rideCancelledNotice: null, // {"type": "ride_cancelled", "ride_id": .., "cancelled_by": "RIDER"}

  socketMessages: [],
  lastMessage: null,
};

// ----------------------------------------------------
// HTTP Async Thunks
// ----------------------------------------------------

/**
 * Call API: POST /api/v1/drivers/go-online/
 * Automatically connects the driver WebSocket upon going online
 */
export const driverGoOnline = createAsyncThunk(
  'driver/goOnline',
  async (locationData, { dispatch, rejectWithValue }) => {
    try {
      console.log('[DriverAPI] Calling go-online endpoint with location:', locationData);
      const payload = locationData
        ? {
            latitude: locationData.lat ?? locationData.latitude,
            longitude: locationData.lng ?? locationData.longitude,
            lat: locationData.lat ?? locationData.latitude,
            lng: locationData.lng ?? locationData.longitude,
          }
        : {};
      const response = await apiPost(ApiConstant.DriverGoOnline, payload);
      console.log('[DriverAPI] Go-online success:', response);

      // Connect WebSocket when going online
      dispatch(connectDriverWebSocket());

      return response?.data || response || { success: true };
    } catch (error) {
      const errorMsg =
        error?.data?.message ||
        error?.data?.detail ||
        error?.message ||
        'Failed to go online';
      console.warn('[DriverAPI] Go-online error:', errorMsg);
      // Still connect WebSocket so socket retry is attempted
      dispatch(connectDriverWebSocket());
      return rejectWithValue(errorMsg);
    }
  }
);

/**
 * Call API: POST /api/v1/drivers/go-offline/
 * Automatically disconnects the driver WebSocket upon going offline
 */
export const driverGoOffline = createAsyncThunk(
  'driver/goOffline',
  async (_, { dispatch, rejectWithValue }) => {
    try {
      console.log('[DriverAPI] Calling go-offline endpoint...');
      const response = await apiPost(ApiConstant.DriverGoOffline, {});
      console.log('[DriverAPI] Go-offline success:', response);

      // Disconnect WebSocket when going offline
      dispatch(disconnectDriverWebSocket());

      return response?.data || response || { success: true };
    } catch (error) {
      const errorMsg =
        error?.data?.message ||
        error?.data?.detail ||
        error?.message ||
        'Failed to go offline';
      console.warn('[DriverAPI] Go-offline error:', errorMsg);
      return rejectWithValue(errorMsg);
    }
  }
);

// ----------------------------------------------------
// WebSocket Connection Async Thunks
// ----------------------------------------------------

let isListenerAttached = false;

/**
 * Connect to ws://<host>/ws/driver/?token=...
 */
export const connectDriverWebSocket = createAsyncThunk(
  'driver/connectWebSocket',
  async (customUrl, { dispatch, rejectWithValue }) => {
    try {
      const token = await getAccessToken();
      if (!token) {
        console.warn('[DriverWS] Cannot connect WebSocket: No access token found');
        return rejectWithValue('No auth token available');
      }

      if (!isListenerAttached) {
        driverWebSocket.addListener((event, payload) => {
          if (event === 'connecting') {
            dispatch(setSocketConnecting(true));
          } else if (event === 'open') {
            dispatch(setSocketConnected(true));
          } else if (event === 'close') {
            dispatch(setSocketConnected(false));
          } else if (event === 'error') {
            dispatch(setSocketError(payload));
          } else if (event === 'offline_error') {
            console.log('[DriverWS] Offline error received from server, auto-syncing driverGoOnline...');
            dispatch(driverGoOnline());
          } else if (event === 'message') {
            dispatch(handleIncomingSocketMessage(payload));
          } else if (event === 'location_sent') {
            dispatch(locationUpdateSent(payload));
          }
        });
        isListenerAttached = true;
      }

      await driverWebSocket.connect(token, customUrl);
      return { connected: true };
    } catch (err) {
      console.error('[DriverWS] Connection error in thunk:', err);
      return rejectWithValue(err.message || 'Failed to connect WebSocket');
    }
  }
);

/**
 * Disconnect Driver WebSocket
 */
export const disconnectDriverWebSocket = createAsyncThunk(
  'driver/disconnectWebSocket',
  async () => {
    driverWebSocket.disconnect();
    return { disconnected: true };
  }
);

// ----------------------------------------------------
// Driver -> Server Action Thunks
// ----------------------------------------------------

/**
 * Send live location update:
 * {"type": "location_update", "lat": 30.7046, "lng": 76.7179}
 */
export const sendDriverLocationUpdate = createAsyncThunk(
  'driver/sendLocationUpdate',
  async ({ lat, lng }, { dispatch }) => {
    dispatch(setCurrentLocation({ lat, lng }));
    const sent = driverWebSocket.sendLocation(lat, lng);
    return { lat, lng, sent, timestamp: Date.now() };
  }
);

/**
 * Accept ride:
 * {"type": "accept_ride", "ride_id": 1}
 */
export const driverAcceptRide = createAsyncThunk(
  'driver/acceptRide',
  async ({ rideId }) => {
    const sent = driverWebSocket.acceptRide(rideId);
    return { rideId, sent };
  }
);

/**
 * Reject ride:
 * {"type": "reject_ride", "ride_id": 1}
 */
export const driverRejectRide = createAsyncThunk(
  'driver/rejectRide',
  async ({ rideId }) => {
    const sent = driverWebSocket.rejectRide(rideId);
    return { rideId, sent };
  }
);

/**
 * Mark arrived at pickup:
 * {"type": "arrived", "ride_id": 1}
 */
export const driverMarkArrived = createAsyncThunk(
  'driver/markArrived',
  async ({ rideId }) => {
    const sent = driverWebSocket.markArrived(rideId);
    return { rideId, sent };
  }
);

/**
 * Start trip with OTP:
 * {"type": "start_trip", "ride_id": 1, "otp": "1234"}
 */
export const driverStartTrip = createAsyncThunk(
  'driver/startTrip',
  async ({ rideId, otp }) => {
    const sent = driverWebSocket.startTrip(rideId, otp);
    return { rideId, otp, sent };
  }
);

/**
 * Complete trip:
 * {"type": "complete_trip", "ride_id": 1}
 */
export const driverCompleteTrip = createAsyncThunk(
  'driver/completeTrip',
  async ({ rideId }) => {
    const sent = driverWebSocket.completeTrip(rideId);
    return { rideId, sent };
  }
);

/**
 * Cancel ride:
 * {"type": "cancel_ride", "ride_id": 1, "reason": "Vehicle issue"}
 */
export const driverCancelRide = createAsyncThunk(
  'driver/cancelRide',
  async ({ rideId, reason = 'Vehicle issue' }) => {
    const sent = driverWebSocket.cancelRide(rideId, reason);
    return { rideId, reason, sent };
  }
);

// ----------------------------------------------------
// Driver Slice
// ----------------------------------------------------

export const driverSlice = createSlice({
  name: 'driver',
  initialState,

  reducers: {
    setSocketConnecting: (state, action) => {
      state.socketConnecting = Boolean(action.payload);
      if (action.payload) {
        state.socketError = null;
      }
    },
    setSocketConnected: (state, action) => {
      state.socketConnected = Boolean(action.payload);
      state.socketConnecting = false;
      if (action.payload) {
        state.socketError = null;
      }
    },
    setSocketError: (state, action) => {
      state.socketError = action.payload;
      state.socketConnecting = false;
    },
    setCurrentLocation: (state, action) => {
      state.currentLocation = {
        lat: Number(action.payload.lat),
        lng: Number(action.payload.lng),
      };
    },
    locationUpdateSent: (state, action) => {
      state.lastLocationSent = {
        lat: Number(action.payload.lat),
        lng: Number(action.payload.lng),
        timestamp: action.payload.timestamp || Date.now(),
      };
    },
    setIsOnlineLocally: (state, action) => {
      state.isOnline = Boolean(action.payload);
    },
    clearIncomingRideRequest: (state) => {
      state.incomingRideRequest = null;
      if (state.rideStatus === 'requested') {
        state.rideStatus = 'idle';
      }
    },
    clearActionNotices: (state) => {
      state.actionError = null;
      state.actionSuccessNotice = null;
      state.rideTakenNotice = null;
      state.rideCancelledNotice = null;
    },
    resetActiveRideState: (state) => {
      state.rideStatus = 'idle';
      state.incomingRideRequest = null;
      state.activeRide = null;
      state.completedRide = null;
      state.actionError = null;
      state.actionSuccessNotice = null;
      state.rideTakenNotice = null;
      state.rideCancelledNotice = null;
    },

    // ----------------------------------------------------
    // SERVER -> DRIVER Message Router
    // ----------------------------------------------------
    handleIncomingSocketMessage: (state, action) => {
      const msg = action.payload || {};
      console.log(`[DriverSlice] 📥 Processing WebSocket message [${msg.type || 'unknown'}]:`, msg);

      switch (msg.type) {
        case 'connected':
          state.socketConnected = true;
          break;

        case 'location_ack':
          // {"type": "location_ack", "lat": .., "lng": ..}
          state.lastLocationAck = {
            lat: Number(msg.lat),
            lng: Number(msg.lng),
            timestamp: Date.now(),
          };
          if (msg.lat !== undefined && msg.lng !== undefined) {
            state.currentLocation = {
              lat: Number(msg.lat),
              lng: Number(msg.lng),
            };
          }
          break;

        case 'ride_request':
          // {"type": "ride_request", "ride_id": .., "vehicle_type": .., "pickup_address": .., "pickup_lat": .., "pickup_lon": .., "drop_address": .., "distance_km": .., "driver_payout": .., "currency": ..}
          state.incomingRideRequest = msg;
          state.rideStatus = 'requested';
          break;

        case 'ride_taken':
        case 'ride_expired':
        case 'offer_expired':
        case 'expire': {
          // {"type": "ride_taken", "ride_id": ..}
          console.log(`[DriverSlice] ⚠️ Offer unavailable [${msg.type}]:`, msg);
          const takenRideId = msg.ride_id || msg.id || msg.data?.ride_id;
          state.incomingRideRequest = null;
          state.rideTakenNotice = {
            ...msg,
            ride_id: takenRideId,
          };
          if (state.rideStatus === 'requested') {
            state.rideStatus = 'idle';
          }
          state.actionError = null;
          break;
        }

        case 'accept_success':
          // {"type": "accept_success", "ride_id": .., "detail": ".."}
          state.rideStatus = 'accepted';
          state.activeRide = {
            ...(state.activeRide || {}),
            ...(state.incomingRideRequest || {}),
            ride_id: msg.ride_id || state.incomingRideRequest?.ride_id,
          };
          state.incomingRideRequest = null;
          state.actionSuccessNotice = msg.detail || 'Ride accepted';
          state.actionError = null;
          break;

        case 'accept_failed': {
          // {"type": "accept_failed", "ride_id": .., "detail": ".."}
          console.warn('[DriverSlice] ❌ Accept failed:', msg);
          state.actionError = msg.detail || 'Failed to accept ride';
          const detailLower = String(msg.detail || '').toLowerCase();
          if (
            detailLower.includes('expired') ||
            detailLower.includes('already') ||
            detailLower.includes('not found') ||
            detailLower.includes('taken')
          ) {
            state.incomingRideRequest = null;
            if (state.rideStatus === 'requested') {
              state.rideStatus = 'idle';
            }
          }
          break;
        }

        case 'reject_success':
          // {"type": "reject_success", "ride_id": .., "detail": ".."}
          state.incomingRideRequest = null;
          state.rideStatus = 'idle';
          state.actionError = null;
          break;

        case 'reject_failed': {
          // {"type": "reject_failed", "ride_id": .., "detail": ".."}
          console.warn('[DriverSlice] ❌ Reject failed:', msg);
          // If offer was expired or already responded to, clear incoming request and reset to idle
          state.incomingRideRequest = null;
          if (state.rideStatus === 'requested') {
            state.rideStatus = 'idle';
          }
          state.actionError = null;
          break;
        }

        case 'mark_arrived_success':
          // {"type": "mark_arrived_success", "ride_id": .., "detail": ".."}
          state.rideStatus = 'arrived';
          state.actionSuccessNotice = msg.detail || 'Marked arrived';
          state.actionError = null;
          break;

        case 'mark_arrived_failed':
          // {"type": "mark_arrived_failed", "ride_id": .., "detail": ".."}
          state.actionError = msg.detail || 'Failed to mark arrived';
          break;

        case 'start_trip_success':
          // {"type": "start_trip_success", "ride_id": .., "detail": ".."}
          state.rideStatus = 'in_progress';
          state.actionSuccessNotice = msg.detail || 'Trip started';
          state.actionError = null;
          break;

        case 'start_trip_failed':
          // {"type": "start_trip_failed", "ride_id": .., "detail": ".."}
          state.actionError = msg.detail || 'Failed to start trip (invalid OTP)';
          break;

        case 'complete_trip_success':
          // {"type": "complete_trip_success", "ride_id": .., "detail": ".."}
          state.rideStatus = 'completed';
          state.completedRide = {
            ...(state.activeRide || {}),
            ride_id: msg.ride_id,
          };
          state.actionSuccessNotice = msg.detail || 'Trip completed';
          state.actionError = null;
          break;

        case 'complete_trip_failed':
          // {"type": "complete_trip_failed", "ride_id": .., "detail": ".."}
          state.actionError = msg.detail || 'Failed to complete trip';
          break;

        case 'cancel_ride_success':
          // {"type": "cancel_ride_success", "ride_id": .., "detail": ".."}
          state.rideStatus = 'cancelled';
          state.activeRide = null;
          state.actionSuccessNotice = msg.detail || 'Ride cancelled';
          state.actionError = null;
          break;

        case 'cancel_ride_failed':
          // {"type": "cancel_ride_failed", "ride_id": .., "detail": ".."}
          state.actionError = msg.detail || 'Failed to cancel ride';
          break;

        case 'ride_cancelled':
          // {"type": "ride_cancelled", "ride_id": .., "cancelled_by": "RIDER"}
          state.rideStatus = 'cancelled';
          state.rideCancelledNotice = msg;
          state.activeRide = null;
          state.incomingRideRequest = null;
          break;

        case 'error': {
          // {"type": "error", "detail": ".."}
          state.socketError = msg.detail || 'WebSocket error';
          const detailLower = String(msg.detail || '').toLowerCase();
          if (
            detailLower.includes('already') ||
            detailLower.includes('expired') ||
            detailLower.includes('not found') ||
            detailLower.includes('taken')
          ) {
            state.incomingRideRequest = null;
            if (state.rideStatus === 'requested') {
              state.rideStatus = 'idle';
            }
          }
          break;
        }

        default:
          break;
      }
    },
  },

  extraReducers: (builder) => {
    builder
      // driverGoOnline
      .addCase(driverGoOnline.pending, (state) => {
        state.onlineLoading = true;
        state.onlineError = null;
      })
      .addCase(driverGoOnline.fulfilled, (state) => {
        state.onlineLoading = false;
        state.isOnline = true;
        state.onlineError = null;
      })
      .addCase(driverGoOnline.rejected, (state, action) => {
        state.onlineLoading = false;
        state.onlineError = action.payload;
      })

      // driverGoOffline
      .addCase(driverGoOffline.pending, (state) => {
        state.onlineLoading = true;
        state.onlineError = null;
      })
      .addCase(driverGoOffline.fulfilled, (state) => {
        state.onlineLoading = false;
        state.isOnline = false;
        state.onlineError = null;
      })
      .addCase(driverGoOffline.rejected, (state, action) => {
        state.onlineLoading = false;
        state.onlineError = action.payload;
      })

      // connectDriverWebSocket
      .addCase(connectDriverWebSocket.pending, (state) => {
        state.socketConnecting = true;
        state.socketError = null;
      })
      .addCase(connectDriverWebSocket.fulfilled, (state) => {
        state.socketConnecting = false;
        state.socketConnected = true;
        state.socketError = null;
      })
      .addCase(connectDriverWebSocket.rejected, (state, action) => {
        state.socketConnecting = false;
        state.socketConnected = false;
        state.socketError = action.payload;
      })

      // disconnectDriverWebSocket
      .addCase(disconnectDriverWebSocket.fulfilled, (state) => {
        state.socketConnected = false;
        state.socketConnecting = false;
      })

      // sendDriverLocationUpdate
      .addCase(sendDriverLocationUpdate.fulfilled, (state, action) => {
        state.lastLocationSent = action.payload;
      })

      // Driver action loading states
      .addCase(driverAcceptRide.pending, (state) => {
        state.actionLoading = true;
        state.actionError = null;
      })
      .addCase(driverAcceptRide.fulfilled, (state, action) => {
        state.actionLoading = false;
        if (state.incomingRideRequest) {
          state.activeRide = {
            ...state.incomingRideRequest,
            ride_id: action.meta?.arg?.rideId || action.payload?.rideId || state.incomingRideRequest.ride_id,
          };
        }
      })
      .addCase(driverRejectRide.pending, (state) => {
        state.actionLoading = true;
        state.actionError = null;
      })
      .addCase(driverRejectRide.fulfilled, (state) => {
        state.actionLoading = false;
      })
      .addCase(driverMarkArrived.pending, (state) => {
        state.actionLoading = true;
        state.actionError = null;
      })
      .addCase(driverMarkArrived.fulfilled, (state) => {
        state.actionLoading = false;
      })
      .addCase(driverStartTrip.pending, (state) => {
        state.actionLoading = true;
        state.actionError = null;
      })
      .addCase(driverStartTrip.fulfilled, (state) => {
        state.actionLoading = false;
      })
      .addCase(driverCompleteTrip.pending, (state) => {
        state.actionLoading = true;
        state.actionError = null;
      })
      .addCase(driverCompleteTrip.fulfilled, (state) => {
        state.actionLoading = false;
      })
      .addCase(driverCancelRide.pending, (state) => {
        state.actionLoading = true;
        state.actionError = null;
      })
      .addCase(driverCancelRide.fulfilled, (state) => {
        state.actionLoading = false;
      });
  },
});

export const {
  setSocketConnecting,
  setSocketConnected,
  setSocketError,
  setCurrentLocation,
  locationUpdateSent,
  setIsOnlineLocally,
  clearIncomingRideRequest,
  clearActionNotices,
  resetActiveRideState,
  handleIncomingSocketMessage,
} = driverSlice.actions;

// Export as driverSocketSlice alias for developer flexibility
export const driverSocketSlice = driverSlice;

export default driverSlice.reducer;
