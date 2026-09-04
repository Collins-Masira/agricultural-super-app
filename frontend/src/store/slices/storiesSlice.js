import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { storiesService } from '@/services'

const initialState = {
  active: [],
  status: 'idle',
  error: null,
  createStatus: 'idle',
  createError: null,
  deleteLoadingStoryId: null,
}

export const fetchActiveStories = createAsyncThunk(
  'stories/fetchActiveStories',
  async (_, { rejectWithValue }) => {
    try {
      return await storiesService.listActiveStories()
    } catch (error) {
      return rejectWithValue(error?.message ?? 'Failed to load stories.')
    }
  },
)

export const createStory = createAsyncThunk(
  'stories/createStory',
  async (input, { rejectWithValue }) => {
    try {
      return await storiesService.createStory(input)
    } catch (error) {
      return rejectWithValue(error?.message ?? 'Failed to create story.')
    }
  },
)

export const deleteStory = createAsyncThunk(
  'stories/deleteStory',
  async (storyId, { rejectWithValue }) => {
    try {
      await storiesService.deleteStory(storyId)
      return storyId
    } catch (error) {
      return rejectWithValue(error?.message ?? 'Failed to delete story.')
    }
  },
)

const storiesSlice = createSlice({
  name: 'stories',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchActiveStories.pending, (state) => {
        state.status = 'loading'
        state.error = null
      })
      .addCase(fetchActiveStories.fulfilled, (state, action) => {
        state.active = action.payload
        state.status = 'ready'
      })
      .addCase(fetchActiveStories.rejected, (state, action) => {
        state.status = 'error'
        state.error = action.payload
      })
      .addCase(createStory.pending, (state) => {
        state.createStatus = 'loading'
        state.createError = null
      })
      .addCase(createStory.fulfilled, (state, action) => {
        state.active.push(action.payload)
        state.createStatus = 'ready'
      })
      .addCase(createStory.rejected, (state, action) => {
        state.createStatus = 'error'
        state.createError = action.payload
      })
      .addCase(deleteStory.pending, (state, action) => {
        state.deleteLoadingStoryId = action.meta.arg
      })
      .addCase(deleteStory.fulfilled, (state, action) => {
        state.active = state.active.filter((story) => story.id !== action.payload)
        state.deleteLoadingStoryId = null
      })
      .addCase(deleteStory.rejected, (state) => {
        state.deleteLoadingStoryId = null
      })
  },
})

export default storiesSlice.reducer
