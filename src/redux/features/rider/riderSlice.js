import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { getAccessToken } from '../../../utils/storage';
import { riderWebSocket } from '../../../utils/riderWebSocket';

const initialState = {
  socketConnected: false,
  socketConnecting: false,
  socketError: null,

  // Active Trip & Assigned Driver info
  activeRideId: null,
  rideOtp: null,
  tripStatus: 'idle', // 'idle' | 'searching' | 'driver_assigned' | 'driver_arrived' | 'in_progress' | 'completed' | 'cancelled'
  driverDetails: null, // { name, phone, rating, vehicle_make, vehicle_model, vehicle_plate, vehicle }
  driverLocation: null, // { lat: number, lng: number }
  completedTrip: null, // { ride_id, final_fare, payment_status }
  cancellationNotice: null, // { ride_id, cancelled_by: "DRIVER" | "RIDER" }

  // Action status
  actionLoading: false,
  actionError: null,
  actionSuccessNotice: null,

  socketMessages: [],
  lastMessage: null,
};

let isRiderListenerAttached = false;

/**
 * Connect to Rider WebSocket (ws://<host>/ws/rider/?token=...)
 */
export const connectRiderWebSocket = createAsyncThunk(
  'rider/connectWebSocket',
  async (customUrl, { dispatch, rejectWithValue }) => {
    try {
      const token = await getAccessToken();
      if (!token) {
        console.warn('[RiderWS] ⚠️ Cannot connect WebSocket: No access token found in storage');
        return rejectWithValue('No auth token available');
      }

      console.log(`[RiderSlice] 🔌 connectRiderWebSocket thunk invoked with token: ${token ? `${token.slice(0, 15)}...` : 'NONE'}`);

      if (!isRiderListenerAttached) {
        riderWebSocket.addListener((event, payload) => {
          if (event === 'connecting') {
            dispatch(setSocketConnecting(true));
          } else if (event === 'open') {
            dispatch(setSocketConnected(true));
          } else if (event === 'close') {
            dispatch(setSocketConnected(false));
          } else if (event === 'error') {
            dispatch(setSocketError(payload));
          } else if (event === 'message') {
            dispatch(handleIncomingRiderMessage(payload));
          }
        });
        isRiderListenerAttached = true;
      }

      await riderWebSocket.connect(token, customUrl);
      return { connected: true };
    } catch (err) {
      console.error('[RiderWS] ❌ Connection error in thunk:', err);
      return rejectWithValue(err.message || 'Failed to connect Rider WebSocket');
    }
  }
);

/**
 * Disconnect Rider WebSocket
 */
export const disconnectRiderWebSocket = createAsyncThunk(
  'rider/disconnectWebSocket',
  async () => {
    riderWebSocket.disconnect();
    return { disconnected: true };
  }
);

/**
 * Cancel ride:
 * {"type": "cancel_ride", "ride_id": 1, "reason": "Changed my mind"}
 */
export const riderCancelRide = createAsyncThunk(
  'rider/cancelRide',
  async ({ rideId, reason = 'Changed my mind' }) => {
    const sent = riderWebSocket.cancelRide(rideId, reason);
    return { rideId, reason, sent };
  }
);

/**
 * Send generic message over Rider WebSocket
 */
export const sendRiderSocketMessage = createAsyncThunk(
  'rider/sendMessage',
  async (data) => {
    const sent = riderWebSocket.sendMessage(data);
    return { data, sent, timestamp: Date.now() };
  }
);

