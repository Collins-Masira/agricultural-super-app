import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { expertsService } from '@/services'

const initialState = {
  experts: [],
  expertsStatus: 'idle',
  expertsError: null,
  expert: null,
  expertStatus: 'idle',
  expertError: null,
  followingIds: [],
  followersCounts: {},
  followLoadingUserId: null,
}

export const fetchExperts = createAsyncThunk(
  'experts/fetchExperts',
  async ({ page = 1, pageSize = 50 } = {}, { rejectWithValue }) => {
    try {
      const result = await expertsService.listExperts(page, pageSize)
      return result.items
    } catch (error) {
      return rejectWithValue(error?.message ?? 'Failed to load experts.')
    }
  },
)

export const fetchExpert = createAsyncThunk(
  'experts/fetchExpert',
  async (userId, { rejectWithValue }) => {
    try {
      return await expertsService.getExpert(userId)
    } catch (error) {
      return rejectWithValue(error?.message ?? 'Failed to load expert.')
    }
  },
)

export const fetchMyFollowing = createAsyncThunk(
  'experts/fetchMyFollowing',
  async (_, { rejectWithValue }) => {
    try {
      const result = await expertsService.getMyFollowing()
      return result.followingIds
    } catch (error) {
      return rejectWithValue(error?.message ?? 'Failed to load following.')
    }
  },
)

export const fetchFollowersCount = createAsyncThunk(
  'experts/fetchFollowersCount',
  async (userId, { rejectWithValue }) => {
    try {
      const count = await expertsService.getFollowersCount(userId)
      return { userId, count }
    } catch (error) {
      return rejectWithValue(error?.message ?? 'Failed to load follower count.')
    }
  },
)

export const toggleFollow = createAsyncThunk(
  'experts/toggleFollow',
  async (userId, { getState, rejectWithValue }) => {
    // The backend exposes separate follow/unfollow endpoints (not a
    // toggle) and doesn't return updated counts -- current state is read
    // here to both pick the right call and compute the optimistic result.
    const state = getState().experts
    const wasFollowing = state.followingIds.includes(userId)
    const currentFollowersCount = state.followersCounts[userId] ?? 0

    try {
      if (wasFollowing) {
        await expertsService.unfollowUser(userId)
      } else {
        await expertsService.followUser(userId)
      }
      const followingIds = wasFollowing
        ? state.followingIds.filter((id) => id !== userId)
        : [...state.followingIds, userId]
      return {
        userId,
        summary: {
          followingIds,
          followersCount: Math.max(0, currentFollowersCount + (wasFollowing ? -1 : 1)),
        },
      }
    } catch (error) {
      return rejectWithValue(error?.message ?? 'Failed to update follow.')
    }
  },
)

const expertsSlice = createSlice({
  name: 'experts',
  initialState,
  reducers: {
    followLoading(state, action) {
      state.followLoadingUserId = action.payload
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchExperts.pending, (state) => {
        state.expertsStatus = 'loading'
        state.expertsError = null
      })
      .addCase(fetchExperts.fulfilled, (state, action) => {
        state.experts = action.payload
        state.expertsStatus = 'ready'
      })
      .addCase(fetchExperts.rejected, (state, action) => {
        state.expertsStatus = 'error'
        state.expertsError = action.payload
      })
      .addCase(fetchExpert.pending, (state) => {
        state.expertStatus = 'loading'
        state.expertError = null
      })
      .addCase(fetchExpert.fulfilled, (state, action) => {
        state.expert = action.payload
        state.expertStatus = 'ready'
      })
      .addCase(fetchExpert.rejected, (state, action) => {
        state.expertStatus = 'error'
        state.expertError = action.payload
      })
      .addCase(fetchMyFollowing.fulfilled, (state, action) => {
        state.followingIds = action.payload
      })
      .addCase(fetchFollowersCount.fulfilled, (state, action) => {
        state.followersCounts[action.payload.userId] = action.payload.count
      })
      .addCase(toggleFollow.pending, (state, action) => {
        state.followLoadingUserId = action.meta.arg
      })
      .addCase(toggleFollow.fulfilled, (state, action) => {
        state.followingIds = action.payload.summary.followingIds
        state.followersCounts[action.payload.userId] = action.payload.summary.followersCount
        state.followLoadingUserId = null
      })
      .addCase(toggleFollow.rejected, (state) => {
        state.followLoadingUserId = null
      })
  },
})

export const { followLoading } = expertsSlice.actions
export default expertsSlice.reducer