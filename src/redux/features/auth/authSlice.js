import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { apiGet, apiPost, apiPut, apiPatch } from '../../../utils/apiClient';
import ApiConstant from '../../../utils/apiConstant';
import { saveTokens, saveUser, saveRole, clearTokens } from '../../../utils/storage';
import { apiPostAuth, apiGetAuth } from '../../../utils/apiClientAuth';

export const DEFAULT_COUNTRIES = [
 
];

const initialState = {
  user: null,
  tokens: null, // { access: string, refresh: string }
  loading: false,
  error: null,
  countryCodes: DEFAULT_COUNTRIES,
  countryCodesLoading: false,
  riderProfile: null, // { home_address, home_lat, home_lng, work_address, work_lat, work_lng }
  isRiderProfileLoading: false,
  isRiderProfileUpdating: false,
  riderProfileError: null,
};

// API call: GET https://.../api/v1/auth/country-codes/
export const fetchCountryCodes = createAsyncThunk(
  'auth/fetchCountryCodes',
  async (_, { rejectWithValue }) => {
    try {
      const data = await apiGetAuth(ApiConstant.CountryCodes);
      console.log("trrrr",data)
      const list = Array.isArray(data) ? data : data?.data || [];
      return list;
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to fetch country codes');
    }
  }
);

// API call: POST https://.../api/v1/auth/login/
export const loginUser = createAsyncThunk(
  'auth/loginUser',
  async (credentials, { rejectWithValue }) => {
    try {
      const payload = {
        password: credentials.password,
      };

      if (credentials.phone_number) {
        payload.phone_number = credentials.phone_number;
      }
      if (credentials.email) {
        payload.email = credentials.email;
      }

      const data = await apiPostAuth(ApiConstant.Login, payload);

      const effectiveRole = (
        data.role ||
        data.user?.role ||
        credentials.role ||
        'RIDER'
      ).toUpperCase();

      // Store tokens and role in AsyncStorage for persistent login across app restarts
      if (data.access || data.token) {
        await saveTokens({
          access: data.access || data.token,
          refresh: data.refresh || '',
          role: effectiveRole,
        });
      } else {
        await saveRole(effectiveRole);
      }

      // Save user with role so it is persisted in AsyncStorage
      const userData = data.user || {
        role: effectiveRole,
        verified: data.verified,
        detail: data.detail,
        email: credentials.email || '',
        phone_number: credentials.phone_number || '',
      };
      await saveUser({ ...userData, role: effectiveRole });

      return {
        ...data,
        role: effectiveRole,
      };
    } catch (error) {
      const errorData = error.data || {};
      const errorMsg =
        errorData.message ||
        errorData.detail ||
        (errorData.non_field_errors && errorData.non_field_errors[0]) ||
        (errorData.phone_number && Array.isArray(errorData.phone_number) ? errorData.phone_number[0] : errorData.phone_number) ||
        (errorData.password && Array.isArray(errorData.password) ? errorData.password[0] : errorData.password) ||
        errorData.error ||
        error.message ||
        'Login failed. Please check your credentials.';
      return rejectWithValue(errorMsg);
    }
  }
);

// API call: POST https://.../api/v1/auth/register/
export const registerUser = createAsyncThunk(
  'auth/registerUser',
  async (userData, { rejectWithValue }) => {
    try {
      const payload = {
        full_name: userData.full_name,
        phone_number: userData.phone_number,
        email: userData.email,
        password: userData.password,
        role: userData.role || 'RIDER',
      };

      const data = await apiPostAuth(ApiConstant.Register, payload);

      const effectiveRole = (
        data.role ||
        data.user?.role ||
        userData.role ||
        'RIDER'
      ).toUpperCase();

      if (data.access || data.token) {
        await saveTokens({
          access: data.access || data.token,
          refresh: data.refresh || '',
          role: effectiveRole,
        });
      } else {
        await saveRole(effectiveRole);
      }

      const userProfile = data.user || {
        role: effectiveRole,
        full_name: userData.full_name,
        email: userData.email,
        phone_number: userData.phone_number,
      };
      await saveUser({ ...userProfile, role: effectiveRole });

      return {
        ...data,
        role: effectiveRole,
      };
    } catch (error) {
      const errorData = error.data || {};
      let errorMsg =
        errorData.message ||
        errorData.detail ||
        (errorData.non_field_errors && errorData.non_field_errors[0]);

      if (!errorMsg && typeof errorData === 'object' && Object.keys(errorData).length > 0) {
        const fieldErrors = Object.entries(errorData)
          .map(([field, msgs]) => {
            const msg = Array.isArray(msgs) ? msgs.join(', ') : msgs;
            return `${field}: ${msg}`;
          })
          .join('\n');
        errorMsg = fieldErrors;
      }

      return rejectWithValue(
        errorMsg || error.message || 'Registration failed. Please try again.'
      );
    }
  }
);