export const riderSlice = createSlice({
  name: 'rider',
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
    setTripStatus: (state, action) => {
      state.tripStatus = action.payload;
    },
    setActiveRideId: (state, action) => {
      state.activeRideId = action.payload;
    },
    setRideOtp: (state, action) => {
      state.rideOtp = action.payload;
    },
    setDriverDetails: (state, action) => {
      state.driverDetails = action.payload;
    },
    updateDriverLocation: (state, action) => {
      state.driverLocation = {
        lat: Number(action.payload.lat ?? action.payload.latitude),
        lng: Number(action.payload.lng ?? action.payload.longitude ?? action.payload.lon),
      };
    },
    clearActionNotices: (state) => {
      state.actionError = null;
      state.actionSuccessNotice = null;
      state.cancellationNotice = null;
    },
    clearRiderTripState: (state) => {
      state.activeRideId = null;
      state.rideOtp = null;
      state.tripStatus = 'idle';
      state.driverDetails = null;
      state.driverLocation = null;
      state.completedTrip = null;
      state.cancellationNotice = null;
      state.actionError = null;
      state.actionSuccessNotice = null;
    },

    // ----------------------------------------------------
    // SERVER -> RIDER Message Router
    // ----------------------------------------------------
    handleIncomingRiderMessage: (state, action) => {
      const msg = action.payload || {};
      state.lastMessage = msg;
      state.socketMessages.push(msg);
      console.log(`[RiderSlice] 📥 Processing WebSocket message [${msg.type || 'unknown'}]:`, msg);

      switch (msg.type) {
        case 'connected':
          state.socketConnected = true;
          break;

        case 'driver_assigned':
        case 'ride_accepted': {
          // Supports flat: {"type": "driver_assigned", "ride_id": 1, "driver_name": ".."}
          // Or nested: {"type": "driver_assigned", "ride": { "id": 1 }, "driver": { "name": ".." }}
          const d = msg.driver || msg.data || msg;
          const assignedRideId = msg.ride_id || msg.id || d.ride_id || d.id;
          state.tripStatus = 'driver_assigned';
          if (assignedRideId) {
            state.activeRideId = assignedRideId;
          }
          const vMake = d.vehicle_make || d.vehicle?.make || '';
          const vModel = d.vehicle_model || d.vehicle?.model || '';
          const vPlate = d.vehicle_plate || d.vehicle?.plate || d.vehicle_number || '';
          const vName =
            d.vehicle_name ||
            `${vMake} ${vModel}`.trim() ||
            d.vehicle?.name ||
            'Motorcycle';

          state.driverDetails = {
            id: d.driver_id || d.id || 1,
            name: d.driver_name || d.name || d.user?.name || 'Assigned Driver',
            phone: d.driver_phone || d.phone || d.user?.phone || '+1 (555) 019-2834',
            rating: d.driver_rating
              ? String(d.driver_rating)
              : d.rating
              ? String(d.rating)
              : '4.95',
            vehicle_make: vMake,
            vehicle_model: vModel,
            vehicle_plate: vPlate,
            vehicle: vName,
            photo: d.driver_photo || d.photo || d.avatar || null,
          };
          break;
        }

        case 'driver_arrived':
          // {"type": "driver_arrived", "ride_id": ..}
          state.tripStatus = 'driver_arrived';
          break;

        case 'trip_started':
          // {"type": "trip_started", "ride_id": ..}
          state.tripStatus = 'in_progress';
          break;

        case 'driver_location': {
          // {"type": "driver_location", "lat": .., "lng": ..}
          const lat = msg.lat ?? msg.latitude;
          const lng = msg.lng ?? msg.lon ?? msg.longitude;
          if (lat !== undefined && lng !== undefined) {
            state.driverLocation = {
              lat: Number(lat),
              lng: Number(lng),
            };
          }
          break;
        }

        case 'trip_completed':
          // {"type": "trip_completed", "ride_id": .., "final_fare": .., "payment_status": ".."}
          state.tripStatus = 'completed';
          state.completedTrip = {
            ride_id: msg.ride_id || msg.id,
            final_fare: msg.final_fare || msg.fare,
            payment_status: msg.payment_status || 'PAID',
          };
          break;

        case 'ride_cancelled':
          // {"type": "ride_cancelled", "ride_id": .., "cancelled_by": "DRIVER"}
          state.tripStatus = 'cancelled';
          state.cancellationNotice = {
            ride_id: msg.ride_id,
            cancelled_by: msg.cancelled_by || 'DRIVER',
          };
          break;

        case 'cancel_ride_success':
          // {"type": "cancel_ride_success", "ride_id": .., "detail": ".."}
          state.tripStatus = 'cancelled';
          state.actionSuccessNotice = msg.detail || 'Ride cancelled successfully';
          state.actionError = null;
          state.activeRideId = null;
          break;

        case 'cancel_ride_failed':
          // {"type": "cancel_ride_failed", "ride_id": .., "detail": ".."}
          state.actionError = msg.detail || 'Failed to cancel ride';
          break;

        case 'no_drivers_available':
        case 'no_driver_found':
        case 'ride_rejected':
          state.tripStatus = 'no_driver_found';
          state.actionError = msg.detail || 'No drivers available nearby.';
          break;

        case 'error':
          // {"type": "error", "detail": ".."}
          state.socketError = msg.detail || 'WebSocket error';
          break;

        default:
          break;
      }
    },
  },

  extraReducers: (builder) => {
    builder
      // connectRiderWebSocket
      .addCase(connectRiderWebSocket.pending, (state) => {
        state.socketConnecting = true;
        state.socketError = null;
      })
      .addCase(connectRiderWebSocket.fulfilled, (state) => {
        state.socketConnecting = false;
        state.socketConnected = true;
        state.socketError = null;
      })
      .addCase(connectRiderWebSocket.rejected, (state, action) => {
        state.socketConnecting = false;
        state.socketConnected = false;
        state.socketError = action.payload;
      })

      // disconnectRiderWebSocket
      .addCase(disconnectRiderWebSocket.fulfilled, (state) => {
        state.socketConnected = false;
        state.socketConnecting = false;
      })

      // riderCancelRide
      .addCase(riderCancelRide.pending, (state) => {
        state.actionLoading = true;
        state.actionError = null;
      })
      .addCase(riderCancelRide.fulfilled, (state) => {
        state.actionLoading = false;
      })
      .addCase(riderCancelRide.rejected, (state, action) => {
        state.actionLoading = false;
        state.actionError = action.payload;
      });
  },
});

export const {
  setSocketConnecting,
  setSocketConnected,
  setSocketError,
  setTripStatus,
  setActiveRideId,
  setRideOtp,
  setDriverDetails,
  updateDriverLocation,
  clearActionNotices,
  clearRiderTripState,
  handleIncomingRiderMessage,
} = riderSlice.actions;

export const riderSocketSlice = riderSlice;
export default riderSlice.reducer;
