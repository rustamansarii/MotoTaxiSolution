import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { apiPost, apiGet } from '../../../utils/apiClient';
import ApiConstant from '../../../utils/apiConstant';
import { MOCK_RIDES } from '../../../data/mockRides';
import { isGuestMode, getAccessToken } from '../../../utils/storage';

export const mapFareToRide = (fare, overallData) => {
  const type = (fare.vehicle_type || '').toUpperCase();
  const fareAmount = Number(fare.customer_fare) || 0;
  const isNight = Boolean(fare.night_pricing_applied);

  if (type === 'BIKE') {
    return {
      id: 'ride_bike',
      vehicle_type: 'BIKE',
      name: 'Moto Taxi Standard',
      tag: isNight ? 'Night Rate' : 'Fastest',
      eta: '3 mins',
      price: fareAmount,
      originalPrice: isNight ? null : Math.round(fareAmount * 1.15 * 10) / 10,
      seats: 1,
      description: 'Affordable, reliable everyday motorcycle rides',
      iconType: 'bike',
      currency: overallData?.currency || 'USD',
      distance_km: overallData?.distance_km,
      duration_min: overallData?.duration_min,
      night_pricing_applied: isNight,
    };
  } else if (type === 'AUTO') {
    return {
      id: 'ride_auto',
      vehicle_type: 'AUTO',
      name: 'Moto Auto',
      tag: isNight ? 'Night Rate' : 'Popular',
      eta: '4 mins',
      price: fareAmount,
      originalPrice: isNight ? null : Math.round(fareAmount * 1.15 * 10) / 10,
      seats: 3,
      description: 'Convenient 3-seater auto rickshaw ride',
      iconType: 'auto',
      currency: overallData?.currency || 'USD',
      distance_km: overallData?.distance_km,
      duration_min: overallData?.duration_min,
      night_pricing_applied: isNight,
    };
  } else if (type === 'CAR') {
    return {
      id: 'ride_car',
      vehicle_type: 'CAR',
      name: 'Moto Cab / Car',
      tag: isNight ? 'Night Rate' : 'Comfort',
      eta: '5 mins',
      price: fareAmount,
      originalPrice: isNight ? null : Math.round(fareAmount * 1.15 * 10) / 10,
      seats: 4,
      description: 'Spacious car ride for up to 4 passengers',
      iconType: 'car',
      currency: overallData?.currency || 'USD',
      distance_km: overallData?.distance_km,
      duration_min: overallData?.duration_min,
      night_pricing_applied: isNight,
    };
  }

  return {
    id: `ride_${type.toLowerCase()}`,
    vehicle_type: type,
    name: `Moto ${type.charAt(0).toUpperCase() + type.slice(1).toLowerCase()}`,
    tag: isNight ? 'Night Rate' : undefined,
    eta: '5 mins',
    price: fareAmount,
    originalPrice: null,
    seats: 2,
    description: `${type} ride`,
    iconType: 'bike',
    currency: overallData?.currency || 'USD',
    distance_km: overallData?.distance_km,
    duration_min: overallData?.duration_min,
    night_pricing_applied: isNight,
  };
};

/**
 * 1. Fetch Fare Estimate API
 * POST /rides/fare-estimate/
 * Body: { pickup_lat, pickup_lon, drop_lat, drop_lon }
 */
export const fetchFareEstimate = createAsyncThunk(
  'rides/fetchFareEstimate',
  async ({ pickup_lat, pickup_lon, drop_lat, drop_lon }, { rejectWithValue }) => {
    try {
      const payload = {
        pickup_lat: Number(pickup_lat),
        pickup_lon: Number(pickup_lon),
        drop_lat: Number(drop_lat),
        drop_lon: Number(drop_lon),
      };

      const data = await apiPost(ApiConstant.FareEstimate, payload);
      return data;
    } catch (error) {
      return rejectWithValue(
        error.message || 'Failed to calculate fare estimate'
      );
    }
  }
);

/**
 * 2. Book Ride API
 * POST /rides/book/
 * Body: {
 *   pickup_lat,
 *   pickup_lon,
 *   pickup_address,
 *   drop_lat,
 *   drop_lon,
 *   drop_address,
 *   vehicle_type
 * }
 */
export const bookRide = createAsyncThunk(
  'rides/bookRide',
  async (bookingData, { rejectWithValue }) => {
    try {
      const payload = {
        pickup_lat: Number(bookingData.pickup_lat),
        pickup_lon: Number(bookingData.pickup_lon),
        pickup_address: String(bookingData.pickup_address || ''),
        drop_lat: Number(bookingData.drop_lat),
        drop_lon: Number(bookingData.drop_lon),
        drop_address: String(bookingData.drop_address || ''),
        vehicle_type: String(bookingData.vehicle_type || 'CAR').toUpperCase(),
      };

      const data = await apiPost(ApiConstant.BookRide, payload);
      return data;
    } catch (error) {
      return rejectWithValue(
        error.message || 'Failed to book ride'
      );
    }
  }
);

