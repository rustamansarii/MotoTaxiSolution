import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiGet } from '../../../utils/apiClient';
import ApiConstant from '../../../utils/apiConstant';

const formatRecentItem = (item) => {
  if (!item) return null;
  const address = item.address || item.display_name || item.title || '';
  if (!address) return null;
  const title =
    item.title ||
    item.city ||
    (typeof item.display_name === 'string' ? item.display_name.split(',')[0].trim() : '') ||
    address.split(',')[0].trim() ||
    'Recent Place';
  const latitude = item.latitude ?? (item.lat ? parseFloat(item.lat) : undefined);
  const longitude = item.longitude ?? (item.lon ? parseFloat(item.lon) : undefined);
  const rawId = item.id || item.place_id;
  const safeId =
    rawId && !String(rawId).startsWith('user_saved_')
      ? (String(rawId).startsWith('recent_') ? String(rawId) : `recent_${rawId}`)
      : `recent_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;

  return {
    ...item,
    id: safeId,
    title,
    address,
    display_name: item.display_name || address,
    latitude,
    longitude,
    icon: 'clock',
  };
};

const initialState = {
  // Current user GPS position & resolved address
  currentCoords: null, // { latitude, longitude }
  currentAddress: null, // { display_name, city, state, country, lat, lon, place_id }
  isCurrentLocationLoading: false,
  currentLocationError: null,

  // Search Results
  searchResults: [],
  isSearching: false,
  searchError: null,

  // Selected Locations for Ride
  pickupLocation: null, // { address, latitude, longitude, display_name, ... }
  dropoffLocation: null, // { address, latitude, longitude, display_name, distance_km, ... }

  // Search History
  recentSearches: [],
};

export const loadRecentSearches = createAsyncThunk(
  'location/loadRecentSearches',
  async () => {
    try {
      await AsyncStorage.removeItem('recent_searches');
    } catch (_) {}
    return [];
  }
);

/**
 * 1. Reverse Geocode GPS Coordinates to Address
 * Call: GET /location/search/?q={lat},{lon}
 * Example: /location/search/?q=30.6945195,76.7820527
 */
export const reverseGeocodeLocation = createAsyncThunk(
  'location/reverseGeocodeLocation',
  async ({ latitude, longitude }, { rejectWithValue }) => {
    try {
      const data = await apiGet(ApiConstant.LocationSearch, {
        q: `${latitude},${longitude}`,
      });

      const results = Array.isArray(data?.results) ? data.results : Array.isArray(data) ? data : [];
      const primaryLocation = results[0] || null;

      if (!primaryLocation) {
        return rejectWithValue('No address found for these coordinates');
      }

      return {
        ...primaryLocation,
        latitude: parseFloat(primaryLocation.lat) || latitude,
        longitude: parseFloat(primaryLocation.lon) || longitude,
        address: primaryLocation.display_name,
      };
    } catch (error) {
      return rejectWithValue(
        error.message || 'Failed to resolve current location address'
      );
    }
  }
);

/**
 * 2. Search Locations by Name / Query
 * - For Pickup: GET /location/search/?q={query}
 * - For Dropoff (with distance): GET /location/search/?q={query}&lat={lat}&lon={lon}
 */
export const searchLocation = createAsyncThunk(
  'location/searchLocation',
  async ({ query, q, lat, lon }, { rejectWithValue }) => {
    try {
      const searchQuery = (query || q || '').trim();
      if (!searchQuery) {
        return [];
      }

      const params = { q: searchQuery };
      if (lat !== undefined && lat !== null && lon !== undefined && lon !== null) {
        params.lat = lat;
        params.lon = lon;
      }

      const data = await apiGet(ApiConstant.LocationSearch, params);
      const results = Array.isArray(data?.results) ? data.results : Array.isArray(data) ? data : [];

      return results.map((item) => ({
        ...item,
        id: item.place_id || String(item.lat) + String(item.lon),
        title: item.city || item.display_name.split(',')[0],
        address: item.display_name,
        latitude: parseFloat(item.lat),
        longitude: parseFloat(item.lon),
        distance_km:
          item.distance_km !== undefined && item.distance_km !== null
            ? Number(item.distance_km)
            : null,
        distance:
          item.distance_km !== undefined && item.distance_km !== null && !isNaN(Number(item.distance_km))
            ? `${Number(item.distance_km).toFixed(1)} km`
            : null,
      }));
    } catch (error) {
      return rejectWithValue(error.message || 'Location search failed');
    }
  }
);

const locationSlice = createSlice({
  name: 'location',
  initialState,

  reducers: {
    setCurrentCoords: (state, action) => {
      state.currentCoords = action.payload; // { latitude, longitude }
    },

    addRecentSearch: (state) => {
      state.recentSearches = [];
      try {
        AsyncStorage.removeItem('recent_searches').catch(() => {});
      } catch (_) {}
    },

    setPickupLocation: (state, action) => {
      state.pickupLocation = action.payload;
    },

    setDropoffLocation: (state, action) => {
      state.dropoffLocation = action.payload;
    },

    clearRecentSearches: (state) => {
      state.recentSearches = [];
      try {
        AsyncStorage.removeItem('recent_searches').catch(() => {});
      } catch (_) {}
    },

    clearSearchResults: (state) => {
      state.searchResults = [];
      state.searchError = null;
    },

    swapLocations: (state) => {
      const temp = state.pickupLocation;
      state.pickupLocation = state.dropoffLocation;
      state.dropoffLocation = temp;
    },

    resetLocationState: () => initialState,
  },

  extraReducers: (builder) => {
    builder
      // loadRecentSearches
      .addCase(loadRecentSearches.fulfilled, (state) => {
        state.recentSearches = [];
      })

      // reverseGeocodeLocation
      .addCase(reverseGeocodeLocation.pending, (state) => {
        state.isCurrentLocationLoading = true;
        state.currentLocationError = null;
      })
      .addCase(reverseGeocodeLocation.fulfilled, (state, action) => {
        state.isCurrentLocationLoading = false;
        state.currentAddress = action.payload;
        // Automatically default pickupLocation to current address if empty
        if (!state.pickupLocation) {
          state.pickupLocation = action.payload;
        }
      })
      .addCase(reverseGeocodeLocation.rejected, (state, action) => {
        state.isCurrentLocationLoading = false;
        state.currentLocationError = action.payload;
      })

      // searchLocation
      .addCase(searchLocation.pending, (state) => {
        state.isSearching = true;
        state.searchError = null;
      })
      .addCase(searchLocation.fulfilled, (state, action) => {
        state.isSearching = false;
        state.searchResults = action.payload;
      })
      .addCase(searchLocation.rejected, (state, action) => {
        state.isSearching = false;
        state.searchError = action.payload;
      });
  },
});

export const {
  setCurrentCoords,
  setPickupLocation,
  setDropoffLocation,
  addRecentSearch,
  clearRecentSearches,
  clearSearchResults,
  swapLocations,
  resetLocationState,
} = locationSlice.actions;

export default locationSlice.reducer;
