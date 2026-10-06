import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { apiGet, apiPost, apiPut, apiPatch, apiDelete } from '../../../utils/apiClient';
import ApiConstant from '../../../utils/apiConstant';
import { saveTokens, saveUser, saveRole, clearTokens, isGuestMode, getAccessToken } from '../../../utils/storage';
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
  isProfileLoading: false,
  profileError: null,
  isProfileUpdating: false,
  profileUpdateError: null,
  driverVerification: null,
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

// API call: GET https://.../api/v1/auth/profile/ or http://127.0.0.1:8000/api/v1/auth/profile/
export const fetchUserProfile = createAsyncThunk(
  'auth/fetchUserProfile',
  async (_, { rejectWithValue }) => {
    try {
      const isGuest = await isGuestMode();
      const token = await getAccessToken();
      if (isGuest || !token) {
        console.log('[AuthAPI] Skipping fetchUserProfile: user is unauthenticated or in guest mode');
        return rejectWithValue('User is unauthenticated or in guest mode');
      }

      console.log('[AuthAPI] Fetching authenticated user profile from auth/profile/...');
      let data;
      try {
        data = await apiGet(ApiConstant.UserProfile || 'auth/profile/');
      } catch (err) {
        // Fallback to local URL if main URL network error occurs
        if (err?.code === 'ERR_NETWORK' || err?.message?.includes('Network Error')) {
          console.log('[AuthAPI] Network error on default API_URL, attempting local http://127.0.0.1:8000/api/v1/auth/profile/...');
          data = await apiGet('http://127.0.0.1:8000/api/v1/auth/profile/');
        } else {
          throw err;
        }
      }
      console.log('[AuthAPI] User profile received successfully:', data);
      return data;
    } catch (error) {
      const errorMsg =
        error?.response?.data?.detail ||
        error?.response?.data?.message ||
        error?.message ||
        'Failed to fetch user profile';
      console.warn('[AuthAPI] Failed to fetch user profile:', errorMsg);
      return rejectWithValue(errorMsg);
    }
  }
);

// API call: PATCH https://.../api/v1/auth/me/ or http://127.0.0.1:8000/api/v1/auth/me/
export const updateUserProfile = createAsyncThunk(
  'auth/updateUserProfile',
  async (userData, { dispatch, rejectWithValue }) => {
    try {
      let payload = userData;
      let isMultipart = userData instanceof FormData;

      // If plain object provided, convert to FormData (multipart/form-data)
      if (!isMultipart && typeof userData === 'object' && userData !== null) {
        const formData = new FormData();
        Object.entries(userData).forEach(([key, val]) => {
          if (val === undefined || val === null) return;
          if (key === 'profile_photo') {
            if (typeof val === 'object' && val.uri) {
              formData.append('profile_photo', {
                uri: val.uri,
                name: val.name || `photo_${Date.now()}.jpg`,
                type: val.type || 'image/jpeg',
              });
            } else if (typeof val === 'string' && (val.startsWith('file://') || val.startsWith('content://'))) {
              formData.append('profile_photo', {
                uri: val,
                name: `photo_${Date.now()}.jpg`,
                type: 'image/jpeg',
              });
            }
          } else {
            formData.append(key, String(val));
          }
        });
        payload = formData;
        isMultipart = true;
      }

      console.log('[AuthAPI] Updating user profile via PATCH auth/me/ (multipart/form-data)');
      const patchConfig = isMultipart
        ? { headers: { 'Content-Type': 'multipart/form-data' } }
        : {};

      let data;
      try {
        data = await apiPatch(ApiConstant.AuthMe, payload, patchConfig);
      } catch (err) {
        // Fallback to local URL if main URL network error occurs
        if (err?.code === 'ERR_NETWORK' || err?.message?.includes('Network Error')) {
          console.log('[AuthAPI] Network error on default API_URL, attempting local http://127.0.0.1:8000/api/v1/auth/me/...');
          data = await apiPatch('http://127.0.0.1:8000/api/v1/auth/me/', payload, patchConfig);
        } else {
          throw err;
        }
      }
      const updatedUser = data?.data || data?.result || data?.user || data;
      if (updatedUser) {
        await saveUser(updatedUser);
      }
      dispatch(fetchUserProfile());
      return updatedUser;
    } catch (error) {
      const errorMsg =
        error?.response?.data?.detail ||
        error?.response?.data?.message ||
        error?.message ||
        'Failed to update profile';
      console.warn('[AuthAPI] Failed to update user profile via auth/me/:', errorMsg);
      return rejectWithValue(errorMsg);
    }
  }
);

export const fetchRiderProfile = createAsyncThunk(
  'auth/fetchRiderProfile',
  async (_, { rejectWithValue }) => {
    try {
      const isGuest = await isGuestMode();
      const token = await getAccessToken();
      if (isGuest || !token) {
        console.log('[AuthAPI] Skipping fetchRiderProfile: user is unauthenticated or in guest mode');
        return rejectWithValue('User is unauthenticated or in guest mode');
      }

      const data = await apiGet(ApiConstant.RiderProfile);
      return data?.data || data?.result || data;
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to fetch rider profile');
    }
  }
);

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

