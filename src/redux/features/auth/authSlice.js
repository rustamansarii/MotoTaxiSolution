import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { apiGet, apiPost } from '../../../utils/apiClient';
import ApiConstant from '../../../utils/apiConstant';
import { saveTokens, saveUser, clearTokens } from '../../../utils/storage';

export const DEFAULT_COUNTRIES = [
  { name: 'India', iso2: 'IN', dial_code: '+91', flag: '🇮🇳' },
  { name: 'United States', iso2: 'US', dial_code: '+1', flag: '🇺🇸' },
  { name: 'United Kingdom', iso2: 'GB', dial_code: '+44', flag: '🇬🇧' },
  { name: 'France', iso2: 'FR', dial_code: '+33', flag: '🇫🇷' },
  { name: 'Afghanistan', iso2: 'AF', dial_code: '+93', flag: '🇦🇫' },
  { name: 'Australia', iso2: 'AU', dial_code: '+61', flag: '🇦🇺' },
  { name: 'Canada', iso2: 'CA', dial_code: '+1', flag: '🇨🇦' },
  { name: 'Germany', iso2: 'DE', dial_code: '+49', flag: '🇩🇪' },
  { name: 'United Arab Emirates', iso2: 'AE', dial_code: '+971', flag: '🇦🇪' },
];

const initialState = {
  user: null,
  tokens: null, // { access: string, refresh: string }
  loading: false,
  error: null,
  countryCodes: DEFAULT_COUNTRIES,
  countryCodesLoading: false,
};

// API call: GET https://.../api/v1/auth/country-codes/
export const fetchCountryCodes = createAsyncThunk(
  'auth/fetchCountryCodes',
  async (_, { rejectWithValue }) => {
    try {
      const data = await apiGet(ApiConstant.CountryCodes);
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

      const data = await apiPost(ApiConstant.Login, payload);

      // Store tokens in AsyncStorage for subsequent authenticated API calls
      // Expected backend response shape: { refresh: "...", access: "..." }
      if (data.access || data.token) {
        await saveTokens({
          access: data.access || data.token,
          refresh: data.refresh || '',
        });
      }

      if (data.user) {
        await saveUser(data.user);
      }

      return data;
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

      const data = await apiPost(ApiConstant.Register, payload);

      if (data.access || data.token) {
        await saveTokens({
          access: data.access || data.token,
          refresh: data.refresh || '',
        });
      }

      if (data.user) {
        await saveUser(data.user);
      }

      return data;
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

const authSlice = createSlice({
  name: 'auth',
  initialState,

  reducers: {
    logout: state => {
      state.user = null;
      state.tokens = null;
      state.error = null;
      clearTokens();
    },
    clearError: state => {
      state.error = null;
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
      });
  },
});

export const { logout, clearError } = authSlice.actions;

export default authSlice.reducer;