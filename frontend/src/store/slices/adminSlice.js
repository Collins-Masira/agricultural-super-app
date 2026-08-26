import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { adminService } from '@/services'

const initialState = {
  stats: null,
  statsStatus: 'idle',
  statsError: null,

  users: [],
  usersTotal: 0,
  usersPage: 1,
  usersPerPage: 20,
  usersStatus: 'idle',
  usersError: null,

  updateLoadingId: null,
  updateError: null,
}

export const fetchAdminStats = createAsyncThunk(
  'admin/fetchStats',
  async (_, { rejectWithValue }) => {
    try {
      return await adminService.getStats()
    } catch (error) {
      return rejectWithValue(error?.message ?? 'Failed to load dashboard statistics.')
    }
  },
)

export const fetchAdminUsers = createAsyncThunk(
  'admin/fetchUsers',
  async (params = {}, { rejectWithValue }) => {
    try {
      return await adminService.listUsers(params)
    } catch (error) {
      return rejectWithValue(error?.message ?? 'Failed to load users.')
    }
  },
)

export const updateAdminUser = createAsyncThunk(
  'admin/updateUser',
  async ({ userId, isActive, role }, { rejectWithValue }) => {
    try {
      const user = await adminService.updateUser(userId, { isActive, role })
      return user
    } catch (error) {
      return rejectWithValue(error?.message ?? 'Failed to update user.')
    }
  },
)

const adminSlice = createSlice({
  name: 'admin',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchAdminStats.pending, (state) => {
        state.statsStatus = 'loading'
        state.statsError = null
      })
      .addCase(fetchAdminStats.fulfilled, (state, action) => {
        state.stats = action.payload
        state.statsStatus = 'ready'
      })
      .addCase(fetchAdminStats.rejected, (state, action) => {
        state.statsStatus = 'error'
        state.statsError = action.payload
      })
      .addCase(fetchAdminUsers.pending, (state) => {
        state.usersStatus = 'loading'
        state.usersError = null
      })
      .addCase(fetchAdminUsers.fulfilled, (state, action) => {
        state.users = action.payload.items
        state.usersTotal = action.payload.total
        state.usersPage = action.payload.page
        state.usersPerPage = action.payload.perPage
        state.usersStatus = 'ready'
      })
      .addCase(fetchAdminUsers.rejected, (state, action) => {
        state.usersStatus = 'error'
        state.usersError = action.payload
      })
      .addCase(updateAdminUser.pending, (state, action) => {
        state.updateLoadingId = action.meta.arg.userId
        state.updateError = null
      })
      .addCase(updateAdminUser.fulfilled, (state, action) => {
        const index = state.users.findIndex((u) => u.user.id === action.payload.user.id)
        if (index !== -1) state.users[index] = action.payload
        state.updateLoadingId = null
      })
      .addCase(updateAdminUser.rejected, (state, action) => {
        state.updateLoadingId = null
        state.updateError = action.payload
      })
  },
})

export default adminSlice.reducer
