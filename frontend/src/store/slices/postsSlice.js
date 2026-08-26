import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { postsService } from '@/services'

const initialState = {
  feed: [],
  feedStatus: 'idle',
  feedError: null,
  current: null,
  currentStatus: 'idle',
  currentError: null,
  userPosts: [],
  userPostsStatus: 'idle',
  userPostsError: null,
  likeLoadingPostId: null,
}

export const fetchFeed = createAsyncThunk(
  'posts/fetchFeed',
  async ({ page = 1, pageSize = 10 } = {}, { rejectWithValue }) => {
    try {
      const result = await postsService.listPosts(page, pageSize)
      return result.items
    } catch (error) {
      return rejectWithValue(error?.message ?? 'Failed to load posts.')
    }
  },
)

export const fetchPost = createAsyncThunk(
  'posts/fetchPost',
  async (postId, { rejectWithValue }) => {
    try {
      return await postsService.getPost(postId)
    } catch (error) {
      return rejectWithValue(error?.message ?? 'Failed to load post.')
    }
  },
)

export const fetchUserPosts = createAsyncThunk(
  'posts/fetchUserPosts',
  async (userId, { rejectWithValue }) => {
    try {
      return await postsService.listUserPosts(userId)
    } catch (error) {
      return rejectWithValue(error?.message ?? 'Failed to load posts.')
    }
  },
)

export const createPost = createAsyncThunk(
  'posts/createPost',
  async (input, { rejectWithValue }) => {
    try {
      return await postsService.createPost(input)
    } catch (error) {
      return rejectWithValue(error?.message ?? 'Failed to create post.')
    }
  },
)

function findPost(state, postId) {
  if (state.current?.id === postId) return state.current
  return state.feed.find((p) => p.id === postId) ?? state.userPosts.find((p) => p.id === postId)
}

export const toggleLike = createAsyncThunk(
  'posts/toggleLike',
  async (postId, { getState, rejectWithValue }) => {
    // The backend exposes separate like/unlike endpoints (not a toggle),
    // and doesn't return updated counts -- so the current state is read
    // here to both pick the right call and compute the optimistic result.
    const post = findPost(getState().posts, postId)
    const wasLiked = post?.likedByMe ?? false
    const currentCount = post?.likeCount ?? 0

    try {
      if (wasLiked) {
        await postsService.unlikePost(postId)
      } else {
        await postsService.likePost(postId)
      }
      return {
        postId,
        likedByMe: !wasLiked,
        likeCount: Math.max(0, currentCount + (wasLiked ? -1 : 1)),
      }
    } catch (error) {
      return rejectWithValue(error?.message ?? 'Failed to update like.')
    }
  },
)

export const addComment = createAsyncThunk(
  'posts/addComment',
  async ({ postId, content }, { rejectWithValue }) => {
    try {
      const comment = await postsService.addComment(postId, content)
      return { postId, comment }
    } catch (error) {
      return rejectWithValue(error?.message ?? 'Failed to add comment.')
    }
  },
)

function applyLikeToPost(post, { postId, likedByMe, likeCount }) {
  if (post && post.id === postId) {
    post.likedByMe = likedByMe
    post.likeCount = likeCount
  }
}

const postsSlice = createSlice({
  name: 'posts',
  initialState,
  reducers: {
    likeLoading(state, action) {
      state.likeLoadingPostId = action.payload
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchFeed.pending, (state) => {
        state.feedStatus = 'loading'
        state.feedError = null
      })
      .addCase(fetchFeed.fulfilled, (state, action) => {
        state.feed = action.payload
        state.feedStatus = 'ready'
      })
      .addCase(fetchFeed.rejected, (state, action) => {
        state.feedStatus = 'error'
        state.feedError = action.payload
      })
      .addCase(fetchPost.pending, (state) => {
        state.currentStatus = 'loading'
        state.currentError = null
      })
      .addCase(fetchPost.fulfilled, (state, action) => {
        state.current = action.payload
        state.currentStatus = 'ready'
      })
      .addCase(fetchPost.rejected, (state, action) => {
        state.currentStatus = 'error'
        state.currentError = action.payload
      })
      .addCase(fetchUserPosts.pending, (state) => {
        state.userPostsStatus = 'loading'
        state.userPostsError = null
      })
      .addCase(fetchUserPosts.fulfilled, (state, action) => {
        state.userPosts = action.payload
        state.userPostsStatus = 'ready'
      })
      .addCase(fetchUserPosts.rejected, (state, action) => {
        state.userPostsStatus = 'error'
        state.userPostsError = action.payload
      })
      .addCase(createPost.fulfilled, (state, action) => {
        state.feed.unshift(action.payload)
        state.feedStatus = 'ready'
      })
      .addCase(toggleLike.fulfilled, (state, action) => {
        applyLikeToPost(state.current, action.payload)
        const feedPost = state.feed.find((p) => p.id === action.payload.postId)
        applyLikeToPost(feedPost, action.payload)
        const userPost = state.userPosts.find((p) => p.id === action.payload.postId)
        applyLikeToPost(userPost, action.payload)
        state.likeLoadingPostId = null
      })
      .addCase(toggleLike.rejected, (state) => {
        state.likeLoadingPostId = null
      })
      .addCase(addComment.fulfilled, (state, action) => {
        if (state.current && state.current.id === action.payload.postId) {
          state.current.comments.push(action.payload.comment)
        }
        const feedPost = state.feed.find((p) => p.id === action.payload.postId)
        if (feedPost) feedPost.comments.push(action.payload.comment)
        const userPost = state.userPosts.find((p) => p.id === action.payload.postId)
        if (userPost) userPost.comments.push(action.payload.comment)
      })
  },
})

export const { likeLoading } = postsSlice.actions
export default postsSlice.reducer