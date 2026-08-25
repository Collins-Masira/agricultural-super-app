import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { profileService } from '@/services'

const initialState = {
  profile: null,
  status: 'idle',
  error: null,
}

export const fetchProfile = createAsyncThunk(
  'profile/fetchProfile',
  async (userId, { rejectWithValue }) => {
    try {
      return await profileService.getProfile(userId)
    } catch (error) {
      return rejectWithValue(error?.message ?? 'Failed to load profile.')
    }
  },
)

export const updateProfile = createAsyncThunk(
  'profile/updateProfile',
  async ({ userId, input }, { rejectWithValue }) => {
    try {
      return await profileService.updateProfile(userId, input)
    } catch (error) {
      return rejectWithValue(error?.message ?? 'Failed to update profile.')
    }
  },
)

const profileSlice = createSlice({
  name: 'profile',
  initialState,
  reducers: {
    clearProfile(state) {
      state.profile = null
      state.status = 'idle'
      state.error = null
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProfile.pending, (state) => {
        state.status = 'loading'
        state.error = null
      })
      .addCase(fetchProfile.fulfilled, (state, action) => {
        state.profile = action.payload
        state.status = 'ready'
      })
      .addCase(fetchProfile.rejected, (state, action) => {
        state.status = 'error'
        state.error = action.payload
      })
      .addCase(updateProfile.pending, (state) => {
        state.status = 'loading'
        state.error = null
      })
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.profile = action.payload
        state.status = 'ready'
      })
      .addCase(updateProfile.rejected, (state, action) => {
        state.status = 'error'
        state.error = action.payload
      })
  },
})

export const { clearProfile } = profileSlice.actions
export default profileSlice.reducer