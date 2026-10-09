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
  distanceRemainingKm: null, // number in km (e.g. 0.07)
  etaMin: null, // number in minutes (e.g. 1)
  target: null, // 'pickup' | 'drop'
  completedTrip: null, // { ride_id, final_fare, payment_status }
  cancellationNotice: null, // { ride_id, cancelled_by: "DRIVER" | "RIDER" }
  rideExpiredNotice: null, // { ride_id, detail }
  activeRideData: null, // Full ride object if received from server / current_state

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
      const payload = action.payload || {};
      const lat = payload.lat ?? payload.latitude;
      const lng = payload.lng ?? payload.longitude ?? payload.lon;
      if (lat !== undefined && lng !== undefined) {
        state.driverLocation = {
          lat: Number(lat),
          lng: Number(lng),
        };
      }
      if (payload.distance_remaining_km !== undefined && payload.distance_remaining_km !== null) {
        state.distanceRemainingKm = Number(payload.distance_remaining_km);
      }
      if (payload.eta_min !== undefined && payload.eta_min !== null) {
        state.etaMin = Number(payload.eta_min);
      }
      if (payload.target) {
        state.target = payload.target;
      }
    },
    setTripEtaAndDistance: (state, action) => {
      const payload = action.payload || {};
      const dist = payload.distance_remaining_km ?? payload.distanceRemainingKm;
      const eta = payload.eta_min ?? payload.etaMin;
      if (dist !== undefined && dist !== null) {
        state.distanceRemainingKm = Number(dist);
      }
      if (eta !== undefined && eta !== null) {
        state.etaMin = Number(eta);
      }
      if (payload.target) {
        state.target = payload.target;
      }
    },
    clearActionNotices: (state) => {
      state.actionError = null;
      state.actionSuccessNotice = null;
      state.cancellationNotice = null;
      state.rideExpiredNotice = null;
    },
    clearRiderTripState: (state) => {
      state.activeRideId = null;
      state.rideOtp = null;
      state.tripStatus = 'idle';
      state.driverDetails = null;
      state.driverLocation = null;
      state.distanceRemainingKm = null;
      state.etaMin = null;
      state.target = null;
      state.completedTrip = null;
      state.cancellationNotice = null;
      state.rideExpiredNotice = null;
      state.actionError = null;
      state.actionSuccessNotice = null;
      state.activeRideData = null;
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

        case 'current_state': {
          // {"type": "current_state", "has_active_ride": true, "stage": "trip_ongoing", "driver": {...}, "ride": {...}, ...}
          console.log('[RiderSlice] 🔄 Processing current_state payload:', msg);
          if (msg.has_active_ride && msg.ride) {
            const ride = msg.ride || {};
            const assignedRideId = ride.ride_id || ride.id || msg.ride_id;
            if (assignedRideId) {
              state.activeRideId = assignedRideId;
            }

            const stage = String(msg.stage || ride.status || '').toLowerCase();
            if (stage.includes('searching') || stage.includes('request')) {
              state.tripStatus = 'searching';
            } else if (stage.includes('assign') || stage.includes('accept')) {
              state.tripStatus = 'driver_assigned';
            } else if (stage.includes('arriv')) {
              state.tripStatus = 'driver_arrived';
            } else if (stage.includes('trip') || stage.includes('ongo') || stage.includes('progress')) {
              state.tripStatus = 'in_progress';
            } else {
              state.tripStatus = 'driver_assigned';
            }

            if (ride.otp) {
              state.rideOtp = ride.otp;
            }

            // Driver Details
            const d = msg.driver || {};
            const v = msg.vehicle || {};
            const vMake = v.make || d.vehicle_make || '';
            const vModel = v.model || d.vehicle_model || '';
            const vPlate = v.plate || d.vehicle_plate || d.vehicle_number || d.plate_number || '';
            const vColor = v.color || d.vehicle_color || d.color || '';
            const vName = v.name || `${vMake} ${vModel}`.trim() || 'Vehicle';
            const combinedStr = `${vMake} ${vModel} ${vName}`.toLowerCase();
            const isCarOrSuv =
              combinedStr.includes('car') ||
              combinedStr.includes('benz') ||
              combinedStr.includes('wagon') ||
              combinedStr.includes('suv') ||
              combinedStr.includes('sedan') ||
              combinedStr.includes('cab') ||
              combinedStr.includes('audi') ||
              combinedStr.includes('bmw') ||
              combinedStr.includes('thar') ||
              combinedStr.includes('swift') ||
              combinedStr.includes('dzire') ||
              combinedStr.includes('etios') ||
              combinedStr.includes('toyota') ||
              combinedStr.includes('hyundai');
            const isAutoRick =
              combinedStr.includes('auto') ||
              combinedStr.includes('rick') ||
              combinedStr.includes('tuk');
            const vType =
              v.vehicle_type ||
              d.vehicle_type ||
              (isCarOrSuv ? 'CAR' : isAutoRick ? 'AUTO' : 'BIKE');

            state.driverDetails = {
              id: d.id || d.driver_id || 1,
              name: d.name || d.driver_name || 'Assigned Driver',
              phone: d.phone || d.driver_phone || '+1 (555) 019-2834',
              rating: d.rating ? String(d.rating) : '4.95',
              vehicle_type: vType,
              vehicle_make: vMake,
              vehicle_model: vModel,
              vehicle_plate: vPlate,
              vehicle_color: vColor,
              vehicle: vName,
              photo: d.photo || d.avatar || null,
              vehicle_image: d.vehicle_image || d.vehicle_photo || d.car_image || v.image || null,
              car: {
                make: vMake,
                model: vName || `${vMake} ${vModel}`.trim() || 'Vehicle',
                color: vColor,
                plateNumber: vPlate,
                category: vType,
              },
            };

            const driverLat = d.location?.lat ?? d.lat ?? msg.lat;
            const driverLng = d.location?.lng ?? d.lng ?? msg.lng;
            if (
              driverLat !== undefined &&
              driverLng !== undefined &&
              driverLat !== null &&
              driverLng !== null
            ) {
              state.driverLocation = {
                lat: Number(driverLat),
                lng: Number(driverLng),
              };
            }

            if (
              msg.progress?.distance_remaining_km !== undefined &&
              msg.progress?.distance_remaining_km !== null
            ) {
              state.distanceRemainingKm = Number(msg.progress.distance_remaining_km);
            }
            if (msg.progress?.eta_min !== undefined && msg.progress?.eta_min !== null) {
              state.etaMin = Number(msg.progress.eta_min);
            }
            if (msg.progress?.target) {
              state.target = msg.progress.target;
            }

            state.activeRideData = ride;
            state.cancellationNotice = null;
          } else if (msg.has_active_ride === false) {
            state.activeRideId = null;
            state.tripStatus = 'idle';
            state.driverDetails = null;
            state.driverLocation = null;
            state.activeRideData = null;
          }
          break;
        }

        case 'driver_assigned':
        case 'ride_accepted': {
          // Supports flat: {"type": "driver_assigned", "ride_id": 1, "driver_name": ".."}
          // Or nested: {"type": "driver_assigned", "ride": { "id": 1 }, "driver": { "name": ".." }}
          const d = msg.driver || msg.data || msg;
          const assignedRideId = msg.ride_id || msg.id || d.ride_id || d.id;
          state.tripStatus = 'driver_assigned';
          state.cancellationNotice = null;
          if (assignedRideId) {
            state.activeRideId = assignedRideId;
          }

          // Extract live driver coordinates from backend payload if present
          const driverLat =
            msg.driver_lat ??
            msg.lat ??
            msg.latitude ??
            d.driver_lat ??
            d.lat ??
            d.latitude;
          const driverLng =
            msg.driver_lon ??
            msg.driver_lng ??
            msg.lng ??
            msg.lon ??
            msg.longitude ??
            d.driver_lon ??
            d.driver_lng ??
            d.lng ??
            d.lon ??
            d.longitude;

          if (
            driverLat !== undefined &&
            driverLat !== null &&
            driverLng !== undefined &&
            driverLng !== null
          ) {
            state.driverLocation = {
              lat: Number(driverLat),
              lng: Number(driverLng),
            };
          }

          const vMake = d.vehicle_make || d.vehicle?.make || '';
          const vModel = d.vehicle_model || d.vehicle?.model || '';
          const vPlate = d.vehicle_plate || d.vehicle?.plate || d.vehicle_number || d.plate_number || '';
          const vColor = d.vehicle_color || d.color || d.vehicle?.color || '';
          const vName =
            d.vehicle_name ||
            `${vMake} ${vModel}`.trim() ||
            d.vehicle?.name ||
            'Vehicle';
          const combinedStr = `${vMake} ${vModel} ${vName}`.toLowerCase();
          const isCarOrSuv =
            combinedStr.includes('car') ||
            combinedStr.includes('benz') ||
            combinedStr.includes('wagon') ||
            combinedStr.includes('suv') ||
            combinedStr.includes('sedan') ||
            combinedStr.includes('cab') ||
            combinedStr.includes('audi') ||
            combinedStr.includes('bmw') ||
            combinedStr.includes('thar') ||
            combinedStr.includes('swift') ||
            combinedStr.includes('dzire') ||
            combinedStr.includes('etios') ||
            combinedStr.includes('toyota') ||
            combinedStr.includes('hyundai');
          const isAutoRick =
            combinedStr.includes('auto') ||
            combinedStr.includes('rick') ||
            combinedStr.includes('tuk');
          const vType =
            d.vehicle_type ||
            msg.vehicle_type ||
            (isCarOrSuv ? 'CAR' : isAutoRick ? 'AUTO' : 'BIKE');

          state.driverDetails = {
            id: d.driver_id || d.id || 1,
            name: d.driver_name || d.name || d.user?.name || 'Assigned Driver',
            phone: d.driver_phone || d.phone || d.user?.phone || '+1 (555) 019-2834',
            rating: d.driver_rating
              ? String(d.driver_rating)
              : d.rating
              ? String(d.rating)
              : '4.95',
            vehicle_type: vType,
            vehicle_make: vMake,
            vehicle_model: vModel,
            vehicle_plate: vPlate,
            vehicle_color: vColor,
            vehicle: vName,
            photo: d.driver_photo || d.photo || d.avatar || null,
            vehicle_image: d.vehicle_image || d.vehicle_photo || d.car_image || null,
            car: {
              make: vMake,
              model: vName || `${vMake} ${vModel}`.trim() || 'Vehicle',
              color: vColor,
              plateNumber: vPlate,
              category: vType,
            },
          };

          const initialDist = msg.distance_remaining_km ?? msg.distance_km ?? d.distance_remaining_km ?? d.distance_km;
          const initialEta = msg.eta_min ?? msg.eta ?? d.eta_min ?? d.eta;
          if (initialDist !== undefined && initialDist !== null) {
            state.distanceRemainingKm = Number(initialDist);
          }
          if (initialEta !== undefined && initialEta !== null) {
            state.etaMin = Number(initialEta);
          }
          if (msg.target || d.target) {
            state.target = msg.target || d.target;
          }
          break;
        }

        case 'driver_arrived':
          // {"type": "driver_arrived", "ride_id": ..}
          state.tripStatus = 'driver_arrived';
          state.distanceRemainingKm = 0;
          state.etaMin = 0;
          break;

        case 'trip_started':
          // {"type": "trip_started", "ride_id": ..}
          state.tripStatus = 'in_progress';
          break;

        case 'driver_location': {
          // {"type": "driver_location", "lat": .., "lng": .., "status": "BUSY", "ride_id": .., "target": "pickup", "distance_remaining_km": 0.07, "eta_min": 1}
          const lat = msg.lat ?? msg.latitude ?? msg.driver_lat;
          const lng =
            msg.lng ??
            msg.lon ??
            msg.longitude ??
            msg.driver_lon ??
            msg.driver_lng;
          if (
            lat !== undefined &&
            lng !== undefined &&
            lat !== null &&
            lng !== null
          ) {
            state.driverLocation = {
              lat: Number(lat),
              lng: Number(lng),
            };
          }

          if (
            msg.distance_remaining_km !== undefined &&
            msg.distance_remaining_km !== null
          ) {
            state.distanceRemainingKm = Number(msg.distance_remaining_km);
          }
          if (msg.eta_min !== undefined && msg.eta_min !== null) {
            state.etaMin = Number(msg.eta_min);
          }
          if (msg.target) {
            state.target = msg.target;
          }
          if (msg.ride_id) {
            state.activeRideId = msg.ride_id;
          }
          break;
        }

        case 'location_ack': {
          // Fallback if backend sends location_ack to rider
          if (
            msg.distance_remaining_km !== undefined &&
            msg.distance_remaining_km !== null
          ) {
            state.distanceRemainingKm = Number(msg.distance_remaining_km);
          }
          if (msg.eta_min !== undefined && msg.eta_min !== null) {
            state.etaMin = Number(msg.eta_min);
          }
          if (msg.target) {
            state.target = msg.target;
          }
          break;
        }

        case 'trip_completed':
          // {"type": "trip_completed", "ride_id": .., "final_fare": .., "payment_status": ".."}
          state.tripStatus = 'completed';
          {
            const completedRideId = msg.ride_id || msg.id || state.activeRideId;
            state.completedTrip = {
              ride_id: completedRideId,
              final_fare: msg.final_fare || msg.fare,
              payment_status: msg.payment_status || 'PAID',
              driver: state.driverDetails,
            };
            state.activeRideId = completedRideId;
          }
          state.activeRideData = null;
          state.rideOtp = null;
          state.driverLocation = null;
          state.distanceRemainingKm = null;
          state.etaMin = null;
          state.target = null;
          break;

        case 'ride_cancelled': {
          // {"type": "ride_cancelled", "ride_id": .., "cancelled_by": "DRIVER"}
          const cancelledRideId = msg.ride_id || msg.id;
          if (!state.activeRideId || !cancelledRideId || String(cancelledRideId) === String(state.activeRideId)) {
            state.tripStatus = 'cancelled';
            state.cancellationNotice = {
              ride_id: cancelledRideId,
              cancelled_by: msg.cancelled_by || 'DRIVER',
            };
            state.activeRideId = null;
            state.activeRideData = null;
            state.rideOtp = null;
            state.driverDetails = null;
            state.driverLocation = null;
            state.distanceRemainingKm = null;
            state.etaMin = null;
            state.target = null;
          } else {
            console.warn(
              `[RiderSlice] ⚠️ Ignored ride_cancelled for ride #${cancelledRideId} because active ride is #${state.activeRideId}`
            );
          }
          break;
        }

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

        case 'ride_expired':
        case 'expired': {
          console.log('[RiderSlice] ⌛ Ride expired:', msg);
          state.tripStatus = 'expired';
          state.rideExpiredNotice = {
            ride_id: msg.ride_id || msg.id,
            detail: msg.detail || 'No driver found. Please try again.',
          };
          state.actionError = msg.detail || 'No driver found. Please try again.';
          state.activeRideId = null;
          state.activeRideData = null;
          state.rideOtp = null;
          state.driverDetails = null;
          state.driverLocation = null;
          state.distanceRemainingKm = null;
          state.etaMin = null;
          state.target = null;
          break;
        }

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
  setTripEtaAndDistance,
  clearActionNotices,
  clearRiderTripState,
  handleIncomingRiderMessage,
} = riderSlice.actions;

export const riderSocketSlice = riderSlice;
export default riderSlice.reducer;
