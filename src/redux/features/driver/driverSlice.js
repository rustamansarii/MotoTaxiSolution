import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { apiPost, apiGet } from '../../../utils/apiClient';
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
  lastLocationAck: null, // { lat, lng, timestamp, status, ride_id, target, distance_remaining_km, eta_min }
  distanceRemainingKm: null,
  etaMin: null,
  target: null, // 'pickup' | 'drop'

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

  // Available Ride Requests (Manual List)
  availableRideRequests: [],
  requestsLoading: false,
  requestsError: null,

  // Driver Wallet & Earnings
  wallet: null, // { balance, currency, available_balance, pending_balance, total_earnings, ... }
  walletTransactions: [], // [ { id, amount, type, description, created_at, status, ... } ]
  walletSummary: null, // { total_earnings, trips_count, hours_online, daily_breakdown, ... }
  isWalletLoading: false,
  isTransactionsLoading: false,
  isSummaryLoading: false,

  // Driver Home Stats (GET /api/v1/drivers/stats/home/)
  homeStats: null, // { rating, today: { online_hours, total_rides, total_earnings }, week: ..., all_time: ... }
  isHomeStatsLoading: false,
  homeStatsError: null,

  // Driver Rides History
  driverRides: [],
  driverRidesCount: 0,
  driverRidesNext: null,
  driverRidesPrevious: null,
  driverRidesCurrentPage: 1,
  isDriverRidesLoading: false,
  isLoadingMoreDriverRides: false,
  driverRidesError: null,

  // Driver Documents
  driverDocumentsData: null,
  isDocumentsLoading: false,
  documentsError: null,

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

/**
 * Call API: GET /api/v1/drivers/wallet/
 */
export const fetchDriverWallet = createAsyncThunk(
  'driver/fetchWallet',
  async (_, { rejectWithValue }) => {
    try {
      console.log('[DriverAPI] Fetching driver wallet...');
      const response = await apiGet(ApiConstant.DriverWallet);
      console.log('[DriverAPI] Wallet response:', response);
      return response?.data || response;
    } catch (error) {
      const errorMsg =
        error?.data?.message ||
        error?.data?.detail ||
        error?.message ||
        'Failed to fetch driver wallet';
      console.warn('[DriverAPI] Wallet fetch error:', errorMsg);
      return rejectWithValue(errorMsg);
    }
  }
);

/**
 * Call API: GET /api/v1/drivers/wallet/transactions/
 */
export const fetchDriverWalletTransactions = createAsyncThunk(
  'driver/fetchWalletTransactions',
  async (params, { rejectWithValue }) => {
    try {
      console.log('[DriverAPI] Fetching wallet transactions...');
      const response = await apiGet(ApiConstant.DriverWalletTransactions, params);
      console.log('[DriverAPI] Wallet transactions response count:', Array.isArray(response) ? response.length : 'non-array');
      const list = Array.isArray(response)
        ? response
        : Array.isArray(response?.results)
        ? response.results
        : Array.isArray(response?.data)
        ? response.data
        : [];
      return list;
    } catch (error) {
      const errorMsg =
        error?.data?.message ||
        error?.data?.detail ||
        error?.message ||
        'Failed to fetch wallet transactions';
      console.warn('[DriverAPI] Transactions fetch error:', errorMsg);
      return rejectWithValue(errorMsg);
    }
  }
);

/**
 * Call API: GET /api/v1/drivers/wallet/summary/
 */
export const fetchDriverWalletSummary = createAsyncThunk(
  'driver/fetchWalletSummary',
  async (params, { rejectWithValue }) => {
    try {
      console.log('[DriverAPI] Fetching wallet summary...');
      const response = await apiGet(ApiConstant.DriverWalletSummary, params);
      console.log('[DriverAPI] Wallet summary response:', response);
      return response?.data || response;
    } catch (error) {
      const errorMsg =
        error?.data?.message ||
        error?.data?.detail ||
        error?.message ||
        'Failed to fetch wallet summary';
      console.warn('[DriverAPI] Summary fetch error:', errorMsg);
      return rejectWithValue(errorMsg);
    }
  }
);