// API call: GET https://.../api/v1/auth/rider-profile/
export const fetchRiderProfile = createAsyncThunk(
  'auth/fetchRiderProfile',
  async (_, { rejectWithValue }) => {
    try {
      const data = await apiGet(ApiConstant.RiderProfile);
      return data?.data || data?.result || data;
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to fetch rider profile');
    }
  }
);

// API call: PUT/PATCH/POST https://.../api/v1/auth/rider-profile/
export const updateRiderProfile = createAsyncThunk(
  'auth/updateRiderProfile',
  async (profileData, { rejectWithValue }) => {
    try {
      const payload = {
        home_address: profileData.home_address !== undefined ? profileData.home_address : '',
        home_lat:
          profileData.home_lat !== undefined && profileData.home_lat !== null
            ? parseFloat(profileData.home_lat)
            : null,
        home_lng:
          profileData.home_lng !== undefined && profileData.home_lng !== null
            ? parseFloat(profileData.home_lng)
            : null,
        work_address: profileData.work_address !== undefined ? profileData.work_address : '',
        work_lat:
          profileData.work_lat !== undefined && profileData.work_lat !== null
            ? parseFloat(profileData.work_lat)
            : null,
        work_lng:
          profileData.work_lng !== undefined && profileData.work_lng !== null
            ? parseFloat(profileData.work_lng)
            : null,
      };

      // Try PATCH first, if 405 fallback to PUT, then POST
      let response;
      try {
        response = await apiPatch(ApiConstant.RiderProfile, payload);
      } catch (patchErr) {
        if (patchErr?.status === 405) {
          try {
            response = await apiPut(ApiConstant.RiderProfile, payload);
          } catch (putErr) {
            if (putErr?.status === 405) {
              response = await apiPost(ApiConstant.RiderProfile, payload);
            } else {
              throw putErr;
            }
          }
        } else {
          throw patchErr;
        }
      }

      return response?.data || response?.result || response || payload;
    } catch (error) {
      const errorData = error.data || {};
      const errorMsg =
        errorData.message ||
        errorData.detail ||
        (errorData.non_field_errors && errorData.non_field_errors[0]) ||
        error.message ||
        'Failed to update rider profile';
      return rejectWithValue(errorMsg);
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,

  reducers: {
    logout: state => {
      state.user = null;
      state.tokens = null;
      state.error = null;
      state.riderProfile = null;
      clearTokens();
    },
    clearError: state => {
      state.error = null;
      state.riderProfileError = null;
    },
    setRiderProfile: (state, action) => {
      state.riderProfile = {
        ...(state.riderProfile || {}),
        ...action.payload,
      };
    },
  },

  extraReducers: builder => {
    builder
      // loginUser
      .addCase(loginUser.pending, state => {
        state.loading = true;
        state.error = null;
      })

      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user || action.payload;
        state.tokens = {
          access: action.payload.access || action.payload.token,
          refresh: action.payload.refresh,
        };
        state.error = null;
      })

      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Something went wrong';
      })

      // registerUser
      .addCase(registerUser.pending, state => {
        state.loading = true;
        state.error = null;
      })

      .addCase(registerUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user || action.payload;
        state.tokens = {
          access: action.payload.access || action.payload.token,
          refresh: action.payload.refresh,
        };
        state.error = null;
      })

      .addCase(registerUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Registration failed';
      })

      // fetchCountryCodes
      .addCase(fetchCountryCodes.pending, state => {
        state.countryCodesLoading = true;
      })

      .addCase(fetchCountryCodes.fulfilled, (state, action) => {
        state.countryCodesLoading = false;
        if (Array.isArray(action.payload) && action.payload.length > 0) {
          state.countryCodes = action.payload;
        }
      })

      .addCase(fetchCountryCodes.rejected, state => {
        state.countryCodesLoading = false;
      })

      // fetchRiderProfile
      .addCase(fetchRiderProfile.pending, state => {
        state.isRiderProfileLoading = true;
        state.riderProfileError = null;
      })
      .addCase(fetchRiderProfile.fulfilled, (state, action) => {
        state.isRiderProfileLoading = false;
        state.riderProfile = action.payload;
      })
      .addCase(fetchRiderProfile.rejected, (state, action) => {
        state.isRiderProfileLoading = false;
        state.riderProfileError = action.payload;
      })

      // updateRiderProfile
      .addCase(updateRiderProfile.pending, state => {
        state.isRiderProfileUpdating = true;
        state.riderProfileError = null;
      })
      .addCase(updateRiderProfile.fulfilled, (state, action) => {
        state.isRiderProfileUpdating = false;
        state.riderProfile = action.payload;
      })
      .addCase(updateRiderProfile.rejected, (state, action) => {
        state.isRiderProfileUpdating = false;
        state.riderProfileError = action.payload;
      });
  },
});

export const { logout, clearError, setRiderProfile } = authSlice.actions;

export default authSlice.reducer;