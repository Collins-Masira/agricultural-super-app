import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { notificationsService } from '@/services'

const initialState = {
  items: [],
  status: 'idle',
  error: null,
  unreadCount: 0,
}

export const fetchNotifications = createAsyncThunk(
  'notifications/fetchNotifications',
  async (_, { rejectWithValue }) => {
    try {
      return await notificationsService.listNotifications()
    } catch (error) {
      return rejectWithValue(error?.message ?? 'Failed to load notifications.')
    }
  },
)

export const fetchUnreadCount = createAsyncThunk(
  'notifications/fetchUnreadCount',
  async (_, { rejectWithValue }) => {
    try {
      return await notificationsService.getUnreadCount()
    } catch (error) {
      return rejectWithValue(error?.message ?? 'Failed to load unread count.')
    }
  },
)

export const markNotificationRead = createAsyncThunk(
  'notifications/markNotificationRead',
  async (notificationId, { rejectWithValue }) => {
    try {
      return await notificationsService.markRead(notificationId)
    } catch (error) {
      return rejectWithValue(error?.message ?? 'Failed to update notification.')
    }
  },
)

export const markAllNotificationsRead = createAsyncThunk(
  'notifications/markAllNotificationsRead',
  async (_, { rejectWithValue }) => {
    try {
      await notificationsService.markAllRead()
    } catch (error) {
      return rejectWithValue(error?.message ?? 'Failed to update notifications.')
    }
  },
)

const notificationsSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchNotifications.pending, (state) => {
        state.status = 'loading'
        state.error = null
      })
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        state.items = action.payload
        state.status = 'ready'
      })
      .addCase(fetchNotifications.rejected, (state, action) => {
        state.status = 'error'
        state.error = action.payload
      })
      .addCase(fetchUnreadCount.fulfilled, (state, action) => {
        state.unreadCount = action.payload
      })
      .addCase(markNotificationRead.fulfilled, (state, action) => {
        const notification = state.items.find((n) => n.id === action.payload.id)
        if (notification && !notification.isRead) {
          notification.isRead = true
          state.unreadCount = Math.max(0, state.unreadCount - 1)
        }
      })
      .addCase(markAllNotificationsRead.fulfilled, (state) => {
        state.items.forEach((n) => {
          n.isRead = true
        })
        state.unreadCount = 0
      })
  },
})

export default notificationsSlice.reducer
