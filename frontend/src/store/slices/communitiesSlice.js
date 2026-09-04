import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { communitiesService } from '@/services'

const initialState = {
  list: [],
  listStatus: 'idle',
  listError: null,
  current: null,
  currentStatus: 'idle',
  currentError: null,
  createStatus: 'idle',
  createError: null,
  membershipLoadingId: null,
}

export const fetchCommunities = createAsyncThunk(
  'communities/fetchCommunities',
  async ({ page = 1, pageSize = 20 } = {}, { rejectWithValue }) => {
    try {
      const result = await communitiesService.listCommunities(page, pageSize)
      return result.items
    } catch (error) {
      return rejectWithValue(error?.message ?? 'Failed to load communities.')
    }
  },
)

export const fetchCommunity = createAsyncThunk(
  'communities/fetchCommunity',
  async (communityId, { rejectWithValue }) => {
    try {
      return await communitiesService.getCommunity(communityId)
    } catch (error) {
      return rejectWithValue(error?.message ?? 'Failed to load community.')
    }
  },
)

export const createCommunity = createAsyncThunk(
  'communities/createCommunity',
  async (input, { rejectWithValue }) => {
    try {
      return await communitiesService.createCommunity(input)
    } catch (error) {
      return rejectWithValue(error?.message ?? 'Failed to create community.')
    }
  },
)

export const updateCommunitySettings = createAsyncThunk(
  'communities/updateCommunitySettings',
  async ({ communityId, settings }, { rejectWithValue }) => {
    try {
      return await communitiesService.updateCommunitySettings(communityId, settings)
    } catch (error) {
      return rejectWithValue(error?.message ?? 'Failed to update community settings.')
    }
  },
)

export const setMemberRole = createAsyncThunk(
  'communities/setMemberRole',
  async ({ communityId, userId, role }, { rejectWithValue }) => {
    try {
      await communitiesService.setMemberRole(communityId, userId, role)
      return { communityId, userId, role }
    } catch (error) {
      return rejectWithValue(error?.message ?? 'Failed to update member role.')
    }
  },
)

export const removeCommunityMember = createAsyncThunk(
  'communities/removeCommunityMember',
  async ({ communityId, userId }, { rejectWithValue }) => {
    try {
      await communitiesService.removeMember(communityId, userId)
      return { communityId, userId }
    } catch (error) {
      return rejectWithValue(error?.message ?? 'Failed to remove member.')
    }
  },
)

function isMember(community, userId) {
  return community.members.some((m) => m.userId === userId)
}

export const toggleMembership = createAsyncThunk(
  'communities/toggleMembership',
  async ({ communityId, userId }, { getState, rejectWithValue }) => {
    const state = getState().communities
    const community =
      (state.current?.id === communityId ? state.current : null) ??
      state.list.find((c) => c.id === communityId)
    const wasMember = community ? isMember(community, userId) : false

    try {
      if (wasMember) {
        await communitiesService.leaveCommunity(communityId)
      } else {
        await communitiesService.joinCommunity(communityId)
      }
      return { communityId, userId, wasMember, me: getState().auth.user }
    } catch (error) {
      return rejectWithValue(error?.message ?? 'Failed to update membership.')
    }
  },
)

function applyMembershipChange(community, { userId, wasMember, me }) {
  if (!community) return
  if (wasMember) {
    community.members = community.members.filter((m) => m.userId !== userId)
    community.myRole = null
  } else {
    community.members = [
      ...community.members,
      {
        id: `optimistic-${userId}`,
        userId,
        communityId: community.id,
        role: 'member',
        joinedAt: new Date().toISOString(),
        member: me,
      },
    ]
    community.myRole = 'member'
  }
}

function applyMemberRoleChange(community, { userId, role }) {
  if (!community) return
  const membership = community.members.find((m) => m.userId === userId)
  if (membership) membership.role = role
}

function applyMemberRemoval(community, { userId }) {
  if (!community) return
  community.members = community.members.filter((m) => m.userId !== userId)
}

export const toggleCommunityFollow = createAsyncThunk(
  'communities/toggleCommunityFollow',
  async ({ communityId, userId }, { getState, rejectWithValue }) => {
    const state = getState().communities
    const community =
      (state.current?.id === communityId ? state.current : null) ??
      state.list.find((c) => c.id === communityId)
    const wasFollowing = community?.isFollowing ?? false

    try {
      if (wasFollowing) {
        await communitiesService.unfollowCommunity(communityId)
      } else {
        await communitiesService.followCommunity(communityId)
      }
      return { communityId, wasFollowing }
    } catch (error) {
      return rejectWithValue(error?.message ?? 'Failed to update follow status.')
    }
  },
)

const communitiesSlice = createSlice({
  name: 'communities',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchCommunities.pending, (state) => {
        state.listStatus = 'loading'
        state.listError = null
      })
      .addCase(fetchCommunities.fulfilled, (state, action) => {
        state.list = action.payload
        state.listStatus = 'ready'
      })
      .addCase(fetchCommunities.rejected, (state, action) => {
        state.listStatus = 'error'
        state.listError = action.payload
      })
      .addCase(fetchCommunity.pending, (state) => {
        state.currentStatus = 'loading'
        state.currentError = null
      })
      .addCase(fetchCommunity.fulfilled, (state, action) => {
        state.current = action.payload
        state.currentStatus = 'ready'
      })
      .addCase(fetchCommunity.rejected, (state, action) => {
        state.currentStatus = 'error'
        state.currentError = action.payload
      })
      .addCase(createCommunity.pending, (state) => {
        state.createStatus = 'loading'
        state.createError = null
      })
      .addCase(createCommunity.fulfilled, (state, action) => {
        state.list.unshift(action.payload)
        state.createStatus = 'ready'
      })
      .addCase(createCommunity.rejected, (state, action) => {
        state.createStatus = 'error'
        state.createError = action.payload
      })
      .addCase(toggleMembership.pending, (state, action) => {
        state.membershipLoadingId = action.meta.arg.communityId
      })
      .addCase(toggleMembership.fulfilled, (state, action) => {
        if (state.current?.id === action.payload.communityId) {
          applyMembershipChange(state.current, action.payload)
        }
        const listCommunity = state.list.find((c) => c.id === action.payload.communityId)
        applyMembershipChange(listCommunity, action.payload)
        state.membershipLoadingId = null
      })
      .addCase(toggleMembership.rejected, (state) => {
        state.membershipLoadingId = null
      })
  },
})

export default communitiesSlice.reducer