/**
 * Call API: GET /api/v1/drivers/stats/home/
 */
export const fetchDriverHomeStats = createAsyncThunk(
  'driver/fetchHomeStats',
  async (_, { rejectWithValue }) => {
    try {
      console.log('[DriverAPI] Fetching driver home stats from drivers/stats/home/...');
      const response = await apiGet(ApiConstant.DriverHomeStats);
      console.log('[DriverAPI] Home stats response:', response);
      return response?.data || response;
    } catch (error) {
      const errorMsg =
        error?.data?.message ||
        error?.data?.detail ||
        error?.message ||
        'Failed to fetch home stats';
      console.warn('[DriverAPI] Home stats fetch error:', errorMsg);
      return rejectWithValue(errorMsg);
    }
  }
);

/**
 * Call API: GET /api/v1/rides/driver-rides/?page=1&page_size=10
 */
export const fetchDriverRides = createAsyncThunk(
  'driver/fetchDriverRides',
  async ({ page = 1, page_size = 10 } = {}, { rejectWithValue }) => {
    try {
      console.log(`[DriverAPI] Fetching driver rides (page ${page})...`);
      const response = await apiGet(ApiConstant.DriverRides, { page, page_size });
      return { data: response, page };
    } catch (error) {
      const errorMsg =
        error?.data?.message ||
        error?.data?.detail ||
        error?.message ||
        'Failed to fetch driver rides';
      console.warn('[DriverAPI] Driver rides fetch error:', errorMsg);
      return rejectWithValue(errorMsg);
    }
  }
);

/**
 * Call API: GET /api/v1/drivers/documents/
 */
export const fetchDriverDocuments = createAsyncThunk(
  'driver/fetchDriverDocuments',
  async (_, { rejectWithValue }) => {
    try {
      console.log('[DriverAPI] Fetching driver documents...');
      const response = await apiGet(ApiConstant.DriverDocuments);
      return response;
    } catch (error) {
      const errorMsg =
        error?.data?.message ||
        error?.data?.detail ||
        error?.message ||
        'Failed to fetch driver documents';
      console.warn('[DriverAPI] Documents fetch error:', errorMsg);
      return rejectWithValue(errorMsg);
    }
  }
);

/**
 * Call API: GET /api/v1/rides/driver-requests/ (fallback to rides/available/)
 */