/**
 * 3. Fetch My Rides (History) API
 * GET /rides/my-rides/?page=1&page_size=10
 */
export const fetchMyRides = createAsyncThunk(
  'rides/fetchMyRides',
  async ({ page = 1, page_size = 10 } = {}, { rejectWithValue }) => {
    try {
      const isGuest = await isGuestMode();
      const token = await getAccessToken();
      if (isGuest || !token) {
        console.log('[RidesAPI] Skipping fetchMyRides: user is in guest mode or unauthenticated');
        return rejectWithValue('User is unauthenticated or in guest mode');
      }

      const data = await apiGet(ApiConstant.MyRides, { page, page_size });
      return { data, page };
    } catch (error) {
      return rejectWithValue(
        error.message || 'Failed to fetch ride history'
      );
    }
  }
);

const initialState = {
  estimate: null, // { distance_km, duration_min, currency, fares: [] }
  availableRides: [],
  selectedRide: null,
  isLoadingFares: false,
  fareError: null,

  // Booking state
  currentBooking: null,
  isBooking: false,
  bookingError: null,

  // My Rides history state
  myRides: [],
  myRidesCount: 0,
  myRidesNext: null,
  myRidesPrevious: null,
  myRidesCurrentPage: 1,
  isLoadingMyRides: false,
  isLoadingMoreMyRides: false,
  myRidesError: null,
};

const ridesSlice = createSlice({
  name: 'rides',
  initialState,

  reducers: {
    setSelectedRide: (state, action) => {
      state.selectedRide = action.payload;
    },
    clearFareEstimate: (state) => {
      state.estimate = null;
      state.availableRides = [];
      state.selectedRide = null;
      state.fareError = null;
    },
    clearBookingState: (state) => {
      state.currentBooking = null;
      state.isBooking = false;
      state.bookingError = null;
    },
    clearMyRides: (state) => {
      state.myRides = [];
      state.myRidesCount = 0;
      state.myRidesNext = null;
      state.myRidesPrevious = null;
      state.myRidesCurrentPage = 1;
      state.isLoadingMyRides = false;
      state.isLoadingMoreMyRides = false;
      state.myRidesError = null;
    },
  },

  extraReducers: (builder) => {
    builder
      // fetchFareEstimate
      .addCase(fetchFareEstimate.pending, (state) => {
        state.isLoadingFares = true;
        state.fareError = null;
      })
      .addCase(fetchFareEstimate.fulfilled, (state, action) => {
        state.isLoadingFares = false;
        state.estimate = action.payload;
        const fares = Array.isArray(action.payload?.fares)
          ? action.payload.fares
          : [];
        const mappedRides = fares.map((f) => mapFareToRide(f, action.payload));
        state.availableRides = mappedRides;
        state.selectedRide = mappedRides[0] || null;
      })
      .addCase(fetchFareEstimate.rejected, (state, action) => {
        state.isLoadingFares = false;
        state.fareError = action.payload;
      })

      // bookRide
      .addCase(bookRide.pending, (state) => {
        state.isBooking = true;
        state.bookingError = null;
      })
      .addCase(bookRide.fulfilled, (state, action) => {
        state.isBooking = false;
        state.currentBooking = action.payload;
      })
      .addCase(bookRide.rejected, (state, action) => {
        state.isBooking = false;
        state.bookingError = action.payload;
      })

      // fetchMyRides
      .addCase(fetchMyRides.pending, (state, action) => {
        const page = action.meta.arg?.page || 1;
        if (page === 1) {
          state.isLoadingMyRides = true;
          state.myRidesError = null;
        } else {
          state.isLoadingMoreMyRides = true;
        }
      })
      .addCase(fetchMyRides.fulfilled, (state, action) => {
        state.isLoadingMyRides = false;
        state.isLoadingMoreMyRides = false;
        const { data, page } = action.payload;
        const results = Array.isArray(data?.results)
          ? data.results
          : Array.isArray(data)
          ? data
          : [];
        state.myRidesCount = data?.count ?? results.length;
        state.myRidesNext = data?.next ?? null;
        state.myRidesPrevious = data?.previous ?? null;
        state.myRidesCurrentPage = page;
        if (page === 1) {
          state.myRides = results;
        } else {
          const existingIds = new Set(state.myRides.map((r) => r.id));
          const newItems = results.filter((r) => !existingIds.has(r.id));
          state.myRides = [...state.myRides, ...newItems];
        }
      })
      .addCase(fetchMyRides.rejected, (state, action) => {
        state.isLoadingMyRides = false;
        state.isLoadingMoreMyRides = false;
        if (action.payload === 'User is unauthenticated or in guest mode') {
          state.myRidesError = null;
        } else {
          state.myRidesError = action.payload;
        }
      });
  },
});

export const {
  setSelectedRide,
  clearFareEstimate,
  clearBookingState,
  clearMyRides,
} = ridesSlice.actions;

export default ridesSlice.reducer;