// API call: DELETE/POST https://.../api/v1/auth/delete-account/
export const deleteUserAccount = createAsyncThunk(
  'auth/deleteUserAccount',
  async (payload = {}, { rejectWithValue }) => {
    try {
      console.log('[AuthAPI] Deleting user account with payload:', payload);
      let response;
      try {
        response = await apiDelete(ApiConstant.DeleteAccount, { data: payload });
      } catch (delErr) {
        if (delErr?.status === 405) {
          response = await apiPost(ApiConstant.DeleteAccount, payload);
        } else {
          throw delErr;
        }
      }
      console.log('[AuthAPI] Account deleted successfully:', response);
      await clearTokens();
      return response?.data || response;
    } catch (error) {
      const errorData = error.data || {};
      const errorMsg =
        errorData.message ||
        errorData.detail ||
        (errorData.non_field_errors && errorData.non_field_errors[0]) ||
        error.message ||
        'Failed to delete account';
      console.warn('[AuthAPI] Delete account error:', errorMsg);
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
      state.driverVerification = null;
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
    setAuthUser: (state, action) => {
      const u = action.payload || {};
      let fName = u.first_name || '';
      let lName = u.last_name || '';
      const fullName = u.full_name || u.name || '';
      if (!fName && fullName) {
        const parts = fullName.trim().split(/\s+/);
        fName = parts[0] || '';
        lName = parts.slice(1).join(' ') || '';
      }
      state.user = {
        ...(state.user || {}),
        ...u,
        full_name: fullName || fName || 'Rider',
        first_name: fName,
        last_name: lName,
        name: fullName || fName,
        phone: u.phone_number || u.phone || state.user?.phone,
        phone_number: u.phone_number || u.phone || state.user?.phone_number,
      };
      if (u.rider_profile) {
        state.riderProfile = {
          ...(state.riderProfile || {}),
          ...u.rider_profile,
        };
      }
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
        const u = action.payload.user || action.payload;
        let fName = u.first_name || '';
        let lName = u.last_name || '';
        const fullName = u.full_name || u.name || '';
        if (!fName && fullName) {
          const parts = fullName.trim().split(/\s+/);
          fName = parts[0] || '';
          lName = parts.slice(1).join(' ') || '';
        }
        state.user = {
          ...u,
          full_name: fullName || fName || 'Rider',
          first_name: fName,
          last_name: lName,
          name: fullName || fName,
          phone: u.phone_number || u.phone,
          phone_number: u.phone_number || u.phone,
        };
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
      })

      // fetchUserProfile
      .addCase(fetchUserProfile.pending, state => {
        state.isProfileLoading = true;
        state.profileError = null;
      })
      .addCase(fetchUserProfile.fulfilled, (state, action) => {
        state.isProfileLoading = false;
        const payload = action.payload || {};
        const rawUser = payload.user || (payload.id ? payload : {});
        const activeRole =
          payload.active_role || rawUser.active_role || state.user?.active_role || '';
        const riderProf = payload.rider_profile || rawUser.rider_profile || null;
        const driverProf = payload.driver_profile || rawUser.driver_profile || null;
        const driverVerification =
          payload.driver_verification || rawUser.driver_verification || null;

        // Normalize first_name and last_name from full_name if not provided
        let fName = rawUser.first_name || '';
        let lName = rawUser.last_name || '';
        const fullName = rawUser.full_name || rawUser.name || '';
        if (!fName && fullName) {
          const parts = fullName.trim().split(/\s+/);
          fName = parts[0] || '';
          lName = parts.slice(1).join(' ') || '';
        }

        const consolidatedUser = {
          ...(state.user || {}),
          ...rawUser,
          full_name: fullName || fName || 'Rider',
          first_name: fName,
          last_name: lName,
          name: fullName || fName,
          phone: rawUser.phone_number || rawUser.phone || state.user?.phone,
          phone_number: rawUser.phone_number || rawUser.phone || state.user?.phone_number,
          email: rawUser.email || state.user?.email,
          active_role: activeRole,
          rating: riderProf?.rating_avg || driverProf?.rating_avg || rawUser.rating || '5.00',
          total_rides:
            riderProf?.total_rides !== undefined
              ? riderProf.total_rides
              : (rawUser.total_rides || 0),
          rider_profile: riderProf || state.riderProfile,
          driver_profile: driverProf || state.user?.driver_profile,
          driver_verification:
            driverVerification || state.user?.driver_verification || null,
        };

        state.user = consolidatedUser;
        if (driverVerification) {
          state.driverVerification = driverVerification;
        }

        if (riderProf) {
          state.riderProfile = {
            ...(state.riderProfile || {}),
            ...riderProf,
          };
        }

        state.profileError = null;

        saveUser(consolidatedUser).catch((err) =>
          console.warn('[AuthSlice] Failed to save user to storage:', err)
        );
      })
      .addCase(fetchUserProfile.rejected, (state, action) => {
        state.isProfileLoading = false;
        state.profileError = action.payload;
      })

      // updateUserProfile
      .addCase(updateUserProfile.pending, state => {
        state.isProfileUpdating = true;
        state.profileUpdateError = null;
      })
      .addCase(updateUserProfile.fulfilled, (state, action) => {
        state.isProfileUpdating = false;
        const u = action.payload || {};
        state.user = {
          ...(state.user || {}),
          ...u,
        };
        state.profileUpdateError = null;
      })
      .addCase(updateUserProfile.rejected, (state, action) => {
        state.isProfileUpdating = false;
        state.profileUpdateError = action.payload;
      })

      // deleteUserAccount
      .addCase(deleteUserAccount.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteUserAccount.fulfilled, state => {
        state.loading = false;
        state.user = null;
        state.tokens = null;
        state.riderProfile = null;
        state.driverVerification = null;
      })
      .addCase(deleteUserAccount.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { logout, clearError, setRiderProfile, setAuthUser } = authSlice.actions;

export default authSlice.reducer;