export const fetchAvailableRideRequests = createAsyncThunk(
  'driver/fetchAvailableRideRequests',
  async (_, { rejectWithValue }) => {
    try {
      console.log('[DriverAPI] Fetching available ride requests from driver-requests/...');
      let response;
      try {
        response = await apiGet(ApiConstant.DriverRequests || 'rides/driver-requests/');
      } catch (err) {
        if (err?.status === 404) {
          console.log('[DriverAPI] driver-requests 404, attempting fallback to rides/available/...');
          response = await apiGet('rides/available/');
        } else {
          throw err;
        }
      }

      console.log('[DriverAPI] Available ride requests response:', response);
      const list = Array.isArray(response?.requests)
        ? response.requests
        : Array.isArray(response?.results)
        ? response.results
        : Array.isArray(response?.data)
        ? response.data
        : Array.isArray(response)
        ? response
        : [];
      return list;
    } catch (error) {
      const errorMsg =
        error?.data?.message ||
        error?.data?.detail ||
        error?.message ||
        'Failed to fetch available ride requests';
      console.warn('[DriverAPI] Available requests error:', errorMsg);
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
  async (customUrl, { dispatch, getState, rejectWithValue }) => {
    try {
      const token = await getAccessToken();
      if (!token) {
        console.warn('[DriverWS] Cannot connect WebSocket: No access token found');
        return rejectWithValue('No auth token available');
      }

      if (!isListenerAttached) {
        driverWebSocket.addListener((event, payload) => {
          console.log("payload",payload)
          if (event === 'connecting') {
            dispatch(setSocketConnecting(true));
          } else if (event === 'open') {
            dispatch(setSocketConnected(true));
          } else if (event === 'close') {
            dispatch(setSocketConnected(false));
          } else if (event === 'error') {
            dispatch(setSocketError(payload));
          } else if (event === 'offline_error') {
            const currentDriverState = getState()?.driver;
            if (currentDriverState?.rideStatus === 'idle' && !currentDriverState?.activeRide) {
              console.log('[DriverWS] Offline error received while idle, auto-syncing driverGoOnline...');
              dispatch(driverGoOnline());
            } else {
              console.log(
                `[DriverWS] Offline error received but driver is currently active (${currentDriverState?.rideStatus}), skipping driverGoOnline.`
              );
            }
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
  async ({ rideId, lat, lng, fare } = {}, { getState }) => {
    const state = getState();
    const loc = state.driver?.currentLocation;
    const activeRide = state.driver?.activeRide || state.driver?.completedRide;

    const effectiveRideId = Number(rideId || activeRide?.ride_id || 1);
    const effectiveLat = lat ?? loc?.lat;
    const effectiveLng = lng ?? loc?.lng;
    const effectiveFare = fare ?? activeRide?.driver_payout ?? activeRide?.fare;

    const extra = {};
    if (effectiveLat !== undefined && effectiveLng !== undefined) {
      extra.lat = Number(effectiveLat);
      extra.lng = Number(effectiveLng);
      extra.latitude = Number(effectiveLat);
      extra.longitude = Number(effectiveLng);
    }
    if (effectiveFare !== undefined && effectiveFare !== null) {
      extra.fare = Number(effectiveFare);
      extra.final_fare = Number(effectiveFare);
    }

    console.log('[driverCompleteTrip] Sending complete_trip for rideId:', effectiveRideId, 'with data:', extra);
    const sent = driverWebSocket.completeTrip(effectiveRideId, extra);
    console.log('sent', sent);
    return { rideId: effectiveRideId, sent };
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
      state.distanceRemainingKm = null;
      state.etaMin = null;
      state.target = null;
      state.actionError = null;
      state.actionSuccessNotice = null;
      state.rideTakenNotice = null;
      state.rideCancelledNotice = null;
    },
    setAvailableRideRequests: (state, action) => {
      state.availableRideRequests = Array.isArray(action.payload) ? action.payload : [];
    },
    addAvailableRideRequest: (state, action) => {
      const newReq = action.payload;
      if (!newReq || !newReq.ride_id) return;
      const rideId = newReq.ride_id;
      if (['accepted', 'arrived', 'in_progress'].includes(state.rideStatus)) {
        return;
      }
      const existingIndex = state.availableRideRequests.findIndex(
        (r) => String(r.ride_id) === String(rideId)
      );
      if (existingIndex >= 0) {
        state.availableRideRequests[existingIndex] = {
          ...state.availableRideRequests[existingIndex],
          ...newReq,
        };
      } else {
        state.availableRideRequests = [newReq, ...state.availableRideRequests];
      }
    },
    removeAvailableRideRequest: (state, action) => {
      const rideId = action.payload?.ride_id || action.payload?.id || action.payload;
      if (!rideId) return;
      state.availableRideRequests = state.availableRideRequests.filter(
        (r) => String(r.ride_id) !== String(rideId)
      );
      if (
        state.incomingRideRequest &&
        String(state.incomingRideRequest.ride_id) === String(rideId)
      ) {
        state.incomingRideRequest = null;
      }
    },
    clearAvailableRideRequests: (state) => {
      state.availableRideRequests = [];
      state.requestsLoading = false;
      state.requestsError = null;
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

        case 'current_state': {
          // {"type": "current_state", "has_active_ride": true, "stage": "trip_ongoing", "driver": {...}, "ride": {...}, ...}
          console.log('[DriverSlice] 🔄 Processing current_state payload:', msg);
          if (msg.driver?.status) {
            state.isOnline = msg.driver.status === 'ONLINE';
          }
          if (msg.driver?.location?.lat && msg.driver?.location?.lng) {
            state.currentLocation = {
              lat: Number(msg.driver.location.lat),
              lng: Number(msg.driver.location.lng),
            };
          }
          if (msg.has_active_ride && msg.ride) {
            const rideData = msg.ride || {};
            const pickupObj = rideData.pickup || {};
            const dropObj = rideData.drop || {};
            const stage = String(msg.stage || rideData.status || '').toLowerCase();

            if (stage.includes('assign') || stage.includes('accept')) {
              state.rideStatus = 'accepted';
            } else if (stage.includes('arriv')) {
              state.rideStatus = 'arrived';
            } else if (stage.includes('trip') || stage.includes('ongo') || stage.includes('progress')) {
              state.rideStatus = 'in_progress';
            } else {
              state.rideStatus = 'accepted';
            }

            state.rideCancelledNotice = null;

            state.activeRide = {
              ...(state.activeRide || {}),
              ride_id: rideData.ride_id || rideData.id || state.activeRide?.ride_id,
              status: rideData.status,
              pickup_address:
                pickupObj.address ||
                pickupObj.display_name ||
                (typeof rideData.pickup === 'string' ? rideData.pickup : null) ||
                rideData.pickup_address ||
                state.activeRide?.pickup_address,
              drop_address:
                dropObj.address ||
                dropObj.display_name ||
                (typeof rideData.drop === 'string' ? rideData.drop : null) ||
                rideData.drop_address ||
                state.activeRide?.drop_address,
              pickup: rideData.pickup || state.activeRide?.pickup,
              drop: rideData.drop || state.activeRide?.drop,
              pickup_lat: pickupObj.lat ?? rideData.pickup_lat ?? state.activeRide?.pickup_lat,
              pickup_lon: pickupObj.lng ?? pickupObj.lon ?? rideData.pickup_lon ?? state.activeRide?.pickup_lon,
              drop_lat: dropObj.lat ?? rideData.drop_lat ?? state.activeRide?.drop_lat,
              drop_lon: dropObj.lng ?? dropObj.lon ?? rideData.drop_lon ?? state.activeRide?.drop_lon,
              rider_name: msg.rider?.name || rideData.rider_name || state.activeRide?.rider_name || 'Rider',
              rider_phone: msg.rider?.phone || rideData.rider_phone || state.activeRide?.rider_phone,
              rider: msg.rider || state.activeRide?.rider,
              driver_payout: rideData.driver_payout ?? rideData.fare ?? state.activeRide?.driver_payout ?? 0,
              fare: rideData.driver_payout ?? rideData.fare ?? state.activeRide?.fare ?? 0,
              currency: rideData.currency || state.activeRide?.currency || 'USD',
              vehicle: msg.vehicle || state.activeRide?.vehicle,
              vehicle_type: msg.vehicle?.vehicle_type || rideData.vehicle_type || state.activeRide?.vehicle_type || 'CAR',
              distance_km: msg.progress?.distance_remaining_km ?? rideData.distance_km ?? state.activeRide?.distance_km,
            };

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
          } else if (msg.has_active_ride === false) {
            state.activeRide = null;
            if (state.rideStatus !== 'requested') {
              state.rideStatus = 'idle';
            }
          }
          break;
        }

        case 'location_ack':
          // {"type": "location_ack", "lat": .., "lng": .., "status": "BUSY", "ride_id": .., "target": "pickup", "distance_remaining_km": 0.02, "eta_min": 1}
          state.lastLocationAck = {
            lat: Number(msg.lat),
            lng: Number(msg.lng),
            status: msg.status,
            ride_id: msg.ride_id,
            target: msg.target,
            distance_remaining_km:
              msg.distance_remaining_km !== undefined && msg.distance_remaining_km !== null
                ? Number(msg.distance_remaining_km)
                : undefined,
            eta_min:
              msg.eta_min !== undefined && msg.eta_min !== null
                ? Number(msg.eta_min)
                : undefined,
            timestamp: Date.now(),
          };
          if (msg.lat !== undefined && msg.lng !== undefined) {
            state.currentLocation = {
              lat: Number(msg.lat),
              lng: Number(msg.lng),
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

          // Synchronize rideStatus and activeRide when location_ack indicates an active ride
          const ackStatus = String(msg.status || '').toUpperCase();
          if (
            ackStatus === 'ON_TRIP' ||
            ackStatus === 'IN_PROGRESS' ||
            ackStatus === 'TRIP_ONGOING'
          ) {
            if (state.rideStatus !== 'in_progress') {
              state.rideStatus = 'in_progress';
            }
            if (msg.ride_id && (!state.activeRide || state.activeRide.ride_id !== msg.ride_id)) {
              state.activeRide = {
                ...(state.activeRide || {}),
                ride_id: msg.ride_id,
              };
            }
          } else if (ackStatus === 'ARRIVED') {
            if (state.rideStatus !== 'arrived') {
              state.rideStatus = 'arrived';
            }
          } else if (
            ackStatus === 'ACCEPTED' ||
            (ackStatus === 'BUSY' && msg.target === 'pickup')
          ) {
            if (state.rideStatus === 'idle') {
              state.rideStatus = 'accepted';
            }
          }
          break;

        case 'ride_request': {
          // {"type": "ride_request", "ride_id": .., "vehicle_type": .., ...}
          // If driver is already engaged in an active trip, ignore duplicate/new ride offers
          const isBusyWithActiveTrip =
            Boolean(state.activeRide?.ride_id) &&
            ['accepted', 'arrived', 'in_progress'].includes(state.rideStatus);

          if (isBusyWithActiveTrip) {
            console.warn(
              `[DriverSlice] ⚠️ Ignored ride_request for ride #${msg.ride_id} because driver is currently active (status: ${state.rideStatus}, activeRideId: ${state.activeRide?.ride_id})`
            );
            break;
          }
          state.incomingRideRequest = msg;
          state.rideCancelledNotice = null;

          // Add to availableRideRequests list without duplicates
          const reqRideId = msg.ride_id || msg.id;
          if (reqRideId) {
            const existingIdx = state.availableRideRequests.findIndex(
              (r) => String(r.ride_id) === String(reqRideId)
            );
            if (existingIdx >= 0) {
              state.availableRideRequests[existingIdx] = {
                ...state.availableRideRequests[existingIdx],
                ...msg,
              };
            } else {
              state.availableRideRequests = [msg, ...state.availableRideRequests];
            }
          }
          break;
        }

        case 'ride_taken':
        case 'ride_expired':
        case 'offer_expired':
        case 'expire': {
          // {"type": "ride_taken", "ride_id": ..}
          console.log(`[DriverSlice] ⚠️ Offer unavailable [${msg.type}]:`, msg);
          const takenRideId = msg.ride_id || msg.id || msg.data?.ride_id;
          if (takenRideId) {
            state.availableRideRequests = state.availableRideRequests.filter(
              (r) => String(r.ride_id) !== String(takenRideId)
            );
          }
          if (state.incomingRideRequest && String(state.incomingRideRequest.ride_id) === String(takenRideId)) {
            state.incomingRideRequest = null;
          }
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

        case 'accept_success': {
          // {"type": "accept_success", "ride_id": .., "detail": ".."}
          state.rideStatus = 'accepted';
          state.rideCancelledNotice = null;
          const acceptedRideId = msg.ride_id || state.incomingRideRequest?.ride_id;
          if (acceptedRideId) {
            state.availableRideRequests = state.availableRideRequests.filter(
              (r) => String(r.ride_id) !== String(acceptedRideId)
            );
          }
          const matchedRequest =
            state.availableRideRequests.find((r) => String(r.ride_id) === String(acceptedRideId)) ||
            state.incomingRideRequest ||
            {};
          state.activeRide = {
            ...matchedRequest,
            ...(state.activeRide || {}),
            ride_id: acceptedRideId,
          };
          state.incomingRideRequest = null;
          state.actionSuccessNotice = msg.detail || 'Ride accepted';
          state.actionError = null;
          break;
        }

        case 'accept_failed': {
          // {"type": "accept_failed", "ride_id": .., "detail": ".."}
          console.warn('[DriverSlice] ❌ Accept failed:', msg);
          const failedRideId = msg.ride_id || msg.id;
          if (failedRideId) {
            state.availableRideRequests = state.availableRideRequests.filter(
              (r) => String(r.ride_id) !== String(failedRideId)
            );
          }
          state.actionError = msg.detail || 'This ride is no longer available.';
          state.incomingRideRequest = null;
          if (state.rideStatus === 'requested') {
            state.rideStatus = 'idle';
          }
          break;
        }

        case 'reject_success':
          console.log("reject_successreject_success")
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
          state.rideStatus = 'idle';
          state.activeRide = null;
          state.actionSuccessNotice = msg.detail || 'Ride cancelled';
          state.actionError = null;
          break;

        case 'cancel_ride_failed':
          // {"type": "cancel_ride_failed", "ride_id": .., "detail": ".."}
          state.actionError = msg.detail || 'Failed to cancel ride';
          break;

        case 'ride_cancelled': {
          // {"type": "ride_cancelled", "ride_id": .., "cancelled_by": "RIDER"}
          const cancelledRideId = msg.ride_id || msg.id;
          const activeRideId = state.activeRide?.ride_id || state.incomingRideRequest?.ride_id;
          if (!activeRideId || !cancelledRideId || String(cancelledRideId) === String(activeRideId)) {
            state.rideStatus = 'idle';
            state.rideCancelledNotice = msg;
            state.activeRide = null;
            state.incomingRideRequest = null;
          } else {
            console.warn(
              `[DriverSlice] ⚠️ Ignored ride_cancelled for ride #${cancelledRideId} because active ride is #${activeRideId}`
            );
          }
          break;
        }

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
    clearDriverRides: (state) => {
      state.driverRides = [];
      state.driverRidesCount = 0;
      state.driverRidesNext = null;
      state.driverRidesPrevious = null;
      state.driverRidesCurrentPage = 1;
      state.isDriverRidesLoading = false;
      state.isLoadingMoreDriverRides = false;
      state.driverRidesError = null;
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
        state.rideCancelledNotice = null;
      })
      .addCase(driverAcceptRide.fulfilled, (state, action) => {
        state.actionLoading = false;
        state.rideCancelledNotice = null;
        const targetRideId = action.meta?.arg?.rideId || action.payload?.rideId;
        const matched =
          state.availableRideRequests.find((r) => String(r.ride_id) === String(targetRideId)) ||
          state.incomingRideRequest;
        if (matched) {
          state.activeRide = {
            ...matched,
            ride_id: targetRideId,
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
      })

      // fetchDriverWallet
      .addCase(fetchDriverWallet.pending, (state) => {
        state.isWalletLoading = true;
        state.walletError = null;
      })
      .addCase(fetchDriverWallet.fulfilled, (state, action) => {
        state.isWalletLoading = false;
        state.wallet = action.payload;
        state.walletError = null;
      })
      .addCase(fetchDriverWallet.rejected, (state, action) => {
        state.isWalletLoading = false;
        state.walletError = action.payload;
      })

      // fetchDriverWalletTransactions
      .addCase(fetchDriverWalletTransactions.pending, (state) => {
        state.isTransactionsLoading = true;
      })
      .addCase(fetchDriverWalletTransactions.fulfilled, (state, action) => {
        state.isTransactionsLoading = false;
        state.walletTransactions = action.payload;
      })
      .addCase(fetchDriverWalletTransactions.rejected, (state) => {
        state.isTransactionsLoading = false;
      })

      // fetchDriverWalletSummary
      .addCase(fetchDriverWalletSummary.pending, (state) => {
        state.isSummaryLoading = true;
      })
      .addCase(fetchDriverWalletSummary.fulfilled, (state, action) => {
        state.isSummaryLoading = false;
        state.walletSummary = action.payload;
      })
      .addCase(fetchDriverWalletSummary.rejected, (state) => {
        state.isSummaryLoading = false;
      })

      // fetchDriverHomeStats
      .addCase(fetchDriverHomeStats.pending, (state) => {
        state.isHomeStatsLoading = true;
        state.homeStatsError = null;
      })
      .addCase(fetchDriverHomeStats.fulfilled, (state, action) => {
        state.isHomeStatsLoading = false;
        state.homeStats = action.payload;
        state.homeStatsError = null;
      })
      .addCase(fetchDriverHomeStats.rejected, (state, action) => {
        state.isHomeStatsLoading = false;
        state.homeStatsError = action.payload;
      })

      // fetchDriverRides
      .addCase(fetchDriverRides.pending, (state, action) => {
        const page = action.meta.arg?.page || 1;
        if (page === 1) {
          state.isDriverRidesLoading = true;
          state.driverRidesError = null;
        } else {
          state.isLoadingMoreDriverRides = true;
        }
      })
      .addCase(fetchDriverRides.fulfilled, (state, action) => {
        state.isDriverRidesLoading = false;
        state.isLoadingMoreDriverRides = false;
        const { data, page } = action.payload;
        const results = Array.isArray(data?.results)
          ? data.results
          : Array.isArray(data)
          ? data
          : [];
        state.driverRidesCount = data?.count ?? results.length;
        state.driverRidesNext = data?.next ?? null;
        state.driverRidesPrevious = data?.previous ?? null;
        state.driverRidesCurrentPage = page;
        if (page === 1) {
          state.driverRides = results;
        } else {
          const existingIds = new Set(state.driverRides.map((r) => r.id));
          const newItems = results.filter((r) => !existingIds.has(r.id));
          state.driverRides = [...state.driverRides, ...newItems];
        }
      })
      .addCase(fetchDriverRides.rejected, (state, action) => {
        state.isDriverRidesLoading = false;
        state.isLoadingMoreDriverRides = false;
        state.driverRidesError = action.payload;
      })

      // fetchDriverDocuments
      .addCase(fetchDriverDocuments.pending, (state) => {
        state.isDocumentsLoading = true;
        state.documentsError = null;
      })
      .addCase(fetchDriverDocuments.fulfilled, (state, action) => {
        state.isDocumentsLoading = false;
        state.driverDocumentsData = action.payload;
      })
      .addCase(fetchDriverDocuments.rejected, (state, action) => {
        state.isDocumentsLoading = false;
        state.documentsError = action.payload;
      })

      // fetchAvailableRideRequests
      .addCase(fetchAvailableRideRequests.pending, (state) => {
        state.requestsLoading = true;
        state.requestsError = null;
      })
      .addCase(fetchAvailableRideRequests.fulfilled, (state, action) => {
        state.requestsLoading = false;
        state.availableRideRequests = Array.isArray(action.payload) ? action.payload : [];
      })
      .addCase(fetchAvailableRideRequests.rejected, (state, action) => {
        state.requestsLoading = false;
        state.requestsError = action.payload;
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
  clearDriverRides,
  setAvailableRideRequests,
  addAvailableRideRequest,
  removeAvailableRideRequest,
  clearAvailableRideRequests,
} = driverSlice.actions;

// Export as driverSocketSlice alias for developer flexibility
export const driverSocketSlice = driverSlice;

export default driverSlice.reducer;
